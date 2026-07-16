import { readAuthSession } from '../auth/storage';
import { ApiError } from '../lib/api';

function parseFilename(header: string | null, fallback: string) {
  if (!header) {
    return fallback;
  }

  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] ?? fallback;
}

export async function downloadAuthenticated(path: string, fallbackFilename: string) {
  const session = readAuthSession();
  const headers = new Headers();

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const response = await fetch(`/api/v1${path}`, { headers });

  if (!response.ok) {
    let message = response.statusText || 'Download failed';

    try {
      const payload = (await response.json()) as { message?: string | string[]; error?: string };
      const raw = payload.message ?? payload.error;
      message = Array.isArray(raw) ? raw.join(', ') : raw || message;
    } catch {
      // Binary endpoints may not return JSON errors.
    }

    throw new ApiError({ status: response.status, message });
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = parseFilename(response.headers.get('Content-Disposition'), fallbackFilename);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
