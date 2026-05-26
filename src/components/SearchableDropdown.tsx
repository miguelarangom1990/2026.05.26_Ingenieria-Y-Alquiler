import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';
import { cleanInput, trimInput, formatTitleCase } from '../lib/utils';

interface Option {
  value: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  allowCustom?: boolean;
  matcher?: (optionLabel: string, searchTerm: string) => boolean;
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Seleccione una opción",
  icon,
  className = "",
  required = false,
  disabled = false,
  allowCustom = false,
  matcher,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(allowCustom && !selectedOption ? value || "" : "");
    }
  }, [isOpen, allowCustom, value, selectedOption]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    document.addEventListener('touchstart', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
      document.removeEventListener('touchstart', handleClickOutside, { capture: true });
    };
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) => {
      if (!searchTerm) return true;
      if (opt.label.toLowerCase().includes(searchTerm.toLowerCase())) return true;
      return matcher ? matcher(opt.label, searchTerm) : false;
    });
  }, [options, searchTerm, matcher]);

  const exactMatchExists = useMemo(() => {
    return options.some(opt => opt.label.toLowerCase() === searchTerm.trim().toLowerCase());
  }, [options, searchTerm]);

  return (
    <div className={`relative w-full`} ref={dropdownRef}>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type="text"
          placeholder={selectedOption ? selectedOption.label : value && allowCustom ? value : placeholder}
          value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : (allowCustom ? value : ""))}
          onFocus={() => {
            if (!disabled) {
              setSearchTerm(allowCustom && !selectedOption ? value || "" : "");
              setIsOpen(true);
            }
          }}
          onChange={(e) => {
            const cleaned = cleanInput(e.target.value);
            setSearchTerm(cleaned);
            if (!isOpen) setIsOpen(true);
            if (cleaned === '') {
              onChange('');
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              if (allowCustom) {
                const currentVal = valueRef.current;
                const currentOpt = options.find(o => o.value === currentVal);
                if (currentOpt) {
                  setSearchTerm(currentOpt.label);
                } else {
                  setSearchTerm(currentVal || "");
                }
              } else {
                setSearchTerm("");
              }
              setIsOpen(false);
            }, 200);
          }}
          disabled={disabled}
          required={required && !value}
          className={`${className || `w-full pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-700 transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400`} ${icon ? '!pl-9' : ''} pr-10 text-sm ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
        />
        <ChevronDown 
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`} 
          size={16} 
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-[150] max-h-60 flex flex-col no-scrollbar animate-in fade-in slide-in-from-top-2">
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 transition-colors border-b border-slate-50 last:border-0 ${opt.disabled ? 'bg-slate-50 opacity-60 cursor-default' : 'hover:bg-slate-50 cursor-pointer'} ${value === opt.value ? 'bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  {opt.subtitle && (
                    <div className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">{opt.subtitle}</div>
                  )}
                </button>
              ))
            ) : null}
          </div>
          
          {allowCustom && searchTerm.trim() && !exactMatchExists && (
            <button
              type="button"
              onClick={() => {
                const formatted = formatTitleCase(trimInput(searchTerm));
                onChange(formatted);
                setIsOpen(false);
              }}
              className="w-full text-left p-3 hover:bg-indigo-50 transition-colors border-t border-slate-200 flex items-start gap-3 text-indigo-700 bg-slate-50 group shrink-0"
            >
              <div className="bg-white p-1 rounded shadow-sm group-hover:scale-110 transition-transform mt-0.5">
                 <Plus size={14} className="text-indigo-600" />
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider font-bold mb-0.5 opacity-80">Agregar Provisionalmente</span>
                <span className="block text-sm font-medium">{formatTitleCase(trimInput(searchTerm))}</span>
              </div>
            </button>
          )}

          {!allowCustom && filteredOptions.length === 0 && (
            <div className="p-4 text-xs text-slate-400 italic text-center shrink-0">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
}
