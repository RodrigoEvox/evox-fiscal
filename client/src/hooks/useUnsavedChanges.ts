import { useEffect, useCallback, useRef, useState, createElement } from 'react';

/**
 * Hook that warns the user when trying to leave a page with unsaved changes.
 * - Shows browser's native beforeunload dialog on tab close/refresh
 * - Provides confirmNavigation() for in-app navigation guards with custom AlertDialog
 * - Provides UnsavedAlert component to render the confirmation dialog
 *
 * Usage:
 *   const { setDirty, confirmNavigation, UnsavedAlert } = useUnsavedChanges();
 *   setDirty(true); // when form is edited
 *   const handleCancel = () => confirmNavigation(() => navigate('/somewhere'));
 *   return <>{...}<UnsavedAlert /></>;
 */
export function useUnsavedChanges() {
  const [isDirty, setIsDirtyState] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const isDirtyRef = useRef(false);

  const setDirty = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
    setIsDirtyState(dirty);
  }, []);

  // Browser beforeunload (tab close / refresh)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // For in-app navigation guards - shows custom dialog
  const confirmNavigation = useCallback((action: () => void) => {
    if (!isDirtyRef.current) {
      action();
      return;
    }
    pendingAction.current = action;
    setShowAlert(true);
  }, []);

  // Legacy API: simple window.confirm
  const confirmLeave = useCallback(() => {
    if (!isDirtyRef.current) return true;
    return window.confirm('Você tem alterações não salvas. Deseja realmente sair?');
  }, []);

  const handleConfirm = useCallback(() => {
    setShowAlert(false);
    setDirty(false);
    if (pendingAction.current) {
      pendingAction.current();
      pendingAction.current = null;
    }
  }, [setDirty]);

  const handleCancel = useCallback(() => {
    setShowAlert(false);
    pendingAction.current = null;
  }, []);

  // Render function for the AlertDialog (uses createElement to avoid JSX in .ts)
  const UnsavedAlert = useCallback(() => {
    if (!showAlert) return null;
    // Use a simple portal-based overlay instead of shadcn AlertDialog to avoid .tsx
    return createElement('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center',
      onClick: (e: any) => { if (e.target === e.currentTarget) handleCancel(); },
    },
      createElement('div', { className: 'fixed inset-0 bg-black/50 z-50' }),
      createElement('div', {
        className: 'relative z-50 bg-background border rounded-lg shadow-lg p-6 max-w-md w-full mx-4',
      },
        createElement('h2', { className: 'text-lg font-semibold text-foreground mb-2' }, 'Deseja sair sem salvar?'),
        createElement('p', { className: 'text-sm text-muted-foreground mb-6' },
          'Você tem alterações não salvas. Se sair agora, todas as modificações serão perdidas.'
        ),
        createElement('div', { className: 'flex justify-end gap-3' },
          createElement('button', {
            className: 'px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors',
            onClick: handleCancel,
          }, 'Continuar Editando'),
          createElement('button', {
            className: 'px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors',
            onClick: handleConfirm,
          }, 'Sair sem Salvar'),
        ),
      ),
    );
  }, [showAlert, handleCancel, handleConfirm]);

  return { isDirty, setDirty, confirmNavigation, confirmLeave, UnsavedAlert };
}

export default useUnsavedChanges;
