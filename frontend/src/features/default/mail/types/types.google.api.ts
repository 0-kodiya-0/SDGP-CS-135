// Define return types for each hook
export interface UseGmailMessagesReturn {
    messages: GmailMessage[];
    message: GmailMessage | null;
    loading: boolean;
    error: string | null;
    nextPageToken?: string;

    // Message operations
    listMessages: (params?: {
        pageToken?: string;
        maxResults?: number;
        q?: string;
        labelIds?: string[];
        includeSpamTrash?: boolean;
    }) => Promise<void>;
    trashMessage: (messageId: string) => Promise<boolean>;
    deleteMessage: (messageId: string) => Promise<boolean>;
    modifyLabels: (messageId: string, addLabelIds?: string[], removeLabelIds?: string[]) => Promise<GmailMessage | null>;
    getMessage: (messageId: string, format?: 'minimal' | 'full' | 'raw' | 'metadata') => Promise<GmailMessage | null>;
    sendMessage: (params: SendMessageParams) => Promise<GmailMessage | null>;
}

export interface UseGmailLabelsReturn {
    labels: GmailLabel[];
    loading: boolean;
    error: string | null;

    // Label operations
    listLabels: () => Promise<void>;
    createLabel: (params: CreateLabelParams) => Promise<GmailLabel | null>;
    updateLabel: (labelId: string, params: Omit<UpdateLabelParams, 'id'>) => Promise<GmailLabel | null>;
    deleteLabel: (labelId: string) => Promise<boolean>;
    getLabel: (labelId: string) => Promise<GmailLabel | null>;
}

// Gmail Message types
export interface GmailMessage {
    id: string;
    threadId?: string;
    labelIds?: string[];
    snippet?: string;
    historyId?: string;
    internalDate?: string;
    payload?: MessagePayload;
    sizeEstimate?: number;
    raw?: string;
}

export interface MessagePayload {
    partId?: string;
    mimeType: string;
    filename?: string;
    headers: MessageHeader[];
    body?: MessageBody;
    parts?: MessagePart[];
}

export interface MessageHeader {
    name: string;
    value: string;
}

export interface MessageBody {
    attachmentId?: string;
    size: number;
    data?: string;
}

export interface MessagePart {
    partId?: string;
    mimeType: string;
    filename?: string;
    headers: MessageHeader[];
    body: MessageBody;
    parts?: MessagePart[];
}

// Gmail Label types
export interface GmailLabel {
    id: string;
    name: string;
    messageListVisibility?: 'show' | 'hide';
    labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
    type?: string;
    messagesTotal?: number;
    messagesUnread?: number;
    threadsTotal?: number;
    threadsUnread?: number;
    color?: {
        textColor: string;
        backgroundColor: string;
    };
}

// Request types
export interface SendMessageParams {
    to: string | string[];
    subject: string;
    body: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: MessageAttachment[];
    isHtml?: boolean;
}

export interface MessageAttachment {
    filename: string;
    content: string | ArrayBuffer;
    contentType?: string;
}

export interface CreateLabelParams {
    name: string;
    labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
    messageListVisibility?: 'show' | 'hide';
}

export interface UpdateLabelParams extends Partial<CreateLabelParams> {
    id: string;
}

// Parsed message for display
export interface ParsedEmail {
    id: string;
    threadId?: string;
    subject?: string;
    snippet?: string; // Added snippet property
    from?: {
        name?: string;
        email?: string;
    };
    to?: {
        name?: string;
        email?: string;
    }[];
    cc?: {
        name?: string;
        email?: string;
    }[];
    bcc?: {
        name?: string;
        email?: string;
    }[];
    date?: Date;
    body?: {
        text?: string;
        html?: string;
    };
    attachments?: {
        filename: string;
        mimeType: string;
        size: number;
        attachmentId?: string;
    }[];
    labelIds?: string[];
    isUnread?: boolean;
    isStarred?: boolean;
    isImportant?: boolean;
}

// Helper functions for working with Gmail messages
export const GMAIL_SYSTEM_LABELS = {
    INBOX: 'INBOX',
    SENT: 'SENT',
    DRAFT: 'DRAFT',
    TRASH: 'TRASH',
    SPAM: 'SPAM',
    STARRED: 'STARRED',
    IMPORTANT: 'IMPORTANT',
    UNREAD: 'UNREAD',
    CATEGORY_PERSONAL: 'CATEGORY_PERSONAL',
    CATEGORY_SOCIAL: 'CATEGORY_SOCIAL',
    CATEGORY_PROMOTIONS: 'CATEGORY_PROMOTIONS',
    CATEGORY_UPDATES: 'CATEGORY_UPDATES',
    CATEGORY_FORUMS: 'CATEGORY_FORUMS'
};