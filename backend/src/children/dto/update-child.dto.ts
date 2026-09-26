import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ChildTutorDto } from './child-tutor.dto';

export class UpdateChildDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(['Varón', 'Mujer'], {
    message: 'El sexo debe ser Varón o Mujer',
  })
  sex?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La foto no puede estar vacía' })
  @IsUrl({}, { message: 'La foto debe ser una URL válida' })
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El diagnóstico no puede estar vacío' })
  diagnostico?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El carnet del niño no puede estar vacío' })
  @MaxLength(191, { message: 'El carnet no puede superar los 191 caracteres' })
  carnet?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe haber al menos un tutor' })
  @ValidateNested({ each: true })
  @Type(() => ChildTutorDto)
  tutors?: ChildTutorDto[];

  @IsOptional()
  @IsInt()
  @IsPositive()
  specialistId?: number;
}
