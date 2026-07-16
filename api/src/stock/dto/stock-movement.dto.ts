import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';

export class StockMovementDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ enum: StockMovementType })
  type!: StockMovementType;

  @ApiProperty()
  qty!: number;

  @ApiProperty({ required: false, nullable: true })
  reason!: string | null;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  createdAt!: Date;
}
