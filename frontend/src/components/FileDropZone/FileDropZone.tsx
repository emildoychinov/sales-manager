import { Box, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useRef, useState, useCallback } from "react";
import type { DragEvent, ChangeEvent } from "react";
import type { FileDropZoneProps } from "../../types";

export function FileDropZone({ accept = ".csv", onFile, disabled = false }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [disabled, onFile],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);

      e.target.value = "";
    },
    [onFile],
  );

  return (
    <Box
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      sx={{
        border: "1.5px dashed",
        borderColor: dragOver ? "primary.main" : "divider",
        borderRadius: 1.5,
        px: 3,
        py: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        cursor: disabled ? "default" : "pointer",
        bgcolor: dragOver ? "action.hover" : "transparent",
        opacity: disabled ? 0.5 : 1,
        transition: "border-color 150ms, background-color 150ms",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        hidden
      />
      <UploadFileIcon sx={{ fontSize: 32, color: "text.secondary" }} />
      <Typography variant="body2" color="text.secondary">
        Drag &amp; drop a CSV file here, or click to browse
      </Typography>
    </Box>
  );
}
