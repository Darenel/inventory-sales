import { Body, Controller, Get, Param, Post, Query, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { SaleListResponseDto } from './dto/sale-list-response.dto';
import { SaleDto } from './dto/sale.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Role.vendedor)
  @ApiOperation({ summary: 'Create a sale' })
  @ApiCreatedResponse({ type: SaleDto })
  @ApiConflictResponse({ description: 'Insufficient stock for sku {sku}' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  create(@Body() dto: CreateSaleDto, @Request() request: { user: AuthUser }): Promise<SaleDto> {
    return this.salesService.create(dto, request.user);
  }

  @Get()
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'List sales' })
  @ApiOkResponse({ type: SaleListResponseDto })
  findAll(@Query() query: ListSalesQueryDto, @Request() request: { user: AuthUser }): Promise<SaleListResponseDto> {
    return this.salesService.findAll(query, request.user);
  }

  @Get(':id')
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'Get a sale by id' })
  @ApiOkResponse({ type: SaleDto })
  @ApiNotFoundResponse({ description: 'Sale not found' })
  findOne(@Param('id') id: string, @Request() request: { user: AuthUser }): Promise<SaleDto> {
    return this.salesService.findOne(id, request.user);
  }
}
