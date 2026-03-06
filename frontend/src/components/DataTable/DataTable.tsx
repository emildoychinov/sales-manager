import {
  Box,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import type { DataTableProps } from "../../types";

export function DataTable<T>({
  columns,
  rows,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  sortBy,
  sortOrder,
  onSortChange,
  loading = false,
  emptyMessage = "No data",
  rowKey,
  maxHeight = 500,
}: DataTableProps<T>) {
  return (
    <Paper variant="outlined">
      <Box sx={{ height: 2 }}>{loading && <LinearProgress />}</Box>
      <TableContainer sx={{ maxHeight }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => {
                const canSort = col.sortable && onSortChange;
                const isActive = canSort && sortBy === col.id;

                return (
                  <TableCell
                    key={col.id}
                    align={col.align ?? "left"}
                    sortDirection={isActive ? sortOrder : false}
                    sx={{
                      minWidth: col.minWidth,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {canSort ? (
                      <TableSortLabel
                        active={!!isActive}
                        direction={isActive ? sortOrder : "asc"}
                        onClick={() => onSortChange(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  hover={!!onRowClick}
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: onRowClick ? "pointer" : "default",
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align ?? "left"} sx={{ fontSize: "0.8125rem" }}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.id] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_e, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25]}
        />
      )}
    </Paper>
  );
}
