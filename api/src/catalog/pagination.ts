import { ListQueryDto } from './dto/list-query.dto';

export const normalizeListQuery = (query: ListQueryDto) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    search: query.search?.trim() || undefined,
    sortDir: query.sortDir ?? 'asc',
  };
};

export const pickSortBy = (sortBy: string | undefined, allowed: string[], fallback: string) =>
  sortBy && allowed.includes(sortBy) ? sortBy : fallback;
