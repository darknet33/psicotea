import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
  @IsEnum(Role, { message: 'El rol debe ser uno de los roles válidos' })
  role: Role;
}
