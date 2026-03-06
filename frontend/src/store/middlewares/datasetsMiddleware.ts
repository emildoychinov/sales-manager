import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AxiosError } from "axios";
import datasetsApiRequests, {
  type RecordsQueryParams,
} from "../../services/datasetsApiRequests";

export const listDatasets = createAsyncThunk(
  "datasets/listDatasets",
  async (): Promise<unknown | AxiosError> => {
    try {
      const response = await datasetsApiRequests.list();
      return response.data;
    } catch (err) {
      return err as AxiosError;
    }
  }
);

export const getDatasetById = createAsyncThunk(
  "datasets/getDatasetById",
  async (datasetId: number): Promise<unknown | AxiosError> => {
    try {
      const response = await datasetsApiRequests.getById(datasetId);
      return response.data;
    } catch (err) {
      return err as AxiosError;
    }
  }
);

export const getDatasetRecords = createAsyncThunk(
  "datasets/getDatasetRecords",
  async (
    payload: { datasetId: number; params?: RecordsQueryParams }
  ): Promise<unknown | AxiosError> => {
    try {
      const response = await datasetsApiRequests.getRecords(
        payload.datasetId,
        payload.params
      );
      return response.data;
    } catch (err) {
      return err as AxiosError;
    }
  }
);

export const getDatasetAggregates = createAsyncThunk(
  "datasets/getDatasetAggregates",
  async (datasetId: number): Promise<unknown | AxiosError> => {
    try {
      const response = await datasetsApiRequests.getAggregates(datasetId);
      return response.data;
    } catch (err) {
      return err as AxiosError;
    }
  }
);

export const exportDataset = createAsyncThunk(
  "datasets/exportDataset",
  async (
    payload: { datasetId: number; fmt?: "csv" | "parquet" }
  ): Promise<unknown | AxiosError> => {
    try {
      const response = await datasetsApiRequests.export(
        payload.datasetId,
        payload.fmt ?? "csv"
      );
      return response.data;
    } catch (err) {
      return err as AxiosError;
    }
  }
);

export const uploadDataset = createAsyncThunk(
  "datasets/uploadDataset",
  async (file: File): Promise<unknown | AxiosError> => {
    try {
      const response = await datasetsApiRequests.upload(file);
      return response.data;
    } catch (err) {
      return err as AxiosError;
    }
  }
);

export const deleteDataset = createAsyncThunk(
  "datasets/deleteDataset",
  async (datasetId: number): Promise<unknown | AxiosError> => {
    try {
      const response = await datasetsApiRequests.delete(datasetId);
      return response.data ?? { dataset_id: datasetId };
    } catch (err) {
      return err as AxiosError;
    }
  }
);
