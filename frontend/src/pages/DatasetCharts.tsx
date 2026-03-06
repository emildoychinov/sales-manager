import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useEffect } from "react";
import { SalesChart } from "../components/SalesChart/SalesChart";
import { useDispatch, useSelector } from "../store/hooks";
import { getDatasetAggregates } from "../store/middlewares";
import type { DatasetChartsProps } from "../types/chart";

export function DatasetCharts({ datasetId, filters }: DatasetChartsProps) {
  const dispatch = useDispatch();
  const { aggregates, aggregatesLoading } = useSelector((s) => s.datasets);

  useEffect(() => {
    dispatch(getDatasetAggregates({ datasetId, filters }));
  }, [dispatch, datasetId, filters]);

  if (aggregatesLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!aggregates) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        Could not load chart data.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Charts
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SalesChart
            title="Sales by product line"
            data={aggregates.sales_by_product_line}
            type="bar"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SalesChart
            title="Sales by country"
            data={aggregates.sales_by_country}
            type="pie"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SalesChart
            title="Sales over time"
            data={aggregates.sales_over_time}
            type="line"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
