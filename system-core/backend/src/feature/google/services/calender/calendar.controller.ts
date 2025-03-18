import { Response } from 'express';
import {
    GetEventsParams,
    GetEventParams,
    CreateEventParams,
    UpdateEventParams,
    DeleteEventParams,
    GetCalendarsParams,
    CreateCalendarParams,
    UpdateCalendarParams
} from './calendar.types';
import { ApiErrorCode } from '../../../../types/response.types';
import { sendError, sendSuccess } from '../../../../utils/response';
import { handleGoogleApiError } from '../../middleware';
import { GoogleApiRequest } from '../../types';
import { CalendarService } from './calendar.service';

/**
 * Controller for Calendar API endpoints
 */
export class CalendarController {
    /**
     * List events from a calendar
     */
    static async listEvents(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            // Extract query parameters
            const params: GetEventsParams = {
                calendarId: req.query.calendarId as string,
                maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 100,
                pageToken: req.query.pageToken as string,
                timeMin: req.query.timeMin as string,
                timeMax: req.query.timeMax as string,
                singleEvents: req.query.singleEvents === 'true',
                orderBy: req.query.orderBy as ('startTime' | 'updated'),
                q: req.query.q as string
            };

            // Create service and get events
            const calendarService = new CalendarService(req.googleAuth);
            const events = await calendarService.listEvents(params);

            sendSuccess(res, 200, {
                events: events.items,
                nextPageToken: events.nextPageToken
            });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Get a specific event by ID
     */
    static async getEvent(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const eventId = req.params.eventId;

            if (!eventId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Event ID is required');
            }

            // Extract parameters
            const params: GetEventParams = {
                calendarId: req.query.calendarId as string,
                eventId
            };

            // Create service and get event
            const calendarService = new CalendarService(req.googleAuth);
            const event = await calendarService.getEvent(params);

            sendSuccess(res, 200, { event });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Create a new event
     */
    static async createEvent(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const {
                calendarId, summary, description, location,
                start, end, attendees, recurrence, reminders,
                colorId, transparency, visibility, conferenceData
            } = req.body;

            if (!summary || !start || !end) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Summary, start, and end are required');
            }

            // Create event payload
            const params: CreateEventParams = {
                calendarId,
                summary,
                description,
                location,
                start,
                end,
                attendees,
                recurrence,
                reminders,
                colorId,
                transparency,
                visibility,
                conferenceData
            };

            // Create service and create event
            const calendarService = new CalendarService(req.googleAuth);
            const event = await calendarService.createEvent(params);

            sendSuccess(res, 201, { event });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Update an existing event
     */
    static async updateEvent(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const eventId = req.params.eventId;

            if (!eventId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Event ID is required');
            }

            const {
                calendarId, summary, description, location,
                start, end, attendees, recurrence, reminders,
                colorId, transparency, visibility, conferenceData,
                sendUpdates
            } = req.body;

            // Create update payload
            const params: UpdateEventParams = {
                eventId,
                calendarId,
                summary,
                description,
                location,
                start,
                end,
                attendees,
                recurrence,
                reminders,
                colorId,
                transparency,
                visibility,
                conferenceData,
                sendUpdates
            };

            // Create service and update event
            const calendarService = new CalendarService(req.googleAuth);
            const event = await calendarService.updateEvent(params);

            sendSuccess(res, 200, { event });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Delete an event
     */
    static async deleteEvent(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const eventId = req.params.eventId;

            if (!eventId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Event ID is required');
            }

            const calendarId = req.query.calendarId as string;
            const sendUpdates = req.query.sendUpdates as ('all' | 'externalOnly' | 'none');

            // Create delete params
            const params: DeleteEventParams = {
                eventId,
                calendarId,
                sendUpdates
            };

            // Create service and delete event
            const calendarService = new CalendarService(req.googleAuth);
            await calendarService.deleteEvent(params);

            sendSuccess(res, 200, { message: 'Event deleted successfully' });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * List available calendars
     */
    static async listCalendars(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            // Extract query parameters
            const params: GetCalendarsParams = {
                maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 100,
                pageToken: req.query.pageToken as string
            };

            // Create service and get calendars
            const calendarService = new CalendarService(req.googleAuth);
            const calendars = await calendarService.listCalendars(params);

            sendSuccess(res, 200, {
                calendars: calendars.items,
                nextPageToken: calendars.nextPageToken
            });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Create a new calendar
     */
    static async createCalendar(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const { summary, description, location, timeZone } = req.body;

            if (!summary) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Calendar summary (name) is required');
            }

            // Create calendar payload
            const params: CreateCalendarParams = {
                summary,
                description,
                location,
                timeZone
            };

            // Create service and create calendar
            const calendarService = new CalendarService(req.googleAuth);
            const calendar = await calendarService.createCalendar(params);

            sendSuccess(res, 201, { calendar });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Update an existing calendar
     */
    static async updateCalendar(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const calendarId = req.params.calendarId;

            if (!calendarId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Calendar ID is required');
            }

            const { summary, description, location, timeZone } = req.body;

            // Create update payload
            const params: UpdateCalendarParams = {
                calendarId,
                summary,
                description,
                location,
                timeZone
            };

            // Create service and update calendar
            const calendarService = new CalendarService(req.googleAuth);
            const calendar = await calendarService.updateCalendar(params);

            sendSuccess(res, 200, { calendar });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }

    /**
     * Delete a calendar
     */
    static async deleteCalendar(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const calendarId = req.params.calendarId;

            if (!calendarId) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Calendar ID is required');
            }

            // Create service and delete calendar
            const calendarService = new CalendarService(req.googleAuth);
            await calendarService.deleteCalendar(calendarId);

            sendSuccess(res, 200, { message: 'Calendar deleted successfully' });
        } catch (error) {
            handleGoogleApiError(res, error);
        }
    }
}