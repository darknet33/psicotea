import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class UpdateSpecialistChildrenDto {
  @Type(() => Number)
  @IsInt({ each: true })
  childIds: number[];
}
