import { ApiProperty } from '@nestjs/swagger';
import { SaleSummaryDto } from './sale-summary.dto';

export class SaleListResponseDto {
  @ApiProperty({ type: [SaleSummaryDto] })
  data!: SaleSummaryDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
