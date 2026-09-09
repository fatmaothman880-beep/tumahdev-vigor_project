import { useState, useEffect } from 'react';
import { api, AppStore, ConnectionInfo } from '../api/client';

export function useAppData() {
  const [data, setData] = useState<AppStore>(() => api.getSnapshot());

  useEffect(() => {
    // Initial fetch
    setData(api.getSnapshot());

    // Subscribe to store updates
    const unsubscribe = api.subscribe(() => {
      setData({ ...api.getSnapshot() });
    });

    return unsubscribe;
  }, []);

  return {
    ...data,
    connectionInfo: data.connectionInfo as ConnectionInfo,
    alerts: api.getAlerts(),
    api,
  };
}

export function useLiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const eatTime = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Africa/Nairobi', // EAT (UTC+3)
  });

  const eatDate = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Nairobi',
  });

  return { now, eatTime, eatDate };
}
