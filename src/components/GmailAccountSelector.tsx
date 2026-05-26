import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Mail, Plus, Trash2, Check, X } from 'lucide-react';

export const GmailAccountSelector: React.FC = () => {
  const { 
    gmailAccounts, 
    activeGmailEmail, 
    setActiveGmailEmail, 
    removeGmailAccount, 
    addGmailAccount 
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setDeletingEmail(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddAccount = async () => {
    try {
      await addGmailAccount();
      setIsOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSelect = (email: string) => {
    if (deletingEmail === email) return;
    setActiveGmailEmail(email);
    setIsOpen(false);
  };

  const activeEmailDisplay = activeGmailEmail || (gmailAccounts[0] && gmailAccounts[0].email) || 'Seleccionar correo...';

  return (
    <div className="relative flex items-center text-xs text-slate-700" ref={dropdownRef}>
      <span className="text-slate-400 font-bold w-12 shrink-0">De:</span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all font-medium text-slate-700 font-sans shadow-sm"
      >
        <Mail className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800 font-mono">&lt;{activeEmailDisplay}&gt;</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-12 mt-1.5 w-72 bg-white rounded-xl border border-slate-200/80 shadow-lg z-50 py-1.5 font-sans overflow-hidden">
          {/* Header */}
          <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase border-b border-slate-50">
            CUENTAS
          </div>

          {/* Accounts list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {gmailAccounts.length === 0 ? (
              <div className="px-3.5 py-2 text-xs text-slate-400 italic">
                No hay cuentas asociadas
              </div>
            ) : (
              gmailAccounts.map((account) => {
                const isActive = activeGmailEmail 
                  ? (account.email.toLowerCase() === activeGmailEmail.toLowerCase())
                  : (gmailAccounts[0] && gmailAccounts[0].email.toLowerCase() === account.email.toLowerCase());
                const isUnderDeletion = deletingEmail === account.email;
                return (
                  <div
                    key={account.email}
                    onClick={() => handleSelect(account.email)}
                    className={`flex items-center justify-between px-3.5 py-2 text-xs transition-colors cursor-pointer group ${
                      isActive ? 'bg-indigo-50/50 font-bold text-indigo-950' : 'hover:bg-slate-50 text-slate-600 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      {!isActive && <div className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate font-mono">{account.email}</span>
                    </div>

                    {isUnderDeletion ? (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-rose-600 font-bold mr-1">¿Eliminar?</span>
                        <button
                          type="button"
                          onClick={() => {
                            removeGmailAccount(account.email);
                            setDeletingEmail(null);
                          }}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
                          title="Confirmar eliminación"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEmail(null)}
                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all"
                          title="Cancelar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingEmail(account.email);
                        }}
                        className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="h-px bg-slate-100 my-1" />

          {/* Options */}
          <button
            type="button"
            onClick={handleAddAccount}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-indigo-600 hover:bg-indigo-50/20 font-bold transition-colors text-left"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir cuenta de correo electrónico</span>
          </button>
        </div>
      )}
    </div>
  );
};
