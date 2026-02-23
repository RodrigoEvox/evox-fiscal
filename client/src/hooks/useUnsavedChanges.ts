import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook that warns the user when trying to leave a page with unsaved changes.
 * - Shows browser's native beforeunload dialog on tab close/refresh
 * - Can be used with a custom confirmation dialog for in-app navigation
 *
 * @param isDirty - Whether there are unsaved changes
 * @param message - Custom message (used for in-app dialogs; browser uses its own)
 */
export function useUnsavedChanges(isDirty: boolean, message = 'Você tem alterações não salvas. Deseja realmente sair?') {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Browser beforeunload (tab close / refresh)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      // Modern browsers ignore custom messages but still show a dialog
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [message]);

  // Helper for in-app navigation guards
  const confirmLeave = useCallback(() => {
    if (!isDirtyRef.current) return true;
    return window.confirm(message);
  }, [message]);

  return { confirmLeave, isDirty };
}

export default useUnsavedChanges;
