import { useState, useCallback } from 'react';

export function usePagination(initialPage: number = 1, initialSize: number = 20) {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [total, setTotal] = useState(0);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page,
    size,
    total,
    setPage,
    setSize,
    setTotal,
    resetPage,
  };
}
