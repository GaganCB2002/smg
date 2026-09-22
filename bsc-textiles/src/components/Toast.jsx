import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const idRef = useRef(0);

  const show = useCallback((message, { duration = 2600, tone = 'gold' } = {}) => {
    idRef.current += 1;
    const id = idRef.current;
    setToast({ id, message, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), duration);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex justify-center px-4"
      >
        {toast ? (
          <div
            key={toast.id}
            className="toast-pop glass pointer-events-auto flex items-center gap-3 rounded-full px-5 py-3 text-[0.7rem] uppercase tracking-[0.28em] text-ivory"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: toast.tone === 'error' ? '#e27a7a' : 'var(--champagne)',
                boxShadow: `0 0 12px ${toast.tone === 'error' ? '#e27a7a' : 'var(--champagne)'}`,
              }}
            />
            <span style={{ letterSpacing: '0.18em' }}>{toast.message}</span>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
