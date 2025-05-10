// Meeting data types
export interface MeetingData {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    conferenceData?: {
        conferenceId?: string;
        conferenceSolution?: {
            key?: {
                type?: string;
            };
            name?: string;
            iconUri?: string;
        };
        entryPoints?: Array<{
            entryPointType?: string;
            uri?: string;
            label?: string;
            pin?: string;
            accessCode?: string;
            meetingCode?: string;
            passcode?: string;
            password?: string;
        }>;
    };
    hangoutLink?: string;
    meetLink?: string;
    attendees?: Array<{
        email: string;
        displayName?: string;
        optional?: boolean;
        responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    }>;
    organizer?: {
        email: string;
        displayName?: string;
    };
    created?: string;
    updated?: string;
    status?: string;
    guestsCanModify?: boolean;
    guestsCanInviteOthers?: boolean;
    guestsCanSeeOtherGuests?: boolean;
}

// Request params for creating a meeting
export interface CreateMeetingParams {
    summary: string;
    description?: string;
    startTime: string; // ISO string format
    endTime: string;   // ISO string format
    timeZone?: string;
    attendees?: Array<{
        email: string;
        displayName?: string;
        optional?: boolean;
    }>;
    notifyAttendees?: boolean;
    guestsCanModify?: boolean;
    guestsCanInviteOthers?: boolean;
    guestsCanSeeOtherGuests?: boolean;
}

// Request params for updating a meeting
export interface UpdateMeetingParams {
    summary?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    timeZone?: string;
    attendees?: Array<{
        email: string;
        displayName?: string;
        optional?: boolean;
    }>;
    notifyAttendees?: boolean;
    guestsCanModify?: boolean;
    guestsCanInviteOthers?: boolean;
    guestsCanSeeOtherGuests?: boolean;
}

// Simplified form interface for creating meetings
export interface MeetingFormData {
    summary: string;
    description: string;
    startDate: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endDate: string;   // YYYY-MM-DD
    endTime: string;   // HH:MM
    timeZone: string;
    attendees: string; // Comma-separated emails
    notifyAttendees: boolean;
    guestsCanModify: boolean;
    guestsCanInviteOthers: boolean;
    guestsCanSeeOtherGuests: boolean;
}

// Helper to convert form data to API params
export function formToMeetingParams(formData: MeetingFormData): CreateMeetingParams {
    // Parse attendees from comma-separated string
    const attendees = formData.attendees
        .split(',')
        .map(email => email.trim())
        .filter(email => email)
        .map(email => ({ email }));

    // Combine date and time
    const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
    const endDateTime = `${formData.endDate}T${formData.endTime}:00`;

    return {
        summary: formData.summary,
        description: formData.description,
        startTime: startDateTime,
        endTime: endDateTime,
        timeZone: formData.timeZone,
        attendees: attendees.length ? attendees : undefined,
        notifyAttendees: formData.notifyAttendees,
        guestsCanModify: formData.guestsCanModify,
        guestsCanInviteOthers: formData.guestsCanInviteOthers,
        guestsCanSeeOtherGuests: formData.guestsCanSeeOtherGuests
    };
}

// Helper to format meeting time
export function formatMeetingTime(dateTimeString: string, timeZone?: string): string {
    if (!dateTimeString) return '';

    try {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        };

        return new Date(dateTimeString).toLocaleString(undefined, {
            ...options,
            timeZone: timeZone || undefined
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateTimeString;
    }
}

// Helper to format meeting duration
export function calculateDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '';

    try {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        const durationMs = end - start;

        const minutes = Math.floor(durationMs / (1000 * 60));

        if (minutes < 60) {
            return `${minutes} minutes`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0
                ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`
                : `${hours} hour${hours > 1 ? 's' : ''}`;
        }
    } catch (error) {
        console.error('Error calculating duration:', error);
        return '';
    }
}

// List of common timezones for form selection
export const COMMON_TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
];

export interface UseMeetApiReturn {
    meetings: MeetingData[];
    meeting: MeetingData | null;
    loading: boolean;
    error: string | null;
    nextPageToken?: string;

    // Meeting CRUD operations
    createMeeting: (params: CreateMeetingParams) => Promise<MeetingData | null>;
    getMeeting: (meetingId: string) => Promise<MeetingData | null>;
    updateMeeting: (meetingId: string, params: UpdateMeetingParams) => Promise<MeetingData | null>;
    deleteMeeting: (meetingId: string, notifyAttendees?: boolean) => Promise<boolean>;
    listMeetings: (params?: {
        pageToken?: string;
        maxResults?: number;
        timeMin?: string;
        timeMax?: string;
        q?: string;
        singleEvents?: boolean;
        orderBy?: 'startTime' | 'updated';
    }) => Promise<void>;

    // Participant management
    addParticipant: (meetingId: string, email: string, optional?: boolean) => Promise<MeetingData | null>;
    removeParticipant: (meetingId: string, email: string) => Promise<MeetingData | null>;

    // Availability checking
    checkAvailability: (email: string, startTime: string, endTime: string) => Promise<boolean | null>;
}