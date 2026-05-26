import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DatePickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  className?: string;
  placeholder?: string;
  align?: 'left' | 'right';
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const YEARS = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  defaultValue,
  onChange,
  required,
  disabled,
  name,
  className = "",
  placeholder = "Seleccione una fecha",
  align = "left"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update internal value when prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Parse initial date or use today for view
  const initialDate = internalValue ? new Date(internalValue + 'T00:00:00') : new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  
  useEffect(() => {
    if (internalValue) {
      setViewDate(new Date(internalValue + 'T00:00:00'));
    }
  }, [internalValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName.toLowerCase() === 'option' || target.tagName.toLowerCase() === 'select')) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (day: number) => {
    if (disabled) return;
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    if (value === undefined) setInternalValue(formattedDate);
    onChange?.(formattedDate);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (value === undefined) setInternalValue('');
    onChange?.('');
    setIsOpen(false);
  };

  const handleToday = () => {
    if (disabled) return;
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    if (value === undefined) setInternalValue(formattedDate);
    onChange?.(formattedDate);
    setIsOpen(false);
  };

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const changeYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
  };

  const changeMonthByName = (monthIndex: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }
    
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = internalValue === `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
      
      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleDateSelect(i)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
            isSelected ? 'bg-indigo-600 text-white shadow-sm' :
            isToday ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
            'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return days;
  };

  const displayValue = internalValue ? new Date(internalValue + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : '';

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative group flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
      >
        <CalendarIcon className="absolute left-3 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          readOnly 
          value={displayValue} 
          placeholder={placeholder} 
          required={required} 
          className="w-full flex-1 min-w-0 bg-transparent outline-none cursor-pointer text-sm pl-9 pr-2 group-hover:pr-8 transition-all py-0.5" 
        />
        {/* Hidden input for form submission */}
        {name && <input type="hidden" name={name} value={internalValue} />}
        
        {internalValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute z-[100] mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 w-72 ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            {/* Header with Selects */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-1">
                <select 
                  value={viewDate.getMonth()}
                  onChange={(e) => changeMonthByName(parseInt(e.target.value))}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-bold text-slate-900 bg-transparent border-none outline-none cursor-pointer hover:text-indigo-600 transition-colors pr-2 relative"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select 
                  value={viewDate.getFullYear()}
                  onChange={(e) => changeYear(parseInt(e.target.value))}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-bold text-slate-900 bg-transparent border-none outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* Footer Actions */}
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
              >
                Hoy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
