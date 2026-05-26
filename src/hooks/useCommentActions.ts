import { useCallback } from 'react';
import { Comment, Attachment, MaintenanceCard, Order } from '../types';

export function useCommentActions(
  deps: {
    newComment: string;
    setNewComment: (val: string) => void;
    commentAttachments: Attachment[];
    setCommentAttachments: (val: Attachment[]) => void;
    history: Order[];
    updateOrderField: <K extends keyof Order>(id: string, field: K, val: Order[K]) => void;
    setViewingOrder: any;
    viewingOrder: Order | null;
    maintenanceCards: MaintenanceCard[];
    updateMaintenanceField: <K extends keyof MaintenanceCard>(id: string, field: K, val: MaintenanceCard[K]) => void;
    setViewingMaintenanceCard: any;
    viewingMaintenanceCard: MaintenanceCard | null;
  }
) {
  const handleAddComment = useCallback((itemId: string, isMaintenance = false, overrideText?: string, extraFields?: Partial<Comment>) => {
    const textToUse = overrideText || deps.newComment;
    if (!textToUse.trim() && deps.commentAttachments.length === 0) return;

    const comment: Comment = {
      id: crypto.randomUUID(),
      text: textToUse,
      timestamp: Date.now(),
      author: 'Usuario Actual',
      attachments: deps.commentAttachments.length > 0 ? [...deps.commentAttachments] : undefined,
      ...extraFields
    };

    if (isMaintenance) {
      const card = deps.maintenanceCards.find(c => c.id === itemId);
      if (card) {
        const updatedComments = [...(card.comments || []), comment];
        deps.updateMaintenanceField(itemId, 'comments', updatedComments);
        deps.setViewingMaintenanceCard((prev: any) => prev && prev.id === itemId ? { ...prev, comments: updatedComments } : prev);
      }
    } else {
      const order = deps.history.find(o => o.id === itemId);
      if (order) {
        const updatedComments = [...(order.comments || []), comment];
        deps.updateOrderField(itemId, 'comments', updatedComments);
        deps.setViewingOrder((prev: any) => prev && prev.id === itemId ? { ...prev, comments: updatedComments } : prev);
      }
    }
    deps.setNewComment('');
    deps.setCommentAttachments([]);
  }, [deps]);

  return { handleAddComment };
}
