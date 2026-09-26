import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { ChildrenService } from '../children/children.service';
import { CredentialResolverService } from '../common/credential/credential-resolver.service';
import { RequestUser } from '../common/interfaces/authenticated-request.interface';
import { PrismaService } from '../prisma/prisma.service';

const DATE = new Date(2026, 0, 15);

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
}) {
  const {
    childId = 7,
    childSpecialistId = 3,
    specialistIdForUser = 3,
    existingAttendance = null,
    resolveThrows,
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
    attendance: { findUnique, upsert },
    child: { findUnique },
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
