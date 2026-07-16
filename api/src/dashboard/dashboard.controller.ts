import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { SalesSeriesPointDto } from './dto/sales-series-point.dto';
import { SalesSeriesQueryDto } from './dto/sales-series-query.dto';
import { TopProductDto } from './dto/top-product.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard KPI summary' })
  @ApiOkResponse({ type: DashboardSummaryDto })
  getSummary(): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary();
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top products by units sold' })
  @ApiOkResponse({ type: [TopProductDto] })
  getTopProducts(@Query() query: TopProductsQueryDto): Promise<TopProductDto[]> {
    return this.dashboardService.getTopProducts(query);
  }

  @Get('sales-series')
  @ApiOperation({ summary: 'Get daily sales revenue series' })
  @ApiOkResponse({ type: [SalesSeriesPointDto] })
  getSalesSeries(@Query() query: SalesSeriesQueryDto): Promise<SalesSeriesPointDto[]> {
    return this.dashboardService.getSalesSeries(query);
  }
}
