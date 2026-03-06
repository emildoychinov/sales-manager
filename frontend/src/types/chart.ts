import type { AggregateItem, DatasetFilters } from "./datasets";

export interface SalesChartProps {
    title: string;
    data: AggregateItem[];
    type: "bar" | "pie" | "line";
  }

export interface DatasetChartsProps {
    datasetId: number;
    filters: DatasetFilters;
}