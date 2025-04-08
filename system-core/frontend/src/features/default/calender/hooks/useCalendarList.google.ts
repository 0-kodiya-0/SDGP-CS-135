import axios from "axios";
import { useState, useCallback } from "react";
import { ApiResponse, API_BASE_URL } from "../../../../conf/axios";
import { UseCalendarListReturn, CalendarResource, CreateCalendarParams, UpdateCalendarParams } from "../types/types.google.api";
import { handleApiError } from "../../user_account/utils/utils.google";
import { useGooglePermissions } from "../../user_account/hooks/usePermissions.google";

/**
 * Hook for managing Google Calendar List
 */
export const useCalendarList = (accountId: string): UseCalendarListReturn => {
  const [calendars, setCalendars] = useState<CalendarResource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  // Use Google Permissions hook
  const { verifyServiceAccess, invalidatePermission } = useGooglePermissions();

  /**
   * List available calendars
   */
  const listCalendars = useCallback(async (
    params?: {
      pageToken?: string;
      maxResults?: number;
    }
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Verify access using the updated permission hook
      const hasAccess = await verifyServiceAccess(accountId, "calendar", "readonly");
      if (!hasAccess) {
        setError("You need additional permissions to access calendars");
        setLoading(false);
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params?.pageToken) queryParams.append('pageToken', params.pageToken);
      if (params?.maxResults) queryParams.append('maxResults', params.maxResults.toString());

      const response = await axios.get<ApiResponse<{
        calendars: CalendarResource[];
        nextPageToken?: string;
      }>>(
        `${API_BASE_URL}/google/${accountId}/calendar/calendars?${queryParams.toString()}`,
        { withCredentials: true }
      );

      if (response.data.success && response.data.data) {
        if (params?.pageToken) {
          // If using pagination, append to existing calendars
          setCalendars(prev => [...prev, ...response.data.data!.calendars]);
        } else {
          // Otherwise replace the calendars list
          setCalendars(response.data.data.calendars);
        }
        setNextPageToken(response.data.data.nextPageToken);
      } else {
        setError(response.data.error?.message || 'Failed to list calendars');
      }
    } catch (err) {
      // Handle API errors and invalidate permissions if needed
      const permissionError = handleApiError(err);
      if (permissionError) {
        invalidatePermission(accountId, "calendar", "readonly");
        setError("Permission error: You need additional permissions to access calendars");
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while listing calendars');
      }
    } finally {
      setLoading(false);
    }
  }, [accountId, verifyServiceAccess, invalidatePermission]);

  /**
   * Create a new calendar
   */
  const createCalendar = useCallback(async (
    params: CreateCalendarParams
  ): Promise<CalendarResource | null> => {
    setLoading(true);
    setError(null);

    try {
      // Verify access using the updated permission hook - creating calendars requires 'full' access
      const hasAccess = await verifyServiceAccess(accountId, "calendar", "full");
      if (!hasAccess) {
        setError("You need additional permissions to create calendars");
        setLoading(false);
        return null;
      }

      const response = await axios.post<ApiResponse<{ calendar: CalendarResource }>>(
        `${API_BASE_URL}/google/${accountId}/calendar/calendars`,
        params,
        { withCredentials: true }
      );

      if (response.data.success && response.data.data) {
        const newCalendar = response.data.data.calendar;
        setCalendars(prev => [...prev, newCalendar]);
        return newCalendar;
      } else {
        setError(response.data.error?.message || 'Failed to create calendar');
        return null;
      }
    } catch (err) {
      // Handle API errors and invalidate permissions if needed
      const permissionError = handleApiError(err);
      if (permissionError) {
        invalidatePermission(accountId, "calendar", "full");
        setError("Permission error: You need additional permissions to create calendars");
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while creating the calendar');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [accountId, verifyServiceAccess, invalidatePermission]);

  /**
   * Update an existing calendar
   */
  const updateCalendar = useCallback(async (
    calendarId: string,
    params: Omit<UpdateCalendarParams, 'calendarId'>
  ): Promise<CalendarResource | null> => {
    setLoading(true);
    setError(null);

    try {
      // Verify access using the updated permission hook - updating calendars requires 'full' access
      const hasAccess = await verifyServiceAccess(accountId, "calendar", "full");
      if (!hasAccess) {
        setError("You need additional permissions to update calendars");
        setLoading(false);
        return null;
      }

      const response = await axios.put<ApiResponse<{ calendar: CalendarResource }>>(
        `${API_BASE_URL}/google/${accountId}/calendar/calendars/${calendarId}`,
        params,
        { withCredentials: true }
      );

      if (response.data.success && response.data.data) {
        const updatedCalendar = response.data.data.calendar;
        setCalendars(prev => prev.map(cal => cal.id === calendarId ? updatedCalendar : cal));
        return updatedCalendar;
      } else {
        setError(response.data.error?.message || 'Failed to update calendar');
        return null;
      }
    } catch (err) {
      // Handle API errors and invalidate permissions if needed
      const permissionError = handleApiError(err);
      if (permissionError) {
        invalidatePermission(accountId, "calendar", "full");
        setError("Permission error: You need additional permissions to update calendars");
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while updating the calendar');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [accountId, verifyServiceAccess, invalidatePermission]);

  /**
   * Delete a calendar
   */
  const deleteCalendar = useCallback(async (
    calendarId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Verify access using the updated permission hook - deleting calendars requires 'full' access
      const hasAccess = await verifyServiceAccess(accountId, "calendar", "full");
      if (!hasAccess) {
        setError("You need additional permissions to delete calendars");
        setLoading(false);
        return false;
      }

      const response = await axios.delete<ApiResponse<{ message: string }>>(
        `${API_BASE_URL}/google/${accountId}/calendar/calendars/${calendarId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Remove the calendar from the calendars list
        setCalendars(prev => prev.filter(cal => cal.id !== calendarId));
        return true;
      } else {
        setError(response.data.error?.message || 'Failed to delete calendar');
        return false;
      }
    } catch (err) {
      // Handle API errors and invalidate permissions if needed
      const permissionError = handleApiError(err);
      if (permissionError) {
        invalidatePermission(accountId, "calendar", "full");
        setError("Permission error: You need additional permissions to delete calendars");
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while deleting the calendar');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [accountId, verifyServiceAccess, invalidatePermission]);

  return {
    calendars,
    loading,
    error,
    nextPageToken,
    listCalendars,
    createCalendar,
    updateCalendar,
    deleteCalendar
  };
};