import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, Edit2, X, Building2, MapPin, Calendar, History, 
  Paperclip, MessageSquare, Image, Video, File, Download, 
  Trash2, Send, ChevronUp, ChevronDown, ChevronLeft, 
  ChevronRight, RefreshCw, CheckCircle2, AlertCircle, Mail, Reply
} from 'lucide-react';
import { 
  MaintenanceCard, 
  MaintenanceStatus, 
  Attachment,
  ConfirmDialogProps
} from '../../types';
import { groupCommentsAndThreads, EmailThreadView } from '../EmailThreadView';
import { 
  cleanInput, 
  trimInput, 
  generateMaintenanceTitle 
} from '../../lib/utils';
import { 
  formatDateTime 
} from '../../lib/orderUtils';
import { 
  MAINTENANCE_COLUMNS 
} from '../../constants/orders';
import { MaintenanceStepIndicator } from '../StepIndicators';
import { sendEmail, fetchProfileEmail, fetchThreadMessages, extractMessageText } from '../../services/gmailService';
import { Can } from '../Can';
import { useAuth } from '../../context/AuthContext';
import { GmailAccountSelector } from '../GmailAccountSelector';

interface MaintenanceDetailsModalProps {
  viewingMaintenanceCard: MaintenanceCard;
  setViewingMaintenanceCard: (card: MaintenanceCard | null) => void;
  updateMaintenanceCard: (card: MaintenanceCard) => void;
  deleteMaintenanceCard: (id: string) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceStatus) => void;
  updateMaintenanceItems: (id: string, items: any[]) => void;
  updateMaintenanceField: (id: string, field: string, value: any) => void;
  maintenanceCards: MaintenanceCard[];
  setEditingMaintenanceCard: (card: MaintenanceCard | null) => void;
  setEditingMaintenanceStage: (stage: MaintenanceStatus | null) => void;
  setConfirmDialog: (dialog: ConfirmDialogProps) => void;
  asModal?: boolean;
  maintenanceViewMode: 'simple' | 'detailed';
  commentPanelWidth: number;
  setCommentPanelWidth: (val: number) => void;
  windowWidth: number;
  isDraggingComment: boolean;
  commentAttachments: Attachment[];
  setCommentAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  newComment: string;
  setNewComment: (val: string) => void;
  handleAddComment: (id: string, isMaintenance: boolean, overrideText?: string, extraFields?: any) => void;
  handleCommentFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCommentDragOver: (e: React.DragEvent) => void;
  handleCommentDragLeave: (e: React.DragEvent) => void;
  handleCommentDrop: (e: React.DragEvent) => void;
  handleDeleteCommentAttachment: (cardId: string, commentId: string, attachmentId: string, isMaintenance: boolean) => void;
  setViewingItemDetails: (item: any) => void;
}

export const MaintenanceDetailsModal: React.FC<MaintenanceDetailsModalProps> = React.memo(({
  viewingMaintenanceCard,
  setViewingMaintenanceCard,
  updateMaintenanceCard,
  deleteMaintenanceCard,
  updateMaintenanceStatus,
  updateMaintenanceItems,
  updateMaintenanceField,
  maintenanceCards,
  setEditingMaintenanceCard,
  setEditingMaintenanceStage,
  setConfirmDialog,
  asModal = false,
  maintenanceViewMode,
  commentPanelWidth,
  setCommentPanelWidth,
  windowWidth,
  isDraggingComment,
  commentAttachments,
  setCommentAttachments,
  newComment,
  setNewComment,
  handleAddComment,
  handleCommentFileUpload,
  handleCommentDragOver,
  handleCommentDragLeave,
  handleCommentDrop,
  handleDeleteCommentAttachment,
  setViewingItemDetails,
}) => {
  const [isEditingMaintenanceTitle, setIsEditingMaintenanceTitle] = useState(false);
  const [maintenanceTitleInput, setMaintenanceTitleInput] = useState('');
  const [isMaintenanceModifyMenuOpen, setIsMaintenanceModifyMenuOpen] = useState(false);
  const [isMaintenanceActionMenuOpen, setIsMaintenanceActionMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Local upload state if needed

  const maintenanceModifyMenuRef = useRef<HTMLDivElement>(null);
  const maintenanceActionMenuRef = useRef<HTMLDivElement>(null);

  const { hasPermission, accessToken, loginWithGoogle, userData, currentUser, gmailAccounts, activeGmailEmail, removeGmailAccount } = useAuth();
  const canEdit = hasPermission('EDITAR_MANTENIMIENTO');

  const [commentType, setCommentType] = useState<'comment' | 'email'>('comment');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [replyThreadId, setReplyThreadId] = useState<string | null>(null);
  const [isSyncingEmails, setIsSyncingEmails] = useState(false);

  const handleSyncEmails = async (isAutoSync = false) => {
    let currentToken = accessToken;
    if (!currentToken) {
      if (isAutoSync) return;
      setConfirmDialog({
        isOpen: true,
        message: 'Es necesario autorizar la conexión a Gmail para sincronizar correos. ¿Deseas hacerlo ahora?',
        onConfirm: async () => {
          try {
            await loginWithGoogle();
            setConfirmDialog({
              isOpen: true,
              message: 'Se autorizó correctamente. Por favor intenta sincronizar de nuevo haciendo clic en el botón.',
              onConfirm: () => {},
              isAlert: true
            });
          } catch (e: any) {
            setConfirmDialog({
              isOpen: true,
              message: "Error autorizando Gmail: " + e.message,
              onConfirm: () => {},
              isAlert: true
            });
          }
        }
      });
      return;
    }
    const currentThreads = viewingMaintenanceCard.emailThreadIds || [];
    if (currentThreads.length === 0) {
      if (isAutoSync) return;
      setConfirmDialog({
        isOpen: true,
        message: 'No hay correos enlazados para sincronizar en este mantenimiento. Primero debes enviar un correo desde esta ventana de comentarios para enlazarlo.',
        onConfirm: () => {},
        isAlert: true
      });
      return;
    }
    
    setIsSyncingEmails(true);
    try {
      let newCommentsCount = 0;
      const currentMessages = new Set((viewingMaintenanceCard.comments || []).filter(c => c.messageId).map(c => c.messageId));
      let updatedComments = [...(viewingMaintenanceCard.comments || [])];

      for (const threadId of currentThreads) {
        const threadData = await fetchThreadMessages(accessToken, threadId);
        if (threadData && threadData.messages) {
          for (const msg of threadData.messages) {
            const headers = msg.payload?.headers || [];
            const rfcMessageId = headers.find((h: any) => h.name.toLowerCase() === 'message-id')?.value;
            
            if (!currentMessages.has(msg.id)) {
              // Extract basic info
              const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Desconocido';
              const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'Sin Asunto';
              const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();
              
              const bodyText = extractMessageText(msg.payload);

              // Prepend header to body
              const fullText = `[Correo Recibido]\n\nDe: ${fromHeader}\nAsunto: ${subjectHeader}\n\n${bodyText}`;

              updatedComments.push({
                id: crypto.randomUUID(),
                text: fullText,
                author: fromHeader,
                timestamp: new Date(dateHeader).getTime(),
                messageId: msg.id,
                rfcMessageId,
                threadId: msg.threadId
              });
              
              currentMessages.add(msg.id);
              newCommentsCount++;
            } else {
              // Update existing comment to ensure it has rfcMessageId
              const existingIdx = updatedComments.findIndex(c => c.messageId === msg.id);
              if (existingIdx !== -1 && !updatedComments[existingIdx].rfcMessageId && rfcMessageId) {
                updatedComments[existingIdx] = { ...updatedComments[existingIdx], rfcMessageId };
                newCommentsCount++; // Count as update to trigger save
              }
            }
          }
        }
      }
      
      if (newCommentsCount > 0) {
        // Update the maintenance card comments
        updatedComments.sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0));
        updateMaintenanceField(viewingMaintenanceCard.id, 'comments', updatedComments);
        setViewingMaintenanceCard((prev: any) => prev ? { ...prev, comments: updatedComments } : prev);
        if (!isAutoSync) {
          setConfirmDialog({
            isOpen: true,
            message: `Se han sincronizado ${newCommentsCount} correos nuevos.`,
            onConfirm: () => {},
            isAlert: true
          });
        }
      } else {
        if (!isAutoSync) {
          setConfirmDialog({
            isOpen: true,
            message: 'No se encontraron respuestas nuevas en los correos enlazados.',
            onConfirm: () => {},
            isAlert: true
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.status === 401) {
        const expiredEmail = activeGmailEmail || (gmailAccounts && gmailAccounts[0]?.email);
        if (expiredEmail) {
          removeGmailAccount(expiredEmail);
        }
        if (!isAutoSync) {
          setConfirmDialog({
            isOpen: true,
            message: 'Tu sesión de Gmail ha caducado o tiene credenciales inválidas. Se ha desconectado la cuenta para que puedas volverla a conectar y evitar este error.',
            onConfirm: () => {},
            isAlert: true
          });
        }
      } else {
        if (!isAutoSync) {
          setConfirmDialog({
            isOpen: true,
            message: 'Error sincronizando correos: ' + err.message,
            onConfirm: () => {},
            isAlert: true
          });
        }
      }
    } finally {
      setIsSyncingEmails(false);
    }
  };

  useEffect(() => {
    if (accessToken && viewingMaintenanceCard.emailThreadIds && viewingMaintenanceCard.emailThreadIds.length > 0) {
      handleSyncEmails(true);
    }
  }, [viewingMaintenanceCard.id, accessToken]);

  const handleReplyToComment = (comment: any) => {
    if ((comment.rfcMessageId || comment.messageId) && comment.threadId) {
      setReplyMessageId(comment.rfcMessageId || comment.messageId);
      setReplyThreadId(comment.threadId);
      
      let email = comment.author || '';
      const match = email.match(/<([^>]+)>/);
      if (match) email = match[1];
      setEmailTo(email);
      
      const subjectMatch = comment.text?.match(/Asunto:\s*(.*)/);
      let subject = subjectMatch ? subjectMatch[1] : emailSubject;
      if (!subject.toLowerCase().startsWith('re:')) {
        subject = `Re: ${subject}`;
      }
      setEmailSubject(subject.trim());
      setCommentType('email');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (maintenanceModifyMenuRef.current && !maintenanceModifyMenuRef.current.contains(event.target as Node)) {
        setIsMaintenanceModifyMenuOpen(false);
      }
      if (maintenanceActionMenuRef.current && !maintenanceActionMenuRef.current.contains(event.target as Node)) {
        setIsMaintenanceActionMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full h-full max-w-none bg-white animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-none rounded-none shadow-none">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/50 shrink-0 gap-4">
          <div className="flex items-center gap-8 flex-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 shrink-0 group">
              <Wrench className="w-5 h-5 text-orange-600" />
              {isEditingMaintenanceTitle ? (
                <input
                  autoFocus
                  type="text"
                  value={maintenanceTitleInput}
                  onChange={(e) => setMaintenanceTitleInput(e.target.value)}
                  onBlur={() => {
                    setIsEditingMaintenanceTitle(false);
                    const trimmed = maintenanceTitleInput.trim();
                    if (trimmed && trimmed !== viewingMaintenanceCard.nombre) {
                      const newCard = { ...viewingMaintenanceCard, nombre: trimmed, isManualTitle: true };
                      setViewingMaintenanceCard(newCard);
                      updateMaintenanceCard(newCard);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingMaintenanceTitle(false);
                      const trimmed = maintenanceTitleInput.trim();
                      if (trimmed && trimmed !== viewingMaintenanceCard.nombre) {
                        const newCard = { ...viewingMaintenanceCard, nombre: trimmed, isManualTitle: true };
                        setViewingMaintenanceCard(newCard);
                        updateMaintenanceCard(newCard);
                      }
                    } else if (e.key === 'Escape') {
                      setIsEditingMaintenanceTitle(false);
                    }
                  }}
                  className="text-xl font-bold bg-white border border-orange-300 rounded px-2 outline-none w-full max-w-md focus:ring-2 focus:ring-orange-500"
                />
              ) : (
                <span 
                  className={`truncate px-1 -mx-1 rounded transition-colors ${canEdit ? 'cursor-text hover:bg-slate-100' : ''}`}
                  onClick={() => {
                    if (!canEdit) return;
                    setMaintenanceTitleInput(viewingMaintenanceCard.nombre || generateMaintenanceTitle(viewingMaintenanceCard.items, viewingMaintenanceCard.cliente));
                    setIsEditingMaintenanceTitle(true);
                  }}
                  title={canEdit ? "Click para editar" : ""}
                >
                  {viewingMaintenanceCard.nombre ? viewingMaintenanceCard.nombre : generateMaintenanceTitle(viewingMaintenanceCard.items, viewingMaintenanceCard.cliente)}
                  {canEdit && <Edit2 className="w-3 h-3 inline-block ml-2 text-slate-300 opacity-0 group-hover:opacity-100" />}
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={() => {
                const newIsManual = !viewingMaintenanceCard.isManualTitle;
                const newCard = { ...viewingMaintenanceCard, isManualTitle: newIsManual };
                if (!newIsManual) {
                  newCard.nombre = generateMaintenanceTitle(newCard.items, newCard.cliente);
                }
                setViewingMaintenanceCard(newCard);
                updateMaintenanceCard(newCard);
              }}
              className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all shrink-0 ${viewingMaintenanceCard.isManualTitle ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
              title={viewingMaintenanceCard.isManualTitle ? "Título Manual" : "Título Automático"}
            >
              {viewingMaintenanceCard.isManualTitle ? 'Manual' : 'Automático'}
            </button>
            <div className="hidden lg:block flex-1 max-w-2xl">
              <MaintenanceStepIndicator status={viewingMaintenanceCard.status} compact={true} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!asModal && (
              <Can permission="ELIMINAR_MANTENIMIENTO">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setConfirmDialog({
                      isOpen: true,
                      message: '¿Estás seguro de que quieres eliminar este mantenimiento?',
                      onConfirm: () => {
                        if (viewingMaintenanceCard?.id) deleteMaintenanceCard(viewingMaintenanceCard.id);
                        setViewingMaintenanceCard(null);
                      }
                    });
                  }}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-600"
                  title="Eliminar mantenimiento"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </Can>
            )}
            <button 
              onClick={() => setViewingMaintenanceCard(null)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {viewingMaintenanceCard.cliente}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Obra</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {viewingMaintenanceCard.obra || 'No especificada'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha Ingreso Taller</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {viewingMaintenanceCard.fechaIngreso}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha Creación</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  {formatDateTime(viewingMaintenanceCard.timestamp)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Equipos en Mantenimiento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {viewingMaintenanceCard.items.map(item => (
                  <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span 
                        className="font-semibold text-slate-700 text-sm hover:text-blue-600 hover:underline cursor-pointer"
                        onClick={() => setViewingItemDetails(item)}
                      >
                        {item.equipo}
                      </span>
                      <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">Cant: {item.cantidad}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                      {viewingMaintenanceCard.status !== 'COT_CLIENT' && (
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Aprob. Gerencia</p>
                          <p className="text-xs font-medium text-slate-700">{item.aprobacionGerencia || '-'}</p>
                        </div>
                      )}
                      {viewingMaintenanceCard.status === 'COT_CLIENT' && (
                        <>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Valor Cot. Cliente</p>
                            <p className="text-xs font-medium text-slate-700">{item.valorCotizadoCliente ? `$${item.valorCotizadoCliente}` : '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Cot cliente enviada?</p>
                            <p className="text-xs font-medium text-slate-700">{item.cotClientEnviada || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Aprob Client Fact Mantenimiento</p>
                            <p className="text-xs font-medium text-slate-700">{item.aprobClientFactMantenimiento || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5"># Cot mant cliente</p>
                            <p className="text-xs font-medium text-slate-700">{item.numCotMantCliente || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Factura (estado)</p>
                            <p className="text-xs font-medium text-slate-700">{item.facturaEstado || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5"># factura mant</p>
                            <p className="text-xs font-medium text-slate-700">{item.numFacturaMant || '-'}</p>
                          </div>
                          {item.facturaArchivos && item.facturaArchivos.length > 0 && (
                            <div className="col-span-2">
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">factura mant (Arch)</p>
                              <div className="flex flex-wrap gap-2">
                                {item.facturaArchivos.map(file => (
                                  <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-[10px] text-orange-600 hover:underline flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                    <Paperclip className="w-2.5 h-2.5" /> {file.name}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {viewingMaintenanceCard.status === 'CERVINO' && (
                        <>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Orden Mant / Salida Taller realizada?</p>
                            <p className="text-xs font-medium text-slate-700">{item.salidaTallerRealizada || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5"># Orden Mant / Salida T</p>
                            <p className="text-xs font-medium text-slate-700">{item.numOrdenMantSalidaT || '-'}</p>
                          </div>
                          {item.ordenMantSalidaTallerArchivos && item.ordenMantSalidaTallerArchivos.length > 0 && (
                            <div className="col-span-2">
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Orden Mant / Salida taller (arch)</p>
                              <div className="flex flex-wrap gap-2">
                                {item.ordenMantSalidaTallerArchivos.map(file => (
                                  <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    <Paperclip className="w-2.5 h-2.5" /> {file.name}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {item.archivosAdjuntos && item.archivosAdjuntos.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Adjuntos</p>
                          <div className="flex flex-wrap gap-2">
                            {item.archivosAdjuntos.map(file => (
                              <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                <Paperclip className="w-2.5 h-2.5" /> {file.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Etapa: Solicitud de Revisión */}
            {(maintenanceViewMode === 'detailed' || viewingMaintenanceCard.status === 'SOLICITUD_REVISION') && (
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">1. Solicitud de Revisión</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Fecha Ingreso Taller</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.items[0]?.fechaEntregaTaller || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Tipo de Ubicación</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.items[0]?.ubicacionReparacion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Cliente</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.items[0]?.clienteCobro || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Obra</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.items[0]?.obraCobro || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Proveedor Mantenimiento</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.items[0]?.proveedorMantenimiento || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Propiedad Equipo</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.items[0]?.propiedadEquipo || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Tipo de Cobro</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.items[0]?.tipoCobro?.join(', ') || '-'}</p>
                  </div>
                  {viewingMaintenanceCard.items[0]?.recibosTaller && viewingMaintenanceCard.items[0].recibosTaller.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Recibos Taller</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewingMaintenanceCard.items[0].recibosTaller.map(file => (
                          <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            <Paperclip className="w-3 h-3" /> {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Etapa: Cotización Proveedor */}
            {(maintenanceViewMode === 'detailed' ? 
              (MAINTENANCE_COLUMNS.findIndex(c => c.status === viewingMaintenanceCard.status) >= 1) : 
              (viewingMaintenanceCard.status === 'COT_PROV_MANT')
            ) && (
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">2. Cotización Proveedor</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Solicitud Cot Prov</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.cotProvMantEnviada || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Nº Cotización</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.numCotProvMant || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Costo Mantenimiento</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.costoMantenimiento ? `$${viewingMaintenanceCard.costoMantenimiento}` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Cobro a Cliente</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.cobroMantClient || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Etapa: Aprobación IYA */}
            {(maintenanceViewMode === 'detailed' ? 
              (MAINTENANCE_COLUMNS.findIndex(c => c.status === viewingMaintenanceCard.status) >= 2) : 
              (viewingMaintenanceCard.status === 'APROB_MANT_IYA')
            ) && (
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">3. Aprobación IYA</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Nº Orden Compra Proveedor</p>
                    <p className="text-sm font-medium text-slate-700">{viewingMaintenanceCard.numOrdenCompraProveedor || '-'}</p>
                  </div>
                  {viewingMaintenanceCard.ordenCompraProveedorArchivos && viewingMaintenanceCard.ordenCompraProveedorArchivos.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Orden Compra Prov Archivos</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewingMaintenanceCard.ordenCompraProveedorArchivos.map(file => (
                          <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            <Paperclip className="w-3 h-3" /> {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Etapa: Cotización Cliente */}
            {(maintenanceViewMode === 'detailed' ? 
              (MAINTENANCE_COLUMNS.findIndex(c => c.status === viewingMaintenanceCard.status) >= 3) : 
              (viewingMaintenanceCard.status === 'COT_CLIENT')
            ) && (
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">4. Cotización Cliente</h4>
                <p className="text-xs text-slate-400 italic">Los detalles de cotización y factura se encuentran en cada equipo arriba.</p>
              </div>
            )}

            {/* Etapa: Cervino */}
            {(maintenanceViewMode === 'detailed' ? 
              (MAINTENANCE_COLUMNS.findIndex(c => c.status === viewingMaintenanceCard.status) >= 4) : 
              (viewingMaintenanceCard.status === 'CERVINO')
            ) && (
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">5. Cervino</h4>
                <p className="text-xs text-slate-400 italic">Los detalles de orden y salida se encuentran en cada equipo arriba.</p>
              </div>
            )}

          </div>
        </div>
          {/* Sidebar for Comments and Attachments */}
          <div 
            className="hidden lg:block w-1.5 cursor-col-resize hover:bg-indigo-300 active:bg-indigo-500 transition-colors z-20 shrink-0 bg-transparent"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = commentPanelWidth;
              
              const onMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = startX - moveEvent.clientX; 
                setCommentPanelWidth(Math.max(300, Math.min(windowWidth * 0.8, startWidth + deltaX)));
              };
              
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
              };
              
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          />
          <div 
            className="w-full flex flex-col bg-slate-50/50 relative border-l border-slate-100"
            style={{ 
              width: windowWidth >= 1024 ? `${commentPanelWidth}px` : '100%', 
              flexShrink: 0, 
              flexGrow: 0, 
              flexBasis: windowWidth >= 1024 ? `${commentPanelWidth}px` : 'auto' 
            }}
          >
            <div className="p-4 border-b border-slate-100 bg-white shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Actividad y Comentarios
              </h3>
              <button
                onClick={handleSyncEmails}
                disabled={isSyncingEmails}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingEmails ? 'animate-spin' : ''}`} />
                {isSyncingEmails ? 'Sincronizando...' : 'Sincronizar Correos'}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Comments Section */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Comentarios ({viewingMaintenanceCard.comments?.length || 0})
                </h4>
                
                <div className="space-y-4">
                  {(() => {
                    const renderableItems = groupCommentsAndThreads(viewingMaintenanceCard.comments || []);
                    if (renderableItems.length === 0) {
                      return (
                        <div className="py-6 text-center bg-white rounded-xl border border-dashed border-slate-200">
                          <MessageSquare className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-400">Aún no hay comentarios</p>
                        </div>
                      );
                    }
                    return renderableItems.map((item) => {
                      if (item.type === 'thread') {
                        return (
                          <EmailThreadView
                            key={item.threadId}
                            thread={item}
                            handleReplyToComment={handleReplyToComment}
                            handleDeleteCommentAttachment={(commentId, attachmentId) => 
                              handleDeleteCommentAttachment(viewingMaintenanceCard.id, commentId, attachmentId, true)
                            }
                          />
                        );
                      } else {
                        const comment = item.comment;
                        return (
                          <div key={comment.id} className="space-y-1 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-indigo-600">{comment.author || comment.autor}</span>
                              <div className="flex items-center gap-2">
                                {comment.messageId && comment.threadId && (
                                  <button
                                    onClick={() => handleReplyToComment(comment)}
                                    className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <Reply className="w-3.5 h-3.5" />
                                    Responder
                                  </button>
                                )}
                                <span className="text-[9px] text-slate-400">{new Date(comment.timestamp || comment.fecha || Date.now()).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <div className="p-3 bg-white rounded-2xl rounded-tl-none border border-slate-200 shadow-sm text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {comment.text || comment.texto}
                              
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 gap-2">
                                  {comment.attachments.map(file => (
                                    <div key={file.id} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-100 group/file">
                                      <div 
                                        onClick={() => window.open(file.url, '_blank')}
                                        className="w-6 h-6 rounded bg-white flex items-center justify-center shrink-0 border border-slate-200 cursor-pointer"
                                      >
                                        {file.type.startsWith('image/') ? <Image className="w-3 h-3 text-blue-500" /> :
                                         file.type.startsWith('video/') ? <Video className="w-3 h-3 text-purple-500" /> :
                                         <File className="w-3 h-3 text-slate-400" />}
                                      </div>
                                      <span 
                                        onClick={() => window.open(file.url, '_blank')}
                                        className="text-[10px] font-medium text-slate-600 truncate flex-1 cursor-pointer hover:text-indigo-600"
                                      >
                                        {file.name}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <a href={file.url} download={file.name} className="p-1 hover:bg-white rounded transition-colors" title="Descargar">
                                          <Download className="w-3 h-3 text-slate-400 hover:text-indigo-600" />
                                        </a>
                                        <button 
                                          onClick={() => handleDeleteCommentAttachment(viewingMaintenanceCard.id, comment.id, file.id, true)}
                                          className="p-1 hover:bg-white rounded transition-colors"
                                          title="Eliminar"
                                        >
                                          <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-600" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <div 
              className={`p-4 bg-white border-t border-slate-100 shrink-0 relative transition-all duration-200 ${isDraggingComment ? 'bg-indigo-50/50' : ''}`}
              onDragOver={handleCommentDragOver}
              onDragLeave={handleCommentDragLeave}
              onDrop={handleCommentDrop}
            >
              {isDraggingComment && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-600/10 backdrop-blur-[1px] border-2 border-dashed border-indigo-400 m-2 rounded-2xl pointer-events-none animate-in fade-in duration-200">
                  <div className="flex flex-col items-center gap-2 text-indigo-600">
                    <Paperclip className="w-8 h-8 animate-bounce" />
                    <span className="text-sm font-bold uppercase tracking-widest">Soltar para adjuntar</span>
                  </div>
                </div>
              )}
              {commentAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {commentAttachments.map(file => (
                    <div key={file.id} className="relative group">
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100 pr-8">
                        {file.type.startsWith('image/') ? <Image className="w-3 h-3 text-indigo-500" /> : <File className="w-3 h-3 text-indigo-400" />}
                        <span className="text-[10px] font-medium text-indigo-700 max-w-[100px] truncate">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => setCommentAttachments(prev => prev.filter(a => a.id !== file.id))}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-indigo-400 hover:text-indigo-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <div className="flex bg-slate-100 border-b border-slate-200 px-2 pt-2 gap-1 overflow-x-auto">
                  <button
                    onClick={() => { setCommentType('comment'); setReplyMessageId(null); setReplyThreadId(null); }}
                    className={`px-3 py-1.5 rounded-t-lg text-xs font-bold transition-colors shrink-0 ${commentType === 'comment' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                  >
                    Comentario
                  </button>
                  <button
                    onClick={() => { setCommentType('email'); setReplyMessageId(null); setReplyThreadId(null); if (!emailSubject) setEmailSubject(`Mantenimiento #${viewingMaintenanceCard.id.slice(0, 8).toUpperCase()}`); }}
                    className={`px-3 py-1.5 rounded-t-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${commentType === 'email' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Correo electrónico
                  </button>
                </div>
                
                <div className="bg-white">
                  {commentType === 'email' && (
                    <div className="p-3 border-b border-slate-100 flex flex-col gap-2 bg-slate-50">
                      {!accessToken ? (
                        <div className="flex flex-col items-center justify-center p-4">
                          <p className="text-xs text-slate-500 mb-3 text-center">Para enviar correos, necesitas conectar tu cuenta de Gmail.</p>
                          <button 
                            onClick={async () => {
                              try {
                                setConfirmDialog({
                                  isOpen: true,
                                  message: "Reautenticando...",
                                  onConfirm: () => {},
                                  isAlert: true
                                });
                                await loginWithGoogle();
                                setConfirmDialog({
                                  isOpen: true,
                                  message: "Cuenta conectada correctamente.",
                                  onConfirm: () => {},
                                  isAlert: true
                                });
                              } catch (err: any) {
                                setConfirmDialog({
                                  isOpen: true,
                                  message: err.message || "Error al conectar con Gmail",
                                  onConfirm: () => {},
                                  isAlert: true
                                });
                              }
                            }}
                            className="gsi-material-button text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 font-bold hover:bg-slate-50 shadow-sm transition-all"
                          >
                           Conectar Gmail 
                          </button>
                        </div>
                      ) : (
                        <>
                          <GmailAccountSelector />
                          <div className="h-px bg-slate-200 w-full" />
                          <div className="flex items-center text-xs">
                            <span className="text-slate-400 font-bold w-12 shrink-0">Para:</span>
                            <input 
                              type="email" 
                              value={emailTo}
                              onChange={(e) => setEmailTo(e.target.value)}
                              placeholder="correo@ejemplo.com"
                              className="flex-1 bg-transparent border-none outline-none text-slate-700 font-medium"
                            />
                          </div>
                          <div className="h-px bg-slate-200 w-full" />
                          <div className="flex items-center text-xs">
                            <span className="text-slate-400 font-bold w-12 shrink-0">Asunto:</span>
                            <input 
                              type="text" 
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              placeholder="Asunto del correo"
                              className="flex-1 bg-transparent border-none outline-none text-slate-700 font-medium"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(cleanInput(e.target.value))}
                    onBlur={(e) => setNewComment(trimInput(e.target.value))}
                    placeholder={commentType === 'email' ? "Escribe tu correo..." : "Escribe un comentario..."}
                    className="w-full pl-4 pr-24 py-3 bg-transparent border-none text-xs outline-none resize-none min-h-[100px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (commentType === 'comment') {
                          handleAddComment(viewingMaintenanceCard.id, true);
                        }
                      }
                    }}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <label className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer">
                      <Paperclip className="w-4 h-4" />
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        onChange={handleCommentFileUpload}
                      />
                    </label>
                    <button 
                      onClick={() => {
                        if (commentType === 'email') {
                          if (!accessToken) return;
                          
                          setConfirmDialog({
                            isOpen: true,
                            message: `¿Estás seguro de enviar este correo a ${emailTo}?`,
                            onConfirm: async () => {
                              setIsSendingEmail(true);
                              try {
                                const sendResult = await sendEmail(
                                  accessToken, 
                                  emailTo, 
                                  emailSubject, 
                                  newComment, 
                                  true, 
                                  commentAttachments,
                                  replyMessageId || undefined,
                                  replyThreadId || undefined
                                );
                                
                                if (sendResult && sendResult.threadId) {
                                  const currentThreads = viewingMaintenanceCard.emailThreadIds || [];
                                  if (!currentThreads.includes(sendResult.threadId)) {
                                    const newThreads = [...currentThreads, sendResult.threadId];
                                    updateMaintenanceField(viewingMaintenanceCard.id, 'emailThreadIds', newThreads);
                                    setViewingMaintenanceCard((prev: any) => prev ? { ...prev, emailThreadIds: newThreads } : prev);
                                  }
                                }
                                
                                const originalComment = newComment;
                                setCommentType('comment');
                                
                                const googleEmail = currentUser?.providerData?.find(p => p.providerId === 'google.com')?.email;
                                let senderName = googleEmail || userData?.name || currentUser?.email || 'Usuario';
                                try {
                                  const realEmail = await fetchProfileEmail(accessToken);
                                  if (realEmail) senderName = realEmail;
                                } catch (e: any) {
                                  console.log("No se pudo obtener el correo de Google, usando fallback.", e);
                                  if (e.status === 401) {
                                    throw e;
                                  }
                                }
                                
                                const emailLogText = `[Correo Enviado]\n\nDe: ${senderName}\nPara: ${emailTo}\nAsunto: ${emailSubject}\n\n${originalComment}`;
                                
                                setTimeout(() => {
                                   handleAddComment(viewingMaintenanceCard.id, true, emailLogText, {
                                     threadId: sendResult && sendResult.threadId ? sendResult.threadId : undefined,
                                     messageId: sendResult && sendResult.id ? sendResult.id : undefined,
                                     author: senderName
                                   });
                                   setEmailTo('');
                                   setEmailSubject('');
                                   setReplyMessageId(null);
                                   setReplyThreadId(null);
                                }, 0);
                                
                                setConfirmDialog({
                                  isOpen: true,
                                  message: 'Correo enviado exitosamente.',
                                  onConfirm: () => {},
                                  isAlert: true
                                });
                              } catch (error: any) {
                                console.error("Error enviando correo:", error);
                                if (error.status === 401) {
                                  const expiredEmail = activeGmailEmail || (gmailAccounts && gmailAccounts[0]?.email);
                                  if (expiredEmail) {
                                    removeGmailAccount(expiredEmail);
                                  }
                                  setConfirmDialog({
                                    isOpen: true,
                                    message: 'Tu sesión de Gmail ha caducado o tiene credenciales inválidas. Se ha desconectado la cuenta para que puedas volverla a conectar y evitar este error.',
                                    onConfirm: () => {},
                                    isAlert: true
                                  });
                                } else {
                                  setConfirmDialog({
                                    isOpen: true,
                                    message: error.message || 'Error al enviar el correo. Verifica los permisos.',
                                    onConfirm: () => {},
                                    isAlert: true
                                  });
                                }
                              } finally {
                                setIsSendingEmail(false);
                              }
                            }
                          });
                        } else {
                          handleAddComment(viewingMaintenanceCard.id, true);
                        }
                      }}
                      disabled={commentType === 'email' ? (isSendingEmail || !accessToken || !emailTo.trim() || !emailSubject.trim() || !newComment.trim()) : (!newComment.trim() && commentAttachments.length === 0)}
                      className="p-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:scale-95 active:scale-90"
                    >
                      <Send className={`w-4 h-4 ${isSendingEmail ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 text-center">Presiona Enter para enviar</p>
            </div>
          </div>
        </div>

        {!asModal && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
            <Can permission="EDITAR_MANTENIMIENTO">
              <div className="relative" ref={maintenanceModifyMenuRef}>
                <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm">
                  <button
                    onClick={() => {
                      setEditingMaintenanceCard(viewingMaintenanceCard);
                      setEditingMaintenanceStage(viewingMaintenanceCard.status);
                      setViewingMaintenanceCard(null);
                    }}
                    className="px-4 py-2.5 text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2 rounded-l-xl border-r border-slate-200"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modificar
                  </button>
                  <button
                    onClick={() => {
                      setIsMaintenanceModifyMenuOpen(!isMaintenanceModifyMenuOpen);
                      setIsMaintenanceActionMenuOpen(false);
                    }}
                    className="px-2 py-2.5 text-slate-700 hover:bg-slate-50 transition-all active:scale-95 rounded-r-xl flex items-center justify-center"
                  >
                    {isMaintenanceModifyMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isMaintenanceModifyMenuOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                    {MAINTENANCE_COLUMNS.map((col, index) => {
                      const currentIndex = MAINTENANCE_COLUMNS.findIndex(c => c.status === viewingMaintenanceCard.status);
                      if (index > currentIndex) return null;
                      return (
                        <button
                          key={col.status}
                          onClick={() => {
                            setEditingMaintenanceCard(viewingMaintenanceCard);
                            setEditingMaintenanceStage(col.status as MaintenanceStatus);
                            setIsMaintenanceModifyMenuOpen(false);
                            setViewingMaintenanceCard(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <col.icon className={`w-4 h-4 text-${col.color}-500`} />
                          Modificar {col.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Can>

            {['COMPLETADO', 'CANCELADO'].includes(viewingMaintenanceCard.status) && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    message: '¿Desea restaurar esta tarjeta de mantenimiento a la etapa inicial (Activos)?',
                    onConfirm: () => {
                      updateMaintenanceStatus(viewingMaintenanceCard.id, 'SOLICITUD_REVISION');
                      setViewingMaintenanceCard(null);
                    }
                  });
                }}
                className="px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
              >
                <RefreshCw className="w-4 h-4" />
                Restaurar a Activos
              </button>
            )}

            {(!['COMPLETADO', 'CANCELADO'].includes(viewingMaintenanceCard.status)) && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative" ref={maintenanceActionMenuRef}>
                <div className={`flex text-white rounded-xl shadow-md ${
                  viewingMaintenanceCard.status === 'CERVINO' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}>
                  {viewingMaintenanceCard.status !== 'SOLICITUD_REVISION' && (
                    <button
                      onClick={(e) => {
                        const currentIndex = MAINTENANCE_COLUMNS.findIndex(c => c.status === viewingMaintenanceCard.status);
                        if (currentIndex > 0) {
                          const newStatus = MAINTENANCE_COLUMNS[currentIndex - 1].status;
                          const updateCard = maintenanceCards.find(c => c.id === viewingMaintenanceCard.id);
                          if (updateCard) {
                            const updatedItems = (newStatus === 'COT_PROV_MANT' && updateCard.status !== 'COT_PROV_MANT') ? updateCard.items.map(i => ({...i, cotProvMantEnviada: 'Cot Recibida' as any})) : updateCard.items;
                            updateMaintenanceStatus(viewingMaintenanceCard.id, newStatus as MaintenanceStatus);
                            updateMaintenanceItems(viewingMaintenanceCard.id, updatedItems);
                          }
                          setViewingMaintenanceCard(prev => prev ? { ...prev, status: newStatus as MaintenanceStatus, items: (newStatus === 'COT_PROV_MANT' && prev.status !== 'COT_PROV_MANT') ? prev.items.map(i => ({...i, cotProvMantEnviada: 'Cot Recibida' as any})) : prev.items } : null);
                        }
                      }}
                      className="px-3 py-2.5 hover:bg-blue-700 transition-colors rounded-l-xl border-r border-blue-500/30"
                      title="Devolver a etapa anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setIsMaintenanceActionMenuOpen(!isMaintenanceActionMenuOpen);
                      setIsMaintenanceModifyMenuOpen(false);
                    }}
                    className={`px-4 py-2.5 font-bold transition-colors flex items-center gap-2 ${
                      viewingMaintenanceCard.status === 'CERVINO' ? 'hover:bg-emerald-700' : 'hover:bg-blue-700'
                    } ${
                      viewingMaintenanceCard.status === 'SOLICITUD_REVISION' ? 'rounded-l-xl' : ''
                    } ${
                      viewingMaintenanceCard.status === 'CERVINO' ? 'rounded-xl' : ''
                    }`}
                  >
                    Mover a
                    {isMaintenanceActionMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {viewingMaintenanceCard.status !== 'CERVINO' && (
                    <button
                      onClick={(e) => {
                        const currentIndex = MAINTENANCE_COLUMNS.findIndex(c => c.status === viewingMaintenanceCard.status);
                        if (currentIndex < MAINTENANCE_COLUMNS.length - 1) {
                          const newStatus = MAINTENANCE_COLUMNS[currentIndex + 1].status;
                          const updateCard = maintenanceCards.find(c => c.id === viewingMaintenanceCard.id);
                          if (updateCard) {
                            const updatedItems = (newStatus === 'COT_PROV_MANT' && updateCard.status !== 'COT_PROV_MANT') ? updateCard.items.map(i => ({...i, cotProvMantEnviada: 'Cot Recibida' as any})) : updateCard.items;
                            updateMaintenanceStatus(viewingMaintenanceCard.id, newStatus as MaintenanceStatus);
                            updateMaintenanceItems(viewingMaintenanceCard.id, updatedItems);
                          }
                          setViewingMaintenanceCard(prev => prev ? { ...prev, status: newStatus as MaintenanceStatus, items: (newStatus === 'COT_PROV_MANT' && prev.status !== 'COT_PROV_MANT') ? prev.items.map(i => ({...i, cotProvMantEnviada: 'Cot Recibida' as any})) : prev.items } : null);
                        }
                      }}
                      className="px-3 py-2.5 hover:bg-blue-700 transition-colors rounded-r-xl border-l border-blue-500/30"
                      title="Avanzar a siguiente etapa"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {isMaintenanceActionMenuOpen && (
                  <div className="absolute bottom-full mb-2 right-0 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                    {MAINTENANCE_COLUMNS.map((col) => (
                      <button
                        key={col.status}
                        onClick={() => {
                          const updateCard = maintenanceCards.find(c => c.id === viewingMaintenanceCard.id);
                          if (updateCard) {
                            const updatedItems = (col.status === 'COT_PROV_MANT' && updateCard.status !== 'COT_PROV_MANT') ? updateCard.items.map(i => ({...i, cotProvMantEnviada: 'Cot Recibida' as any})) : updateCard.items;
                            updateMaintenanceStatus(viewingMaintenanceCard.id, col.status as MaintenanceStatus);
                            updateMaintenanceItems(viewingMaintenanceCard.id, updatedItems);
                          }
                          setViewingMaintenanceCard(prev => prev ? { ...prev, status: col.status as MaintenanceStatus, items: (col.status === 'COT_PROV_MANT' && prev.status !== 'COT_PROV_MANT') ? prev.items.map(i => ({...i, cotProvMantEnviada: 'Cot Recibida' as any})) : prev.items } : null);
                          setIsMaintenanceActionMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <col.icon className={`w-4 h-4 text-${col.color}-500`} />
                        Mover a {col.title}
                      </button>
                    ))}
                    <div className="my-2 border-t border-slate-100"></div>
                    {viewingMaintenanceCard.status === 'CERVINO' && (
                      <button
                        onClick={() => {
                          updateMaintenanceStatus(viewingMaintenanceCard.id, 'COMPLETADO');
                          setViewingMaintenanceCard(null);
                          setIsMaintenanceActionMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Completar Mantenimiento
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          message: '¿Estás seguro de cancelar este mantenimiento?',
                          onConfirm: () => {
                            updateMaintenanceStatus(viewingMaintenanceCard.id, 'CANCELADO');
                            setViewingMaintenanceCard(null);
                            setIsMaintenanceActionMenuOpen(false);
                          }
                        });
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Cancelar Mantenimiento
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
