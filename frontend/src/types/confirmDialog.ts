export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "error" | "primary" | "secondary" | "warning" | "info" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}
