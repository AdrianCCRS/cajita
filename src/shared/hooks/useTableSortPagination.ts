import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export type SortConfig<Column extends string> = {
  column: Column;
  direction: SortDirection;
};

export type PaginationConfig = {
  pageSize: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
};

export function useTableSortPagination<Item, Column extends string>({
  data,
  defaultSort,
  defaultPageSize = 10,
  sortFns,
}: {
  data: Item[];
  defaultSort: SortConfig<Column>;
  defaultPageSize?: number;
  sortFns: Record<Column, (a: Item, b: Item) => number>;
}) {
  const [sort, setSort] = useState<SortConfig<string>>(defaultSort);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const sorted = useMemo(() => {
    const fn = sortFns[sort.column as Column];
    if (!fn) return data;
    const multiplier = sort.direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => fn(a, b) * multiplier);
  }, [data, sort, sortFns]);

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSize, safePage]);

  function toggleSort(column: string) {
    setSort((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: "asc" };
    });
    setCurrentPage(1);
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setCurrentPage(1);
  }

  return {
    pagination: {
      pageSize,
      currentPage: safePage,
      totalItems,
      totalPages,
    } as PaginationConfig,
    paginatedData: paginated,
    sort,
    setCurrentPage,
    toggleSort,
    changePageSize,
  };
}
