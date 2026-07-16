import { ApiProperty } from '@nestjs/swagger';

export class TopProductDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  unitsSold!: number;

  @ApiProperty({ type: String, example: '920.00' })
  revenue!: string;
}
