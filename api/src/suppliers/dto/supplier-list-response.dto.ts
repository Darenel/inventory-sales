import { ApiProperty } from '@nestjs/swagger';
import { SupplierDto } from './supplier.dto';

export class SupplierListResponseDto {
  @ApiProperty({ type: [SupplierDto] })
  data!: SupplierDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
