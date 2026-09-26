import { Injectable, NotFoundException } from '@nestjs/common';
import { CredentialTokenService } from './credential-token.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Mensaje único para token inválido, token bien formado que no resuelve a
 * ningún niño, y niño inactivo. Si fueran distintos, un atacante podría
 * confirmar que un token está en uso.
 */
export const CREDENTIAL_NOT_FOUND =
  'Credencial no válida. Verifica el código QR de la credencial del niño.';

/**
 * Resuelve un `credentialCode` (o la URL pública completa que lo contiene) al
 * niño activo correspondiente. Lo usan tanto el endpoint público de consulta
 * como el escaneo de asistencia, para que la verificación de la firma y el
 * filtro de niños inactivos vivan en un solo lugar.
 */
@Injectable()
export class CredentialResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentialToken: CredentialTokenService,
  ) {}

  /**
   * Acepta el código suelto o la URL que escanea el lector
   * (`http://host/publico/nino/<code>`) y devuelve solo el código.
   */
  static extractCode(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';

    // Si parece una URL, se toma el último segmento de la ruta.
    if (trimmed.includes('/')) {
      const segments = trimmed.split(/[?#]/)[0].split('/').filter(Boolean);
      return segments[segments.length - 1] ?? '';
    }

    return trimmed;
  }

  /** Devuelve el id del niño activo, o lanza 404. */
  async resolveActiveChildId(input: string): Promise<number> {
    const code = CredentialResolverService.extractCode(input);

    // Verificar la firma antes de tocar la base de datos: un token con firma
    // inválida nunca llega a generar una consulta.
    if (!code || !this.credentialToken.verify(code)) {
      throw new NotFoundException(CREDENTIAL_NOT_FOUND);
    }

    const child = await this.prisma.child.findFirst({
      where: { credentialCode: code, isActive: true },
      select: { id: true },
    });

    if (!child) {
      throw new NotFoundException(CREDENTIAL_NOT_FOUND);
    }

    return child.id;
  }
}
