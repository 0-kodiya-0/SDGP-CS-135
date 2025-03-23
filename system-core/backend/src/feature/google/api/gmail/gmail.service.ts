import { google, gmail_v1 } from 'googleapis';
import { Auth } from 'googleapis';
import {
    GmailMessage,
    GmailMessageList,
    GetMessagesParams,
    GetMessageParams,
    SendMessageParams,
    GmailLabel,
    GmailLabelList,
    CreateLabelParams,
    UpdateLabelParams
} from './gmail.types';

/**
 * Gmail API Service
 * Contains methods to interact with Gmail API
 */
export class GmailService {
    private gmail: gmail_v1.Gmail;

    constructor(auth: Auth.OAuth2Client) {
        this.gmail = google.gmail({ version: 'v1', auth });
    }

    /**
     * List messages in the user's mailbox
     */
    async listMessages(params: GetMessagesParams = {}): Promise<GmailMessageList> {
        try {
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                maxResults: params.maxResults || 20,
                pageToken: params.pageToken,
                labelIds: params.labelIds,
                q: params.q,
                includeSpamTrash: params.includeSpamTrash
            });

            return {
                items: response.data.messages || [],
                nextPageToken: response.data.nextPageToken || undefined
            };
        } catch (error) {
            console.error('Error listing Gmail messages:', error);
            throw error;
        }
    }

    /**
     * Get a specific message by ID
     */
    async getMessage(params: GetMessageParams): Promise<GmailMessage> {
        try {
            const response = await this.gmail.users.messages.get({
                userId: 'me',
                id: params.id,
                format: params.format
            });

            return response.data;
        } catch (error) {
            console.error(`Error getting Gmail message ${params.id}:`, error);
            throw error;
        }
    }

    /**
     * Send an email
     */
    async sendMessage(params: SendMessageParams): Promise<GmailMessage> {
        try {
            // Create the email content
            const message = this.createMimeMessage(params);

            // Encode the message in base64url format
            const encodedMessage = Buffer.from(message)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            // Send the email
            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error sending Gmail message:', error);
            throw error;
        }
    }

    /**
     * List all labels
     */
    async listLabels(): Promise<GmailLabelList> {
        try {
            const response = await this.gmail.users.labels.list({
                userId: 'me'
            });

            return {
                items: response.data.labels || []
            };
        } catch (error) {
            console.error('Error listing Gmail labels:', error);
            throw error;
        }
    }

    /**
     * Create a new label
     */
    async createLabel(params: CreateLabelParams): Promise<GmailLabel> {
        try {
            const response = await this.gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                    name: params.name,
                    labelListVisibility: params.labelListVisibility,
                    messageListVisibility: params.messageListVisibility
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error creating Gmail label:', error);
            throw error;
        }
    }

    /**
     * Update an existing label
     */
    async updateLabel(params: UpdateLabelParams): Promise<GmailLabel> {
        try {
            const response = await this.gmail.users.labels.update({
                userId: 'me',
                id: params.id,
                requestBody: {
                    name: params.name,
                    labelListVisibility: params.labelListVisibility,
                    messageListVisibility: params.messageListVisibility
                }
            });

            return response.data;
        } catch (error) {
            console.error(`Error updating Gmail label ${params.id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a label
     */
    async deleteLabel(id: string): Promise<void> {
        try {
            await this.gmail.users.labels.delete({
                userId: 'me',
                id
            });
        } catch (error) {
            console.error(`Error deleting Gmail label ${id}:`, error);
            throw error;
        }
    }

    /**
     * Helper method to create a MIME message
     */
    private createMimeMessage(params: SendMessageParams): string {
        const toRecipients = Array.isArray(params.to) ? params.to.join(', ') : params.to;
        const ccRecipients = params.cc ? (Array.isArray(params.cc) ? params.cc.join(', ') : params.cc) : '';
        const bccRecipients = params.bcc ? (Array.isArray(params.bcc) ? params.bcc.join(', ') : params.bcc) : '';

        // Generate a boundary for multi-part messages
        const boundary = `boundary_${Date.now().toString()}`;

        // Create headers
        const message = [
            `To: ${toRecipients}`,
            `Subject: ${params.subject}`,
            'MIME-Version: 1.0'
        ];

        // Add CC and BCC if provided
        if (ccRecipients) {
            message.push(`Cc: ${ccRecipients}`);
        }

        if (bccRecipients) {
            message.push(`Bcc: ${bccRecipients}`);
        }

        // Handle simple message (no attachments)
        if (!params.attachments || params.attachments.length === 0) {
            message.push(`Content-Type: ${params.isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`);
            message.push('');
            message.push(params.body);
            return message.join('\r\n');
        }

        // Handle message with attachments
        message.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
        message.push('');

        // Add the message body
        message.push(`--${boundary}`);
        message.push(`Content-Type: ${params.isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`);
        message.push('Content-Transfer-Encoding: 7bit');
        message.push('');
        message.push(params.body);

        // Add attachments
        params.attachments.forEach(attachment => {
            const content = Buffer.isBuffer(attachment.content)
                ? attachment.content.toString('base64')
                : Buffer.from(attachment.content).toString('base64');

            message.push(`--${boundary}`);
            message.push(`Content-Type: ${attachment.contentType || 'application/octet-stream'}`);
            message.push('Content-Transfer-Encoding: base64');
            message.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
            message.push('');
            message.push(content);
        });

        // End boundary
        message.push(`--${boundary}--`);

        return message.join('\r\n');
    }
}