import React, { useState, useEffect } from 'react';

interface UseColumnResizingProps {
  initialWidths: Record<string, number>;
  onWidthsChange: (widths: Record<string, number>) => void;
}

export const useColumnResizing = ({ initialWidths, onWidthsChange }: UseColumnResizingProps) => {
  const [resizingColumn, setResizingColumn] = useState<{ id: string, startX: number, startWidth: number } | null>(null);

  const handleResizeMouseDown = (id: string, e: React.MouseEvent) => {
    setResizingColumn({
      id,
      startX: e.clientX,
      startWidth: initialWidths[id] || 150,
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn) return;
      
      const deltaX = e.clientX - resizingColumn.startX;
      const newWidth = Math.max(50, resizingColumn.startWidth + deltaX);
      
      onWidthsChange({
        ...initialWidths,
        [resizingColumn.id]: newWidth
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    if (resizingColumn) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, initialWidths, onWidthsChange]);

  return {
    handleResizeMouseDown,
    isResizing: !!resizingColumn
  };
};
