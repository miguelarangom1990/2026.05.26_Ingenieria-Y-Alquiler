import React from 'react';
import { 
  FileText, Trash2, X, Building2, MapPin, Truck, Calendar, History, 
  CheckCircle2, Wrench, Paperclip, Video, File, Download, 
  MessageSquare, Send, XCircle, RefreshCw, Edit2, ChevronDown, 
  ChevronUp, ChevronLeft, ChevronRight, ClipboardCheck, Plus, 
  AlertCircle, Image, ListFilter, PackagePlus, Mail, Reply
} from 'lucide-react';
import { Order, MaintenanceCard, Company, OrderStatus, Attachment } from '../../types';
import { StepIndicator } from '../StepIndicators';
import { groupCommentsAndThreads, EmailThreadView } from '../EmailThreadView';
import { 
  formatDate, formatDateTime, getRevisionChecklist
} from '../../lib/orderUtils';
import { cleanInput, trimInput, getStatusBadge, generateOrderTitle } from '../../lib/utils';
import { Can } from '../Can';
import { useAuth } from '../../context/AuthContext';
import { GmailAccountSelector } from '../GmailAccountSelector';
import { sendEmail, fetchThreadMessages, fetchProfileEmail, extractMessageText } from '../../services/gmailService';

interface OrderDetailsModalProps {
  viewingOrder: Order;
  setViewingOrder: any;
  updateOrder: (order: Order) => void;
  updateOrderField: (id: string, field: string, value: any) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  handleDeleteOrder: (id: string) => void;
  handleEdit: (order: Order) => void;
  handleStartLogistics: (order: Order) => void;
  handleStartTransport: (order: Order) => void;
  handleMoveStageBackward: (order: Order, e: React.MouseEvent) => void;
  handleMoveStageForward: (order: Order, e: React.MouseEvent) => void;
  handleRevertToTransport: (order: Order) => void;
  handleCreateMaintenanceFromOrder: (order: Order) => void;
  setLinkingOrderToMaintenance: (id: string | null) => void;
  setEditingMaintenanceCard: (card: MaintenanceCard | null) => void;
  setViewMode: (mode: any) => void;
  setConfirmDialog: (state: any) => void;
  setIsAttachmentsModalOpen: (val: boolean) => void;
  setIsSaved: (val: boolean) => void;
  isEditingViewingTitle: boolean;
  setIsEditingViewingTitle: (val: boolean) => void;
  viewingTitleInput: string;
  setViewingTitleInput: (val: string) => void;
  commentPanelWidth: number;
  setCommentPanelWidth: (val: number) => void;
  windowWidth: number;
  asModal: boolean;
  maintenanceCards: MaintenanceCard[];
  companies: Company[];
  newComment: string;
  setNewComment: (val: string) => void;
  commentAttachments: Attachment[];
  setCommentAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  handleAddComment: (id: string, overrideText?: string, extraFields?: any) => void;
  handleDeleteCommentAttachment: (orderId: string, commentId: string, attachmentId: string) => void;
  isDraggingComment: boolean;
  handleCommentDragOver: (e: React.DragEvent) => void;
  handleCommentDragLeave: (e: React.DragEvent) => void;
  handleCommentDrop: (e: React.DragEvent) => void;
  handleCommentFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isModifyMenuOpen: boolean;
  setIsModifyMenuOpen: (val: boolean) => void;
  isActionMenuOpen: boolean;
  setIsActionMenuOpen: (val: boolean) => void;
  modifyMenuRef: React.RefObject<HTMLDivElement>;
  actionMenuRef: React.RefObject<HTMLDivElement>;
  getStatusBadge: (order: Order) => React.ReactNode;
  handleChecklistItemChange: (orderId: string, item: string, checked: boolean) => void;
  handleDeleteCommentAttachmentFromOrder: (orderId: string, commentId: string, fileId: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = React.memo(({
  viewingOrder,
  setViewingOrder,
  updateOrder,
  updateOrderField,
  updateOrderStatus,
  handleDeleteOrder,
  handleEdit,
  handleStartLogistics,
  handleStartTransport,
  handleMoveStageBackward,
  handleMoveStageForward,
  handleRevertToTransport,
  handleCreateMaintenanceFromOrder,
  setLinkingOrderToMaintenance,
  setEditingMaintenanceCard,
  setViewMode,
  setConfirmDialog,
  setIsAttachmentsModalOpen,
  setIsSaved,
  isEditingViewingTitle,
  setIsEditingViewingTitle,
  viewingTitleInput,
  setViewingTitleInput,
  commentPanelWidth,
  setCommentPanelWidth,
  windowWidth,
  asModal,
  maintenanceCards,
  companies,
  newComment,
  setNewComment,
  commentAttachments,
  setCommentAttachments,
  handleAddComment,
  handleDeleteCommentAttachment,
  isDraggingComment,
  handleCommentDragOver,
  handleCommentDragLeave,
  handleCommentDrop,
  handleCommentFileUpload,
  isModifyMenuOpen,
  setIsModifyMenuOpen,
  isActionMenuOpen,
  setIsActionMenuOpen,
  modifyMenuRef,
  actionMenuRef,
  getStatusBadge,
  handleChecklistItemChange,
}) => {
  const { hasPermission, accessToken, loginWithGoogle, userData, currentUser, gmailAccounts, activeGmailEmail, removeGmailAccount } = useAuth();
  const canEdit = hasPermission('EDITAR_PEDIDOS');
  
  const [commentType, setCommentType] = React.useState<'comment' | 'email'>('comment');
  const [emailTo, setEmailTo] = React.useState('');
  const [emailSubject, setEmailSubject] = React.useState('');
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [isSyncingEmails, setIsSyncingEmails] = React.useState(false);
  const [replyMessageId, setReplyMessageId] = React.useState<string | null>(null);
  const [replyThreadId, setReplyThreadId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setEmailSubject(`Pedido #${viewingOrder.id.slice(0, 8).toUpperCase()}`);
  }, [viewingOrder.id]);

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
      
      // Clear reply state when tab changes
    }
  };

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
    const currentThreads = viewingOrder.emailThreadIds || [];
    if (currentThreads.length === 0) {
      if (isAutoSync) return;
      setConfirmDialog({
        isOpen: true,
        message: 'No hay correos enlazados para sincronizar en este pedido. Primero debes enviar un correo desde esta ventana de comentarios para enlazarlo.',
        onConfirm: () => {},
        isAlert: true
      });
      return;
    }
    
    setIsSyncingEmails(true);
    try {
      let newCommentsCount = 0;
      const currentMessages = new Set((viewingOrder.comments || []).filter(c => c.messageId).map(c => c.messageId));
      let updatedComments = [...(viewingOrder.comments || [])];

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
        // Update the order comments
        updatedComments.sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0));
        updateOrderField(viewingOrder.id, 'comments', updatedComments);
        setViewingOrder((prev: any) => prev ? { ...prev, comments: updatedComments } : prev);
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

  React.useEffect(() => {
    if (accessToken && viewingOrder.emailThreadIds && viewingOrder.emailThreadIds.length > 0) {
      handleSyncEmails(true);
    }
  }, [viewingOrder.id, accessToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full h-full max-w-none bg-white animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-none rounded-none shadow-none">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/50 shrink-0 gap-4">
          <div className="flex flex-1 justify-between items-center w-full max-w-full overflow-hidden">
            
            <div className="flex items-center gap-3 shrink-0 max-w-[40%] overflow-hidden">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 truncate group">
                <FileText className="w-5 h-5 shrink-0 text-indigo-600" />
                {isEditingViewingTitle ? (
                  <input
                    autoFocus
                    type="text"
                    value={viewingTitleInput}
                    onChange={(e) => setViewingTitleInput(e.target.value)}
                    onBlur={() => {
                      setIsEditingViewingTitle(false);
                      const trimmed = viewingTitleInput.trim();
                      if (trimmed && trimmed !== viewingOrder.nombre) {
                        const newOrder = { ...viewingOrder, nombre: trimmed, isManualTitle: true };
                        setViewingOrder(newOrder);
                        updateOrder(newOrder);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingViewingTitle(false);
                        const trimmed = viewingTitleInput.trim();
                        if (trimmed && trimmed !== viewingOrder.nombre) {
                          const newOrder = { ...viewingOrder, nombre: trimmed, isManualTitle: true };
                          setViewingOrder(newOrder);
                          updateOrder(newOrder);
                        }
                      } else if (e.key === 'Escape') {
                        setIsEditingViewingTitle(false);
                      }
                    }}
                    className="text-xl font-bold bg-white border border-indigo-300 rounded px-2 outline-none w-full max-w-md focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <span 
                    className={`truncate px-1 -mx-1 rounded transition-colors ${canEdit ? 'cursor-text hover:bg-slate-100' : ''}`}
                    onClick={() => {
                      if (!canEdit) return;
                      setViewingTitleInput(viewingOrder.nombre || '');
                      setIsEditingViewingTitle(true);
                    }}
                    title={canEdit ? "Click para editar" : ""}
                  >
                    {viewingOrder.nombre ? viewingOrder.nombre : 'Detalles de la Solicitud'}
                    {canEdit && <Edit2 className="w-3 h-3 inline-block ml-2 text-slate-300 opacity-0 group-hover:opacity-100" />}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => {
                  const newIsManual = !viewingOrder.isManualTitle;
                  const newOrder = { ...viewingOrder, isManualTitle: newIsManual };
                  if (!newIsManual) {
                    newOrder.nombre = generateOrderTitle(newOrder.items);
                  }
                  setViewingOrder(newOrder);
                  updateOrder(newOrder);
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all shrink-0 ${viewingOrder.isManualTitle ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                title={viewingOrder.isManualTitle ? "Título Manual" : "Título Automático"}
              >
                {viewingOrder.isManualTitle ? 'Manual' : 'Automático'}
              </button>
            </div>

            <div className="flex flex-1 justify-center items-center">
              <h2 className={`text-lg lg:text-xl font-bold flex items-center gap-2 ${
                  viewingOrder.status === 'PEDIDO' ? 'text-slate-900' : 
                  viewingOrder.status === 'EN_LOGISTICA' ? 'text-emerald-900' : 
                  viewingOrder.status === 'EN_TRANSPORTE' ? 'text-blue-900' : 
                  'text-purple-900'
                }`}>
                {viewingOrder.status === 'PEDIDO' && <History className="w-5 h-5 lg:w-6 lg:h-6 text-slate-600" />}
                {viewingOrder.status === 'EN_LOGISTICA' && <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600" />}
                {viewingOrder.status === 'EN_TRANSPORTE' && <Truck className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />}
                {viewingOrder.status === 'FINALIZADO' && <PackagePlus className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />}
                
                {viewingOrder.status === 'PEDIDO' && 'En Solicitud'}
                {viewingOrder.status === 'EN_LOGISTICA' && 'Coordinación Logística'}
                {viewingOrder.status === 'EN_TRANSPORTE' && 'En Transporte'}
                {viewingOrder.status === 'FINALIZADO' && 'Revisión de Documentos'}
              </h2>
            </div>
            
            <div className="flex justify-end shrink-0 max-w-[20%]">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shrink-0 h-fit ${
                  viewingOrder.status === 'PEDIDO' ? 'bg-slate-100 text-slate-600' : 
                  viewingOrder.status === 'EN_LOGISTICA' ? 'bg-emerald-100 text-emerald-600' : 
                  viewingOrder.status === 'EN_TRANSPORTE' ? 'bg-blue-100 text-blue-600' : 
                  'bg-purple-100 text-purple-600'
              }`}>
                Pedido #{viewingOrder.id?.slice(0, 8)}
              </span>
            </div>

          </div>
          <div className="flex items-center gap-2">
            {!asModal && (
              <button 
                onClick={() => setIsAttachmentsModalOpen(true)}
                className="p-2 hover:bg-indigo-50 rounded-full transition-colors text-slate-400 hover:text-indigo-600 relative"
                title="Archivos Adjuntos"
              >
                <Paperclip className="w-5 h-5" />
                {viewingOrder.attachments && viewingOrder.attachments.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {viewingOrder.attachments.length}
                  </span>
                )}
              </button>
            )}
            {!asModal && (
              <Can permission="ELIMINAR_PEDIDOS">
                <button 
                  onClick={() => handleDeleteOrder(viewingOrder.id)}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-600"
                  title="Eliminar Solicitud"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </Can>
            )}
            <button 
              onClick={() => setViewingOrder(null)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 border-r border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {viewingOrder.cliente}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Obra</p>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {viewingOrder.destino || <span className="text-red-500 font-bold">Sin definir</span>}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo de Transporte</p>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <span className="capitalize">{viewingOrder.tipoTransporte || 'No especificado'}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha Solicitud</p>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {viewingOrder.fecha}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha Creación</p>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    {formatDateTime(viewingOrder.timestamp)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado Actual</p>
                  <div className="mt-1">{getStatusBadge(viewingOrder)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Equipos Solicitados</p>
                <div className="space-y-3">
                  {viewingOrder.items.map((item) => (
                    <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between py-3 px-4 text-sm gap-3">
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-slate-700">{item.equipo}</span>
                          <span className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-600 font-mono text-xs">
                            Cant: {item.cantidad}
                          </span>
                        </div>
                        {item.proveedor ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="font-medium">{item.proveedor}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                            <History className="w-3.5 h-3.5" />
                            <span className="font-medium">Sin Proveedor</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewingOrder.logisticsInfo && (
                <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Información Logística
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Transportista</p>
                      <p className="text-sm text-slate-700 font-semibold">{viewingOrder.logisticsInfo.transportista}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tipo de Vehículo</p>
                      <p className="text-sm text-slate-700 font-semibold">{viewingOrder.logisticsInfo.tipoVehiculo}</p>
                    </div>
                    {viewingOrder.logisticsInfo.notas && (
                      <div className="md:col-span-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Notas</p>
                        <p className="text-sm text-slate-600 italic">"{viewingOrder.logisticsInfo.notas}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewingOrder.transportInfo && (
                <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Información de Transporte y Cobro
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cobro Transporte</p>
                      <p className="text-sm text-slate-700 font-semibold">{viewingOrder.logisticsInfo?.cobroTransporte || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Razón Transporte</p>
                      <p className="text-sm text-slate-700 font-semibold">{Array.isArray(viewingOrder.logisticsInfo?.razonTransporte) ? viewingOrder.logisticsInfo.razonTransporte.join(', ') : viewingOrder.logisticsInfo?.razonTransporte || '-'}</p>
                    </div>
                  </div>

                  {(viewingOrder.transportInfo.providerData || viewingOrder.transportInfo.providerAttachments) && (() => {
                    const allViewProviders = Array.from(new Set([
                      ...Object.keys(viewingOrder.transportInfo.providerData || {}),
                      ...Object.keys(viewingOrder.transportInfo.providerAttachments || {})
                    ]));
                    
                    const ownViewProviders = allViewProviders.filter(provider => {
                      const company = companies.find(c => c.name === provider);
                      return company?.propiedadDeLaEmpresa === 'Propia';
                    });
                    
                    const thirdPartyViewProviders = allViewProviders.filter(provider => {
                      const company = companies.find(c => c.name === provider);
                      return company?.propiedadDeLaEmpresa !== 'Propia';
                    });

                    const renderViewProviderCard = (provider: string) => (
                      <div key={provider} className={`bg-white/50 rounded-xl p-3 border ${ownViewProviders.includes(provider) ? 'border-green-400/50 shadow-sm shadow-green-100' : 'border-blue-50/50'}`}>
                            <p className="text-xs font-bold text-slate-700 mb-2">{provider}</p>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fecha Transporte</p>
                                <p className="text-[11px] font-medium text-slate-600">
                                  {viewingOrder.transportInfo?.providerData?.[provider]?.fechaTransporteSub || '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fecha Cobro</p>
                                <p className="text-[11px] font-medium text-slate-600">
                                  {viewingOrder.transportInfo?.providerData?.[provider]?.fechaCobroSub || '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider"># RM/DV</p>
                                <p className="text-[11px] font-medium text-slate-600">
                                  {viewingOrder.transportInfo?.providerData?.[provider]?.numAlterno || '-'}
                                </p>
                              </div>
                            </div>
                            {viewingOrder.transportInfo?.providerAttachments?.[provider] && viewingOrder.transportInfo.providerAttachments[provider].length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Adjuntos</p>
                                <div className="flex flex-wrap gap-1">
                                  {viewingOrder.transportInfo.providerAttachments[provider].map(file => (
                                    <button 
                                      key={file.id}
                                      onClick={() => window.open(file.url, '_blank')}
                                      className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                                    >
                                      {file.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                    );
                    
                    return (
                      <div className="mt-6 border-t border-blue-100 pt-4 space-y-6">
                        {ownViewProviders.length > 0 && (
                          <div className="bg-white/40 p-4 rounded-xl border-2 border-green-400/50">
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3">Equipo Propio</p>
                            <div className="space-y-3">
                              {ownViewProviders.map(renderViewProviderCard)}
                            </div>
                          </div>
                        )}
                        
                        {thirdPartyViewProviders.length > 0 && (
                          <div className="bg-white/40 p-4 rounded-xl border border-blue-50/50">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">Equipo De Terceros</p>
                            <div className="space-y-3">
                              {thirdPartyViewProviders.map(renderViewProviderCard)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              {viewingOrder.maintenanceInfo && (
                <div className="bg-orange-50/30 p-5 rounded-2xl border border-orange-100">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Información de Mantenimiento
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Fecha de Creación</p>
                      <p className="text-sm text-slate-700 font-semibold">{viewingOrder.maintenanceInfo.fechaIngreso || '-'}</p>
                    </div>
                    {viewingOrder.maintenanceInfo.notas && (
                      <div className="md:col-span-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Notas / Observaciones</p>
                        <p className="text-sm text-slate-600 italic">"{viewingOrder.maintenanceInfo.notas}"</p>
                      </div>
                    )}
                  </div>
                  
                  {viewingOrder.maintenanceInfo.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-orange-100">
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-3">Equipos en Taller</p>
                      <div className="space-y-2">
                        {viewingOrder.maintenanceInfo.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-white/50 rounded-lg border border-orange-50">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">{item.equipo}</span>
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Cant: {item.cantidad}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Proveedor</span>
                              <span className="text-[10px] font-bold text-orange-600">{item.proveedorMantenimiento}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewingOrder.attachments && viewingOrder.attachments.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Archivos Adjuntos ({viewingOrder.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingOrder.attachments.map((file) => (
                      <div key={file.id} className="group p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all flex items-center gap-3">
                        <div 
                          onClick={() => window.open(file.url, '_blank')}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer overflow-hidden ${
                          file.type.startsWith('image/') ? 'bg-blue-50 text-blue-500' :
                          file.type.startsWith('video/') ? 'bg-purple-50 text-purple-500' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {file.type.startsWith('image/') ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : file.type.startsWith('video/') ? (
                            <Video className="w-5 h-5" />
                          ) : (
                            <File className="w-5 h-5" />
                          )}
                        </div>
                        <div 
                          onClick={() => window.open(file.url, '_blank')}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <p className="text-sm font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB • {formatDate(file.timestamp)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <a 
                            href={file.url} 
                            download={file.name}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Descargar"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingOrder.status === 'FINALIZADO' && (
                <div className="mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col items-center">
                  <div className="flex flex-col items-center text-center mb-6">
                    <ClipboardCheck className="w-12 h-12 text-purple-600 mb-4" />
                    <h3 className="text-lg font-bold text-purple-900 mb-2">Revisión de Documentación</h3>
                    <p className="text-sm text-purple-700 max-w-md">
                      El pedido se encuentra en etapa de revisión final de documentos. Por favor, complete la lista de chequeo antes de finalizar.
                    </p>
                  </div>

                  <div className="w-full max-w-md bg-white rounded-xl border border-purple-100 p-4 mb-6 shadow-sm">
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ListFilter className="w-4 h-4" />
                      Lista de Chequeo de Revisión
                    </h4>
                    <div className="space-y-3">
                      {getRevisionChecklist(viewingOrder).map((item) => (
                        <label key={item} className={`flex items-start gap-3 group ${canEdit ? 'cursor-pointer' : 'cursor-default opacity-80'}`}>
                          <div className="relative flex items-center mt-0.5">
                            <input
                              type="checkbox"
                              checked={viewingOrder.checklist?.[item] || false}
                              onChange={(e) => canEdit && handleChecklistItemChange(viewingOrder.id, item, e.target.checked)}
                              disabled={!canEdit}
                              className={`peer h-5 w-5 appearance-none rounded border border-slate-300 bg-white checked:bg-purple-600 checked:border-purple-600 transition-all ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                            />
                            <CheckCircle2 className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-0.5 top-0.5" />
                          </div>
                          <span className={`text-xs leading-tight transition-colors ${canEdit ? 'text-slate-600 group-hover:text-purple-700' : 'text-slate-500'}`}>
                            {item}
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Progreso</span>
                        <span className="text-[10px] font-bold text-purple-600">
                          {Object.values(viewingOrder.checklist || {}).filter(Boolean).length} / {getRevisionChecklist(viewingOrder).length}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 transition-all duration-500"
                          style={{ width: `${(Object.values(viewingOrder.checklist || {}).filter(Boolean).length / getRevisionChecklist(viewingOrder).length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      disabled={Object.values(viewingOrder.checklist || {}).filter(Boolean).length < getRevisionChecklist(viewingOrder).length}
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          message: '¿Desea finalizar el proceso de este pedido?',
                          onConfirm: () => {
                            setViewingOrder(null);
                            setConfirmDialog({
                              isOpen: true,
                              message: 'Proceso finalizado correctamente.',
                              onConfirm: () => {},
                              isAlert: true
                            });
                          }
                        });
                      }}
                      className={`px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 ${
                        Object.values(viewingOrder.checklist || {}).filter(Boolean).length < getRevisionChecklist(viewingOrder).length
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg active:scale-95'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Finalizar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Comentarios ({viewingOrder.comments?.length || 0})
                </h4>
                
                <div className="space-y-4">
                  {(() => {
                    const renderableItems = groupCommentsAndThreads(viewingOrder.comments || []);
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
                              handleDeleteCommentAttachment(viewingOrder.id, commentId, attachmentId)
                            }
                          />
                        );
                      } else {
                        const comment = item.comment;
                        return (
                          <div key={comment.id} className="space-y-1 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-indigo-600">{comment.author}</span>
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
                                <span className="text-[9px] text-slate-400">{new Date(comment.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <div className="p-3 bg-white rounded-2xl rounded-tl-none border border-slate-200 shadow-sm text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {comment.text}
                              
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
                                          onClick={() => handleDeleteCommentAttachment(viewingOrder.id, comment.id, file.id)}
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

            <div 
              className={`p-4 bg-white border-t border-slate-100 shrink-0 transition-all duration-200 ${isDraggingComment ? 'bg-indigo-50/50' : ''}`}
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
                    onClick={() => { setCommentType('email'); setReplyMessageId(null); setReplyThreadId(null); if (!emailSubject) setEmailSubject(`Pedido #${viewingOrder.id.slice(0, 8).toUpperCase()}`); }}
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
                          handleAddComment(viewingOrder.id);
                        } else if (commentType === 'email' && accessToken && emailTo) {
                          // Submit email logic triggered below by button
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
                                  const currentThreads = viewingOrder.emailThreadIds || [];
                                  if (!currentThreads.includes(sendResult.threadId)) {
                                    const newThreads = [...currentThreads, sendResult.threadId];
                                    updateOrderField(viewingOrder.id, 'emailThreadIds', newThreads);
                                    setViewingOrder((prev: any) => prev ? { ...prev, emailThreadIds: newThreads } : prev);
                                  }
                                }
                                
                                // Log email in comments
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
                                   handleAddComment(viewingOrder.id, emailLogText, {
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
                          handleAddComment(viewingOrder.id);
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
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3 shrink-0">
            <button
              onClick={() => {
                const orderId = viewingOrder.id;
                const newConfirmado = !viewingOrder.confirmado;
                updateOrderField(orderId, 'confirmado', newConfirmado);
                setViewingOrder(prev => prev ? { ...prev, confirmado: newConfirmado } : null);
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
              }}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 border ${
                viewingOrder.confirmado 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                  : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
              }`}
            >
              {viewingOrder.confirmado ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {viewingOrder.confirmado ? 'Solicitud Confirmada' : 'Solicitud No Confirmada'}
            </button>

            {['COMPLETADO', 'CANCELADO'].includes(viewingOrder.status) && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    message: '¿Desea restaurar este pedido a la etapa inicial (Activos)?',
                    onConfirm: () => {
                      updateOrderStatus(viewingOrder.id, 'PEDIDO');
                      setViewingOrder(null);
                    }
                  });
                }}
                className="px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
              >
                <RefreshCw className="w-4 h-4" />
                Restaurar a Activos
              </button>
            )}

            {(!['COMPLETADO', 'CANCELADO'].includes(viewingOrder.status)) && (
              <div className="flex items-center gap-2">
                <Can permission="EDITAR_PEDIDOS">
                  <div className="relative" ref={modifyMenuRef}>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm">
                      <button
                        onClick={() => {
                          if (viewingOrder.status === 'PEDIDO') {
                            handleEdit(viewingOrder);
                          } else if (viewingOrder.status === 'EN_LOGISTICA') {
                            handleStartLogistics(viewingOrder);
                          } else if (viewingOrder.status === 'EN_TRANSPORTE' || viewingOrder.status === 'FINALIZADO') {
                            handleStartTransport(viewingOrder);
                          }
                          setViewingOrder(null);
                        }}
                        className="px-4 py-2.5 text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2 rounded-l-xl border-r border-slate-200"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modificar
                      </button>
                      <button
                        onClick={() => {
                          setIsModifyMenuOpen(!isModifyMenuOpen);
                          setIsActionMenuOpen(false);
                        }}
                        className="px-2 py-2.5 text-slate-700 hover:bg-slate-50 transition-all active:scale-95 rounded-r-xl flex items-center justify-center"
                      >
                        {isModifyMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {isModifyMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                      <div className="p-1 flex flex-col gap-1">
                        <button
                          onClick={() => {
                            handleEdit(viewingOrder);
                            setViewingOrder(null);
                            setIsModifyMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                          Modificar Solicitud
                        </button>

                        {(viewingOrder.status === 'EN_LOGISTICA' || viewingOrder.status === 'EN_TRANSPORTE' || viewingOrder.status === 'FINALIZADO') && (
                          <button
                            onClick={() => {
                              handleStartLogistics(viewingOrder);
                              setViewingOrder(null);
                              setIsModifyMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
                          >
                            <Truck className="w-4 h-4 text-slate-400" />
                            Modificar Logística
                          </button>
                        )}

                        {(viewingOrder.status === 'EN_TRANSPORTE' || viewingOrder.status === 'FINALIZADO') && (
                          <button
                            onClick={() => {
                              handleStartTransport(viewingOrder);
                              setViewingOrder(null);
                              setIsModifyMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
                          >
                            <Truck className="w-4 h-4 text-slate-400" />
                            Modificar Transporte
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Can>

              <div className="relative" ref={actionMenuRef}>
                  <div className="flex items-center bg-blue-600 text-white rounded-xl shadow-md">
                    {viewingOrder.status !== 'PEDIDO' && (
                      <button
                        onClick={(e) => {
                          handleMoveStageBackward(viewingOrder, e);
                          setViewingOrder(null);
                        }}
                        className="px-3 py-2.5 hover:bg-blue-700 transition-colors rounded-l-xl border-r border-blue-500"
                        title="Etapa Anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setIsActionMenuOpen(!isActionMenuOpen);
                        setIsModifyMenuOpen(false);
                      }}
                      className={`px-6 py-2.5 font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                        viewingOrder.status === 'PEDIDO' ? 'rounded-l-xl' : ''
                      } ${
                        viewingOrder.status === 'FINALIZADO' ? 'rounded-r-xl' : ''
                      }`}
                    >
                      Mover a
                      {isActionMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {viewingOrder.status !== 'FINALIZADO' && (
                      <button
                        onClick={(e) => {
                          handleMoveStageForward(viewingOrder, e);
                          setViewingOrder(null);
                        }}
                        className="px-3 py-2.5 hover:bg-blue-700 transition-colors rounded-r-xl border-l border-blue-500"
                        title="Siguiente Etapa"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  {isActionMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                      <div className="p-1 flex flex-col gap-1">
                        {viewingOrder.status === 'PEDIDO' && (
                          <button
                            onClick={(e) => {
                              handleMoveStageForward(viewingOrder, e);
                              setViewingOrder(null);
                              setIsActionMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
                          >
                            <Truck className="w-4 h-4 text-slate-400" />
                            Mover a Logística
                          </button>
                        )}

                        {viewingOrder.status === 'FINALIZADO' && (
                          <>
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  message: '¿Desea devolver el pedido a la etapa de transporte?',
                                  onConfirm: () => {
                                    handleRevertToTransport(viewingOrder);
                                  }
                                });
                                setIsActionMenuOpen(false);
                                setViewingOrder(null);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
                            >
                              <X className="w-4 h-4 text-slate-400" />
                              Devolver a Transporte
                            </button>
                            {(viewingOrder.tipoTransporte === 'devolucion' || viewingOrder.tipoTransporte === 'trayecto') && (
                              <div className="border-t border-slate-100 mt-2 pt-2">
                                <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inspecciones / Mantenimiento</div>
                                {maintenanceCards.filter(card => card.orderId === viewingOrder.id).map(card => (
                                  <button
                                    key={card.id}
                                    onClick={() => {
                                      setEditingMaintenanceCard(card);
                                      setViewMode('maintenance');
                                      setViewingOrder(null);
                                      setIsActionMenuOpen(false);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-medium text-blue-600 flex items-center gap-2 transition-colors text-wrap break-words"
                                  >
                                    <Wrench className="w-4 h-4 shrink-0 text-blue-500" />
                                    Ver Inspección #{card.id?.slice(0,8)}
                                  </button>
                                ))}
                                <button
                                  onClick={() => {
                                    handleCreateMaintenanceFromOrder(viewingOrder);
                                    setIsActionMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm font-medium text-orange-600 flex items-center gap-2 transition-colors mt-1"
                                >
                                  <Plus className="w-4 h-4 shrink-0 text-orange-500" />
                                  Crear nueva inspección
                                </button>
                                <button
                                  onClick={() => {
                                    setLinkingOrderToMaintenance(viewingOrder.id);
                                    setIsActionMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm font-medium text-indigo-600 flex items-center gap-2 transition-colors"
                                >
                                  <ClipboardCheck className="w-4 h-4 shrink-0 text-indigo-500" />
                                  Vincular inspección existente
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {viewingOrder.status === 'EN_LOGISTICA' && (
                          <>
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  message: '¿Desea devolver el pedido a la etapa inicial?',
                                  onConfirm: () => {
                                    const orderId = viewingOrder.id;
                                    updateOrderStatus(orderId, 'PEDIDO');
                                    setViewingOrder(null);
                                  }
                                });
                                setIsActionMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
                            >
                              <X className="w-4 h-4 text-slate-400" />
                              Devolver a Solicitud
                            </button>
                            <button
                              onClick={(e) => {
                                handleMoveStageForward(viewingOrder, e);
                                setViewingOrder(null);
                                setIsActionMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
                            >
                              <Truck className="w-4 h-4 text-slate-400" />
                              Mover a Transporte
                            </button>
                          </>
                        )}

                        {viewingOrder.status === 'EN_TRANSPORTE' && (
                          <>
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  message: '¿Desea devolver el pedido a la etapa de logística?',
                                  onConfirm: () => {
                                    const orderId = viewingOrder.id;
                                    updateOrderStatus(orderId, 'EN_LOGISTICA');
                                    setViewingOrder(null);
                                  }
                                });
                                setIsActionMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
                            >
                              <X className="w-4 h-4 text-slate-400" />
                              Devolver a Logística
                            </button>
                            <button
                              onClick={(e) => {
                                handleMoveStageForward(viewingOrder, e);
                                setViewingOrder(null);
                                setIsActionMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-emerald-600 flex items-center gap-2 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Mover a Revisión Docs
                            </button>
                          </>
                        )}

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          {viewingOrder.status === 'FINALIZADO' && (
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  message: '¿Completar el pedido? Ya no aparecerá en el tablero Kanban.',
                                  onConfirm: () => {
                                    updateOrderStatus(viewingOrder.id, 'COMPLETADO');
                                    setViewingOrder(null);
                                  }
                                });
                                setIsActionMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 rounded-lg text-sm font-medium text-emerald-700 flex items-center gap-2 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Completar Pedido
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                message: '¿Estás seguro de cancelar este pedido?',
                                onConfirm: () => {
                                  updateOrderStatus(viewingOrder.id, 'CANCELADO');
                                  setViewingOrder(null);
                                }
                              });
                              setIsActionMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-red-50 rounded-lg text-sm font-medium text-red-600 flex items-center gap-2 transition-colors"
                          >
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            Cancelar Pedido
                          </button>
                        </div>
                      </div>
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
