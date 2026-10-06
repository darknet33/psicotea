import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAreaDto {
  @IsOptional()
  @IsString()
  @MaxLength(80, {
    message: 'El nombre del área no puede superar los 80 caracteres',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191, {
    message: 'La descripción no puede superar los 191 caracteres',
  })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
