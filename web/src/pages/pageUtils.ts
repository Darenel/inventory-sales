import { ApiError } from '../lib/api';
import { SortDir } from '../lib/types';

export const pageLimit = 10;

export type ListState = {
  page: number;
  search: string;
  sortBy: string;
  sortDir: SortDir;
};

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}
