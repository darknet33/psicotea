import { ConfigService } from '@nestjs/config';
import { CredentialTokenService } from './credential-token.service';

const SECRET = 'a'.repeat(64);
const OTRO_SECRETO = 'b'.repeat(64);

function createService(secret: string | undefined): CredentialTokenService {
  const config = {
    get: jest.fn().mockReturnValue(secret),
  } as unknown as ConfigService;
  return new CredentialTokenService(config);
}

describe('CredentialTokenService', () => {
  let service: CredentialTokenService;

  beforeEach(() => {
    service = createService(SECRET);
  });

  describe('generate', () => {
    it('produce un token con el formato <hex32>.<hex32>', () => {
      const token = service.generate();

      expect(token).toMatch(/^[0-9a-f]{32}\.[0-9a-f]{32}$/);
    });

    it('produce un token distinto en cada llamada', () => {
      const tokens = new Set(
        Array.from({ length: 100 }, () => service.generate()),
      );

      expect(tokens.size).toBe(100);
    });

    it('falla si CREDENTIAL_SECRET no está configurado', () => {
      const serviceSinSecreto = createService(undefined);

      expect(() => serviceSinSecreto.generate()).toThrow(
        'Falta CREDENTIAL_SECRET en la configuración del backend',
      );
    });
  });

  describe('verify', () => {
    it('acepta un token recién generado y devuelve su parte aleatoria', () => {
      const token = service.generate();

      expect(service.verify(token)).toBe(token.split('.')[0]);
    });

    it('rechaza un token con la firma de otro secreto', () => {
      const tokenEnOtroMundo = createService(OTRO_SECRETO).generate();

      expect(service.verify(tokenEnOtroMundo)).toBeNull();
    });

    it('rechaza un token con un carácter de la firma alterado', () => {
      const [randomId, signature] = service.generate().split('.');
      const alterada =
        signature[0] === 'a'
          ? 'b' + signature.slice(1)
          : 'a' + signature.slice(1);

      expect(service.verify(`${randomId}.${alterada}`)).toBeNull();
    });

    it('rechaza un token con la parte aleatoria alterada', () => {
      const [randomId, signature] = service.generate().split('.');
      const alterado =
        randomId[0] === 'a' ? 'b' + randomId.slice(1) : 'a' + randomId.slice(1);

      expect(service.verify(`${alterado}.${signature}`)).toBeNull();
    });

    it('rechaza un token al que se le quitó la firma', () => {
      const randomId = service.generate().split('.')[0];

      expect(service.verify(randomId)).toBeNull();
    });

    it('rechaza un token sin separador', () => {
      expect(service.verify('a'.repeat(64))).toBeNull();
    });

    it('rechaza un token cuya parte aleatoria no es hexadecimal', () => {
      expect(service.verify(`${'z'.repeat(32)}.${'a'.repeat(32)}`)).toBeNull();
    });

    it('rechaza una firma de longitud incorrecta', () => {
      const randomId = service.generate().split('.')[0];

      expect(service.verify(`${randomId}.${'a'.repeat(16)}`)).toBeNull();
    });

    it('rechaza una cadena vacía', () => {
      expect(service.verify('')).toBeNull();
    });

    it('rechaza null y undefined', () => {
      expect(service.verify(null)).toBeNull();
      expect(service.verify(undefined)).toBeNull();
    });

    it('rechaza un valor que no es string', () => {
      expect(service.verify(123 as unknown as string)).toBeNull();
    });

    it('rechaza un token con un segmento adicional', () => {
      const token = service.generate();

      expect(service.verify(`${token}.extra`)).toBeNull();
    });
  });
});
