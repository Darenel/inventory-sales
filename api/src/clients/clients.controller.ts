import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ListQueryDto } from '../catalog/dto/list-query.dto';
import { ClientListResponseDto } from './dto/client-list-response.dto';
import { ClientDto } from './dto/client.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientsService } from './clients.service';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'List clients' })
  @ApiOkResponse({ type: ClientListResponseDto })
  findAll(@Query() query: ListQueryDto): Promise<ClientListResponseDto> {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'Get a client by id' })
  @ApiOkResponse({ type: ClientDto })
  @ApiNotFoundResponse({ description: 'Client not found' })
  findOne(@Param('id') id: string): Promise<ClientDto> {
    return this.clientsService.findOne(id);
  }

  @Post()
  @Roles(Role.vendedor)
  @ApiOperation({ summary: 'Create a client' })
  @ApiCreatedResponse({ type: ClientDto })
  @ApiConflictResponse({ description: 'Client email already exists' })
  create(@Body() dto: CreateClientDto): Promise<ClientDto> {
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.vendedor)
  @ApiOperation({ summary: 'Update a client' })
  @ApiOkResponse({ type: ClientDto })
  @ApiConflictResponse({ description: 'Client email already exists' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto): Promise<ClientDto> {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.vendedor)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a client' })
  @ApiNoContentResponse({ description: 'Client deleted' })
  @ApiConflictResponse({ description: 'Client has sales' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.clientsService.remove(id);
  }
}
