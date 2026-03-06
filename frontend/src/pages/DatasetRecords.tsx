import { Box, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { DataTable } from "../components/DataTable/DataTable";
import { formatCurrency, formatDate } from "../utils/format";
import { useDispatch } from "../store/hooks";
import { getDatasetRecords } from "../store/middlewares";
import type {
  Column,
  DatasetFilters,
  PaginatedRecordsResponse,
  SalesRecord,
} from "../types";

const columns: Column<SalesRecord>[] = [
  { id: "order_number", label: "Order #", minWidth: 80, sortable: true },
  { id: "order_date", label: "Date", minWidth: 100, sortable: true, render: (r) => formatDate(r.order_date) },
  { id: "status", label: "Status", minWidth: 90 },
  { id: "product_line", label: "Product line", minWidth: 120 },
  { id: "product_code", label: "Product", minWidth: 90 },
  { id: "customer_name", label: "Customer", minWidth: 130, sortable: true },
  {
    id: "quantity_ordered",
    label: "Qty",
    align: "right",
    minWidth: 60,
    sortable: true,
    render: (r) => r.quantity_ordered?.toLocaleString() ?? "—",
  },
  {
    id: "price_each",
    label: "Price",
    align: "right",
    minWidth: 80,
    sortable: true,
    render: (r) => (r.price_each != null ? formatCurrency(r.price_each) : "—"),
  },
  {
    id: "total_sales",
    label: "Total",
    align: "right",
    minWidth: 90,
    sortable: true,
    render: (r) => (r.total_sales != null ? formatCurrency(r.total_sales) : "—"),
  },
  { id: "country", label: "Country", minWidth: 100 },
  { id: "deal_size", label: "Deal size", minWidth: 80 },
];

interface DatasetRecordsProps {
  datasetId: number;
  filters: DatasetFilters;
}

export function DatasetRecords({ datasetId, filters }: DatasetRecordsProps) {
  const dispatch = useDispatch();
  const [rows, setRows] = useState<SalesRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setPage(0);
  }, [filters]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    const result = await dispatch(
      getDatasetRecords({
        datasetId,
        params: {
          sortBy,
          sortOrder,
          status: filters.status,
          productLine: filters.productLine,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          paginationParams: { page: page + 1, size: rowsPerPage },
        },
      }),
    );

    const payload = result.payload;
    if (payload && !isAxiosError(payload)) {
      const data = payload as PaginatedRecordsResponse;
      setRows(data.items ?? []);
      setTotal(data.total ?? 0);
    }

    setLoading(false);
  }, [dispatch, datasetId, sortBy, sortOrder, filters, page, rowsPerPage]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSortChange = useCallback(
    (columnId: string) => {
      if (columnId === sortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(columnId);
        setSortOrder("asc");
      }
      
      setPage(0);
    },
    [sortBy],
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Records
      </Typography>

      <DataTable
        columns={columns}
        rows={rows}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(rpp) => { setRowsPerPage(rpp); setPage(0); }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        loading={loading}
        emptyMessage="No records found."
        rowKey={(r) => r.id}
      />
    </Box>
  );
}
