import { NextFunction, Response } from 'express';
import {
    CreateMeetingParams,
    GetMeetingParams,
    UpdateMeetingParams,
    DeleteMeetingParams,
    ListMeetingsParams
} from './meet.types';
import { BadRequestError, JsonSuccess } from '../../../../types/response.types';
import { asyncHandler } from '../../../../utils/response';
import { GoogleApiRequest } from '../../types';
import { MeetService } from './meet.service';
import { Auth } from 'googleapis';

/**
 * Create a new Google Meet meeting
 */
export const createMeeting = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const {
        summary, description, startTime, endTime, timeZone,
        attendees, notifyAttendees, guestsCanModify,
        guestsCanInviteOthers, guestsCanSeeOtherGuests
    } = req.body;

    if (!summary || !startTime || !endTime) {
        throw new BadRequestError('Summary, start time, and end time are required');
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
    const meetService = new MeetService(req.googleAuth as Auth.OAuth2Client);
    const meeting = await meetService.createMeeting(params);

    next(new JsonSuccess({ meeting }, 201));
});

/**
 * Get a specific Google Meet meeting
 */
export const getMeeting = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const meetingId = req.params.meetingId;

    if (!meetingId) {
        throw new BadRequestError('Meeting ID is required');
    }

    // Get meeting params
    const params: GetMeetingParams = {
        meetingId
    };

    // Create service and get meeting
    const meetService = new MeetService(req.googleAuth as Auth.OAuth2Client);
    const meeting = await meetService.getMeeting(params);

    next(new JsonSuccess({ meeting }));
});

/**
 * Update an existing Google Meet meeting
 */
export const updateMeeting = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const meetingId = req.params.meetingId;

    if (!meetingId) {
        throw new BadRequestError('Meeting ID is required');
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
    const meetService = new MeetService(req.googleAuth as Auth.OAuth2Client);
    const meeting = await meetService.updateMeeting(params);

    next(new JsonSuccess({ meeting }));
});

/**
 * Delete a Google Meet meeting
 */
export const deleteMeeting = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const meetingId = req.params.meetingId;

    if (!meetingId) {
        throw new BadRequestError('Meeting ID is required');
    }

    const notifyAttendees = req.query.notifyAttendees === 'true';

    // Delete meeting params
    const params: DeleteMeetingParams = {
        meetingId,
        sendUpdates: notifyAttendees ? 'all' : 'none'
    };

    // Create service and delete meeting
    const meetService = new MeetService(req.googleAuth as Auth.OAuth2Client);
    await meetService.deleteMeeting(params);

    next(new JsonSuccess({ message: 'Meeting deleted successfully' }));
});

/**
 * List Google Meet meetings
 */
export const listMeetings = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
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
    const meetService = new MeetService(req.googleAuth as Auth.OAuth2Client);
    const meetings = await meetService.listMeetings(params);

    next(new JsonSuccess({
        meetings: meetings.items,
        nextPageToken: meetings.nextPageToken
    }));
});

/**
 * Check if a user is available during a proposed meeting time
 */
export const checkAvailability = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const { email, startTime, endTime } = req.body;

    if (!email || !startTime || !endTime) {
        throw new BadRequestError('Email, start time, and end time are required');
    }

    // Create service and check availability
    const meetService = new MeetService(req.googleAuth as Auth.OAuth2Client);
    const isAvailable = await meetService.checkAvailability(email, startTime, endTime);

    next(new JsonSuccess({ isAvailable }));
});

/**
 * Add a participant to an existing meeting
 */
export const addParticipant = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const meetingId = req.params.meetingId;

    if (!meetingId) {
        throw new BadRequestError('Meeting ID is required');
    }

    const { email, optional } = req.body;

    if (!email) {
        throw new BadRequestError('Email is required');
    }

    // Create service and add participant
    const meetService = new MeetService(req.googleAuth as Auth.OAuth2Client);
    const meeting = await meetService.addParticipant(meetingId, email, optional);

    next(new JsonSuccess({ meeting }));
});

/**
 * Remove a participant from an existing meeting
 */
export const removeParticipant = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const meetingId = req.params.meetingId;

    if (!meetingId) {
        throw new BadRequestError('Meeting ID is required');
    }

    const { email } = req.body;

    if (!email) {
        throw new BadRequestError('Email is required');
    }

    // Create service and remove participant
    const meetService = new MeetService(req.googleAuth as Auth.OAuth2Client);
    const meeting = await meetService.removeParticipant(meetingId, email);

    next(new JsonSuccess({ meeting }));
});