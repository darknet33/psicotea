import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

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
  @IsIn(['M', 'F', 'Masculino', 'Femenino'], {
    message: 'El sexo debe ser M, F, Masculino o Femenino',
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
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  parentLastName?: string;

  @IsOptional()
  @IsString()
  parentRelationship?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email del tutor debe ser un email válido' })
  parentEmail?: string;

  @IsOptional()
  @IsString()
  parentCarnet?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  specialistId?: number;
}
