export function filtersToSearchParams(filters: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      }
    } else {
      params.set(key, String(value));
    }
  });

  return params;
}

export function searchParamsToFilters(params: URLSearchParams): Record<string, any> {
  const filters: Record<string, any> = {};

  params.forEach((value, key) => {
    if (value.includes(',')) {
      filters[key] = value.split(',');
    } else {
      filters[key] = value;
    }
  });

  return filters;
}
