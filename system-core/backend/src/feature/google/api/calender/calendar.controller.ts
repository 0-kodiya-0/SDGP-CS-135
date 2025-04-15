import { NextFunction, Response } from 'express';
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
import { BadRequestError, JsonSuccess } from '../../../../types/response.types';
import { asyncHandler } from '../../../../utils/response';
import { GoogleApiRequest } from '../../types';
import { CalendarService } from './calendar.service';
import { Auth } from 'googleapis';

/**
 * List events from a calendar
 */
export const listEvents = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
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
    const calendarService = new CalendarService(req.googleAuth as Auth.OAuth2Client);
    const events = await calendarService.listEvents(params);

    next(new JsonSuccess({
        events: events.items,
        nextPageToken: events.nextPageToken
    }));
});

/**
 * Get a specific event by ID
 */
export const getEvent = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const eventId = req.params.eventId;

    if (!eventId) {
        throw new BadRequestError('Event ID is required');
    }

    // Extract parameters
    const params: GetEventParams = {
        calendarId: req.query.calendarId as string,
        eventId
    };

    // Create service and get event
    const calendarService = new CalendarService(req.googleAuth as Auth.OAuth2Client);
    const event = await calendarService.getEvent(params);

    next(new JsonSuccess({ event }));
});

/**
 * Create a new event
 */
export const createEvent = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const {
        calendarId, summary, description, location,
        start, end, attendees, recurrence, reminders,
        colorId, transparency, visibility, conferenceData
    } = req.body;

    if (!summary || !start || !end) {
        throw new BadRequestError('Summary, start, and end are required');
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
    const calendarService = new CalendarService(req.googleAuth as Auth.OAuth2Client);
    const event = await calendarService.createEvent(params);

    next(new JsonSuccess({ event }, 201));
});

/**
 * Update an existing event
 */
export const updateEvent = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const eventId = req.params.eventId;

    if (!eventId) {
        throw new BadRequestError('Event ID is required');
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
    const calendarService = new CalendarService(req.googleAuth as Auth.OAuth2Client);
    const event = await calendarService.updateEvent(params);

    next(new JsonSuccess({ event }));
});

/**
 * Delete an event
 */
export const deleteEvent = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const eventId = req.params.eventId;

    if (!eventId) {
        throw new BadRequestError('Event ID is required');
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
    const calendarService = new CalendarService(req.googleAuth as Auth.OAuth2Client);
    await calendarService.deleteEvent(params);

    next(new JsonSuccess({ message: 'Event deleted successfully' }));
});

/**
 * List available calendars
 */
export const listCalendars = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    // Extract query parameters
    const params: GetCalendarsParams = {
        maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 100,
        pageToken: req.query.pageToken as string
    };

    // Create service and get calendars
    const calendarService = new CalendarService(req.googleAuth as Auth.OAuth2Client);
    const calendars = await calendarService.listCalendars(params);

    next(new JsonSuccess({
        calendars: calendars.items,
        nextPageToken: calendars.nextPageToken
    }));
});

/**
 * Create a new calendar
 */
export const createCalendar = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const { summary, description, location, timeZone } = req.body;

    if (!summary) {
        throw new BadRequestError('Calendar summary (name) is required');
    }

    // Create calendar payload
    const params: CreateCalendarParams = {
        summary,
        description,
        location,
        timeZone
    };

    // Create service and create calendar
    const calendarService = new CalendarService(req.googleAuth as Auth.OAuth2Client);
    const calendar = await calendarService.createCalendar(params);

    next(new JsonSuccess({ calendar }, 201));
});

/**
 * Update an existing calendar
 */
export const updateCalendar = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const calendarId = req.params.calendarId;

    if (!calendarId) {
        throw new BadRequestError('Calendar ID is required');
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
    const calendarService = new CalendarService(req.googleAuth as Auth.OAuth2Client);
    const calendar = await calendarService.updateCalendar(params);

    next(new JsonSuccess({ calendar }));
});

/**
 * Delete a calendar
 */
export const deleteCalendar = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const calendarId = req.params.calendarId;

    if (!calendarId) {
        throw new BadRequestError('Calendar ID is required');
    }

    // Create service and delete calendar
    const calendarService = new CalendarService(req.googleAuth as Auth.OAuth2Client);
    await calendarService.deleteCalendar(calendarId);

    next(new JsonSuccess({ message: 'Calendar deleted successfully' }));
});