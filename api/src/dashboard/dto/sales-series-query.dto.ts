import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class SalesSeriesQueryDto {
  @ApiPropertyOptional({ default: 30, minimum: 1, maximum: 365 })
  @Transform(({ value }) => (value === undefined ? 30 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(365)
  days = 30;
}
