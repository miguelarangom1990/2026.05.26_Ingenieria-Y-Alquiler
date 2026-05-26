import React, { useCallback } from 'react';
import { Attachment, Order } from '../types';
import { uploadFile } from '../services/firebaseService';

interface UseOrderFileUploadsProps {
  setIsUploading: (isUploading: boolean) => void;
  setCommentAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  history: Order[];
  updateOrderField: (orderId: string, field: string, value: any) => void;
  viewingOrder: Order | null;
  setViewingOrder: (order: Order | null) => void;
  setTransportingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  transportingOrder: Order | null;
  setIsDraggingAttachments: (isDragging: boolean) => void;
  setConfirmDialog: (config: any) => void;
}

export function useOrderFileUploads({
  setIsUploading,
  setCommentAttachments,
  history,
  updateOrderField,
  viewingOrder,
  setViewingOrder,
  setTransportingOrder,
  transportingOrder,
  setIsDraggingAttachments,
  setConfirmDialog
}: UseOrderFileUploadsProps) {
  
  const handleCommentFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        const url = await uploadFile(file, 'orders/comments');
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: url,
          timestamp: Date.now(),
          file: file
        });
      }
      setCommentAttachments(prev => [...prev, ...newAttachments]);
    } catch (error: any) {
      alert("Error subiendo archivos: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, setCommentAttachments]);

  const handleFileUpload = useCallback(async (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        const url = await uploadFile(file, `orders/${orderId}/attachments`);
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: url,
          timestamp: Date.now()
        });
      }
      const order = history.find(o => o.id === orderId);
      if (order) {
        const updatedAttachments = [...(order.attachments || []), ...newAttachments];
        updateOrderField(orderId, 'attachments', updatedAttachments);
        if (viewingOrder?.id === orderId) setViewingOrder({ ...order, attachments: updatedAttachments });
      }
    } catch (error: any) {
      alert("Error subiendo archivos: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, history, updateOrderField, viewingOrder, setViewingOrder]);

  const handleProviderFileUpload = useCallback(async (providerName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !transportingOrder) return;
    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        const url = await uploadFile(file, `orders/${transportingOrder.id}/providers/${providerName}`);
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: url,
          timestamp: Date.now()
        });
      }
      setTransportingOrder(prev => {
        if (!prev) return null;
        const currentAttachments = prev.transportInfo?.providerAttachments?.[providerName] || [];
        return {
          ...prev,
          transportInfo: {
            ...prev.transportInfo!,
            providerAttachments: {
              ...(prev.transportInfo?.providerAttachments || {}),
              [providerName]: [...currentAttachments, ...newAttachments]
            }
          }
        };
      });
    } catch (error: any) {
      alert("Error subiendo archivos: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, transportingOrder, setTransportingOrder]);

  const handleRmDvFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !transportingOrder) return;
    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        const url = await uploadFile(file, `orders/${transportingOrder.id}/rmdv`);
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: url,
          timestamp: Date.now()
        });
      }
      setTransportingOrder(prev => {
        if (!prev) return null;
        const currentAttachments = prev.transportInfo?.rmDvArch || [];
        return {
          ...prev,
          transportInfo: {
            ...prev.transportInfo!,
            rmDvArch: [...currentAttachments, ...newAttachments]
          }
        };
      });
    } catch (error: any) {
      alert("Error subiendo archivos: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, transportingOrder, setTransportingOrder]);

  const handleFotosYOtrosFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !transportingOrder) return;
    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        const url = await uploadFile(file, `orders/${transportingOrder.id}/fotos`);
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: url,
          timestamp: Date.now()
        });
      }
      setTransportingOrder(prev => {
        if (!prev) return null;
        const currentAttachments = prev.transportInfo?.fotosYOtrosArchivos || [];
        return {
          ...prev,
          transportInfo: {
            ...prev.transportInfo!,
            fotosYOtrosArchivos: [...currentAttachments, ...newAttachments]
          }
        };
      });
    } catch (error: any) {
      alert("Error subiendo archivos: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, transportingOrder, setTransportingOrder]);

  const handleProviderRmDvFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, providerName: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !transportingOrder) return;
    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        const url = await uploadFile(file, `orders/${transportingOrder.id}/providers_rmdv/${providerName}`);
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: url,
          timestamp: Date.now()
        });
      }
      setTransportingOrder(prev => {
        if (!prev) return null;
        const currentAttachments = prev.transportInfo?.providerRmDvAttachments?.[providerName] || [];
        return {
          ...prev,
          transportInfo: {
            ...prev.transportInfo!,
            providerRmDvAttachments: {
              ...(prev.transportInfo?.providerRmDvAttachments || {}),
              [providerName]: [...currentAttachments, ...newAttachments]
            }
          }
        };
      });
    } catch (error: any) {
      alert("Error subiendo archivos: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, transportingOrder, setTransportingOrder]);

  const handleAttachmentsDrop = useCallback(async (orderId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAttachments(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        const url = await uploadFile(file, `orders/${orderId}/attachments`);
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: url,
          timestamp: Date.now()
        });
      }
      const order = history.find(o => o.id === orderId);
      if (order) {
        const updatedAttachments = [...(order.attachments || []), ...newAttachments];
        updateOrderField(orderId, 'attachments', updatedAttachments);
        if (viewingOrder?.id === orderId) setViewingOrder({ ...order, attachments: updatedAttachments });
      }
    } catch (error: any) {
      alert("Error subiendo archivos: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, history, updateOrderField, viewingOrder, setViewingOrder, setIsDraggingAttachments]);

  const handleDeleteAttachment = useCallback((orderId: string, attachmentId: string) => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar este archivo?',
      onConfirm: () => {
        const order = history.find(o => o.id === orderId);
        if (order) {
          const updatedAttachments = order.attachments?.filter(a => a.id !== attachmentId);
          updateOrderField(orderId, 'attachments', updatedAttachments);
          if (viewingOrder?.id === orderId) setViewingOrder({ ...order, attachments: updatedAttachments });
        }
      }
    });
  }, [setConfirmDialog, history, updateOrderField, viewingOrder, setViewingOrder]);

  return {
    handleCommentFileUpload,
    handleFileUpload,
    handleProviderFileUpload,
    handleRmDvFileUpload,
    handleFotosYOtrosFileUpload,
    handleProviderRmDvFileUpload,
    handleAttachmentsDrop,
    handleDeleteAttachment,
    handleAttachmentsDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDraggingAttachments(true); },
    handleAttachmentsDragLeave: (e: React.DragEvent) => { e.preventDefault(); setIsDraggingAttachments(false); },
    handleCommentDragOver: (e: React.DragEvent) => { e.preventDefault(); },
    handleCommentDragLeave: (e: React.DragEvent) => { e.preventDefault(); },
    handleCommentDrop: async (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;
      setIsUploading(true);
      try {
        const newAttachments: Attachment[] = [];
        const fileArray = Array.from(files) as File[];
        for (const file of fileArray) {
          const url = await uploadFile(file, 'orders/comments');
          newAttachments.push({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            url: url,
            timestamp: Date.now(),
            file: file
          });
        }
        setCommentAttachments(prev => [...prev, ...newAttachments]);
      } catch (error: any) {
        alert("Error subiendo archivos: " + (error?.message || "Revisa la consola"));
      } finally {
        setIsUploading(false);
      }
    }
  };
}
