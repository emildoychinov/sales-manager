import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileDropZone } from "../components/FileDropZone/FileDropZone";

describe("FileDropZone", () => {
  const onFile = vi.fn();

  beforeEach(() => {
    onFile.mockClear();
  });

  it("renders the upload prompt", () => {
    render(<FileDropZone onFile={onFile} />);
    expect(screen.getByText(/drag & drop a csv file/i)).toBeInTheDocument();
  });

  it("calls onFile when a file is selected via the input", async () => {
    render(<FileDropZone onFile={onFile} />);

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["col1,col2\n1,2"], "data.csv", { type: "text/csv" });

    await userEvent.upload(input, file);

    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("calls onFile when a file is dropped", () => {
    render(<FileDropZone onFile={onFile} />);

    const dropzone = screen.getByText(/drag & drop/i).closest("div")!;
    const file = new File(["a,b\n1,2"], "drop.csv", { type: "text/csv" });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("does not call onFile when disabled and a file is dropped", () => {
    render(<FileDropZone onFile={onFile} disabled />);

    const dropzone = screen.getByText(/drag & drop/i).closest("div")!;
    const file = new File(["a,b\n1,2"], "drop.csv", { type: "text/csv" });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(onFile).not.toHaveBeenCalled();
  });

  it("applies reduced opacity when disabled", () => {
    render(<FileDropZone onFile={onFile} disabled />);
    const dropzone = screen.getByText(/drag & drop/i).closest("div")!;
    expect(dropzone).toBeInTheDocument();
  });

  it("respects the accept prop", () => {
    render(<FileDropZone onFile={onFile} accept=".parquet" />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.accept).toBe(".parquet");
  });
});
