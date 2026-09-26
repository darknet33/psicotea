import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** Longitud de la parte aleatoria del token, en bytes. */
const RANDOM_BYTES = 16;
/** Longitud de la firma HMAC truncada, en caracteres hex. */
const SIGNATURE_LENGTH = 32;
const TOKEN_SEPARATOR = '.';

/**
 * Emite y verifica el token de credencial de un niño.
 *
 * Formato: `<randomId>.<signature>`, donde `randomId` son 32 caracteres hex
 * aleatorios y `signature` es el HMAC-SHA256 de `randomId` truncado a 32
 * caracteres hex, calculado con `CREDENTIAL_SECRET`.
 *
 * Las dos mitades cumplen funciones distintas: la parte aleatoria impide que el
 * token sea adivinable por fuerza bruta, y la firma permite detectar que fue
 * alterado.
 */
@Injectable()
export class CredentialTokenService {
  constructor(private readonly config: ConfigService) {}

  generate(): string {
    const randomId = randomBytes(RANDOM_BYTES).toString('hex');
    return `${randomId}${TOKEN_SEPARATOR}${this.sign(randomId)}`;
  }

  /**
   * Verifica la firma y devuelve la parte aleatoria del token.
   * Devuelve `null` si el token está mal formado o la firma no corresponde.
   */
  verify(token: string | undefined | null): string | null {
    if (typeof token !== 'string') return null;

    const separatorIndex = token.indexOf(TOKEN_SEPARATOR);
    if (separatorIndex <= 0) return null;

    const randomId = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);
    if (!isHex(randomId, RANDOM_BYTES * 2)) return null;
    if (!isHex(signature, SIGNATURE_LENGTH)) return null;

    const expected = this.sign(randomId);
    // isHex ya garantizó que ambas cadenas miden SIGNATURE_LENGTH hex, así que
    // los buffers tienen el mismo tamaño y timingSafeEqual no lanza.
    if (
      !timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expected, 'hex'),
      )
    ) {
      return null;
    }

    return randomId;
  }

  private sign(randomId: string): string {
    return createHmac('sha256', this.secret())
      .update(randomId)
      .digest('hex')
      .slice(0, SIGNATURE_LENGTH);
  }

  private secret(): string {
    const secret = this.config.get<string>('CREDENTIAL_SECRET');
    if (!secret) {
      throw new InternalServerErrorException(
        'Falta CREDENTIAL_SECRET en la configuración del backend',
      );
    }
    return secret;
  }
}

function isHex(value: string, expectedLength: number): boolean {
  return value.length === expectedLength && /^[0-9a-f]+$/.test(value);
}
