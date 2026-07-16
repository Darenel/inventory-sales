import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ type: String, example: '1240.50' })
  revenueToday!: string;

  @ApiProperty({ type: String, example: '8420.75' })
  revenue7d!: string;

  @ApiProperty({ type: String, example: '28420.75' })
  revenue30d!: string;

  @ApiProperty()
  salesCountToday!: number;

  @ApiProperty()
  salesCount7d!: number;

  @ApiProperty()
  salesCount30d!: number;

  @ApiProperty()
  lowStockCount!: number;

  @ApiProperty()
  productCount!: number;

  @ApiProperty()
  clientCount!: number;
}
