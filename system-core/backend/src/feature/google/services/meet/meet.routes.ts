import express from 'express';
import { MeetController } from './meet.controller';
import { googleApiAuth } from '../../middleware';

const router = express.Router({ mergeParams: true });

// Meetings endpoints
router.get(
    '/meetings',
    googleApiAuth('meet', 'readonly'),
    MeetController.listMeetings
);

router.get(
    '/meetings/:meetingId',
    googleApiAuth('meet', 'readonly'),
    MeetController.getMeeting
);

router.post(
    '/meetings',
    googleApiAuth('meet', 'full'),
    MeetController.createMeeting
);

router.put(
    '/meetings/:meetingId',
    googleApiAuth('meet', 'full'),
    MeetController.updateMeeting
);

router.delete(
    '/meetings/:meetingId',
    googleApiAuth('meet', 'full'),
    MeetController.deleteMeeting
);

// Participants endpoints
router.post(
    '/meetings/:meetingId/participants',
    googleApiAuth('meet', 'full'),
    MeetController.addParticipant
);

router.delete(
    '/meetings/:meetingId/participants',
    googleApiAuth('meet', 'full'),
    MeetController.removeParticipant
);

// Availability endpoint
router.post(
    '/availability',
    googleApiAuth('meet', 'readonly'),
    MeetController.checkAvailability
);

export default router;