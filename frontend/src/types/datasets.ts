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

export enum DatasetStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  DELETING = "deleting",
}

export interface SalesRecord {
  id: number;
  order_number: number | null;
  quantity_ordered: number | null;
  price_each: number | null;
  sales: number | null;
  total_sales: number | null;
  order_date: string | null;
  status: string | null;
  product_line: string | null;
  product_code: string | null;
  customer_name: string | null;
  city: string | null;
  country: string | null;
  deal_size: string | null;
}

export interface PaginatedRecordsResponse {
  items: SalesRecord[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AggregateItem {
  label: string;
  value: number;
}

export interface DatasetAggregates {
  sales_by_product_line: AggregateItem[];
  sales_by_country: AggregateItem[];
  sales_over_time: AggregateItem[];
}
