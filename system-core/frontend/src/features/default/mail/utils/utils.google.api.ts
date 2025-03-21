import { GmailMessage, ParsedEmail, MessagePayload, MessagePart, SendMessageParams, GmailLabel, MessageAttachment } from "../types/types.google.api";

/**
 * Parse a Gmail message into a more user-friendly format
 */
export function parseGmailMessage(message: GmailMessage): ParsedEmail {
    const parsedEmail: ParsedEmail = {
        id: message.id,
        threadId: message.threadId,
        labelIds: message.labelIds,
        isUnread: message.labelIds?.includes('UNREAD'),
        isStarred: message.labelIds?.includes('STARRED'),
        isImportant: message.labelIds?.includes('IMPORTANT')
    };

    if (!message.payload) {
        return parsedEmail;
    }

    // Extract headers
    const headers = message.payload.headers || [];

    // Get subject
    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
    if (subjectHeader) {
        parsedEmail.subject = subjectHeader.value;
    }

    // Get From
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
    if (fromHeader && fromHeader.value) {
        const matches = fromHeader.value.match(/([^<]+)?<?([^>]+)>?/);
        if (matches) {
            parsedEmail.from = {
                name: matches[1]?.trim(),
                email: matches[2]?.trim()
            };
        } else {
            parsedEmail.from = {
                email: fromHeader.value.trim()
            };
        }
    }

    // Get To
    const toHeader = headers.find(h => h.name.toLowerCase() === 'to');
    if (toHeader && toHeader.value) {
        parsedEmail.to = toHeader.value.split(',').map(recipient => {
            const matches = recipient.match(/([^<]+)?<?([^>]+)>?/);
            if (matches) {
                return {
                    name: matches[1]?.trim(),
                    email: matches[2]?.trim()
                };
            } else {
                return {
                    email: recipient.trim()
                };
            }
        });
    }

    // Get CC
    const ccHeader = headers.find(h => h.name.toLowerCase() === 'cc');
    if (ccHeader && ccHeader.value) {
        parsedEmail.cc = ccHeader.value.split(',').map(recipient => {
            const matches = recipient.match(/([^<]+)?<?([^>]+)>?/);
            if (matches) {
                return {
                    name: matches[1]?.trim(),
                    email: matches[2]?.trim()
                };
            } else {
                return {
                    email: recipient.trim()
                };
            }
        });
    }

    // Get Date
    const dateHeader = headers.find(h => h.name.toLowerCase() === 'date');
    if (dateHeader) {
        parsedEmail.date = new Date(dateHeader.value);
    }

    // Extract body and attachments
    parsedEmail.body = {};
    parsedEmail.attachments = [];

    // Helper to process message parts recursively
    function processParts(part: MessagePayload | MessagePart) {
        // Process body
        if (part.mimeType === 'text/plain' && part.body?.data) {
            parsedEmail.body!.text = decodeBase64UrlSafe(part.body.data);
        } else if (part.mimeType === 'text/html' && part.body?.data) {
            parsedEmail.body!.html = decodeBase64UrlSafe(part.body.data);
        } else if (part.mimeType?.startsWith('multipart/')) {
            // Process multipart message
            part.parts?.forEach(subpart => processParts(subpart));
        } else if (part.filename && part.body) {
            // Process attachment
            parsedEmail.attachments!.push({
                filename: part.filename,
                mimeType: part.mimeType || 'application/octet-stream',
                size: part.body.size,
                attachmentId: part.body.attachmentId
            });
        }
    }

    // Process the message payload
    if (message.payload) {
        processParts(message.payload);
    }

    return parsedEmail;
}

/**
 * Decode base64url-encoded string
 */
export function decodeBase64UrlSafe(base64UrlString: string): string {
    // Convert from base64url to base64
    const base64String = base64UrlString
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    // Decode base64
    try {
        return decodeURIComponent(
            atob(base64String)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
    } catch (error) {
        console.error('Error decoding base64 string:', error);
        return '';
    }
}

/**
 * Format email address for display
 */
export function formatEmailAddress(address: { name?: string, email: string }): string {
    if (address.name) {
        return `${address.name} <${address.email}>`;
    }
    return address.email;
}

/**
 * Format date in a user-friendly way
 */
export function formatEmailDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) {
        // Today - show time only
        return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } else if (date >= yesterday) {
        // Yesterday
        return 'Yesterday';
    } else if (date.getFullYear() === now.getFullYear()) {
        // Same year - show month and day
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else {
        // Different year - show month, day, and year
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

/**
 * Create a simple text email message
 */
export function createTextEmail(to: string | string[], subject: string, body: string): SendMessageParams {
    return {
        to,
        subject,
        body,
        isHtml: false
    };
}

/**
 * Create an HTML email message
 */
export function createHtmlEmail(to: string | string[], subject: string, htmlBody: string): SendMessageParams {
    return {
        to,
        subject,
        body: htmlBody,
        isHtml: true
    };
}

/**
 * Get label color for display
 * Returns default colors for system labels and null for custom labels without color
 */
export function getLabelColor(label: GmailLabel): { text: string, background: string } | null {
    if (label.color) {
        return {
            text: label.color.textColor,
            background: label.color.backgroundColor
        };
    }

    // Default colors for system labels
    switch (label.id) {
        case 'INBOX':
            return { text: '#ffffff', background: '#4285f4' };
        case 'SENT':
            return { text: '#ffffff', background: '#16a766' };
        case 'IMPORTANT':
            return { text: '#ffffff', background: '#dd4b39' };
        case 'STARRED':
            return { text: '#ffffff', background: '#f5b400' };
        case 'DRAFT':
            return { text: '#ffffff', background: '#8e8e8e' };
        case 'TRASH':
            return { text: '#ffffff', background: '#636363' };
        case 'SPAM':
            return { text: '#ffffff', background: '#a20000' };
        case 'CATEGORY_PERSONAL':
            return { text: '#ffffff', background: '#4986e7' };
        case 'CATEGORY_SOCIAL':
            return { text: '#ffffff', background: '#16a766' };
        case 'CATEGORY_PROMOTIONS':
            return { text: '#ffffff', background: '#f5b400' };
        case 'CATEGORY_UPDATES':
            return { text: '#ffffff', background: '#8e8e8e' };
        case 'CATEGORY_FORUMS':
            return { text: '#ffffff', background: '#a20000' };
        default:
            return null;
    }
}

/**
 * Get a user-friendly label name
 */
export function getDisplayLabelName(label: GmailLabel): string {
    // System labels
    switch (label.id) {
        case 'INBOX':
            return 'Inbox';
        case 'SENT':
            return 'Sent';
        case 'DRAFT':
            return 'Drafts';
        case 'TRASH':
            return 'Trash';
        case 'SPAM':
            return 'Spam';
        case 'STARRED':
            return 'Starred';
        case 'IMPORTANT':
            return 'Important';
        case 'UNREAD':
            return 'Unread';
        case 'CATEGORY_PERSONAL':
            return 'Primary';
        case 'CATEGORY_SOCIAL':
            return 'Social';
        case 'CATEGORY_PROMOTIONS':
            return 'Promotions';
        case 'CATEGORY_UPDATES':
            return 'Updates';
        case 'CATEGORY_FORUMS':
            return 'Forums';
        default:
            return label.name;
    }
}

/**
 * Check if a label is a system label
 */
export function isSystemLabel(labelId: string): boolean {
    return labelId.toUpperCase() === labelId;
}

/**
 * Convert a file to a message attachment
 */
export async function fileToAttachment(file: File): Promise<MessageAttachment> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.result) {
                resolve({
                    filename: file.name,
                    content: reader.result as ArrayBuffer,
                    contentType: file.type
                });
            } else {
                reject(new Error('Failed to read file'));
            }
        };

        reader.onerror = () => {
            reject(reader.error || new Error('Failed to read file'));
        };

        reader.readAsArrayBuffer(file);
    });
}