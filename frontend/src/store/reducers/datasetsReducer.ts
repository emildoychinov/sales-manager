import { createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import {
  listDatasets,
  pollDatasets,
  getDatasetById,
  getDatasetRecords,
  getDatasetAggregates,
  uploadDataset,
  deleteDataset,
} from "../middlewares/datasetsMiddleware";
import type { DatasetSummary, DatasetsState, PaginatedDatasetsResponse } from "../../types";

const initialState: DatasetsState = {
  datasets: [],
  datasetsTotal: 0,
  selectedDataset: null,
  records: null,
  aggregates: null,
  isLoading: false,
  errorMessage: null,
};

const datasetsSlice = createSlice({
  name: "datasets",
  initialState,
  reducers: {
    clearSelectedDataset: (state) => {
      state.selectedDataset = initialState.selectedDataset;
      state.records = initialState.records;
      state.aggregates = initialState.aggregates;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listDatasets.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = null;
      })
      .addCase(listDatasets.fulfilled, (state, action) => {
        if (isAxiosError(action.payload)) {
          state.errorMessage = "Failed to load datasets";
        } else {
          const data = action.payload as PaginatedDatasetsResponse;
          state.datasets = data.items ?? [];
          state.datasetsTotal = data.total ?? 0;
          state.errorMessage = null;
        }
        state.isLoading = false;
      })
      .addCase(listDatasets.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(pollDatasets.fulfilled, (state, action) => {
        if (!isAxiosError(action.payload)) {
          const data = action.payload as PaginatedDatasetsResponse;
          state.datasets = data.items ?? [];
          state.datasetsTotal = data.total ?? 0;
        }
      })
      .addCase(getDatasetById.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = null;
      })
      .addCase(getDatasetById.fulfilled, (state, action) => {
        if (isAxiosError(action.payload)) {
          state.errorMessage = "Dataset not found";
          state.selectedDataset = null;
        } else {
          state.selectedDataset = action.payload as DatasetSummary;
          state.errorMessage = null;
        }
        state.isLoading = false;
      })
      .addCase(getDatasetById.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(getDatasetRecords.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDatasetRecords.fulfilled, (state, action) => {
        if (!isAxiosError(action.payload)) {
          state.records = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(getDatasetRecords.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(getDatasetAggregates.fulfilled, (state, action) => {
        if (!isAxiosError(action.payload)) {
          state.aggregates = action.payload;
        }
      })
      .addCase(uploadDataset.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = null;
      })
      .addCase(uploadDataset.fulfilled, (state, action) => {
        if (isAxiosError(action.payload)) {
          state.errorMessage = "Upload failed";
        } else {
          state.errorMessage = null;
        }
        state.isLoading = false;
      })
      .addCase(uploadDataset.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteDataset.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = null;
      })
      .addCase(deleteDataset.fulfilled, (state, action) => {
        if (isAxiosError(action.payload)) {
          state.errorMessage = "Delete failed";
        } else {
          state.errorMessage = null;
        }
        state.isLoading = false;
      })
      .addCase(deleteDataset.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearSelectedDataset } = datasetsSlice.actions;
export default datasetsSlice.reducer;
