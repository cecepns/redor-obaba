import { useState, useCallback } from 'react';

/**
 * Custom hook to handle API pagination state
 * Default perpage: 10, options: 10, 25, 50, 100
 */
export const usePagination = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const updatePagination = useCallback((meta) => {
    if (meta) {
      if (meta.page !== undefined) setPage(meta.page);
      if (meta.limit !== undefined) setLimit(meta.limit);
      if (meta.total !== undefined) setTotal(meta.total);
      if (meta.totalPages !== undefined) setTotalPages(meta.totalPages);
    }
  }, []);

  const nextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const goToPage = (p) => {
    const pageNum = Math.max(1, Math.min(p, totalPages));
    setPage(pageNum);
  };

  const changeLimit = (newLimit) => {
    setLimit(parseInt(newLimit));
    setPage(1); // reset to first page
  };

  const resetPage = () => {
    setPage(1);
  };

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    updatePagination,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    resetPage,
  };
};

export default usePagination;
