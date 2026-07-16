import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: 'admin@inventory.local' })
  email!: string;

  @ApiProperty({ enum: ['admin', 'vendedor', 'almacen'] })
  role!: string;
}
