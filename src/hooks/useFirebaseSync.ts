import React, { useState, useEffect } from 'react';
import { subscribeToCollection, saveItem, deleteItem } from '../services/firebaseService';

export function useFirebaseSync<T extends { id: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const unsub = subscribeToCollection(collectionName, (fbData) => {
      setData(fbData as T[]);
    });
    return unsub;
  }, [collectionName]);

  const customSetData = (action: React.SetStateAction<T[]>) => {
    setData((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      
      const addedOrModified = next.filter(n => {
        const p = prev.find(i => i.id === n.id);
        if (!p) return true;
        return JSON.stringify(p) !== JSON.stringify(n);
      });
      
      const prevIds = new Set(prev.map(i => i.id));
      const nextIds = new Set(next.map(i => i.id));
      const deleted = prev.filter(p => !nextIds.has(p.id));
      
      deleted.forEach(item => deleteItem(collectionName, item.id));
      addedOrModified.forEach(item => saveItem(collectionName, item));
      
      return next;
    });
  };

  return [data, customSetData] as const;
}
