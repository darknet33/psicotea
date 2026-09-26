import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import {
  CREDENTIAL_NOT_FOUND,
  CredentialResolverService,
} from './credential-resolver.service';
import { CredentialTokenService } from './credential-token.service';
import { PrismaService } from '../../prisma/prisma.service';

const SECRET = 'c'.repeat(64);

function createResolver(
  children: Array<{
    id: number;
    credentialCode: string | null;
    isActive: boolean;
  }>,
) {
  const config = {
    get: jest.fn().mockReturnValue(SECRET),
  } as unknown as ConfigService;
  const tokenService = new CredentialTokenService(config);

  const findFirst = jest.fn(
    async (args: { where: { credentialCode: string; isActive: boolean } }) =>
      children.find(
        (c) =>
          c.credentialCode === args.where.credentialCode &&
          c.isActive === args.where.isActive,
      ) ?? null,
  );

  const prisma = { child: { findFirst } } as unknown as PrismaService;

  return {
    resolver: new CredentialResolverService(prisma, tokenService),
    findFirst,
  };
}

describe('CredentialResolverService.extractCode', () => {
  it('devuelve el código tal cual', () => {
    expect(CredentialResolverService.extractCode('abc.def')).toBe('abc.def');
  });

  it('recorta espacios', () => {
    expect(CredentialResolverService.extractCode('  abc.def  ')).toBe(
      'abc.def',
    );
  });

  it('extrae el código de la URL pública', () => {
    expect(
      CredentialResolverService.extractCode(
        'http://localhost:3000/publico/nino/abc.def',
      ),
    ).toBe('abc.def');
  });

  it('extrae el código de una URL con query string', () => {
    expect(
      CredentialResolverService.extractCode(
        'https://psicotea.com/publico/nino/abc.def?ref=tarjeta',
      ),
    ).toBe('abc.def');
  });

  it('devuelve vacío si no hay nada', () => {
    expect(CredentialResolverService.extractCode('   ')).toBe('');
  });
});

describe('CredentialResolverService.resolveActiveChildId', () => {
  const config = {
    get: jest.fn().mockReturnValue(SECRET),
  } as unknown as ConfigService;
  const tokenService = new CredentialTokenService(config);

  it('devuelve el id del niño activo', async () => {
    const code = tokenService.generate();
    const { resolver } = createResolver([
      { id: 7, credentialCode: code, isActive: true },
    ]);

    await expect(resolver.resolveActiveChildId(code)).resolves.toBe(7);
  });

  it('acepta la URL completa', async () => {
    const code = tokenService.generate();
    const { resolver } = createResolver([
      { id: 7, credentialCode: code, isActive: true },
    ]);

    await expect(
      resolver.resolveActiveChildId(
        `http://localhost:3000/publico/nino/${code}`,
      ),
    ).resolves.toBe(7);
  });

  it('lanza 404 con un token de firma inválida sin tocar la base de datos', async () => {
    const { resolver, findFirst } = createResolver([]);

    await expect(resolver.resolveActiveChildId('a'.repeat(65))).rejects.toThrow(
      NotFoundException,
    );
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('lanza 404 con un token firmado que no existe', async () => {
    const { resolver } = createResolver([]);

    await expect(
      resolver.resolveActiveChildId(tokenService.generate()),
    ).rejects.toThrow(CREDENTIAL_NOT_FOUND);
  });

  it('lanza 404 para un niño inactivo', async () => {
    const code = tokenService.generate();
    // El resolver filtra por isActive: true, así que un niño inactivo no
    // aparece en el resultado aunque exista con ese credentialCode.
    const { resolver } = createResolver([
      { id: 7, credentialCode: code, isActive: false },
    ]);

    await expect(resolver.resolveActiveChildId(code)).rejects.toThrow(
      CREDENTIAL_NOT_FOUND,
    );
  });

  it('lanza 404 con una cadena vacía', async () => {
    const { resolver } = createResolver([]);

    await expect(resolver.resolveActiveChildId('')).rejects.toThrow(
      NotFoundException,
    );
  });
});
