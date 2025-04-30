import { NextFunction, Response } from 'express';
import {
    GetMessagesParams,
    GetMessageParams,
    SendMessageParams,
    CreateLabelParams,
    UpdateLabelParams
} from './gmail.types';
import { BadRequestError, JsonSuccess } from '../../../../types/response.types';
import { asyncHandler } from '../../../../utils/response';
import { GoogleApiRequest } from '../../types';
import { GmailService } from './gmail.service';
import { Auth } from 'googleapis';

/**
 * List messages in the user's mailbox
 */
export const listMessages = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const params: GetMessagesParams = {
        maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 20,
        pageToken: req.query.pageToken as string,
        q: req.query.q as string,
        labelIds: req.query.labelIds ? (req.query.labelIds as string).split(',') : undefined,
        includeSpamTrash: req.query.includeSpamTrash === 'true'
    };

    const gmailService = new GmailService(req.googleAuth as Auth.OAuth2Client);

    // Fetch the initial list of message IDs
    const messageList = await gmailService.listMessages(params);

    // Fetch metadata headers in parallel for faster load
    const metadataPromises = messageList.items.map(async (msg) => {
        const messageMetadata = await gmailService.getMessage({
            id: msg.id!,
            format: 'metadata'
        });
        return messageMetadata;
    });

    const messagesWithMetadata = await Promise.all(metadataPromises);

    next(new JsonSuccess({
        messages: messagesWithMetadata,
        nextPageToken: messageList.nextPageToken
    }));
});

/**
 * Get a specific message by ID
 */
export const getMessage = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const messageId = req.params.messageId;

    if (!messageId) {
        throw new BadRequestError('Message ID is required');
    }

    // Extract query parameters
    const params: GetMessageParams = {
        id: messageId,
        format: req.query.format as ('minimal' | 'full' | 'raw' | 'metadata') || 'full'
    };

    // Create service and get message
    const gmailService = new GmailService(req.googleAuth as Auth.OAuth2Client);
    const message = await gmailService.getMessage(params);

    next(new JsonSuccess({ message }));
});

/**
 * Send a new email
 */
export const sendMessage = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const { to, subject, body, cc, bcc, attachments, isHtml } = req.body;

    if (!to || !subject || body === undefined) {
        throw new BadRequestError('To, subject, and body are required');
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
    const gmailService = new GmailService(req.googleAuth as Auth.OAuth2Client);
    const result = await gmailService.sendMessage(params);

    next(new JsonSuccess({ message: result }));
});

/**
 * List all labels
 */
export const listLabels = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const gmailService = new GmailService(req.googleAuth as Auth.OAuth2Client);
    const labels = await gmailService.listLabels();

    next(new JsonSuccess({ labels: labels.items }));
});

/**
 * Create a new label
 */
export const createLabel = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const { name, labelListVisibility, messageListVisibility } = req.body;

    if (!name) {
        throw new BadRequestError('Label name is required');
    }

    // Create label payload
    const params: CreateLabelParams = {
        name,
        labelListVisibility,
        messageListVisibility
    };

    // Create service and create label
    const gmailService = new GmailService(req.googleAuth as Auth.OAuth2Client);
    const label = await gmailService.createLabel(params);

    next(new JsonSuccess({ label }, 201));
});

/**
 * Update an existing label
 */
export const updateLabel = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const labelId = req.params.labelId;

    if (!labelId) {
        throw new BadRequestError('Label ID is required');
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
    const gmailService = new GmailService(req.googleAuth as Auth.OAuth2Client);
    const label = await gmailService.updateLabel(params);

    next(new JsonSuccess({ label }));
});

/**
 * Delete a label
 */
export const deleteLabel = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const labelId = req.params.labelId;

    if (!labelId) {
        throw new BadRequestError('Label ID is required');
    }

    // Create service and delete label
    const gmailService = new GmailService(req.googleAuth as Auth.OAuth2Client);
    await gmailService.deleteLabel(labelId);

    next(new JsonSuccess({ message: 'Label deleted successfully' }));
});