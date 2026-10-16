import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(80, { message: 'El nombre no puede superar los 80 caracteres' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191, {
    message: 'La descripción no puede superar los 191 caracteres',
  })
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'El color debe ser un valor hexadecimal (ej. #22c55e)',
  })
  color?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
