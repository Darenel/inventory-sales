import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListQueryDto } from '../catalog/dto/list-query.dto';
import { normalizeListQuery, pickSortBy } from '../catalog/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto) {
    const { page, limit, skip, take, search, sortDir } = normalizeListQuery(query);
    const where: Prisma.ClientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};
    const sortBy = pickSortBy(query.sortBy, ['name', 'email', 'createdAt'], 'name');
    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({ where, orderBy: { [sortBy]: sortDir }, skip, take }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async create(dto: CreateClientDto) {
    try {
      return await this.prisma.client.create({
        data: {
          ...dto,
          name: dto.name.trim(),
          email: dto.email?.toLowerCase(),
        },
      });
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);

    try {
      return await this.prisma.client.update({
        where: { id },
        data: {
          ...dto,
          name: dto.name?.trim(),
          email: dto.email?.toLowerCase(),
        },
      });
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const sales = await this.prisma.sale.count({ where: { clientId: id } });

    if (sales > 0) {
      throw new ConflictException('Client has sales');
    }

    await this.prisma.client.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private handleKnownError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Client email already exists');
    }

    throw error;
  }
}
