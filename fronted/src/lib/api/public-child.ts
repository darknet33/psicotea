import { publicApi } from "@/lib/axios";
import type { PublicChildProfile } from "@/types/public-child";

/**
 * Error de credencial no reconocida. El backend responde 404 tanto para un
 * token inexistente, con firma inválida o de un niño inactivo, para no revelar
 * si el niño existe. La página pública usa esto para renderizar un estado
 * "credencial no válida" en lugar de un error técnico.
 */
export class CredentialNotFoundError extends Error {
  constructor() {
    super("Credencial no válida");
    this.name = "CredentialNotFoundError";
  }
}

export function isCredentialNotFound(error: unknown): error is CredentialNotFoundError {
  return error instanceof CredentialNotFoundError;
}

/**
 * Consulta los datos de un niño a partir del código de su credencial.
 *
 * Acepta tanto el token suelto (`abc.def`) como la URL completa del QR
 * (`https://.../publico/nino/abc.def`): es lo que decodifica la cámara y lo
 * que el usuario puede pegar a mano.
 */
export async function getPublicChild(code: string): Promise<PublicChildProfile> {
  try {
    const { data } = await publicApi.get<PublicChildProfile>(
      `/public/children/credential/${encodeURIComponent(code)}`,
    );
    return data;
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        throw new CredentialNotFoundError();
      }
    }
    throw error;
  }
}
