import React, { useState, useEffect } from 'react';
import { Settings, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCustomAcronyms, saveCustomAcronyms, formatTitleCase } from '../lib/utils';

interface WordCasingAdjusterProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
}

export const WordCasingAdjuster: React.FC<WordCasingAdjusterProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customAcronyms, setCustomAcronyms] = useState<string[]>([]);

  useEffect(() => {
    setCustomAcronyms(getCustomAcronyms());
  }, [isOpen]);

  const words = value.split(/\s+/).filter(w => w.length > 0);

  const toggleAcronym = (word: string) => {
    const upper = word.toUpperCase();
    let newList = [...customAcronyms];
    if (newList.includes(upper)) {
      newList = newList.filter(a => a !== upper);
    } else {
      newList.push(upper);
    }
    setCustomAcronyms(newList);
    saveCustomAcronyms(newList);
    
    // Apply changes to the value immediately
    const newValue = formatTitleCase(value);
    onChange(newValue);
  };

  if (!value) return null;

  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-500 bg-white border border-slate-200"
        title="Ajustar siglas y mayúsculas"
      >
        <Settings size={14} className={isOpen ? 'animate-spin-slow' : ''} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 border-t-4 border-t-indigo-500"
            >
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Ajuste de Siglas</h4>
                  {label && <p className="text-[9px] text-slate-300 mt-1 uppercase font-medium">{label}</p>}
                </div>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <X size={12} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {words.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">No hay palabras para ajustar</p>
                ) : (
                  words.map((word, idx) => {
                    const upper = word.toUpperCase();
                    const isAcronym = customAcronyms.includes(upper);
                    
                    return (
                      <div 
                        key={`${word}-${idx}`} 
                        className={`flex items-center justify-between gap-3 p-2 rounded-xl transition-all ${
                          isAcronym ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-bold truncate ${isAcronym ? 'text-indigo-700 font-mono' : 'text-slate-600'}`}>
                            {isAcronym ? upper : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()}
                          </span>
                        </div>
                        
                        <label className="relative flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isAcronym} 
                            onChange={() => toggleAcronym(word)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-500/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                          <span className={`ml-2 text-[8px] font-bold uppercase transition-colors ${
                            isAcronym ? 'text-indigo-600' : 'text-slate-400'
                          }`}>Sigla</span>
                        </label>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2">
                <Info size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-[9px] text-slate-400 leading-relaxed italic">
                  Al marcar una palabra como <b>Sigla</b>, el sistema la mantendrá siempre en mayúsculas en todos los campos automáticos.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
