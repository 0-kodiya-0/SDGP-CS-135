import { Response } from 'express';
import {
    GetMessagesParams,
    GetMessageParams,
    SendMessageParams,
    CreateLabelParams,
    UpdateLabelParams
} from './gmail.types';
import { ApiErrorCode } from '../../../../types/response.types';
import { sendError, sendSuccess } from '../../../../utils/response';
import { handleGoogleApiError } from '../../middleware';
import { GoogleApiRequest } from '../../types';
import { GmailService } from './gmail.service';

/**
 * Controller for Gmail API endpoints
 */
export class GmailController {
    /**
     * List messages in the user's mailbox
     */
    static async listMessages(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            // Extract query parameters
            const params: GetMessagesParams = {
                maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 20,
                pageToken: req.query.pageToken as string,
                q: req.query.q as string,
                labelIds: req.query.labelIds ? (req.query.labelIds as string).split(',') : undefined,
                includeSpamTrash: req.query.includeSpamTrash === 'true'
            };

            // Create service and get messages
            const gmailService = new GmailService(req.googleAuth);
            const messages = await gmailService.listMessages(params);

            sendSuccess(res, 200, {
                messages: messages.items,
                nextPageToken: messages.nextPageToken
            });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Get a specific message by ID
     */
    static async getMessage(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const messageId = req.params.messageId;

            if (!messageId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Message ID is required');
            }

            // Extract query parameters
            const params: GetMessageParams = {
                id: messageId,
                format: req.query.format as ('minimal' | 'full' | 'raw' | 'metadata') || 'full'
            };

            // Create service and get message
            const gmailService = new GmailService(req.googleAuth);
            const message = await gmailService.getMessage(params);

            sendSuccess(res, 200, { message });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Send a new email
     */
    static async sendMessage(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const { to, subject, body, cc, bcc, attachments, isHtml } = req.body;

            if (!to || !subject || body === undefined) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'To, subject, and body are required');
            }

            // Create message payload
            const params: SendMessageParams = {
                to,
                subject,
                body,
                cc,
                bcc,
                attachments,
                isHtml: isHtml === true
            };

            // Create service and send message
            const gmailService = new GmailService(req.googleAuth);
            const result = await gmailService.sendMessage(params);

            sendSuccess(res, 200, { message: result });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * List all labels
     */
    static async listLabels(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const gmailService = new GmailService(req.googleAuth);
            const labels = await gmailService.listLabels();

            sendSuccess(res, 200, { labels: labels.items });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Create a new label
     */
    static async createLabel(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const { name, labelListVisibility, messageListVisibility } = req.body;

            if (!name) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Label name is required');
            }

            // Create label payload
            const params: CreateLabelParams = {
                name,
                labelListVisibility,
                messageListVisibility
            };

            // Create service and create label
            const gmailService = new GmailService(req.googleAuth);
            const label = await gmailService.createLabel(params);

            sendSuccess(res, 201, { label });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Update an existing label
     */
    static async updateLabel(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const labelId = req.params.labelId;

            if (!labelId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Label ID is required');
            }

            const { name, labelListVisibility, messageListVisibility } = req.body;

            // Create update payload
            const params: UpdateLabelParams = {
                id: labelId,
                name,
                labelListVisibility,
                messageListVisibility
            };

            // Create service and update label
            const gmailService = new GmailService(req.googleAuth);
            const label = await gmailService.updateLabel(params);

            sendSuccess(res, 200, { label });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Delete a label
     */
    static async deleteLabel(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const labelId = req.params.labelId;

            if (!labelId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Label ID is required');
            }

            // Create service and delete label
            const gmailService = new GmailService(req.googleAuth);
            await gmailService.deleteLabel(labelId);

            sendSuccess(res, 200, { message: 'Label deleted successfully' });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }
}