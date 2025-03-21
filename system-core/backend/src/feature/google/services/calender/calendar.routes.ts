import express from 'express';
import { CalendarController } from './calendar.controller';
import { googleApiAuth } from '../../middleware';

const router = express.Router({ mergeParams: true });

// Calendar list endpoints
router.get(
  '/calendars',
  googleApiAuth('calendar', 'readonly'),
  CalendarController.listCalendars
);

router.post(
  '/calendars',
  googleApiAuth('calendar', 'full'),
  CalendarController.createCalendar
);

router.put(
  '/calendars/:calendarId',
  googleApiAuth('calendar', 'full'),
  CalendarController.updateCalendar
);

router.delete(
  '/calendars/:calendarId',
  googleApiAuth('calendar', 'full'),
  CalendarController.deleteCalendar
);

// Events endpoints
router.get(
  '/events',
  googleApiAuth('calendar', 'readonly'),
  CalendarController.listEvents
);

router.get(
  '/events/:eventId',
  googleApiAuth('calendar', 'readonly'),
  CalendarController.getEvent
);

router.post(
  '/events',
  googleApiAuth('calendar', 'events'),
  CalendarController.createEvent
);

router.put(
  '/events/:eventId',
  googleApiAuth('calendar', 'events'),
  CalendarController.updateEvent
);

router.delete(
  '/events/:eventId',
  googleApiAuth('calendar', 'events'),
  CalendarController.deleteEvent
);

export default router;