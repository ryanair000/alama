import { useState, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const [storageError, setStorageError] = useState(false);

  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setStorageError(false);
      } catch (e) {
        console.warn('localStorage write failed:', e);
        setStorageError(true);
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue, storageError];
}
