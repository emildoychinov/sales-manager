import { Box } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { ConfirmDialog } from "../components/ConfirmDialog/ConfirmDialog";
import { FileDropZone } from "../components/FileDropZone/FileDropZone";
import { DatasetTable } from "./DatasetTable";
import { useDispatch, useSelector } from "../store/hooks";
import { deleteDataset, exportDataset, listDatasets, pollDatasets, uploadDataset } from "../store/middlewares";
import { DatasetStatus, type DatasetSummary } from "../types";

const POLL_INTERVAL = 500;

export function DatasetsPage() {
  const dispatch = useDispatch();
  const { datasets, datasetsTotal, isLoading, errorMessage } = useSelector((s) => s.datasets);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<DatasetSummary | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const paginationParams = { page: page + 1, size: rowsPerPage };

  useEffect(() => {
    dispatch(listDatasets(paginationParams));
  }, [dispatch, page, rowsPerPage, refreshTrigger]);

  const hasActiveJobs = datasets.some(
    (d) => d.status === DatasetStatus.PROCESSING || d.status === DatasetStatus.PENDING || d.status === DatasetStatus.DELETING,
  );

  useEffect(() => {
    if (hasActiveJobs) {
      pollRef.current = setInterval(() => {
        dispatch(pollDatasets(paginationParams));
      }, POLL_INTERVAL);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hasActiveJobs, dispatch, page, rowsPerPage]);

  const handlePageChange = useCallback((newPage: number) => setPage(newPage), []);
  const handleRowsPerPageChange = useCallback((rpp: number) => {
    setRowsPerPage(rpp);
    setPage(0);
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      await dispatch(uploadDataset(file));
      setRefreshTrigger((t) => t + 1);
    },
    [dispatch],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await dispatch(deleteDataset(deleteTarget.id));
    setDeleteTarget(null);
    setRefreshTrigger((t) => t + 1);
  }, [deleteTarget, dispatch]);

  const handleRowClick = useCallback((row: DatasetSummary) => {
    console.log("Dataset clicked:", row);
  }, []);

  const handleExportClick = useCallback(
    async (row: DatasetSummary, fmt: "csv" | "parquet") => {
      const result = await dispatch(exportDataset({ datasetId: row.id, fmt }));
      const payload = result.payload;
      if (payload && !isAxiosError(payload) && payload instanceof Blob) {
        const url = URL.createObjectURL(payload);
        const a = document.createElement("a");
        a.href = url;
        const base = row.filename.replace(/\.csv$/i, "");
        a.download = `${base}_export.${fmt}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [dispatch],
  );

  return (
    <Box>
      <FileDropZone onFile={handleUpload} disabled={isLoading} />

      <DatasetTable
        rows={datasets}
        total={datasetsTotal}
        loading={isLoading}
        errorMessage={errorMessage}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onRowClick={handleRowClick}
        onExportClick={handleExportClick}
        onDeleteClick={setDeleteTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete dataset"
        message={`This will permanently delete "${deleteTarget?.filename}". This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
