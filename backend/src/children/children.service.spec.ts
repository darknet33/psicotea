import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ChildrenService } from './children.service';
import { CredentialTokenService } from '../common/credential/credential-token.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateChildDto } from './dto/create-child.dto';
import type { UpdateChildDto } from './dto/update-child.dto';

const CHILD_ID = 7;

/** Error de Prisma con la forma real de P2002 en MySQL (meta.target = nombre del índice). */
function uniqueViolation(indexName: string) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: Prisma.prismaVersion.client,
    meta: { target: indexName },
  });
}

function createService() {
  // Se declara la tupla de argumentos en el tipo del mock (no como parámetro)
  // para poder inspeccionar `mock.calls[0][0]` sin disparar la regla de
  // parámetros sin usar.
  const tx = {
    child: {
      create: jest.fn<Promise<{ id: number }>, [unknown]>(async () => ({
        id: CHILD_ID,
      })),
      update: jest.fn<Promise<{ id: number }>, [unknown]>(async () => ({
        id: CHILD_ID,
      })),
    },
    childTutor: {
      deleteMany: jest.fn<Promise<{ count: number }>, [unknown]>(async () => ({
        count: 0,
      })),
      create: jest.fn<Promise<Record<string, never>>, [unknown]>(
        async () => ({}),
      ),
    },
    tutor: {
      upsert: jest.fn<Promise<{ id: number }>, [unknown]>(async () => ({
        id: 1,
      })),
    },
  };

  const $transaction = jest.fn(
    async (cb: (client: typeof tx) => Promise<unknown>) => cb(tx),
  );

  const prisma = {
    $transaction,
    child: {
      findFirst: jest.fn(async () => ({ id: CHILD_ID, tutors: [] })),
    },
  } as unknown as PrismaService;

  const credentialToken = {
    generate: jest.fn(() => 'token.generado'),
  } as unknown as CredentialTokenService;

  return {
    service: new ChildrenService(prisma, credentialToken),
    tx,
    $transaction,
  };
}

function createDto(overrides: Partial<CreateChildDto> = {}): CreateChildDto {
  return {
    name: 'Martina',
    lastName: 'Gómez',
    dateOfBirth: '2019-04-12',
    sex: 'Mujer',
    photoUrl: '',
    diagnostico: '',
    carnet: 'DNI 10293847',
    tutors: [
      {
        name: 'Lucía',
        lastName: 'Pérez',
        relationship: 'Madre',
        phone: '987654321',
        carnet: 'DNI 45231876',
        isPrimary: true,
      },
    ],
    ...overrides,
  } as CreateChildDto;
}

describe('ChildrenService - carnet del niño', () => {
  describe('create', () => {
    it('guarda el carnet con espacios recortados', async () => {
      const { service, tx } = createService();

      await service.create(createDto({ carnet: '  DNI 10293847  ' }));

      expect(tx.child.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ carnet: 'DNI 10293847' }),
        }),
      );
    });

    it('rechaza un carnet que solo tiene espacios', async () => {
      const { service } = createService();

      await expect(
        service.create(createDto({ carnet: '   ' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('genera el token en el backend e ignora el enviado por el cliente', async () => {
      const { service, tx } = createService();

      await service.create(
        createDto({
          credentialCode: 'falso.del cliente',
        } as Partial<CreateChildDto>),
      );

      expect(tx.child.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ credentialCode: 'token.generado' }),
        }),
      );
    });

    it('devuelve 400 con mensaje de duplicado si el carnet ya existe', async () => {
      const { service, tx } = createService();
      tx.child.create.mockRejectedValueOnce(
        uniqueViolation('Child_carnet_key'),
      );

      await expect(service.create(createDto())).rejects.toThrow(
        /carnet ya pertenece a otro niño/i,
      );
    });

    it('no traduce a 400 un P2002 de otro índice', async () => {
      const { service, tx } = createService();
      const error = uniqueViolation('Child_credentialCode_key');
      tx.child.create.mockRejectedValueOnce(error);

      await expect(service.create(createDto())).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    it('NO reporta duplicado al reenviar el carnet propio sin cambios', async () => {
      const { service, tx } = createService();

      // MySQL no viola el índice único cuando el valor no cambia, así que
      // nunca se lanza P2002 y el caso normal debe pasar limpio.
      await expect(
        service.update(CHILD_ID, { carnet: 'DNI 10293847' } as UpdateChildDto),
      ).resolves.toBeDefined();

      expect(tx.child.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ carnet: 'DNI 10293847' }),
        }),
      );
    });

    it('NO toca la columna carnet si el campo no viene en el PATCH', async () => {
      const { service, tx } = createService();

      await service.update(CHILD_ID, { name: 'Martina Ana' } as UpdateChildDto);

      const data = (
        tx.child.update.mock.calls[0][0] as { data: Record<string, unknown> }
      ).data;
      expect(data).not.toHaveProperty('carnet');
    });

    it('devuelve 400 si el carnet pertence a otro niño', async () => {
      const { service, tx } = createService();
      tx.child.update.mockRejectedValueOnce(
        uniqueViolation('Child_carnet_key'),
      );

      await expect(
        service.update(CHILD_ID, { carnet: 'DNI 99999999' } as UpdateChildDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un carnet vacío en el PATCH', async () => {
      const { service } = createService();

      await expect(
        service.update(CHILD_ID, { carnet: '  ' } as UpdateChildDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza 404 si el niño no existe antes de intentar actualizar', async () => {
      const { service, $transaction } = createService();
      const prisma = (service as unknown as { prisma: PrismaService }).prisma;
      jest
        .spyOn(prisma.child, 'findFirst')
        .mockResolvedValueOnce(null as never);

      await expect(
        service.update(999, { name: 'X' } as UpdateChildDto),
      ).rejects.toThrow(NotFoundException);
      expect($transaction).not.toHaveBeenCalled();
    });
  });

  describe('tutores', () => {
    it('exige exactamente un tutor principal', async () => {
      const { service } = createService();

      await expect(
        service.create(
          createDto({
            tutors: [
              { ...createDto().tutors[0], isPrimary: false },
            ] as CreateChildDto['tutors'],
          }),
        ),
      ).rejects.toThrow(/exactamente un tutor principal/i);
    });

    it('rechaza carnets de tutor duplicados', async () => {
      const { service } = createService();
      const base = createDto().tutors[0];

      await expect(
        service.create(
          createDto({
            tutors: [
              { ...base, isPrimary: true },
              { ...base, name: 'Otro', isPrimary: false },
            ] as CreateChildDto['tutors'],
          }),
        ),
      ).rejects.toThrow(/repetido/i);
    });
  });
});
