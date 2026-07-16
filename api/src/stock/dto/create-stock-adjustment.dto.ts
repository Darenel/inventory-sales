import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, NotEquals } from 'class-validator';

export class CreateStockAdjustmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ description: 'Signed non-zero quantity' })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  qty!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
