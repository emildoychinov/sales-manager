export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface DatasetSummary {
  id: number;
  filename: string;
  status: string;
  total_rows: number;
  rows_dropped: number;
  total_sales: number;
  date_min: string | null;
  date_max: string | null;
  progress: number;
  error_message: string | null;
  created_at: string;
}

export interface PaginatedDatasetsResponse {
  items: DatasetSummary[];
  total: number;
  paginationParams: PaginationParams;
}

export interface DatasetsState {
  datasets: DatasetSummary[];
  datasetsTotal: number;
  selectedDataset: DatasetSummary | null;
  records: unknown;
  aggregates: unknown;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface DatasetFilters {
  status?: string;
  productLine?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface RecordsQueryParams extends DatasetFilters {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  paginationParams?: PaginationParams;
}
