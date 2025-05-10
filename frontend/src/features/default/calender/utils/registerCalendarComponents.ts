import { registerComponent } from '../../../required/tab_view/utils/componentRegistry';
import { ComponentTypes } from '../../../required/tab_view/types/types.views';

/**
 * Register all calendar-related components for dynamic loading
 * This function should be called during application initialization
 */
export function registerCalendarComponents() {
    // Register calendar components - using the extended ComponentTypes enum
    registerComponent(
        ComponentTypes.CALENDAR_VIEW,
        () => import('../components/CalendarView')
    );

    registerComponent(
        ComponentTypes.CALENDAR_EVENT_VIEW,
        () => import('../components/CalendarEventView')
    );

    registerComponent(
        ComponentTypes.CALENDAR_CREATE_EVENT_VIEW,
        () => import('../components/CreateEventView')
    );

    registerComponent(
        ComponentTypes.CALENDAR_EDIT_EVENT_VIEW,
        () => import('../components/EditEventView')
    );

    registerComponent(
        ComponentTypes.CALENDAR_CREATE_CALENDAR_VIEW,
        () => import('../components/CreateCalendarView')
    );

    registerComponent(
        ComponentTypes.CALENDAR_SUMMARY_VIEW,
        () => import('../components/CalenderSummaryView')
    );

    console.log('Calendar components registered for dynamic loading');
}