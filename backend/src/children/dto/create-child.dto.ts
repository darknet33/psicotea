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
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  PHOTO_URL_MESSAGE,
  PHOTO_URL_PATTERN,
} from '../../uploads/uploads.constants';
import { ChildTutorDto } from './child-tutor.dto';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsIn(['Varón', 'Mujer'], {
    message: 'El sexo debe ser Varón o Mujer',
  })
  sex: string;

  @IsString()
  @IsNotEmpty({ message: 'La foto es obligatoria' })
  @Matches(PHOTO_URL_PATTERN, { message: PHOTO_URL_MESSAGE })
  photoUrl: string;

  @IsString()
  @IsNotEmpty({ message: 'El diagnóstico es obligatorio' })
  diagnostico: string;

  @IsString()
  @IsNotEmpty({ message: 'El carnet del niño es obligatorio' })
  @MaxLength(191, { message: 'El carnet no puede superar los 191 caracteres' })
  carnet: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe haber al menos un tutor' })
  @ValidateNested({ each: true })
  @Type(() => ChildTutorDto)
  tutors: ChildTutorDto[];

  @IsOptional()
  @IsInt()
  @IsPositive()
  specialistId?: number;
}
