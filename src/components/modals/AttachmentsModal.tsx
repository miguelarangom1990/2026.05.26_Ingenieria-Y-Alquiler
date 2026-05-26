import React from 'react';
import { Paperclip, X, Plus, File, Image, Video, Download, Trash2 } from 'lucide-react';
import { Attachment, Order } from '../../types';

interface AttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewingOrder: Order | null;
  isDraggingAttachments: boolean;
  isUploading: boolean;
  handleAttachmentsDragOver: (e: React.DragEvent) => void;
  handleAttachmentsDragLeave: () => void;
  handleAttachmentsDrop: (orderId: string, e: React.DragEvent) => void;
  handleFileUpload: (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteAttachment: (orderId: string, attachmentId: string) => void;
}

export const AttachmentsModal: React.FC<AttachmentsModalProps> = ({
  isOpen,
  onClose,
  viewingOrder,
  isDraggingAttachments,
  isUploading,
  handleAttachmentsDragOver,
  handleAttachmentsDragLeave,
  handleAttachmentsDrop,
  handleFileUpload,
  handleDeleteAttachment,
}) => {
  if (!isOpen || !viewingOrder) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-indigo-600" />
            Archivos Adjuntos
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div 
            className={`relative p-6 rounded-2xl border-2 border-dashed transition-all duration-200 text-center mb-6 ${isDraggingAttachments ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
            onDragOver={handleAttachmentsDragOver}
            onDragLeave={handleAttachmentsDragLeave}
            onDrop={(e) => handleAttachmentsDrop(viewingOrder.id, e)}
            onClick={() => {
              // Trigger file input click if needed, but we have a label below
            }}
          >
            <Paperclip className={`w-8 h-8 mx-auto mb-3 transition-colors ${isDraggingAttachments ? 'text-indigo-500' : 'text-slate-400'}`} />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Arrastra y suelta archivos aquí
            </p>
            <p className="text-xs text-slate-500 mb-4">
              o haz clic para seleccionar
            </p>
            <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Subir Archivos
              <input 
                type="file" 
                multiple 
                className="hidden" 
                onChange={(e) => handleFileUpload(viewingOrder.id, e)}
              />
            </label>
            
            {isDraggingAttachments && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-600/5 backdrop-blur-[1px] rounded-2xl pointer-events-none">
                <div className="flex flex-col items-center gap-2 text-indigo-600">
                  <Plus className="w-8 h-8 animate-bounce" />
                  <span className="text-sm font-bold uppercase tracking-widest">Soltar archivos</span>
                </div>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-indigo-200 flex items-center justify-center">
                <File className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="h-2.5 bg-indigo-200 rounded-full w-3/4 mb-2"></div>
                <div className="h-2 bg-indigo-100 rounded-full w-1/2"></div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Archivos subidos ({viewingOrder.attachments?.length || 0})
            </h4>
            
            {viewingOrder.attachments && viewingOrder.attachments.length > 0 ? (
              viewingOrder.attachments.map((file) => (
                <div key={file.id} className="group p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all flex items-center gap-3">
                  <div 
                    onClick={() => window.open(file.url, '_blank')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer ${
                    file.type.startsWith('image/') ? 'bg-blue-50 text-blue-500' :
                    file.type.startsWith('video/') ? 'bg-purple-50 text-purple-500' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {file.type.startsWith('image/') ? <Image className="w-5 h-5" /> :
                     file.type.startsWith('video/') ? <Video className="w-5 h-5" /> :
                     <File className="w-5 h-5" />}
                  </div>
                  <div 
                    onClick={() => window.open(file.url, '_blank')}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <p className="text-sm font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB • {new Date(file.timestamp).toLocaleDateString()}</p>
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
                    <button 
                      onClick={() => handleDeleteAttachment(viewingOrder.id, file.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : !isUploading && (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500">No hay archivos adjuntos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
