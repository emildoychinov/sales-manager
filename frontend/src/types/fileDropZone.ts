export interface FileDropZoneProps {
  accept?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}
