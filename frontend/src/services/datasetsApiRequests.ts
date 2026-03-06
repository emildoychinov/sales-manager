import { axiosClient } from "../utils/axiosClient";

export interface DatasetFilters {
  status?: string;
  productLine?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface RecordsQueryParams extends DatasetFilters {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  size?: number;
}

const datasetsApiRequests = {
  list: (): Promise<any> => {
    return axiosClient.get("/api/datasets");
  },

  getById: (datasetId: number): Promise<any> => {
    return axiosClient.get(`/api/datasets/${datasetId}`);
  },

  getRecords: (datasetId: number, params: RecordsQueryParams = {}): Promise<any> => {
    const queryParams: Record<string, string> = {};

    if (params.sortBy) queryParams.sort_by = params.sortBy;
    if (params.sortOrder) queryParams.sort_order = params.sortOrder;
    if (params.status) queryParams.status = params.status;
    if (params.productLine) queryParams.product_line = params.productLine;
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;
    if (params.page !== undefined) queryParams.page = String(params.page);
    if (params.size !== undefined) queryParams.size = String(params.size);

    return axiosClient.get(`/api/datasets/${datasetId}/records`, {
      params: queryParams,
    });
  },

  getAggregates: (datasetId: number): Promise<any> => {
    return axiosClient.get(`/api/datasets/${datasetId}/aggregates`);
  },

  export: (datasetId: number, fmt: "csv" | "parquet" = "csv"): Promise<any> => {
    return axiosClient.get(`/api/datasets/${datasetId}/export`, {
      params: { fmt },
      responseType: "blob",
    });
  },

  upload: (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post("/api/datasets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: (datasetId: number): Promise<any> => {
    return axiosClient.delete(`/api/datasets/${datasetId}`);
  },
};

export default datasetsApiRequests;

