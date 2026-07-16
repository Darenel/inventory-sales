import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from './product.dto';

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductDto] })
  data!: ProductDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
