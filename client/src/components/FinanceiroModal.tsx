import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface FinanceiroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function FinanceiroModal({
  open,
  onOpenChange,
  title,
  children,
  onSubmit,
  isLoading = false,
  submitLabel = "Salvar",
}: FinanceiroModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {children}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            {onSubmit && (
              <Button onClick={onSubmit} disabled={isLoading}>
                {isLoading ? "Salvando..." : submitLabel}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
