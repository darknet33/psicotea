import { Role } from '@prisma/client';
import { EventsGateway } from './events.gateway';
import { RealtimeService } from './realtime.service';

function setup() {
  const gateway = {
    notifyUser: jest.fn(),
    broadcastToAdmins: jest.fn(),
    emitToRooms: jest.fn(),
  };

  return {
    service: new RealtimeService(gateway as unknown as EventsGateway),
    gateway,
  };
}

describe('RealtimeService', () => {
  it('reenvía notificaciones personales al gateway', () => {
    const { service, gateway } = setup();
    const notification = { title: 'Hola', message: 'mundo' };

    service.notifyUser(5, notification);

    expect(gateway.notifyUser).toHaveBeenCalledWith(5, notification);
  });

  it('difunde eventos a los administradores', () => {
    const { service, gateway } = setup();

    service.broadcastToAdmins('activity:new', { childId: 1 });

    expect(gateway.broadcastToAdmins).toHaveBeenCalledWith('activity:new', {
      childId: 1,
    });
  });

  it('traduce los roles a sus rooms', () => {
    const { service, gateway } = setup();

    service.broadcastToRoles(
      [Role.ADMIN, Role.PERSONAL_ADMINISTRATIVO],
      'payment:new',
      { childId: 1 },
    );

    expect(gateway.emitToRooms).toHaveBeenCalledWith(
      ['admin', 'personal'],
      'payment:new',
      { childId: 1 },
    );
  });

  it('no hace nada si no hay rooms', () => {
    const { service, gateway } = setup();

    service.emitToRooms([], 'x', {});

    // El filtro real vive en el gateway; aquí solo se reenvía.
    expect(gateway.emitToRooms).toHaveBeenCalledWith([], 'x', {});
  });
});
