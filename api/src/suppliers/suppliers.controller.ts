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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierListResponseDto } from './dto/supplier-list-response.dto';
import { SupplierDto } from './dto/supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'List suppliers' })
  @ApiOkResponse({ type: SupplierListResponseDto })
  findAll(@Query() query: ListQueryDto): Promise<SupplierListResponseDto> {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'Get a supplier by id' })
  @ApiOkResponse({ type: SupplierDto })
  @ApiNotFoundResponse({ description: 'Supplier not found' })
  findOne(@Param('id') id: string): Promise<SupplierDto> {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @Roles(Role.almacen)
  @ApiOperation({ summary: 'Create a supplier' })
  @ApiCreatedResponse({ type: SupplierDto })
  @ApiConflictResponse({ description: 'Supplier email already exists' })
  create(@Body() dto: CreateSupplierDto): Promise<SupplierDto> {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.almacen)
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiOkResponse({ type: SupplierDto })
  @ApiConflictResponse({ description: 'Supplier email already exists' })
  @ApiNotFoundResponse({ description: 'Supplier not found' })
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto): Promise<SupplierDto> {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.almacen)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiNoContentResponse({ description: 'Supplier deleted' })
  @ApiConflictResponse({ description: 'Supplier has products' })
  @ApiNotFoundResponse({ description: 'Supplier not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.suppliersService.remove(id);
  }
}
