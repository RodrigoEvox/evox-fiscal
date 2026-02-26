import { useState, useCallback, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Hook to guard dialog close when form has unsaved data.
 * 
 * Usage:
 *   const { guardedClose, ConfirmAlert } = useConfirmClose(isDirty, () => setShowDialog(false));
 *   
 *   <Dialog open={open} onOpenChange={(val) => { if (!val) guardedClose(); }}>
 *     ...
 *     <Button onClick={guardedClose}>Cancelar</Button>
 *     ...
 *   </Dialog>
 *   <ConfirmAlert />
 */
export function useConfirmClose(isDirty: boolean, onClose: () => void) {
  const [showConfirm, setShowConfirm] = useState(false);

  const guardedClose = useCallback(() => {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleConfirm = useCallback(() => {
    setShowConfirm(false);
    onClose();
  }, [onClose]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const ConfirmAlert = useCallback(() => (
    <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deseja sair sem salvar?</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem alterações não salvas. Se sair agora, todas as modificações serão perdidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Continuar Editando
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sair sem Salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ), [showConfirm, handleCancel, handleConfirm]);

  return { guardedClose, ConfirmAlert };
}
