import React, { useState } from 'react';
import { 
  Reply, Mail, ChevronDown, ChevronUp, Image, Video, File, Download, Trash2 
} from 'lucide-react';
import { Comment } from '../types';

export interface ParsedEmail {
  isEmail: boolean;
  type: 'sent' | 'received';
  from: string;
  to?: string;
  subject: string;
  body: string;
}

export function parseEmailText(text: string): ParsedEmail {
  if (!text) return { isEmail: false, type: 'received', from: '', subject: '', body: '' };
  
  const isSent = text.includes('[Correo Enviado]');
  const isRecv = text.includes('[Correo Recibido]');
  
  if (!isSent && !isRecv) {
    return { isEmail: false, type: 'received', from: '', subject: '', body: text };
  }
  
  let from = '';
  let to = '';
  let subject = '';
  let body = '';
  
  const lines = text.split('\n');
  let bodyStartIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('De:')) {
      from = line.substring(3).trim();
    } else if (line.startsWith('Para:')) {
      to = line.substring(5).trim();
    } else if (line.startsWith('Asunto:')) {
      subject = line.substring(7).trim();
    } else if (line === '' && from && (isSent ? to : true) && subject && bodyStartIndex === 0) {
      bodyStartIndex = i + 1;
    }
  }
  
  if (bodyStartIndex > 0) {
    body = lines.slice(bodyStartIndex).join('\n').trim();
  } else {
    body = text;
  }
  
  return {
    isEmail: true,
    type: isSent ? 'sent' : 'received',
    from: from || 'Desconocido',
    to: to || undefined,
    subject: subject || 'Sin Asunto',
    body
  };
}

export interface RenderableThread {
  type: 'thread';
  threadId: string;
  subject: string;
  messages: Comment[];
  latestTimestamp: number;
}

export interface RenderableSingleComment {
  type: 'comment';
  comment: Comment;
  timestamp: number;
}

export type RenderableItem = RenderableThread | RenderableSingleComment;

export function groupCommentsAndThreads(comments: Comment[]): RenderableItem[] {
  const result: RenderableItem[] = [];
  const threadMap = new Map<string, Comment[]>();
  
  const messageIdsSeen = new Set<string>();
  const uniqueComments: Comment[] = [];
  
  for (const comment of comments) {
    const msgId = comment.messageId;
    if (msgId) {
      if (messageIdsSeen.has(msgId)) {
        continue;
      }
      messageIdsSeen.add(msgId);
    }
    uniqueComments.push(comment);
  }
  
  const threadComments = uniqueComments.filter(c => !!c.threadId);
  const nonThreadComments = uniqueComments.filter(c => !c.threadId);
  
  for (const comment of threadComments) {
    const threadId = comment.threadId!;
    if (!threadMap.has(threadId)) {
      threadMap.set(threadId, []);
    }
    threadMap.get(threadId)!.push(comment);
  }
  
  for (const [threadId, msgs] of threadMap.entries()) {
    msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    let threadSubject = 'Asunto de Correo';
    for (const msg of msgs) {
      const parsed = parseEmailText(msg.text || msg.texto || '');
      if (parsed.isEmail && parsed.subject) {
        threadSubject = parsed.subject;
        break;
      }
    }
    
    const latestTimestamp = Math.max(...msgs.map(m => m.timestamp || 0));
    
    result.push({
      type: 'thread',
      threadId,
      subject: threadSubject,
      messages: msgs,
      latestTimestamp
    });
  }
  
  for (const comment of nonThreadComments) {
    const parsed = parseEmailText(comment.text || comment.texto || '');
    if (parsed.isEmail) {
      result.push({
        type: 'thread',
        threadId: `single-${comment.id}`,
        subject: parsed.subject,
        messages: [comment],
        latestTimestamp: comment.timestamp || 0
      });
    } else {
      result.push({
        type: 'comment',
        comment,
        timestamp: comment.timestamp || 0
      });
    }
  }
  
  const getSortTime = (item: RenderableItem) => item.type === 'thread' ? item.latestTimestamp : item.timestamp;
  result.sort((a, b) => getSortTime(a) - getSortTime(b));
  
  return result;
}

interface EmailThreadViewProps {
  thread: RenderableThread;
  handleReplyToComment: (comment: Comment) => void;
  handleDeleteCommentAttachment: (commentId: string, attachmentId: string) => void;
}

export const EmailThreadView: React.FC<EmailThreadViewProps> = ({
  thread,
  handleReplyToComment,
  handleDeleteCommentAttachment
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [individualExpanded, setIndividualExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (thread.messages.length > 0) {
      const lastMsg = thread.messages[thread.messages.length - 1];
      initial[lastMsg.id] = true;
    }
    return initial;
  });

  const toggleIndividual = (msgId: string) => {
    setIndividualExpanded(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const colors = [
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-sky-100 text-sky-800 border-sky-200',
    'bg-rose-100 text-rose-800 border-rose-200',
    'bg-violet-100 text-violet-800 border-violet-200'
  ];

  const getAvatarStyle = (emailOrName: string) => {
    const clean = emailOrName.toLowerCase();
    let num = 0;
    for (let i = 0; i < clean.length; i++) {
      num += clean.charCodeAt(i);
    }
    return colors[num % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    let cleanName = name.split('<')[0].trim();
    if (!cleanName) {
      cleanName = name;
    }
    const parts = cleanName.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : 'U';
  };

  return (
    <div id={`thread-container-${thread.threadId}`} className="border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm overflow-hidden border-l-4 border-l-indigo-500 animate-in fade-in duration-200">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Hilo en Gmail</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700">
                {thread.messages.length} {thread.messages.length === 1 ? 'mensaje' : 'mensajes'}
              </span>
            </div>
            <h5 className="text-xs font-bold text-slate-700 truncate mt-0.5 max-w-full">
              {thread.subject}
            </h5>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400 shrink-0 select-none ml-2">
          <span className="text-[9px] font-medium hidden sm:inline-block bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
            Actual: {new Date(thread.latestTimestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3 relative">
          {thread.messages.length > 1 && (
            <div className="absolute left-[29.5px] top-9 bottom-9 w-[1.5px] bg-slate-200 pointer-events-none" />
          )}

          {thread.messages.map((msg, index) => {
            const parsed = parseEmailText(msg.text || msg.texto || '');
            const isOpen = !!individualExpanded[msg.id];
            
            const initials = getInitials(parsed.from);
            const avatarStyle = getAvatarStyle(parsed.from);

            return (
              <div key={msg.id} className="relative flex gap-3 animate-in slide-in-from-top-3 duration-200">
                <div className="relative z-10 shrink-0 mt-0.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm border border-white ${avatarStyle}`}>
                    {initials}
                  </div>
                </div>

                <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden hover:border-slate-200 transition-all duration-150">
                  <div 
                    onClick={() => toggleIndividual(msg.id)}
                    className="p-3 flex justify-between items-center gap-3 cursor-pointer select-none hover:bg-slate-50/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[160px] sm:max-w-[240px]">
                          {parsed.from.split('<')[0].trim() || parsed.from}
                        </span>
                        {parsed.from.includes('<') && (
                          <span className="text-[9px] text-slate-400 truncate hidden xs:inline max-w-[180px] sm:max-w-[280px]">
                            {parsed.from.substring(parsed.from.indexOf('<'))}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold tracking-wide uppercase ${
                          parsed.type === 'sent' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {parsed.type === 'sent' ? 'Enviado' : 'Recibido'}
                        </span>
                        <span>
                          {new Date(msg.timestamp || 0).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                      {msg.messageId && msg.threadId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplyToComment(msg);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Responder"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="p-0.5 hover:bg-slate-50 rounded">
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-3 pb-3.5 pt-1.5 border-t border-slate-50 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap select-text">
                      {parsed.body}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 gap-2">
                          {msg.attachments.map(file => (
                            <div key={file.id} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-100 group/file">
                              <div 
                                onClick={() => window.open(file.url, '_blank')}
                                className="w-6 h-6 rounded bg-white flex items-center justify-center shrink-0 border border-slate-200 cursor-pointer text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-all"
                              >
                                {file.type.startsWith('image/') ? <Image className="w-3.5 h-3.5 text-blue-500" /> :
                                 file.type.startsWith('video/') ? <Video className="w-3.5 h-3.5 text-purple-500" /> :
                                 <File className="w-3.5 h-3.5 text-slate-400" />}
                              </div>
                              <span 
                                onClick={() => window.open(file.url, '_blank')}
                                className="text-[10px] font-medium text-slate-600 truncate flex-1 cursor-pointer hover:text-indigo-600"
                              >
                                {file.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <a href={file.url} download={file.name} className="p-1 hover:bg-white rounded transition-colors" title="Descargar">
                                  <Download className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500" />
                                </a>
                                <button 
                                  onClick={() => handleDeleteCommentAttachment(msg.id, file.id)}
                                  className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-red-600"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
