import { gmail_v1 } from 'googleapis';
import { GoogleListResponse, PaginationParams } from '../../types';

// Request types
export interface GetMessagesParams extends PaginationParams {
    labelIds?: string[];
    q?: string;
    includeSpamTrash?: boolean;
}

export interface GetMessageParams {
    id: string;
    format?: 'minimal' | 'full' | 'raw' | 'metadata';
}

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
    content: string | Buffer;
    encoding?: string;
    contentType?: string;
}

// Empty parameter interface to maintain consistency with other methods
export type GetLabelsParams = Record<string, never>;

export interface CreateLabelParams {
    name: string;
    labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
    messageListVisibility?: 'show' | 'hide';
}

export interface UpdateLabelParams extends Partial<CreateLabelParams> {
    id: string;
}

// Response types
export type GmailMessage = gmail_v1.Schema$Message;
export type GmailMessageList = GoogleListResponse<GmailMessage>;
export type GmailLabel = gmail_v1.Schema$Label;
export type GmailLabelList = GoogleListResponse<GmailLabel>;

// For internal use - using specific types instead of any
export interface DecodedMessage {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    historyId: string;
    internalDate: string;
    payload: {
        headers: {
            name: string;
            value: string;
        }[];
        mimeType: string;
        body: {
            data?: string;
            size: number;
        };
        parts?: MessagePart[];
    };
    sizeEstimate: number;
}

// Define MessagePart interface for nested parts
export interface MessagePart {
    partId?: string;
    mimeType: string;
    filename?: string;
    headers: {
        name: string;
        value: string;
    }[];
    body: {
        data?: string;
        size: number;
        attachmentId?: string;
    };
    parts?: MessagePart[];
}