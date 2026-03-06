import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { DatasetDetails } from "./DatasetDetails";
import { DatasetRecords } from "./DatasetRecords";
import { DatasetCharts } from "./DatasetCharts";
import { useDispatch, useSelector } from "../store/hooks";
import { getDatasetById, getDatasetStatuses, getDatasetProductLines, getDatasetCountries } from "../store/middlewares";
import { clearSelectedDataset } from "../store/reducers/datasetsReducer";
import type { DatasetFilters } from "../types";

interface DatasetDetailPageProps {
  datasetId: number;
  onBack: () => void;
}

export function DatasetDetailPage({ datasetId, onBack }: DatasetDetailPageProps) {
  const dispatch = useDispatch();
  const { selectedDataset, isLoading, errorMessage } = useSelector((s) => s.datasets);

  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [productLineOptions, setProductLineOptions] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);

  const [statusDraft, setStatusDraft] = useState("");
  const [productLineDraft, setProductLineDraft] = useState("");
  const [countryDraft, setCountryDraft] = useState("");
  const [dateFromDraft, setDateFromDraft] = useState("");
  const [dateToDraft, setDateToDraft] = useState("");

  const [filters, setFilters] = useState<DatasetFilters>({});

  useEffect(() => {
    dispatch(getDatasetById(datasetId));
    return () => { dispatch(clearSelectedDataset()); };
  }, [dispatch, datasetId]);

  useEffect(() => {
    async function fetchDropdownData() {
      const [statusRes, productLineRes, countriesRes] = await Promise.all([
        dispatch(getDatasetStatuses(datasetId)),
        dispatch(getDatasetProductLines(datasetId)),
        dispatch(getDatasetCountries(datasetId)),
      ]);

      //there probably is a better way to do this
      if (statusRes.payload && !isAxiosError(statusRes.payload))
        setStatusOptions(statusRes.payload as string[]);

      if (productLineRes.payload && !isAxiosError(productLineRes.payload))
        setProductLineOptions(productLineRes.payload as string[]);

      if (countriesRes.payload && !isAxiosError(countriesRes.payload))
        setCountryOptions(countriesRes.payload as string[]);
    }

    fetchDropdownData();
  }, [dispatch, datasetId]);

  const handleApplyFilters = useCallback(() => {
    setFilters({
      status: statusDraft || undefined,
      productLine: productLineDraft || undefined,
      country: countryDraft || undefined,
      dateFrom: dateFromDraft || undefined,
      dateTo: dateToDraft || undefined,
    });
  }, [statusDraft, productLineDraft, countryDraft, dateFromDraft, dateToDraft]);

  if (isLoading && !selectedDataset) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (errorMessage || !selectedDataset) {
    return (
      <Box sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
          Back to datasets
        </Button>
        <Typography color="error">
          {errorMessage ?? "Dataset not found."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
        Back to datasets
      </Button>

      <DatasetDetails dataset={selectedDataset} />
      <Divider sx={{ my: 3 }} />

      <Box
        component="form"
        onSubmit={(e: { preventDefault(): void }) => { e.preventDefault(); handleApplyFilters(); }}
        sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", mb: 3 }}
      >
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusDraft}
            label="Status"
            onChange={(e) => setStatusDraft(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Product line</InputLabel>
          <Select
            value={productLineDraft}
            label="Product line"
            onChange={(e) => setProductLineDraft(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {productLineOptions.map((pl) => (
              <MenuItem key={pl} value={pl}>{pl}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Country</InputLabel>
          <Select
            value={countryDraft}
            label="Country"
            onChange={(e) => setCountryDraft(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {countryOptions.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="From"
          type="date"
          value={dateFromDraft}
          onChange={(e) => setDateFromDraft(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 150 }}
        />

        <TextField
          size="small"
          label="To"
          type="date"
          value={dateToDraft}
          onChange={(e) => setDateToDraft(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 150 }}
        />

        <Button
          type="submit"
          variant="outlined"
          size="small"
          startIcon={<FilterListIcon />}
          sx={{ height: 40 }}
        >
          Filter
        </Button>
      </Box>

      <DatasetRecords datasetId={datasetId} filters={filters} />
      <Divider sx={{ my: 3 }} />
      <DatasetCharts datasetId={datasetId} filters={filters} />
    </Box>
  );
}
