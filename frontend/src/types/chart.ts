import type { AggregateItem } from "./datasets";

export interface SalesChartProps {
    title: string;
    data: AggregateItem[];
    type: "bar" | "pie" | "line";
  }