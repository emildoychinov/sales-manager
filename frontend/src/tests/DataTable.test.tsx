import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataTable } from "../components/DataTable/DataTable";
import type { Column } from "../types";

interface Row {
  id: number;
  name: string;
  amount: number;
}

const columns: Column<Row>[] = [
  { id: "name", label: "Name" },
  { id: "amount", label: "Amount", align: "right", sortable: true },
];

const rows: Row[] = [
  { id: 1, name: "Alpha", amount: 100 },
  { id: 2, name: "Beta", amount: 200 },
];

const baseProps = {
  columns,
  rows,
  total: 2,
  page: 0,
  rowsPerPage: 10,
  onPageChange: vi.fn(),
  onRowsPerPageChange: vi.fn(),
  rowKey: (r: Row) => r.id,
};

describe("DataTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders column headers", () => {
    render(<DataTable {...baseProps} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("renders all row data", () => {
    render(<DataTable {...baseProps} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("shows empty message when no rows", () => {
    render(<DataTable {...baseProps} rows={[]} total={0} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("calls onRowClick when a row is clicked", () => {
    const onRowClick = vi.fn();
    render(<DataTable {...baseProps} onRowClick={onRowClick} />);

    fireEvent.click(screen.getByText("Alpha"));

    expect(onRowClick).toHaveBeenCalledOnce();
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("uses custom render function for a column", () => {
    const customColumns: Column<Row>[] = [
      { id: "name", label: "Name", render: (r) => <span>{r.name.toUpperCase()}</span> },
    ];
    render(<DataTable {...baseProps} columns={customColumns} />);
    expect(screen.getByText("ALPHA")).toBeInTheDocument();
    expect(screen.getByText("BETA")).toBeInTheDocument();
  });

  it("renders a sortable column with TableSortLabel", () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        {...baseProps}
        sortBy="amount"
        sortOrder="asc"
        onSortChange={onSortChange}
      />,
    );

    const sortButton = screen.getByRole("button", { name: /amount/i });
    expect(sortButton).toBeInTheDocument();

    fireEvent.click(sortButton);
    expect(onSortChange).toHaveBeenCalledWith("amount");
  });

  it("shows loading progress bar when loading", () => {
    render(<DataTable {...baseProps} loading />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows pagination when total > 0", () => {
    render(<DataTable {...baseProps} total={50} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("does not show pagination when total is 0", () => {
    render(<DataTable {...baseProps} rows={[]} total={0} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
