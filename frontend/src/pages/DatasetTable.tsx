import { Box, Chip, IconButton, LinearProgress, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DataTable } from "../components/DataTable/DataTable";
import { formatCurrency, formatDate } from "../utils/format";
import type { Column, DatasetSummary } from "../types";

const STATUS_COLOR: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "error",
  deleting: "default",
};

function StatusCell({ row }: { row: DatasetSummary }) {
  const active = row.status === "processing" || row.status === "pending";
  return (
    <Box sx={{ minWidth: 120 }}>
      <Chip
        label={row.status}
        color={STATUS_COLOR[row.status] ?? "default"}
        size="small"
        variant="outlined"
        sx={{ textTransform: "capitalize", fontWeight: 500 }}
      />
      {active && (
        <LinearProgress
          variant={row.progress > 0 ? "determinate" : "indeterminate"}
          value={row.progress * 100}
          sx={{ mt: 0.75, height: 4, borderRadius: 2 }}
        />
      )}
    </Box>
  );
}

export interface DatasetTableProps {
  rows: DatasetSummary[];
  total: number;
  loading: boolean;
  errorMessage: string | null;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRowClick?: (row: DatasetSummary) => void;
  onDeleteClick?: (row: DatasetSummary) => void;
}

export function DatasetTable({
  rows,
  total,
  loading,
  errorMessage,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  onDeleteClick,
}: DatasetTableProps) {
  const columns: Column<DatasetSummary>[] = [
    { id: "id", label: "ID", minWidth: 50 },
    { id: "filename", label: "File", minWidth: 160 },
    {
      id: "status",
      label: "Status",
      minWidth: 140,
      render: (row) => <StatusCell row={row} />,
    },
    {
      id: "total_rows",
      label: "Rows",
      align: "right",
      minWidth: 80,
      render: (row) => row.total_rows.toLocaleString(),
    },
    {
      id: "total_sales",
      label: "Total sales",
      align: "right",
      minWidth: 100,
      render: (row) => formatCurrency(row.total_sales),
    },
    {
      id: "created_at",
      label: "Uploaded",
      minWidth: 120,
      render: (row) => formatDate(row.created_at),
    },
    {
      id: "actions",
      label: "",
      align: "right",
      minWidth: 48,
      render: (row) =>
        onDeleteClick ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(row);
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        ) : null,
    },
  ];

  return (
    <Box sx={{ mt: 3 }}>
      {errorMessage && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {errorMessage}
        </Typography>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        onRowClick={onRowClick}
        loading={loading}
        emptyMessage="No datasets yet. Upload a CSV to get started."
        rowKey={(row) => row.id}
      />
    </Box>
  );
}
