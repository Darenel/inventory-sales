import { readAuthSession } from '../auth/storage';

export type ApiErrorShape = {
  status: number;
  message: string;
};

export class ApiError extends Error implements ApiErrorShape {
  status: number;

  constructor({ status, message }: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const baseURL = '/api/v1';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[]; error?: string };
    const message = payload.message ?? payload.error;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (message) {
      return message;
    }
  } catch {
    return response.statusText || 'Request failed';
  }

  return response.statusText || 'Request failed';
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = readAuthSession();
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const response = await fetch(`${baseURL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: await parseErrorMessage(response),
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
