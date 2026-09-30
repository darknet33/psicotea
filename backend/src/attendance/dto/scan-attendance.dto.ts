import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ScanAttendanceDto {
  /**
   * El `credentialCode` leído del QR o el `carnet` del niño escrito a mano.
   * También acepta la URL pública completa (`{FRONTEND_URL}/publico/nino/<code>`),
   * que es lo que devuelve el lector de QR; el servicio extrae el último
   * segmento para el credentialCode y usa el valor completo para el carnet.
   */
  @IsString({ message: 'El carnet o código de la credencial es obligatorio' })
  @IsNotEmpty({ message: 'El carnet o código de la credencial es obligatorio' })
  @MaxLength(512, {
    message: 'El carnet o código de la credencial es demasiado largo',
  })
  code: string;
}
