import { axiosClient } from "../utils/axiosClient";
import type { DatasetFilters, PaginationParams, RecordsQueryParams } from "../types";

const datasetsApiRequests = {
  list: (params: PaginationParams = {}): Promise<any> => {
    return axiosClient.get("/api/datasets", { params });
  },

  getById: (datasetId: number): Promise<any> => {
    return axiosClient.get(`/api/datasets/${datasetId}`);
  },

  getRecords: (datasetId: number, params: RecordsQueryParams = {}): Promise<any> => {
    const queryParams: Record<string, string> = {};

    //there probably is a better way to do this
    if (params.sortBy) queryParams.sort_by = params.sortBy;
    if (params.sortOrder) queryParams.sort_order = params.sortOrder;
    if (params.status) queryParams.status = params.status;
    if (params.productLine) queryParams.product_line = params.productLine;
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;
    if (params.paginationParams?.page !== undefined) queryParams.page = String(params.paginationParams.page);
    if (params.paginationParams?.size !== undefined) queryParams.size = String(params.paginationParams.size);

    return axiosClient.get(`/api/datasets/${datasetId}/records`, {
      params: queryParams,
    });
  },

  getAggregates: (datasetId: number, filters: DatasetFilters = {}): Promise<any> => {

    // there is probably a better way to do this
    const queryParams: Record<string, string> = {};
    if (filters.status) queryParams.status = filters.status;
    if (filters.productLine) queryParams.product_line = filters.productLine;
    if (filters.dateFrom) queryParams.date_from = filters.dateFrom;
    if (filters.dateTo) queryParams.date_to = filters.dateTo;
    return axiosClient.get(`/api/datasets/${datasetId}/aggregates`, { params: queryParams });
  },

  getStatuses: (datasetId: number): Promise<any> => {
    return axiosClient.get(`/api/datasets/${datasetId}/statuses`);
  },

  getProductLines: (datasetId: number): Promise<any> => {
    return axiosClient.get(`/api/datasets/${datasetId}/product-lines`);
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

