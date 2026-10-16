import { Type } from 'class-transformer';
import { IsInt, IsPositive, ValidateNested } from 'class-validator';
import { SpecialistScheduleDayDto } from './specialist-schedule-day.dto';

export class UpdateSpecialistScheduleDto {
  @Type(() => SpecialistScheduleDayDto)
  @ValidateNested({ each: true })
  days: SpecialistScheduleDayDto[];
}

export class UpdateSpecialistAreasDto {
  @IsInt({ each: true })
  @IsPositive({ each: true })
  areaIds: number[];
}
