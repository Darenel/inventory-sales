import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
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
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import { StockAlertsResponseDto } from './dto/stock-alerts-response.dto';
import { StockMovementListResponseDto } from './dto/stock-movement-list-response.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { StockService } from './stock.service';

@ApiTags('stock')
@ApiBearerAuth()
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('adjustments')
  @Roles(Role.almacen)
  @ApiOperation({ summary: 'Create a stock adjustment' })
  @ApiCreatedResponse({ type: StockMovementDto })
  @ApiConflictResponse({ description: 'Insufficient stock for sku {sku}' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  createAdjustment(
    @Body() dto: CreateStockAdjustmentDto,
    @Request() request: { user: AuthUser },
  ): Promise<StockMovementDto> {
    return this.stockService.createAdjustment(dto, request.user);
  }

  @Get('movements')
  @Roles(Role.almacen)
  @ApiOperation({ summary: 'List stock movements' })
  @ApiOkResponse({ type: StockMovementListResponseDto })
  findMovements(@Query() query: ListStockMovementsQueryDto): Promise<StockMovementListResponseDto> {
    return this.stockService.findMovements(query);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'List low-stock products' })
  @ApiOkResponse({ type: StockAlertsResponseDto })
  findAlerts(): Promise<StockAlertsResponseDto> {
    return this.stockService.findAlerts();
  }
}
