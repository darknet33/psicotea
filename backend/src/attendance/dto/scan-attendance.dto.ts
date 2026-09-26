import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ScanAttendanceDto {
  /**
   * El `credentialCode` leído del QR o el código escrito a mano. También
   * acepta la URL pública completa (`{FRONTEND_URL}/publico/nino/<code>`), que
   * es lo que devuelve el lector de QR; el servicio extrae el último segmento.
   */
  @IsString({ message: 'El código de la credencial es obligatorio' })
  @IsNotEmpty({ message: 'El código de la credencial es obligatorio' })
  @MaxLength(512, { message: 'El código de la credencial es demasiado largo' })
  code: string;
}
