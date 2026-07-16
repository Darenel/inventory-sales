import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { ReportFormatQueryDto } from './report-format-query.dto';

export class SalesReportQueryDto extends ReportFormatQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-07-16T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
