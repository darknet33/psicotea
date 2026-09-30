import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { ChildrenService } from '../children/children.service';
import { CredentialResolverService } from '../common/credential/credential-resolver.service';
import { RequestUser } from '../common/interfaces/authenticated-request.interface';
import { PrismaService } from '../prisma/prisma.service';

const DATE = new Date(Date.UTC(2026, 0, 15));

function adminUser(): RequestUser {
  return {
    id: 1,
    email: 'admin@psicotea.com',
    name: 'Admin',
    lastName: 'PsicoTea',
    role: Role.ADMIN,
    isActive: true,
  };
}

function specialistUser(): RequestUser {
  return { ...adminUser(), id: 5, role: Role.ESPECIALISTA };
}

function createService(options: {
  childId?: number;
  childSpecialistId?: number | null;
  specialistIdForUser?: number | null;
  existingAttendance?: { id: number } | null;
  resolveThrows?: Error;
  carnetFound?: { id: number } | null;
  findManyResult?: unknown[];
}) {
  const {
    childId = 7,
    childSpecialistId = 3,
    specialistIdForUser = 3,
    existingAttendance = null,
    resolveThrows,
    carnetFound = null,
    findManyResult = [],
  } = options;

  const resolveActiveChildId = jest.fn(async () => {
    if (resolveThrows) throw resolveThrows;
    return childId;
  });

  // El mock respeta el `select` como lo hace Prisma: si el servicio pide solo
  // `{id,name,lastName}`, el mock no devuelve `specialistId`. Así el test
  // verifica de verdad que el servicio no expone más campos de los que pide.
  const pick = <T extends Record<string, unknown>>(
    row: Record<string, unknown>,
    select: Record<string, boolean> | undefined,
  ) => {
    if (!select) return row as T;
    return Object.fromEntries(
      Object.keys(select)
        .filter((key) => select[key])
        .map((key) => [key, row[key]]),
    ) as T;
  };

  const findUnique = jest.fn(
    async (args: {
      where: { childId_date?: { childId: number } };
      select?: Record<string, boolean>;
    }) => {
      if (args.where.childId_date) {
        return existingAttendance;
      }
      return pick(
        {
          id: childId,
          name: 'Martina',
          lastName: 'Gómez',
          specialistId: childSpecialistId,
        },
        args.select,
      );
    },
  );

  const findFirst = jest.fn(async () => carnetFound);

  const findMany = jest.fn(async () => findManyResult);

  const upsert = jest.fn(async () => ({
    id: 99,
    childId,
    date: DATE,
    status: AttendanceStatus.PRESENTE,
    registeredById: 1,
    notes: null,
    createdAt: DATE,
    updatedAt: DATE,
  }));

  const prisma = {
    attendance: { findUnique, upsert, findMany },
    child: { findUnique, findFirst },
  } as unknown as PrismaService;

  const childrenService = {
    getSpecialistIdByUser: jest.fn(async () => specialistIdForUser),
  } as unknown as ChildrenService;

  const resolver = {
    resolveActiveChildId,
  } as unknown as CredentialResolverService;

  return {
    service: new AttendanceService(prisma, resolver, childrenService),
    resolveActiveChildId,
    upsert,
    findUnique,
    findFirst,
    findMany,
  };
}

describe('AttendanceService.scan', () => {
  it('registra PRESENTE y devuelve created=true la primera vez', async () => {
    const { service, upsert } = createService({ existingAttendance: null });

    const result = await service.scan({ code: 'abc.def' }, adminUser());

    expect(result.created).toBe(true);
    expect(result.child).toEqual({ id: 7, name: 'Martina', lastName: 'Gómez' });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          childId: 7,
          status: AttendanceStatus.PRESENTE,
          registeredById: 1,
        }),
      }),
    );
  });

  it('devuelve created=false y no duplica en un reescaneo del mismo día', async () => {
    const { service, upsert } = createService({
      existingAttendance: { id: 55 },
    });

    const result = await service.scan({ code: 'abc.def' }, adminUser());

    expect(result.created).toBe(false);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
  });

  it('propaga el 404 cuando el token no es válido', async () => {
    const { service, upsert } = createService({
      resolveThrows: new NotFoundException('Credencial no válida.'),
    });

    await expect(service.scan({ code: 'malo' }, adminUser())).rejects.toThrow(
      NotFoundException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it('puede escanear escribiendo el carnet del niño en vez del credentialCode', async () => {
    const { service, upsert, findFirst } = createService({
      resolveThrows: new NotFoundException('Credencial no válida.'),
      carnetFound: { id: 7 },
    });

    const result = await service.scan({ code: 'CI 45231876' }, adminUser());

    expect(result.created).toBe(true);
    expect(result.child).toEqual({ id: 7, name: 'Martina', lastName: 'Gómez' });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { carnet: 'CI 45231876', isActive: true },
      }),
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ childId: 7 }),
      }),
    );
  });

  it('lanza 404 si el carnet escrito a mano no existe o el niño está inactivo', async () => {
    const { service, upsert, findFirst } = createService({
      resolveThrows: new NotFoundException('Credencial no válida.'),
      carnetFound: null,
    });

    await expect(
      service.scan({ code: 'NO-EXISTE' }, adminUser()),
    ).rejects.toThrow(NotFoundException);
    expect(findFirst).toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('permite a un ADMIN escanear cualquier niño', async () => {
    const { service } = createService({ childSpecialistId: 99 });

    await expect(
      service.scan({ code: 'abc.def' }, adminUser()),
    ).resolves.toMatchObject({ created: true });
  });

  it('permite a un PERSONAL_ADMINISTRATIVO escanear cualquier niño', async () => {
    const { service } = createService({ childSpecialistId: 99 });
    const user = { ...adminUser(), role: Role.PERSONAL_ADMINISTRATIVO };

    await expect(
      service.scan({ code: 'abc.def' }, user),
    ).resolves.toMatchObject({
      created: true,
    });
  });

  it('permite a un ESPECIALISTA escanear un niño que tiene asignado', async () => {
    const { service } = createService({
      childSpecialistId: 3,
      specialistIdForUser: 3,
    });

    await expect(
      service.scan({ code: 'abc.def' }, specialistUser()),
    ).resolves.toMatchObject({ created: true });
  });

  it('rechaza con 403 a un ESPECIALISTA sobre un niño no asignado', async () => {
    const { service, upsert } = createService({
      childSpecialistId: 8,
      specialistIdForUser: 3,
    });

    await expect(
      service.scan({ code: 'abc.def' }, specialistUser()),
    ).rejects.toThrow(ForbiddenException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rechaza con 403 a un ESPECIALISTA cuando el niño no tiene asignado', async () => {
    const { service } = createService({
      childSpecialistId: null,
      specialistIdForUser: 3,
    });

    await expect(
      service.scan({ code: 'abc.def' }, specialistUser()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lanza 404 si el niño desaparece entre la resolución y la lectura', async () => {
    const { service, findUnique } = createService({});

    // La segunda llamada a findUnique es la del niño; la primera es la de la
    // asistencia del día.
    findUnique
      .mockResolvedValueOnce({ id: 55 } as never)
      .mockResolvedValueOnce(null as never);

    await expect(
      service.scan({ code: 'abc.def' }, adminUser()),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('AttendanceService.findByDate', () => {
  const DATE_FROM = new Date(Date.UTC(2026, 0, 15));

  it('lista las asistencias de la fecha pedida para ADMIN', async () => {
    const { service, findMany } = createService({
      findManyResult: [{ id: 1 }],
    });

    const result = await service.findByDate(DATE_FROM, adminUser());

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { date: DATE_FROM },
        orderBy: [{ child: { lastName: 'asc' } }, { child: { name: 'asc' } }],
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('filtra por especialista asignado cuando el usuario es ESPECIALISTA', async () => {
    const { service, findMany } = createService({
      specialistIdForUser: 3,
      findManyResult: [{ id: 1 }],
    });

    await service.findByDate(DATE_FROM, specialistUser());

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { date: DATE_FROM, child: { specialistId: 3 } },
      }),
    );
  });

  it('devuelve lista vacía si el especialista no existe', async () => {
    const { service, findMany } = createService({ specialistIdForUser: null });

    const result = await service.findByDate(DATE_FROM, specialistUser());

    expect(findMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

describe('AttendanceService.daysInMonth', () => {
  it('devuelve las fechas con asistencia como AAAA-MM-DD', async () => {
    const { service, findMany } = createService({
      findManyResult: [
        { date: new Date(Date.UTC(2026, 0, 15)) },
        { date: new Date(Date.UTC(2026, 0, 29)) },
      ],
    });

    const result = await service.daysInMonth(2026, 1, adminUser());

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          date: {
            gte: new Date(Date.UTC(2026, 0, 1)),
            lt: new Date(Date.UTC(2026, 1, 1)),
          },
        },
        distinct: ['date'],
      }),
    );
    expect(result).toEqual(['2026-01-15', '2026-01-29']);
  });

  it('filtra por especialista en el where', async () => {
    const { service, findMany } = createService({
      specialistIdForUser: 3,
      findManyResult: [{ date: new Date(Date.UTC(2026, 0, 15)) }],
    });

    await service.daysInMonth(2026, 1, specialistUser());

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          date: {
            gte: new Date(Date.UTC(2026, 0, 1)),
            lt: new Date(Date.UTC(2026, 1, 1)),
          },
          child: { specialistId: 3 },
        },
      }),
    );
  });

  it('devuelve lista vacía si el especialista no existe', async () => {
    const { service, findMany } = createService({ specialistIdForUser: null });

    const result = await service.daysInMonth(2026, 1, specialistUser());

    expect(findMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
