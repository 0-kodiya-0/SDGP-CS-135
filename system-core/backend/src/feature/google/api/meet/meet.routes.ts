import express from 'express';
import { googleApiAuth } from '../../middleware';
import { addParticipant, checkAvailability, createMeeting, deleteMeeting, getMeeting, listMeetings, removeParticipant, updateMeeting } from './meet.controller';

const router = express.Router({ mergeParams: true });

// Meetings endpoints
router.get(
    '/meetings',
    googleApiAuth('meet', 'readonly'),
    listMeetings
);

router.get(
    '/meetings/:meetingId',
    googleApiAuth('meet', 'readonly'),
    getMeeting
);

router.post(
    '/meetings',
    googleApiAuth('meet', 'full'),
    createMeeting
);

router.put(
    '/meetings/:meetingId',
    googleApiAuth('meet', 'full'),
    updateMeeting
);

router.delete(
    '/meetings/:meetingId',
    googleApiAuth('meet', 'full'),
    deleteMeeting
);

// Participants endpoints
router.post(
    '/meetings/:meetingId/participants',
    googleApiAuth('meet', 'full'),
    addParticipant
);

router.delete(
    '/meetings/:meetingId/participants',
    googleApiAuth('meet', 'full'),
    removeParticipant
);

// Availability endpoint
router.post(
    '/availability',
    googleApiAuth('meet', 'readonly'),
    checkAvailability
);

export default router;