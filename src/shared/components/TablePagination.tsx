import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui";
import type { PaginationConfig } from "../hooks/useTableSortPagination";

export type TablePaginationProps = {
  pagination: PaginationConfig;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const defaultPageSizeOptions = [5, 10, 20];

export function TablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = defaultPageSizeOptions,
}: TablePaginationProps) {
  const { currentPage, totalPages, totalItems, pageSize } = pagination;
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="table-pagination">
      <div className="table-pagination__info">
        <span>
          {start}–{end} de {totalItems}
        </span>
        <select
          aria-label="Elementos por página"
          className="table-pagination__select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </select>
      </div>
      <div className="table-pagination__nav">
        <Button
          isIconOnly
          aria-label="Página anterior"
          isDisabled={currentPage <= 1}
          size="sm"
          variant="outline"
          onPress={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </Button>
        <span className="table-pagination__page-label">
          {currentPage} de {totalPages}
        </span>
        <Button
          isIconOnly
          aria-label="Página siguiente"
          isDisabled={currentPage >= totalPages}
          size="sm"
          variant="outline"
          onPress={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight aria-hidden="true" size={16} />
        </Button>
      </div>
    </div>
  );
}
