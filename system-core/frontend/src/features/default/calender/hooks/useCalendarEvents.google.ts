import axios from "axios";
import { useState, useCallback } from "react";
import { ApiResponse, API_BASE_URL } from "../../../../conf/axios";
import { UseCalendarEventsReturn, CalendarEvent, CreateEventParams, UpdateEventParams } from "../types/types.google.api";
import { useTokenApi } from "../../user_account";
import { createPermissionError, requestPermission, handleApiError } from "../../user_account/utils/utils.google";

/**
 * Hook for managing Google Calendar Events
 */
export const useCalendarEvents = (accountId: string): UseCalendarEventsReturn => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [event, setEvent] = useState<CalendarEvent | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();

    // Use token API to check for scopes
    const { checkServiceAccess } = useTokenApi();

    /**
     * Verify the user has appropriate access for operation
     */
    const verifyAccess = useCallback(async (
        scopeLevel: "readonly" | "events" | "full" = "readonly"
    ): Promise<boolean> => {
        try {
            const accessCheck = await checkServiceAccess(accountId, "calendar", scopeLevel);

            if (!accessCheck || !accessCheck.hasAccess) {
                // Create and handle permission error
                const permissionError = createPermissionError("calendar", scopeLevel, accountId);
                requestPermission(permissionError);
                setError(`You need additional permissions to access calendar events`);
                return false;
            }

            return true;
        } catch (err) {
            console.error("Error checking calendar access:", err);
            return false;
        }
    }, [accountId, checkServiceAccess]);

    /**
     * List events from a calendar
     */
    const listEvents = useCallback(async (
        params?: {
            calendarId?: string;
            pageToken?: string;
            maxResults?: number;
            timeMin?: string;
            timeMax?: string;
            singleEvents?: boolean;
            orderBy?: 'startTime' | 'updated';
            q?: string;
        }
    ): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return;
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params?.calendarId) queryParams.append('calendarId', params.calendarId);
            if (params?.pageToken) queryParams.append('pageToken', params.pageToken);
            if (params?.maxResults) queryParams.append('maxResults', params.maxResults.toString());
            if (params?.timeMin) queryParams.append('timeMin', params.timeMin);
            if (params?.timeMax) queryParams.append('timeMax', params.timeMax);
            if (params?.singleEvents) queryParams.append('singleEvents', params.singleEvents.toString());
            if (params?.orderBy) queryParams.append('orderBy', params.orderBy);
            if (params?.q) queryParams.append('q', params.q);

            const response = await axios.get<ApiResponse<{
                events: CalendarEvent[];
                nextPageToken?: string;
            }>>(
                `${API_BASE_URL}/google/${accountId}/calendar/events?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                if (params?.pageToken) {
                    // If using pagination, append to existing events
                    setEvents(prev => [...prev, ...response.data.data!.events]);
                } else {
                    // Otherwise replace the events list
                    setEvents(response.data.data.events);
                }
                setNextPageToken(response.data.data.nextPageToken);
            } else {
                setError(response.data.error?.message || 'Failed to list events');
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while listing events');
            }
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Get a specific event by ID
     */
    const getEvent = useCallback(async (
        eventId: string,
        calendarId?: string
    ): Promise<CalendarEvent | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const queryParams = new URLSearchParams();
            if (calendarId) queryParams.append('calendarId', calendarId);

            const response = await axios.get<ApiResponse<{ event: CalendarEvent }>>(
                `${API_BASE_URL}/google/${accountId}/calendar/events/${eventId}?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const fetchedEvent = response.data.data.event;
                setEvent(fetchedEvent);
                return fetchedEvent;
            } else {
                setError(response.data.error?.message || 'Failed to get event');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while getting the event');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Create a new event
     */
    const createEvent = useCallback(async (
        params: CreateEventParams
    ): Promise<CalendarEvent | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - creating events requires 'events' scope level
            const hasAccess = await verifyAccess("events");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ event: CalendarEvent }>>(
                `${API_BASE_URL}/google/${accountId}/calendar/events`,
                params,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const newEvent = response.data.data.event;
                setEvent(newEvent);
                return newEvent;
            } else {
                setError(response.data.error?.message || 'Failed to create event');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while creating the event');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Update an existing event
     */
    const updateEvent = useCallback(async (
        eventId: string,
        params: Omit<UpdateEventParams, 'eventId'>
    ): Promise<CalendarEvent | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - updating events requires 'events' scope level
            const hasAccess = await verifyAccess("events");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.put<ApiResponse<{ event: CalendarEvent }>>(
                `${API_BASE_URL}/google/${accountId}/calendar/events/${eventId}`,
                { ...params, eventId },
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const updatedEvent = response.data.data.event;
                setEvent(updatedEvent);
                // Update the event in the events list if it exists
                setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
                return updatedEvent;
            } else {
                setError(response.data.error?.message || 'Failed to update event');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while updating the event');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Delete an event
     */
    const deleteEvent = useCallback(async (
        eventId: string,
        params?: {
            calendarId?: string;
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        }
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - deleting events requires 'events' scope level
            const hasAccess = await verifyAccess("events");
            if (!hasAccess) {
                setLoading(false);
                return false;
            }

            const queryParams = new URLSearchParams();
            if (params?.calendarId) queryParams.append('calendarId', params.calendarId);
            if (params?.sendUpdates) queryParams.append('sendUpdates', params.sendUpdates);

            const response = await axios.delete<ApiResponse<{ message: string }>>(
                `${API_BASE_URL}/google/${accountId}/calendar/events/${eventId}?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                // Remove the event from the events list
                setEvents(prev => prev.filter(e => e.id !== eventId));
                if (event?.id === eventId) {
                    setEvent(null);
                }
                return true;
            } else {
                setError(response.data.error?.message || 'Failed to delete event');
                return false;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while deleting the event');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [accountId, event?.id, verifyAccess]);

    return {
        events,
        event,
        loading,
        error,
        nextPageToken,
        listEvents,
        getEvent,
        createEvent,
        updateEvent,
        deleteEvent
    };
};