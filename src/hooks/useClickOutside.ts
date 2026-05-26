import React, { useEffect } from 'react';

export const useClickOutside = (refs: React.RefObject<HTMLElement>[], handler: () => void) => {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutside = refs.every(ref => ref.current && !ref.current.contains(event.target as Node));
      if (isOutside) {
        handler();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [refs, handler]);
};
