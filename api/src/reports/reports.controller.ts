import { Controller, Get, Query, Request, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { AuthUser } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { StockReportQueryDto } from './dto/stock-report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles(Role.vendedor)
  @ApiOperation({ summary: 'Export sales report' })
  @ApiProduces('text/csv', 'application/pdf')
  @ApiQuery({ name: 'format', enum: ['csv', 'pdf'], required: false })
  @ApiOkResponse({ description: 'CSV or PDF sales report attachment', schema: { type: 'string', format: 'binary' } })
  async exportSales(
    @Query() query: SalesReportQueryDto,
    @Request() request: { user: AuthUser },
    @Res() response: Response,
  ) {
    const report = await this.reportsService.buildSalesReport(query, request.user);
    this.streamReport(response, report);
  }

  @Get('stock')
  @Roles(Role.almacen)
  @ApiOperation({ summary: 'Export stock report' })
  @ApiProduces('text/csv', 'application/pdf')
  @ApiQuery({ name: 'format', enum: ['csv', 'pdf'], required: false })
  @ApiOkResponse({ description: 'CSV or PDF stock report attachment', schema: { type: 'string', format: 'binary' } })
  async exportStock(@Query() query: StockReportQueryDto, @Res() response: Response) {
    const report = await this.reportsService.buildStockReport(query);
    this.streamReport(response, report);
  }

  private streamReport(
    response: Response,
    report: { contentType: string; filename: string; body: Buffer | string },
  ) {
    response.setHeader('Content-Type', report.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    response.send(report.body);
  }
}
