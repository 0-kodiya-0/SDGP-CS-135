import express from 'express';
import { googleApiAuth } from '../../middleware';
import { createCalendar, createEvent, deleteCalendar, deleteEvent, getEvent, listCalendars, listEvents, updateCalendar, updateEvent } from './calendar.controller';

const router = express.Router({ mergeParams: true });

// Calendar list endpoints
router.get(
  '/calendars',
  googleApiAuth('calendar', 'readonly'),
  listCalendars
);

router.post(
  '/calendars',
  googleApiAuth('calendar', 'full'),
  createCalendar
);

router.put(
  '/calendars/:calendarId',
  googleApiAuth('calendar', 'full'),
  updateCalendar
);

router.delete(
  '/calendars/:calendarId',
  googleApiAuth('calendar', 'full'),
  deleteCalendar
);

// Events endpoints
router.get(
  '/events',
  googleApiAuth('calendar', 'readonly'),
  listEvents
);

router.get(
  '/events/:eventId',
  googleApiAuth('calendar', 'readonly'),
  getEvent
);

router.post(
  '/events',
  googleApiAuth('calendar', 'events'),
  createEvent
);

router.put(
  '/events/:eventId',
  googleApiAuth('calendar', 'events'),
  updateEvent
);

router.delete(
  '/events/:eventId',
  googleApiAuth('calendar', 'events'),
  deleteEvent
);

export default router;