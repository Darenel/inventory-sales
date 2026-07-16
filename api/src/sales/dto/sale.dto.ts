import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SaleItemDto } from './sale-item.dto';

export class SaleDto {
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

  @ApiProperty({ type: [SaleItemDto] })
  items!: SaleItemDto[];
}
