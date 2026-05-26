import { useState, useCallback } from 'react';
import { FilterRule } from '../types';

export function useFilterManagement(initialRules: FilterRule[] = []) {
  const [filterRules, setFilterRules] = useState<FilterRule[]>(initialRules);

  const addFilter = useCallback((defaultField: string = 'cliente') => {
    setFilterRules(prev => [
      ...prev,
      { 
        id: crypto.randomUUID(), 
        field: defaultField, 
        operator: 'contains', 
        value: '', 
        logicalOperator: 'AND' 
      }
    ]);
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilterRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateFilter = useCallback((id: string, updates: Partial<FilterRule>) => {
    setFilterRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterRules([]);
  }, []);

  return {
    filterRules,
    setFilterRules,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters
  };
}
