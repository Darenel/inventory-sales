import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sellerId!: string;

  @ApiPropertyOptional()
  clientId!: string | null;

  @ApiProperty({ type: String, example: '149.97' })
  total!: string;

  @ApiProperty()
  createdAt!: Date;
}
