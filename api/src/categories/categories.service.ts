import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListQueryDto } from '../catalog/dto/list-query.dto';
import { normalizeListQuery, pickSortBy } from '../catalog/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto) {
    const { page, limit, skip, take, search, sortDir } = normalizeListQuery(query);
    const where: Prisma.CategoryWhereInput = search
      ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
      : {};
    const sortBy = pickSortBy(query.sortBy, ['name', 'createdAt'], 'name');
    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({ where, orderBy: { [sortBy]: sortDir }, skip, take }),
      this.prisma.category.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: { name: dto.name.trim() } });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);

    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name?.trim() },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const products = await this.prisma.product.count({ where: { categoryId: id } });

    if (products > 0) {
      throw new ConflictException('Category has products');
    }

    await this.prisma.category.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }
}
