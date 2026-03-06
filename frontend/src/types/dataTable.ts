import type { ReactNode } from "react";

export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (columnId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string | number;
  maxHeight?: number | string;
}
