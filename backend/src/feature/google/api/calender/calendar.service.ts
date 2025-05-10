import { google, calendar_v3 } from 'googleapis';
import { Auth } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import {
    CalendarEvent,
    CalendarEventList,
    GetEventsParams,
    GetEventParams,
    CreateEventParams,
    UpdateEventParams,
    DeleteEventParams,
    CalendarResource,
    CalendarList,
    GetCalendarsParams,
    CreateCalendarParams,
    UpdateCalendarParams,
    EventRequestBody,
    CalendarRequestBody
} from './calendar.types';

/**
 * Calendar API Service
 * Contains methods to interact with Google Calendar API
 */
export class CalendarService {
    private calendar: calendar_v3.Calendar;
    private readonly PRIMARY_CALENDAR = 'primary';

    constructor(auth: Auth.OAuth2Client) {
        this.calendar = google.calendar({ version: 'v3', auth });
    }

    /**
     * List events from a calendar
     */
    async listEvents(params: GetEventsParams = {}): Promise<CalendarEventList> {
        const response = await this.calendar.events.list({
            calendarId: params.calendarId || this.PRIMARY_CALENDAR,
            maxResults: params.maxResults || 100,
            pageToken: params.pageToken,
            timeMin: params.timeMin,
            timeMax: params.timeMax,
            singleEvents: params.singleEvents,
            orderBy: params.orderBy,
            q: params.q
        });

        return {
            items: response.data.items || [],
            nextPageToken: response.data.nextPageToken || undefined
        };
    }

    /**
     * Get a specific event by ID
     */
    async getEvent(params: GetEventParams): Promise<CalendarEvent> {
        const response = await this.calendar.events.get({
            calendarId: params.calendarId || this.PRIMARY_CALENDAR,
            eventId: params.eventId
        });

        return response.data;
    }

    /**
     * Create a new event
     */
    async createEvent(params: CreateEventParams): Promise<CalendarEvent> {
        // Create conference data if requested
        const conferenceDataVersion = params.conferenceData?.createRequest ? 1 : 0;

        // Generate a requestId if conferenceData is specified but no requestId is provided
        let conferenceData = params.conferenceData;
        if (conferenceData?.createRequest && !conferenceData.createRequest.requestId) {
            conferenceData = {
                ...conferenceData,
                createRequest: {
                    ...conferenceData.createRequest,
                    requestId: uuidv4()
                }
            };
        }

        const requestBody: EventRequestBody = {
            summary: params.summary,
            description: params.description,
            location: params.location,
            start: params.start,
            end: params.end,
            attendees: params.attendees,
            recurrence: params.recurrence,
            reminders: params.reminders,
            colorId: params.colorId,
            transparency: params.transparency,
            visibility: params.visibility,
            conferenceData
        };

        const response = await this.calendar.events.insert({
            calendarId: params.calendarId || this.PRIMARY_CALENDAR,
            conferenceDataVersion,
            requestBody
        });

        return response.data;
    }

    /**
     * Update an existing event
     */
    async updateEvent(params: UpdateEventParams): Promise<CalendarEvent> {
        // Create conference data if requested
        const conferenceDataVersion = params.conferenceData?.createRequest ? 1 : 0;

        // Generate a requestId if conferenceData is specified but no requestId is provided
        let conferenceData = params.conferenceData;
        if (conferenceData?.createRequest && !conferenceData.createRequest.requestId) {
            conferenceData = {
                ...conferenceData,
                createRequest: {
                    ...conferenceData.createRequest,
                    requestId: uuidv4()
                }
            };
        }

        // Build the request body with only provided fields
        const requestBody: EventRequestBody = {};
        if (params.summary !== undefined) requestBody.summary = params.summary;
        if (params.description !== undefined) requestBody.description = params.description;
        if (params.location !== undefined) requestBody.location = params.location;
        if (params.start !== undefined) requestBody.start = params.start;
        if (params.end !== undefined) requestBody.end = params.end;
        if (params.attendees !== undefined) requestBody.attendees = params.attendees;
        if (params.recurrence !== undefined) requestBody.recurrence = params.recurrence;
        if (params.reminders !== undefined) requestBody.reminders = params.reminders;
        if (params.colorId !== undefined) requestBody.colorId = params.colorId;
        if (params.transparency !== undefined) requestBody.transparency = params.transparency;
        if (params.visibility !== undefined) requestBody.visibility = params.visibility;
        if (conferenceData !== undefined) requestBody.conferenceData = conferenceData;

        const response = await this.calendar.events.patch({
            calendarId: params.calendarId || this.PRIMARY_CALENDAR,
            eventId: params.eventId,
            sendUpdates: params.sendUpdates,
            conferenceDataVersion,
            requestBody
        });

        return response.data;
    }

    /**
     * Delete an event
     */
    async deleteEvent(params: DeleteEventParams): Promise<void> {
        await this.calendar.events.delete({
            calendarId: params.calendarId || this.PRIMARY_CALENDAR,
            eventId: params.eventId,
            sendUpdates: params.sendUpdates
        });
    }

    /**
     * List available calendars
     */
    async listCalendars(params: GetCalendarsParams = {}): Promise<CalendarList> {
        const response = await this.calendar.calendarList.list({
            maxResults: params.maxResults || 100,
            pageToken: params.pageToken
        });

        return {
            items: response.data.items || [],
            nextPageToken: response.data.nextPageToken || undefined
        };
    }

    /**
     * Create a new calendar
     */
    async createCalendar(params: CreateCalendarParams): Promise<CalendarResource> {
        const requestBody: CalendarRequestBody = {
            summary: params.summary,
            description: params.description,
            location: params.location,
            timeZone: params.timeZone
        };

        const createResponse = await this.calendar.calendars.insert({
            requestBody
        });

        // After creating the calendar, we need to get its entry in the calendar list
        // to get the full calendar resource with all properties
        const response = await this.calendar.calendarList.get({
            calendarId: createResponse.data.id as string
        });

        return response.data;
    }

    /**
     * Update an existing calendar
     */
    async updateCalendar(params: UpdateCalendarParams): Promise<CalendarResource> {
        // Build the request body with only provided fields
        const requestBody: CalendarRequestBody = {};
        if (params.summary !== undefined) requestBody.summary = params.summary;
        if (params.description !== undefined) requestBody.description = params.description;
        if (params.location !== undefined) requestBody.location = params.location;
        if (params.timeZone !== undefined) requestBody.timeZone = params.timeZone;

        await this.calendar.calendars.patch({
            calendarId: params.calendarId,
            requestBody
        });

        // Get the updated calendar resource
        const response = await this.calendar.calendarList.get({
            calendarId: params.calendarId
        });

        return response.data;
    }

    /**
     * Delete a calendar
     */
    async deleteCalendar(calendarId: string): Promise<void> {
        await this.calendar.calendars.delete({
            calendarId
        });
    }
}