import { useEffect, useState } from 'react';
import { openingDate } from '../config/invitation';

const SECOND = 1000;

function diff(target) {
  const total = target - Date.now();
  if (Number.isNaN(total) || total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, open: true, total: 0 };
  }
  return {
    days: Math.floor(total / (SECOND * 60 * 60 * 24)),
    hours: Math.floor((total / (SECOND * 60 * 60)) % 24),
    minutes: Math.floor((total / (SECOND * 60)) % 60),
    seconds: Math.floor((total / SECOND) % 60),
    open: false,
    total,
  };
}

/** Live countdown to the configured opening moment (IST-safe). */
export function useCountdown() {
  const target = openingDate();
  const [state, setState] = useState(() => (target ? diff(target.getTime()) : { open: false, total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, noDate: true }));

  useEffect(() => {
    if (!target) return;
    const ms = target.getTime();
    setState(diff(ms));

    let timeout;
    let interval;
    const startInterval = () => {
      interval = setInterval(() => {
        const next = diff(ms);
        setState(next);
        if (next.open) clearInterval(interval);
      }, SECOND);
    };

    // Align to the next whole second so digits always tick together.
    timeout = setTimeout(startInterval, SECOND - (Date.now() % SECOND));

    const onVisible = () => {
      if (document.visibilityState === 'visible') setState(diff(ms));
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target ? target.getTime() : null]);

  return state;
}
