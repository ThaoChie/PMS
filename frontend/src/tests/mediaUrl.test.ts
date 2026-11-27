import { describe, it, expect } from 'vitest';
import { resolveMediaUrl } from '../utils/mediaUrl';

describe('resolveMediaUrl', () => {
  it('resolves backend-relative /api/attachments/files/... URLs against cross-origin API_BASE_URL', () => {
    expect(
      resolveMediaUrl('/api/attachments/files/123-avatar.png', 'https://api.epms.example.com/api'),
    ).toBe('https://api.epms.example.com/api/attachments/files/123-avatar.png');

    expect(
      resolveMediaUrl('/attachments/files/123-avatar.png', 'https://api.epms.example.com/api'),
    ).toBe('https://api.epms.example.com/api/attachments/files/123-avatar.png');
  });

  it('keeps /api relative URLs when running with local /api proxy', () => {
    expect(resolveMediaUrl('/api/attachments/files/123-avatar.png', '/api')).toBe(
      '/api/attachments/files/123-avatar.png',
    );
  });

  it('preserves absolute, data URI (preset avatars), and blob URLs untouched', () => {
    expect(resolveMediaUrl('https://cdn.example.com/a.png', 'https://api.epms.example.com/api')).toBe(
      'https://cdn.example.com/a.png',
    );
    const dataUri = 'data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E';
    expect(resolveMediaUrl(dataUri, 'https://api.epms.example.com/api')).toBe(dataUri);
    expect(resolveMediaUrl('blob:https://pms-chi-self.vercel.app/123', 'https://api.epms.example.com/api')).toBe(
      'blob:https://pms-chi-self.vercel.app/123',
    );
  });

  it('returns empty string for missing or blank input', () => {
    expect(resolveMediaUrl('')).toBe('');
    expect(resolveMediaUrl(null)).toBe('');
    expect(resolveMediaUrl(undefined)).toBe('');
  });
});
