import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsIn(['M', 'F', 'Masculino', 'Femenino'], {
    message: 'El sexo debe ser M, F, Masculino o Femenino',
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

  @IsString()
  @IsNotEmpty({ message: 'El nombre del tutor es obligatorio' })
  parentName: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido del tutor es obligatorio' })
  parentLastName: string;

  @IsString()
  @IsNotEmpty({ message: 'El parentesco es obligatorio' })
  parentRelationship: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono del tutor es obligatorio' })
  parentPhone: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email del tutor debe ser un email válido' })
  parentEmail?: string;

  @IsString()
  @IsNotEmpty({ message: 'El carnet del tutor es obligatorio' })
  parentCarnet: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  specialistId?: number;
}
