/**
 * Duration parsing and formatting utilities
 * Supports formats like "2h30m", "1d 4h", "45m", "2h"
 * Assumes 1d = 8h work day, 1w = 5d = 40h
 */

export function parseDuration(input?: string | null): number {
  if (!input) return 0;
  const cleaned = input.trim().toLowerCase();
  if (!cleaned) return 0;

  // If input is purely a number, assume minutes
  if (/^\d+$/.test(cleaned)) {
    return parseInt(cleaned, 10);
  }

  let totalMinutes = 0;
  const regex = /(\d+)\s*([wdhm])/g;
  let match;
  let hasMatch = false;

  while ((match = regex.exec(cleaned)) !== null) {
    hasMatch = true;
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'w': // 1 week = 5 working days = 40h = 2400m
        totalMinutes += value * 5 * 8 * 60;
        break;
      case 'd': // 1 working day = 8h = 480m
        totalMinutes += value * 8 * 60;
        break;
      case 'h': // 1 hour = 60m
        totalMinutes += value * 60;
        break;
      case 'm': // 1 minute
        totalMinutes += value;
        break;
    }
  }

  return hasMatch ? totalMinutes : 0;
}

export function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '0m';

  const days = Math.floor(minutes / (8 * 60));
  const remainingMinutesAfterDays = minutes % (8 * 60);
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const remainingMinutes = remainingMinutesAfterDays % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (remainingMinutes > 0 || parts.length === 0) parts.push(`${remainingMinutes}m`);

  return parts.join(' ');
}
