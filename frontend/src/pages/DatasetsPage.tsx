import { Box } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog/ConfirmDialog";
import { FileDropZone } from "../components/FileDropZone/FileDropZone";
import { DatasetTable } from "./DatasetTable";
import { useDispatch, useSelector } from "../store/hooks";
import { deleteDataset, listDatasets, pollDatasets, uploadDataset } from "../store/middlewares";
import type { DatasetSummary } from "../types";

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
    (d) => d.status === "processing" || d.status === "pending" || d.status === "deleting",
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
