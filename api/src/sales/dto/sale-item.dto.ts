import { ApiProperty } from '@nestjs/swagger';

export class SaleItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  saleId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  qty!: number;

  @ApiProperty({ type: String, example: '49.99' })
  unitPrice!: string;
}
