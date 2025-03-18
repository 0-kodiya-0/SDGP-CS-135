import { Response } from 'express';
import {
    CreateMeetingParams,
    GetMeetingParams,
    UpdateMeetingParams,
    DeleteMeetingParams,
    ListMeetingsParams
} from './meet.types';
import { ApiErrorCode } from '../../../../types/response.types';
import { sendError, sendSuccess } from '../../../../utils/response';
import { handleGoogleApiError } from '../../middleware';
import { GoogleApiRequest } from '../../types';
import { MeetService } from './meet.service';

/**
 * Controller for Meet API endpoints
 */
export class MeetController {
    /**
     * Create a new Google Meet meeting
     */
    static async createMeeting(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const {
                summary, description, startTime, endTime, timeZone,
                attendees, notifyAttendees, guestsCanModify,
                guestsCanInviteOthers, guestsCanSeeOtherGuests
            } = req.body;

            if (!summary || !startTime || !endTime) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Summary, start time, and end time are required');
            }

            // Create meeting params
            const params: CreateMeetingParams = {
                summary,
                description,
                startTime,
                endTime,
                timeZone,
                attendees,
                sendUpdates: notifyAttendees ? 'all' : 'none',
                guestsCanModify,
                guestsCanInviteOthers,
                guestsCanSeeOtherGuests
            };

            // Create service and create meeting
            const meetService = new MeetService(req.googleAuth);
            const meeting = await meetService.createMeeting(params);

            sendSuccess(res, 201, { meeting });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Get a specific Google Meet meeting
     */
    static async getMeeting(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const meetingId = req.params.meetingId;

            if (!meetingId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Meeting ID is required');
            }

            // Get meeting params
            const params: GetMeetingParams = {
                meetingId
            };

            // Create service and get meeting
            const meetService = new MeetService(req.googleAuth);
            const meeting = await meetService.getMeeting(params);

            sendSuccess(res, 200, { meeting });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Update an existing Google Meet meeting
     */
    static async updateMeeting(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const meetingId = req.params.meetingId;

            if (!meetingId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Meeting ID is required');
            }

            const {
                summary, description, startTime, endTime, timeZone,
                attendees, notifyAttendees, guestsCanModify,
                guestsCanInviteOthers, guestsCanSeeOtherGuests
            } = req.body;

            // Update meeting params
            const params: UpdateMeetingParams = {
                meetingId,
                summary,
                description,
                startTime,
                endTime,
                timeZone,
                attendees,
                sendUpdates: notifyAttendees ? 'all' : 'none',
                guestsCanModify,
                guestsCanInviteOthers,
                guestsCanSeeOtherGuests
            };

            // Create service and update meeting
            const meetService = new MeetService(req.googleAuth);
            const meeting = await meetService.updateMeeting(params);

            sendSuccess(res, 200, { meeting });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Delete a Google Meet meeting
     */
    static async deleteMeeting(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const meetingId = req.params.meetingId;

            if (!meetingId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Meeting ID is required');
            }

            const notifyAttendees = req.query.notifyAttendees === 'true';

            // Delete meeting params
            const params: DeleteMeetingParams = {
                meetingId,
                sendUpdates: notifyAttendees ? 'all' : 'none'
            };

            // Create service and delete meeting
            const meetService = new MeetService(req.googleAuth);
            await meetService.deleteMeeting(params);

            sendSuccess(res, 200, { message: 'Meeting deleted successfully' });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * List Google Meet meetings
     */
    static async listMeetings(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            // Extract query parameters
            const params: ListMeetingsParams = {
                maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 100,
                pageToken: req.query.pageToken as string,
                timeMin: req.query.timeMin as string,
                timeMax: req.query.timeMax as string,
                q: req.query.q as string,
                singleEvents: req.query.singleEvents === 'true',
                orderBy: req.query.orderBy as 'startTime' | 'updated'
            };

            // Create service and list meetings
            const meetService = new MeetService(req.googleAuth);
            const meetings = await meetService.listMeetings(params);

            sendSuccess(res, 200, {
                meetings: meetings.items,
                nextPageToken: meetings.nextPageToken
            });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Check if a user is available during a proposed meeting time
     */
    static async checkAvailability(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const { email, startTime, endTime } = req.body;

            if (!email || !startTime || !endTime) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Email, start time, and end time are required');
            }

            // Create service and check availability
            const meetService = new MeetService(req.googleAuth);
            const isAvailable = await meetService.checkAvailability(email, startTime, endTime);

            sendSuccess(res, 200, { isAvailable });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Add a participant to an existing meeting
     */
    static async addParticipant(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const meetingId = req.params.meetingId;

            if (!meetingId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Meeting ID is required');
            }

            const { email, optional } = req.body;

            if (!email) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Email is required');
            }

            // Create service and add participant
            const meetService = new MeetService(req.googleAuth);
            const meeting = await meetService.addParticipant(meetingId, email, optional);

            sendSuccess(res, 200, { meeting });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Remove a participant from an existing meeting
     */
    static async removeParticipant(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const meetingId = req.params.meetingId;

            if (!meetingId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Meeting ID is required');
            }

            const { email } = req.body;

            if (!email) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Email is required');
            }

            // Create service and remove participant
            const meetService = new MeetService(req.googleAuth);
            const meeting = await meetService.removeParticipant(meetingId, email);

            sendSuccess(res, 200, { meeting });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }
}