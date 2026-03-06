import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useState } from "react";
import { DataTable } from "../components/DataTable/DataTable";
import { formatCurrency, formatDate } from "../utils/format";
import { DatasetStatus, type Column, type DatasetSummary } from "../types";

export type ExportFormat = "csv" | "parquet";

const STATUS_COLOR: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  [DatasetStatus.PENDING]: "warning",
  [DatasetStatus.PROCESSING]: "info",
  [DatasetStatus.COMPLETED]: "success",
  [DatasetStatus.FAILED]: "error",
  [DatasetStatus.DELETING]: "default",
};

function StatusCell({ row }: { row: DatasetSummary }) {
  const active = row.status === DatasetStatus.PROCESSING || row.status === DatasetStatus.PENDING;
  return (
    <Box sx={{ minWidth: 120 }}>
      <Chip
        label={row.status}
        color={STATUS_COLOR[row.status as DatasetStatus] ?? "default"}
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
  onExportClick?: (row: DatasetSummary, fmt: ExportFormat) => void;
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
  onExportClick,
  onDeleteClick,
}: DatasetTableProps) {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<{ el: HTMLElement; row: DatasetSummary } | null>(null);

  const handleExportButtonClick = (e: React.MouseEvent<HTMLElement>, row: DatasetSummary) => {
    e.stopPropagation();
    setExportMenuAnchor({ el: e.currentTarget, row });
  };

  const handleExportMenuClose = () => setExportMenuAnchor(null);

  const handleExportFormatClick = (fmt: ExportFormat) => {
    if (exportMenuAnchor) {
      onExportClick?.(exportMenuAnchor.row, fmt);
      handleExportMenuClose();
    }
  };

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
      minWidth: 80,
      render: (row) => (
        <Box component="span" sx={{ display: "inline-flex", gap: 0.25 }}>
          {onExportClick && row.status === DatasetStatus.COMPLETED && (
            <IconButton
              size="small"
              onClick={(e) => handleExportButtonClick(e, row)}
              title="Export"
            >
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>
          )}
          {onDeleteClick ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(row);
              }}
              title="Delete"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
      ),
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
      <Menu
        anchorEl={exportMenuAnchor?.el}
        open={!!exportMenuAnchor}
        onClose={handleExportMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => handleExportFormatClick("csv")}>Download as CSV</MenuItem>
        <MenuItem onClick={() => handleExportFormatClick("parquet")}>Download as Parquet</MenuItem>
      </Menu>
    </Box>
  );
}
