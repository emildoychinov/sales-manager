import { axiosClient } from "../utils/axiosClient";
import type { PaginationParams, RecordsQueryParams } from "../types";

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

