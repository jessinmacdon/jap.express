import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

interface Ui {
  toast: string | null;
  showToast: (msg: string) => void;
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
}

const Ctx = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(msg);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const value = useMemo(() => ({ toast, showToast, sheetOpen, openSheet, closeSheet }), [toast, showToast, sheetOpen, openSheet, closeSheet]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useUi = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useUi outside UiProvider');
  return s;
};
