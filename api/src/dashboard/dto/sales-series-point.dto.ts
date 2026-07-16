import { ApiProperty } from '@nestjs/swagger';

export class SalesSeriesPointDto {
  @ApiProperty({ example: '2026-07-16' })
  date!: string;

  @ApiProperty({ type: String, example: '430.00' })
  revenue!: string;

  @ApiProperty()
  salesCount!: number;
}
