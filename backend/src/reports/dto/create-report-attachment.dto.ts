import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReportAttachmentDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del documento es obligatorio' })
  @MaxLength(200, { message: 'El nombre no puede superar los 200 caracteres' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La ruta del documento es obligatoria' })
  @MaxLength(500, { message: 'La ruta no puede superar los 500 caracteres' })
  fileUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'El tipo de archivo no puede superar los 100 caracteres',
  })
  mimeType?: string;
}
