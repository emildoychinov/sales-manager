import { Box, Chip, Grid, Typography } from "@mui/material";
import { formatCurrency, formatDate } from "../utils/format";
import { DatasetStatus, type DatasetSummary } from "../types";

const STATUS_COLOR: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  [DatasetStatus.PENDING]: "warning",
  [DatasetStatus.PROCESSING]: "info",
  [DatasetStatus.COMPLETED]: "success",
  [DatasetStatus.FAILED]: "error",
  [DatasetStatus.DELETING]: "default",
};

interface InfoItemProps {
  label: string;
  value: string | number | React.ReactNode;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

interface DatasetDetailsProps {
  dataset: DatasetSummary;
}

export function DatasetDetails({ dataset }: DatasetDetailsProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {dataset.filename}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <InfoItem label="ID" value={dataset.id} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <InfoItem
            label="Status"
            value={
              <Chip
                label={dataset.status}
                color={STATUS_COLOR[dataset.status] ?? "default"}
                size="small"
                variant="outlined"
                sx={{ textTransform: "capitalize", fontWeight: 500 }}
              />
            }
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <InfoItem label="Rows" value={dataset.total_rows.toLocaleString()} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <InfoItem label="Total sales" value={formatCurrency(dataset.total_sales)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <InfoItem
            label="Date range"
            value={
              dataset.date_min && dataset.date_max
                ? `${formatDate(dataset.date_min)} – ${formatDate(dataset.date_max)}`
                : "—"
            }
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <InfoItem label="Uploaded" value={formatDate(dataset.created_at)} />
        </Grid>
      </Grid>
    </Box>
  );
}
