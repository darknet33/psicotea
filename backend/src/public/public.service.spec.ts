import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';
import { CredentialResolverService } from '../common/credential/credential-resolver.service';
import { PrismaService } from '../prisma/prisma.service';

const FRONTEND_URL = 'https://psicotea.example.com';

/** Centinela: permite pasar `undefined` real sin que aplique el valor por defecto. */
const SIN_FRONTEND_URL = Symbol('sin_FRONTEND_URL');

function createService(options: {
  child?: Record<string, unknown> | null;
  frontendUrl?: string | typeof SIN_FRONTEND_URL;
  resolveThrows?: Error;
}) {
  const { child, resolveThrows } = options;

  // `in` distingue la clave ausente (usar FRONTEND_URL) de la presente con
  // `undefined` (simular que no está configurada en el .env).
  let valorFrontendUrl: string | undefined = FRONTEND_URL;
  if ('frontendUrl' in options) {
    valorFrontendUrl =
      options.frontendUrl === SIN_FRONTEND_URL
        ? undefined
        : (options.frontendUrl as string | undefined);
  }

  const findUnique = jest.fn(async () => child ?? null);

  const prisma = { child: { findUnique } } as unknown as PrismaService;

  const resolver = {
    resolveActiveChildId: jest.fn(async () => {
      if (resolveThrows) throw resolveThrows;
      return 7;
    }),
  } as unknown as CredentialResolverService;

  const config = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? valorFrontendUrl : undefined,
    ),
  } as unknown as ConfigService;

  return { service: new PublicService(prisma, resolver, config), findUnique };
}

const CHILD = {
  name: 'Martina',
  lastName: 'Gómez',
  carnet: 'DNI 10293847',
  dateOfBirth: new Date('2019-04-12'),
  photoUrl: 'https://cdn.example.com/martina.jpg',
  tutors: [
    {
      relationship: 'Madre',
      tutor: {
        name: 'Lucía',
        lastName: 'Pérez',
        phone: '+51 987 654 321',
        address: 'Av. Los Álamos 1234',
      },
    },
  ],
  reports: [
    {
      title: 'Evaluación inicial',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-03-31'),
    },
  ],
};

describe('PublicService.getChildByCredential', () => {
  it('devuelve los datos principales del niño y su tutor', async () => {
    const { service } = createService({ child: CHILD });

    const result = await service.getChildByCredential('abc.def');

    expect(result.name).toBe('Martina');
    expect(result.lastName).toBe('Gómez');
    expect(result.photoUrl).toBe(CHILD.photoUrl);
    expect(result.primaryTutor).toEqual({
      name: 'Lucía',
      lastName: 'Pérez',
      relationship: 'Madre',
      phone: '+51 987 654 321',
      address: 'Av. Los Álamos 1234',
    });
  });

  it('devuelve la lista de informes con título y periodo', async () => {
    const { service } = createService({ child: CHILD });

    const result = await service.getChildByCredential('abc.def');

    expect(result.reports).toEqual([
      {
        title: 'Evaluación inicial',
        periodStart: expect.any(String),
        periodEnd: expect.any(String),
      },
    ]);
  });

  it('expone el carnet del niño para que el padre confirme la credencial', async () => {
    const { service } = createService({ child: CHILD });

    const result = await service.getChildByCredential('abc.def');

    expect(result.carnet).toBe('DNI 10293847');
  });

  it('no expone diagnóstico, token ni contenido de informes', async () => {
    const { service } = createService({
      child: {
        ...CHILD,
        // Aunque el mock devuelva campos que el `select` real excluye, la
        // respuesta debe construirse solo con la lista blanca.
        diagnostico: 'TDAH',
        credentialCode: 'abc.def',
        reports: [
          {
            ...CHILD.reports[0],
            content: 'contenido clínico confidencial',
            pdfUrl: 'https://cdn.example.com/informe.pdf',
          },
        ],
        tutors: [
          {
            ...CHILD.tutors[0],
            tutor: {
              ...CHILD.tutors[0].tutor,
              carnet: 'DNI 45231876',
              email: 'lucia@example.com',
            },
          },
        ],
      },
    });

    const result = await service.getChildByCredential('abc.def');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('TDAH');
    expect(serialized).not.toContain('abc.def');
    expect(serialized).not.toContain('contenido clínico confidencial');
    expect(serialized).not.toContain('informe.pdf');
    // El carnet del tutor sí se excluye: solo se expone el del niño, que ya
    // viene impreso en la credencial escaneada.
    expect(serialized).not.toContain('DNI 45231876');
    expect(serialized).not.toContain('lucia@example.com');
  });

  it('omite la sección del tutor cuando no hay tutor principal', async () => {
    const { service } = createService({ child: { ...CHILD, tutors: [] } });

    const result = await service.getChildByCredential('abc.def');

    expect(result.primaryTutor).toBeNull();
  });

  it('devuelve una lista de informes vacía si no hay informes publicados', async () => {
    const { service } = createService({ child: { ...CHILD, reports: [] } });

    const result = await service.getChildByCredential('abc.def');

    expect(result.reports).toEqual([]);
  });

  it('calcula la edad a partir de la fecha de nacimiento', async () => {
    const { service } = createService({
      child: { ...CHILD, dateOfBirth: new Date(2015, 0, 15) },
    });

    const result = await service.getChildByCredential('abc.def');

    const expected = new Date().getFullYear() - 2015;
    expect(result.age).toBe(expected);
  });

  it('propaga el 404 cuando el token no es válido', async () => {
    const { service, findUnique } = createService({
      resolveThrows: new NotFoundException('Credencial no válida.'),
    });

    await expect(service.getChildByCredential('malo')).rejects.toThrow(
      NotFoundException,
    );
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('lanza 404 si el niño desaparece entre la resolución y la lectura', async () => {
    const { service } = createService({ child: null });

    await expect(service.getChildByCredential('abc.def')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('PublicService.buildPublicUrl', () => {
  it('arma la URL pública con FRONTEND_URL', () => {
    const { service } = createService({ child: null });

    expect(service.buildPublicUrl('abc.def')).toBe(
      `${FRONTEND_URL}/publico/nino/abc.def`,
    );
  });

  it('elimina la barra final de FRONTEND_URL para no duplicarla', () => {
    const { service } = createService({
      child: null,
      frontendUrl: `${FRONTEND_URL}/`,
    });

    expect(service.buildPublicUrl('abc.def')).toBe(
      `${FRONTEND_URL}/publico/nino/abc.def`,
    );
  });

  it('cae a localhost si FRONTEND_URL no está configurada', () => {
    const { service } = createService({
      child: null,
      frontendUrl: SIN_FRONTEND_URL,
    });

    expect(service.buildPublicUrl('abc.def')).toBe(
      'http://localhost:3000/publico/nino/abc.def',
    );
  });
});
