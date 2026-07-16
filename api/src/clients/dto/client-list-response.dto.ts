import { ApiProperty } from '@nestjs/swagger';
import { ClientDto } from './client.dto';

export class ClientListResponseDto {
  @ApiProperty({ type: [ClientDto] })
  data!: ClientDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
