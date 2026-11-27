import { API_BASE_URL } from '../api/axiosClient';

/**
 * Resolves relative backend file/avatar URLs (such as `/api/attachments/files/...`)
 * against the configured API server origin while leaving absolute, `data:`, and `blob:`
 * URLs intact.
 */
export function resolveMediaUrl(url?: string | null, apiBaseUrl: string = API_BASE_URL): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const base = apiBaseUrl.replace(/\/api\/?$/, '');
  if (trimmed.startsWith('/api/')) return `${base}${trimmed}`;
  if (trimmed.startsWith('/')) return `${base}/api${trimmed}`;
  return `${base}/api/attachments/files/${trimmed}`;
}
