import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, example: '49.99' })
  price!: string;

  @ApiProperty({ type: String, example: '29.99' })
  cost!: string;

  @ApiProperty()
  stock!: number;

  @ApiProperty()
  minStock!: number;

  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
