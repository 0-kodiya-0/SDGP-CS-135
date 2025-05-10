/**
 * Extend the base ComponentTypes enum with Calendar-specific components
 * using TypeScript's declaration merging
 */
export const CalendarViewsTypes = {
  CALENDAR_VIEW: 'CalendarView',
  CALENDAR_EVENT_VIEW: 'CalendarEventView',
  CALENDAR_CREATE_EVENT_VIEW: 'CalendarCreateEventView',
  CALENDAR_EDIT_EVENT_VIEW: 'CalendarEditEventView',
  CALENDAR_CREATE_CALENDAR_VIEW: 'CalendarCreateView',
  CALENDAR_SUMMARY_VIEW: 'CalendarSummaryView'
} as const;