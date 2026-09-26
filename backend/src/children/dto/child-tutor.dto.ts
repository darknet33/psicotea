import {
  ArrayMinSize,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ChildTutorDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del tutor es obligatorio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido del tutor es obligatorio' })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'El parentesco es obligatorio' })
  relationship: string;

  @IsString()
  @IsNotEmpty({ message: 'El celular/WhatsApp del tutor es obligatorio' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email del tutor debe ser un email válido' })
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @IsNotEmpty({ message: 'El carnet del tutor es obligatorio' })
  carnet: string;

  @IsBoolean()
  isPrimary: boolean;
}

export class ChildTutorsDto {
  @ArrayMinSize(1, { message: 'Debe haber al menos un tutor' })
  @IsNotEmpty({ each: true })
  tutors: ChildTutorDto[];
}
