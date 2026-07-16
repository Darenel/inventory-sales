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
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dto/category.dto';
import { CategoryListResponseDto } from './dto/category-list-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'List categories' })
  @ApiOkResponse({ type: CategoryListResponseDto })
  findAll(@Query() query: ListQueryDto): Promise<CategoryListResponseDto> {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.vendedor, Role.almacen)
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiOkResponse({ type: CategoryDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  findOne(@Param('id') id: string): Promise<CategoryDto> {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Roles(Role.almacen)
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({ type: CategoryDto })
  create(@Body() dto: CreateCategoryDto): Promise<CategoryDto> {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.almacen)
  @ApiOperation({ summary: 'Update a category' })
  @ApiOkResponse({ type: CategoryDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryDto> {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.almacen)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiNoContentResponse({ description: 'Category deleted' })
  @ApiConflictResponse({ description: 'Category has products' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
