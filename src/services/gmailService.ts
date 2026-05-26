import { Attachment } from '../types';

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunk = 65535;
  for (let i = 0; i < len; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer, i, Math.min(chunk, len - i))));
  }
  return window.btoa(binary);
}

function utf8ToBase64UrlSafe(str: string) {
  const bytes = new TextEncoder().encode(str);
  const base64 = arrayBufferToBase64(bytes.buffer);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const sendEmail = async (
  token: string, 
  to: string, 
  subject: string, 
  body: string, 
  isHtml: boolean = false, 
  attachments: Attachment[] = [],
  replyToMessageId?: string,
  threadId?: string
) => {
  const boundary = 'foo_bar_baz_' + Date.now();
  const emailLines = [];
  
  // Clean newlines from headers to prevent injection and "Invalid header" errors
  const cleanTo = to.replace(/[\r\n]+/g, ' ').trim();
  const cleanSubject = subject.replace(/[\r\n]+/g, ' ').trim();
  
  emailLines.push(`To: ${cleanTo}`);
  emailLines.push(`Subject: ${cleanSubject}`);
  
  if (replyToMessageId) {
    let finalInReplyTo = replyToMessageId;
    let finalReferences = replyToMessageId;

    if (!replyToMessageId.includes('@')) {
      // Treat as Gmail internal message ID and fetch its RFC Message-ID from Gmail API
      try {
        const metadataUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${replyToMessageId}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=References`;
        const metaRes = await fetch(metadataUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          const headers = metaData.payload?.headers || [];
          const parentMsgId = headers.find((h: any) => h.name.toLowerCase() === 'message-id')?.value;
          const parentRefs = headers.find((h: any) => h.name.toLowerCase() === 'references')?.value;
          
          if (parentMsgId) {
            finalInReplyTo = parentMsgId;
            finalReferences = parentRefs ? `${parentRefs.trim()} ${parentMsgId}` : parentMsgId;
          }
        }
      } catch (err) {
        console.error("Failed to fetch message metadata for RFC threading:", err);
      }
    } else {
      // It's already an RFC Message-ID. Formulate wrap brackets if needed.
      let formattedId = replyToMessageId.trim();
      if (!formattedId.startsWith('<')) formattedId = `<${formattedId}`;
      if (!formattedId.endsWith('>')) formattedId = `${formattedId}>`;
      finalInReplyTo = formattedId;
      finalReferences = formattedId;
    }

    emailLines.push(`In-Reply-To: ${finalInReplyTo}`);
    emailLines.push(`References: ${finalReferences}`);
  }
  
  emailLines.push('MIME-Version: 1.0');

  // Format body to safe HTML if isHtml is true and it is raw plain text
  let finalBody = body;
  if (isHtml && body) {
    if (!/<[a-z][\s\S]*>/i.test(body)) {
      finalBody = body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '<br/>');
    }
  }

  if (attachments && attachments.length > 0) {
    emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    emailLines.push('');
    emailLines.push(`--${boundary}`);
    emailLines.push(`Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"`);
    emailLines.push('MIME-Version: 1.0');
    emailLines.push('Content-Transfer-Encoding: 8bit');
    emailLines.push('');
    emailLines.push(finalBody);
    emailLines.push('');

    for (const att of attachments) {
      if (!att.url && !att.file) continue;
      try {
        let arrayBuffer: ArrayBuffer;
        if (att.file) {
          arrayBuffer = await att.file.arrayBuffer();
        } else {
          const response = await fetch(att.url);
          arrayBuffer = await response.arrayBuffer();
        }
        const base64 = arrayBufferToBase64(arrayBuffer);
        
        emailLines.push(`--${boundary}`);
        emailLines.push(`Content-Type: ${att.type || 'application/octet-stream'}; name="${att.name}"`);
        emailLines.push('MIME-Version: 1.0');
        emailLines.push('Content-Transfer-Encoding: base64');
        emailLines.push(`Content-Disposition: attachment; filename="${att.name}"`);
        emailLines.push('');
        
        const chunkedBase64 = base64.match(/.{1,76}/g)?.join('\r\n') || base64;
        emailLines.push(chunkedBase64);
        emailLines.push('');
      } catch (err) {
        console.error('Failed to fetch attachment', err);
      }
    }
    emailLines.push(`--${boundary}--`);
  } else {
    emailLines.push(`Content-type: ${isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"`);
    emailLines.push('');
    emailLines.push(finalBody);
  }

  const emailOriginal = emailLines.join('\r\n');
  const encodedEmail = utf8ToBase64UrlSafe(emailOriginal);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail,
      threadId: threadId || undefined
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Gmail API Error:", errorData);
    const err = new Error(`Failed to send email: ${errorData}`) as any;
    err.status = response.status;
    throw err;
  }

  return response.json();
};

export function decodeGmailBody(base64Data: string): string {
  try {
    const rawBase64 = base64Data.replace(/-/g, "+").replace(/_/g, "/");
    const binString = window.atob(rawBase64);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    console.error("Error decoding Gmail body:", err);
    return "";
  }
}

export function htmlToPlainText(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const text = doc.body.innerText || doc.body.textContent || "";
    return text.trim();
  } catch (err) {
    console.error("Error parsing HTML to plain text:", err);
    return html.replace(/<[^>]+>/g, '').trim();
  }
}

function findBodyPart(parts: any[], mimeType: string): any {
  for (const part of parts) {
    if (part.mimeType === mimeType) {
      return part;
    }
    if (part.parts) {
      const nested = findBodyPart(part.parts, mimeType);
      if (nested) return nested;
    }
  }
  return null;
}

export function extractMessageText(payload: any): string {
  if (!payload) return "";

  // 1. If single-part message
  if (payload.body && payload.body.data) {
    const decoded = decodeGmailBody(payload.body.data);
    if (payload.mimeType === 'text/html') {
      return htmlToPlainText(decoded);
    }
    return decoded;
  }

  // 2. If multi-part message, search recursively
  const parts = payload.parts || [];
  
  // Try to find text/html first
  const htmlPart = findBodyPart(parts, 'text/html');
  if (htmlPart && htmlPart.body && htmlPart.body.data) {
    const decodedHtml = decodeGmailBody(htmlPart.body.data);
    return htmlToPlainText(decodedHtml);
  }

  // Fallback to text/plain
  const plainPart = findBodyPart(parts, 'text/plain');
  if (plainPart && plainPart.body && plainPart.body.data) {
    return decodeGmailBody(plainPart.body.data);
  }

  return "";
}

export const fetchProfileEmail = async (token: string) => {
  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.text();
    const err = new Error(`Failed to fetch profile: ${errorData}`) as any;
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.emailAddress;
};

export const fetchThreadMessages = async (token: string, threadId: string) => {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.text();
    const err = new Error(`Failed to fetch thread: ${errorData}`) as any;
    err.status = response.status;
    throw err;
  }

  return response.json();
};
