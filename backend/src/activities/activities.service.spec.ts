import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RequestUser } from '../common/interfaces/authenticated-request.interface';
import { ActivitiesService } from './activities.service';

const actor = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  id: 7,
  email: 'esp@psicotea.com',
  name: 'Eva',
  lastName: 'Especialista',
  role: Role.ESPECIALISTA,
  isActive: true,
  ...overrides,
});

const baseActivity = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  childId: 5,
  specialistId: 7,
  date: new Date('2026-03-10'),
  title: 'Juego de roles',
  description: null,
  duration: 30,
  child: { id: 5, name: 'Martina', lastName: 'Gómez' },
  specialist: { id: 7, name: 'Eva', lastName: 'Especialista' },
  ...overrides,
});

interface SetupOptions {
  child?: unknown;
  user?: unknown;
  activityFindUnique?: jest.Mock;
  activityCreate?: jest.Mock;
  realtime?: { emitToRooms: jest.Mock };
}

function setup(options: SetupOptions = {}) {
  const realtime = options.realtime ?? { emitToRooms: jest.fn() };

  const prisma = {
    child: {
      findUnique:
        options.child === undefined
          ? jest.fn().mockResolvedValue({
              id: 5,
              specialist: { userId: 20 },
            })
          : jest.fn().mockResolvedValue(options.child),
    },
    user: {
      findUnique:
        options.user === undefined
          ? jest.fn().mockResolvedValue({ id: 7, role: Role.ESPECIALISTA })
          : jest.fn().mockResolvedValue(options.user),
    },
    activity: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique:
        options.activityFindUnique ??
        jest.fn().mockResolvedValue(baseActivity()),
      create: options.activityCreate ?? jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  return {
    service: new ActivitiesService(
      prisma as unknown as PrismaService,
      realtime as unknown as RealtimeService,
    ),
    prisma,
    realtime,
  };
}

describe('ActivitiesService', () => {
  it('lanza 400 si el niño no existe', async () => {
    const { service } = setup({ child: null });

    await expect(
      service.create(
        { childId: 99, date: '2026-03-10', title: 'Juego' },
        actor(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('asigna al especialista autenticado como responsable', async () => {
    const activityCreate = jest.fn().mockResolvedValue({ id: 1 });
    const { service } = setup({ activityCreate });

    await service.create(
      { childId: 5, date: '2026-03-10', title: 'Juego' },
      actor({ id: 7 }),
    );

    expect(activityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ specialistId: 7 }),
    });
  });

  it('rechaza un responsable que no es especialista', async () => {
    const { service } = setup({ user: { id: 8, role: Role.ADMIN } });

    await expect(
      service.create(
        { childId: 5, date: '2026-03-10', title: 'Juego', specialistId: 8 },
        actor({ id: 1, role: Role.ADMIN }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('emite activity:new al registrar', async () => {
    const realtime = { emitToRooms: jest.fn() };
    const { service } = setup({ realtime });

    await service.create(
      { childId: 5, date: '2026-03-10', title: 'Juego' },
      actor(),
    );

    expect(realtime.emitToRooms).toHaveBeenCalledWith(
      expect.arrayContaining(['admin', 'personal', 'user:20']),
      'activity:new',
      expect.objectContaining({ childId: 5 }),
    );
  });

  it('un especialista no puede editar actividades de otro', async () => {
    const { service } = setup({
      activityFindUnique: jest
        .fn()
        .mockResolvedValue(baseActivity({ specialistId: 99 })),
    });

    await expect(
      service.update(1, { title: 'x' }, actor({ id: 7 })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('un admin no puede asignar un responsable sin rol especialista', async () => {
    const { service } = setup({ user: { id: 7, role: Role.ADMIN } });

    await expect(
      service.create(
        { childId: 5, date: '2026-03-10', title: 'Juego', specialistId: 7 },
        actor({ id: 1, role: Role.ADMIN }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
