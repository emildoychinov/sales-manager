import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Provider } from "react-redux";
import { store } from "../store";
import { DatasetsPage } from "../pages/DatasetsPage";
import type { DatasetSummary } from "../types";

const mockDatasets: DatasetSummary[] = [
  {
    id: 1,
    filename: "sales_q1.csv",
    status: "completed",
    total_rows: 100,
    rows_dropped: 2,
    total_sales: 50000,
    date_min: "2026-01-01",
    date_max: "2026-03-31",
    progress: 1,
    error_message: null,
    created_at: "2026-04-01T12:00:00Z",
  },
  {
    id: 2,
    filename: "sales_q2.csv",
    status: "pending",
    total_rows: 0,
    rows_dropped: 0,
    total_sales: 0,
    date_min: null,
    date_max: null,
    progress: 0,
    error_message: null,
    created_at: "2026-04-02T12:00:00Z",
  },
];

vi.mock("../services/datasetsApiRequests", () => ({
  default: {
    list: vi.fn(() =>
      Promise.resolve({
        data: {
          items: mockDatasets,
          total: mockDatasets.length,
        },
      })
    ),
    getById: vi.fn(),
    getRecords: vi.fn(),
    getAggregates: vi.fn(),
    getStatuses: vi.fn(),
    getProductLines: vi.fn(),
    getCountries: vi.fn(),
    export: vi.fn(),
    upload: vi.fn(() =>
      Promise.resolve({
        data: {
          id: 3,
          filename: "uploaded.csv",
          status: "pending",
          total_rows: 0,
          rows_dropped: 0,
          total_sales: 0,
          date_min: null,
          date_max: null,
          progress: 0,
          error_message: null,
          created_at: "2026-04-03T12:00:00Z",
        },
      })
    ),
    delete: vi.fn(() => Promise.resolve({ data: { dataset_id: 1 } })),
  },
}));

function renderDatasetsPage() {
  return render(
    <Provider store={store}>
      <DatasetsPage />
    </Provider>
  );
}

describe("DatasetsPage with mocked API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays datasets from mocked list API", async () => {
    renderDatasetsPage();

    await waitFor(() => {
      expect(screen.getByText("sales_q1.csv")).toBeInTheDocument();
    });
    expect(screen.getByText("sales_q2.csv")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("calls mocked upload API when a file is selected", async () => {
    const datasetsApiRequests = await import("../services/datasetsApiRequests");
    const uploadMock = datasetsApiRequests.default.upload as ReturnType<typeof vi.fn>;

    renderDatasetsPage();

    await waitFor(() => {
      expect(screen.getByText("sales_q1.csv")).toBeInTheDocument();
    });

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["col1,col2\n1,2"], "test.csv", { type: "text/csv" });
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledWith(file);
    });
  });
});
