'use client';

import { useCallback, useSyncExternalStore } from 'react';

const EVENT_NAME = 'persisted-boolean-change';

function subscribeFor(key: string) {
  return (notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) notify();
    };
    const onCustom = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) notify();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT_NAME, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT_NAME, onCustom);
    };
  };
}

export function usePersistedBoolean(key: string, defaultValue = false): [boolean, () => void] {
  const subscribe = useCallback(subscribeFor(key), [key]);
  const getSnapshot = useCallback(() => {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return raw === 'true';
  }, [key, defaultValue]);
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const current = window.localStorage.getItem(key) === 'true';
    window.localStorage.setItem(key, String(!current));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: key }));
  }, [key]);

  return [value, toggle];
}
