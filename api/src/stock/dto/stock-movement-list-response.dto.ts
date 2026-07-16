import { ApiProperty } from '@nestjs/swagger';
import { StockMovementDto } from './stock-movement.dto';

export class StockMovementListResponseDto {
  @ApiProperty({ type: [StockMovementDto] })
  data!: StockMovementDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
