import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
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
  photo?: string;

  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

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