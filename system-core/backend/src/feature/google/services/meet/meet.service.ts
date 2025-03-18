import { google, calendar_v3 } from 'googleapis';
import { Auth } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import {
    CreateMeetingParams,
    GetMeetingParams,
    UpdateMeetingParams,
    DeleteMeetingParams,
    ListMeetingsParams,
    MeetingData,
    MeetingList,
    calendarEventToMeeting
} from './meet.types';

/**
 * Meet API Service
 * Contains methods to interact with Google Meet API via Calendar API
 */
export class MeetService {
    private calendar: calendar_v3.Calendar;
    private readonly PRIMARY_CALENDAR = 'primary';

    constructor(auth: Auth.OAuth2Client) {
        this.calendar = google.calendar({ version: 'v3', auth });
    }

    /**
     * Create a new Google Meet meeting as a calendar event
     */
    async createMeeting(params: CreateMeetingParams): Promise<MeetingData> {
        try {
            // Generate a unique request ID for the conference data
            const requestId = uuidv4();

            // Prepare attendees
            const attendees = params.attendees?.map(attendee => ({
                email: attendee.email,
                displayName: attendee.displayName,
                optional: attendee.optional
            }));

            // Create the meeting via the Calendar API
            const response = await this.calendar.events.insert({
                calendarId: this.PRIMARY_CALENDAR,
                conferenceDataVersion: 1, // Enable conference creation
                sendUpdates: params.sendUpdates || 'all',
                requestBody: {
                    summary: params.summary,
                    description: params.description,
                    start: {
                        dateTime: params.startTime,
                        timeZone: params.timeZone
                    },
                    end: {
                        dateTime: params.endTime,
                        timeZone: params.timeZone
                    },
                    attendees: attendees,
                    guestsCanModify: params.guestsCanModify,
                    guestsCanInviteOthers: params.guestsCanInviteOthers,
                    guestsCanSeeOtherGuests: params.guestsCanSeeOtherGuests,
                    conferenceData: {
                        createRequest: {
                            requestId: requestId,
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet'
                            }
                        }
                    }
                }
            });

            // Convert calendar event to meeting object
            return calendarEventToMeeting(response.data);
        } catch (error) {
            console.error('Error creating Meet meeting:', error);
            throw error;
        }
    }

    /**
     * Get details of a specific Google Meet meeting
     */
    async getMeeting(params: GetMeetingParams): Promise<MeetingData> {
        try {
            // Get the event from Calendar API
            const response = await this.calendar.events.get({
                calendarId: this.PRIMARY_CALENDAR,
                eventId: params.meetingId
            });

            // Convert calendar event to meeting object
            return calendarEventToMeeting(response.data);
        } catch (error) {
            console.error(`Error getting Meet meeting ${params.meetingId}:`, error);
            throw error;
        }
    }

    /**
     * Update an existing Google Meet meeting
     */
    async updateMeeting(params: UpdateMeetingParams): Promise<MeetingData> {
        try {
            // First get the existing event to avoid overwriting Conference Data
            const existingEvent = await this.calendar.events.get({
                calendarId: this.PRIMARY_CALENDAR,
                eventId: params.meetingId
            });

            // Prepare the updated fields
            const requestBody: calendar_v3.Schema$Event = {};

            if (params.summary !== undefined) requestBody.summary = params.summary;
            if (params.description !== undefined) requestBody.description = params.description;

            if (params.startTime) {
                requestBody.start = {
                    dateTime: params.startTime,
                    timeZone: params.timeZone || existingEvent.data.start?.timeZone
                };
            }

            if (params.endTime) {
                requestBody.end = {
                    dateTime: params.endTime,
                    timeZone: params.timeZone || existingEvent.data.end?.timeZone
                };
            }

            if (params.attendees) {
                requestBody.attendees = params.attendees.map(attendee => ({
                    email: attendee.email,
                    displayName: attendee.displayName,
                    optional: attendee.optional
                }));
            }

            if (params.guestsCanModify !== undefined) requestBody.guestsCanModify = params.guestsCanModify;
            if (params.guestsCanInviteOthers !== undefined) requestBody.guestsCanInviteOthers = params.guestsCanInviteOthers;
            if (params.guestsCanSeeOtherGuests !== undefined) requestBody.guestsCanSeeOtherGuests = params.guestsCanSeeOtherGuests;

            // Keep the conference data from the existing event
            requestBody.conferenceData = existingEvent.data.conferenceData;

            // Update the meeting
            const response = await this.calendar.events.patch({
                calendarId: this.PRIMARY_CALENDAR,
                eventId: params.meetingId,
                sendUpdates: params.sendUpdates || 'all',
                requestBody
            });

            // Convert calendar event to meeting object
            return calendarEventToMeeting(response.data);
        } catch (error) {
            console.error(`Error updating Meet meeting ${params.meetingId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a Google Meet meeting
     */
    async deleteMeeting(params: DeleteMeetingParams): Promise<void> {
        try {
            await this.calendar.events.delete({
                calendarId: this.PRIMARY_CALENDAR,
                eventId: params.meetingId,
                sendUpdates: params.sendUpdates || 'all'
            });
        } catch (error) {
            console.error(`Error deleting Meet meeting ${params.meetingId}:`, error);
            throw error;
        }
    }

    /**
     * List Google Meet meetings (events with conferenceData)
     */
    async listMeetings(params: ListMeetingsParams = {}): Promise<MeetingList> {
        try {
            // Create a query to filter for events with conference data
            const q = params.q ?
                `${params.q} hangoutLink:*` :
                'hangoutLink:*'; // Only return events with a Meet link

            const response = await this.calendar.events.list({
                calendarId: this.PRIMARY_CALENDAR,
                maxResults: params.maxResults || 100,
                pageToken: params.pageToken,
                timeMin: params.timeMin,
                timeMax: params.timeMax,
                q: q,
                singleEvents: params.singleEvents || true,
                orderBy: params.orderBy || 'startTime'
            });

            // Filter events to only those with conference data
            const meetEvents = response.data.items?.filter(
                event => event.conferenceData || event.hangoutLink
            ) || [];

            // Convert all events to meeting objects
            return {
                items: meetEvents.map(event => calendarEventToMeeting(event)),
                nextPageToken: response.data.nextPageToken
            };
        } catch (error) {
            console.error('Error listing Meet meetings:', error);
            throw error;
        }
    }

    /**
     * Check if a user is available during a proposed meeting time
     */
    async checkAvailability(email: string, startTime: string, endTime: string): Promise<boolean> {
        try {
            const response = await this.calendar.freebusy.query({
                requestBody: {
                    timeMin: startTime,
                    timeMax: endTime,
                    items: [
                        {
                            id: email
                        }
                    ]
                }
            });

            const busySlots = response.data.calendars?.[email]?.busy || [];

            // If there are no busy slots, the person is available
            return busySlots.length === 0;
        } catch (error) {
            console.error(`Error checking availability for ${email}:`, error);
            throw error;
        }
    }

    /**
     * Add a participant to an existing meeting
     */
    async addParticipant(meetingId: string, email: string, optional: boolean = false): Promise<MeetingData> {
        try {
            // First get the existing event
            const existingEvent = await this.calendar.events.get({
                calendarId: this.PRIMARY_CALENDAR,
                eventId: meetingId
            });

            // Get current attendees or initialize empty array
            const currentAttendees = existingEvent.data.attendees || [];

            // Check if the email is already in the attendees list
            const existingAttendee = currentAttendees.find(attendee => attendee.email === email);

            if (existingAttendee) {
                // If already exists, don't add again
                return calendarEventToMeeting(existingEvent.data);
            }

            // Add the new attendee
            const updatedAttendees = [
                ...currentAttendees,
                {
                    email,
                    optional
                }
            ];

            // Update the event with the new attendee
            const response = await this.calendar.events.patch({
                calendarId: this.PRIMARY_CALENDAR,
                eventId: meetingId,
                sendUpdates: 'all',
                requestBody: {
                    attendees: updatedAttendees
                }
            });

            // Convert calendar event to meeting object
            return calendarEventToMeeting(response.data);
        } catch (error) {
            console.error(`Error adding participant to meeting ${meetingId}:`, error);
            throw error;
        }
    }

    /**
     * Remove a participant from an existing meeting
     */
    async removeParticipant(meetingId: string, email: string): Promise<MeetingData> {
        try {
            // First get the existing event
            const existingEvent = await this.calendar.events.get({
                calendarId: this.PRIMARY_CALENDAR,
                eventId: meetingId
            });

            // Get current attendees or initialize empty array
            const currentAttendees = existingEvent.data.attendees || [];

            // Filter out the attendee to remove
            const updatedAttendees = currentAttendees.filter(attendee => attendee.email !== email);

            // If no change, return the existing event
            if (updatedAttendees.length === currentAttendees.length) {
                return calendarEventToMeeting(existingEvent.data);
            }

            // Update the event with the filtered attendees
            const response = await this.calendar.events.patch({
                calendarId: this.PRIMARY_CALENDAR,
                eventId: meetingId,
                sendUpdates: 'all',
                requestBody: {
                    attendees: updatedAttendees
                }
            });

            // Convert calendar event to meeting object
            return calendarEventToMeeting(response.data);
        } catch (error) {
            console.error(`Error removing participant from meeting ${meetingId}:`, error);
            throw error;
        }
    }
}