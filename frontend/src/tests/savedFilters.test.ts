import { describe, it, expect } from 'vitest';
import { mapSavedFilter } from '../features/filters';

describe('Saved Filters feature', () => {
  it('mapSavedFilter parses string criteria into filters object', () => {
    const raw = {
      id: 12,
      name: 'High Priority Bugs',
      criteria: JSON.stringify({
        keyword: 'login crash',
        types: ['BUG'],
        priorities: ['HIGH', 'HIGHEST'],
      }),
      owner: { id: 1, fullName: 'John Doe', email: 'john@example.com' },
      sharedWith: [],
      emailSubscription: true,
      frequency: 'DAILY',
      isShared: false,
    };

    const mapped = mapSavedFilter(raw);
    expect(mapped.id).toBe('12');
    expect(mapped.name).toBe('High Priority Bugs');
    expect(mapped.filters.keyword).toBe('login crash');
    expect(mapped.filters.types).toEqual(['BUG']);
    expect(mapped.filters.priorities).toEqual(['HIGH', 'HIGHEST']);
    expect(mapped.emailSubscription).toBe(true);
    expect(mapped.frequency).toBe('daily');
    expect(mapped.isShared).toBe(false);
  });

  it('mapSavedFilter handles raw object filters without failing', () => {
    const raw = {
      id: '25',
      name: 'All Tasks',
      filters: {
        types: ['TASK'],
        statusIds: [1, 2],
      },
      owner: { id: 2, fullName: 'Jane Doe', email: 'jane@example.com' },
      sharedWith: [{ id: 3, fullName: 'Bob', email: 'bob@example.com' }],
      emailSubscription: false,
      frequency: null,
      isShared: true,
    };

    const mapped = mapSavedFilter(raw);
    expect(mapped.id).toBe('25');
    expect(mapped.filters.types).toEqual(['TASK']);
    expect(mapped.filters.statusIds).toEqual([1, 2]);
    expect(mapped.sharedWith).toHaveLength(1);
    expect(mapped.sharedWith[0].name).toBe('Bob');
    expect(mapped.emailSubscription).toBe(false);
    expect(mapped.frequency).toBeUndefined();
    expect(mapped.isShared).toBe(true);
  });

  it('mapSavedFilter falls back to empty object on invalid criteria JSON', () => {
    const raw = {
      id: 99,
      name: 'Corrupt Filter',
      criteria: '{not-valid-json',
      owner: null,
    };

    const mapped = mapSavedFilter(raw);
    expect(mapped.id).toBe('99');
    expect(mapped.name).toBe('Corrupt Filter');
    expect(mapped.filters).toEqual({});
  });
});
