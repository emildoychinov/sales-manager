import { Box, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import type { SalesChartProps } from "../../types/chart";

export function SalesChart({ title, data, type }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No data for {title}
        </Typography>
      </Box>
    );
  }

  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.value);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      {type === "bar" && (
        <BarChart
          xAxis={[{ scaleType: "band" as const, data: labels }]}
          series={[{ data: values }]}
          height={300}
        />
      )}
      {type === "pie" && (
        <PieChart
          series={[
            {
              data: labels.map((label, i) => ({ id: i, label, value: values[i] })),
            },
          ]}
          height={300}
        />
      )}
      {type === "line" && (
        <LineChart
          xAxis={[{ scaleType: "band" as const, data: labels }]}
          series={[{ data: values }]}
          height={300}
        />
      )}
    </Box>
  );
}
