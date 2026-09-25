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
  ValidateNested,
} from 'class-validator';
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

  @IsOptional()
  @IsString()
  photo?: string;

  @IsDateString()
  enrollmentDate: string;

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