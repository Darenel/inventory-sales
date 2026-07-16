import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from './category.dto';

export class CategoryListResponseDto {
  @ApiProperty({ type: [CategoryDto] })
  data!: CategoryDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
