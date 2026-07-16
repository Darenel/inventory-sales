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
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductDto } from './dto/product.dto';
import { ProductListResponseDto } from './dto/product-list-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'List products' })
  @ApiOkResponse({ type: ProductListResponseDto })
  findAll(@Query() query: ListProductsQueryDto): Promise<ProductListResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiOkResponse({ type: ProductDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOne(@Param('id') id: string): Promise<ProductDto> {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles(Role.almacen)
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiConflictResponse({ description: 'Product sku already exists' })
  create(@Body() dto: CreateProductDto): Promise<ProductDto> {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.almacen)
  @ApiOperation({ summary: 'Update a product' })
  @ApiOkResponse({ type: ProductDto })
  @ApiConflictResponse({ description: 'Product sku already exists' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<ProductDto> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.almacen)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiNoContentResponse({ description: 'Product deleted' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
