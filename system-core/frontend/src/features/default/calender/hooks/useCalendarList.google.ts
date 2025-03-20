import axios from "axios";
import { useState, useCallback } from "react";
import { ApiResponse, API_BASE_URL } from "../../../../conf/axios";
import { UseCalendarListReturn, CalendarResource, CreateCalendarParams, UpdateCalendarParams } from "../types/types.google.api";
import { useTokenApi } from "../../user_account";
import { createPermissionError, requestPermission, handleApiError } from "../../user_account/utils/utils.google";

/**
 * Hook for managing Google Calendar List
 */
export const useCalendarList = (accountId: string): UseCalendarListReturn => {
  const [calendars, setCalendars] = useState<CalendarResource[]>([]);
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
        setError(`You need additional permissions to access calendars`);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error checking calendar access:", err);
      return false;
    }
  }, [accountId, checkServiceAccess]);

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
      // Verify access first
      const hasAccess = await verifyAccess("readonly");
      if (!hasAccess) {
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
      // Handle permission errors
      const permissionError = handleApiError(err);
      if (permissionError) {
        requestPermission(permissionError);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while listing calendars');
      }
    } finally {
      setLoading(false);
    }
  }, [accountId, verifyAccess]);

  /**
   * Create a new calendar
   */
  const createCalendar = useCallback(async (
    params: CreateCalendarParams
  ): Promise<CalendarResource | null> => {
    setLoading(true);
    setError(null);

    try {
      // Verify access first - creating calendars requires 'full' access
      const hasAccess = await verifyAccess("full");
      if (!hasAccess) {
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
      // Handle permission errors
      const permissionError = handleApiError(err);
      if (permissionError) {
        requestPermission(permissionError);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while creating the calendar');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [verifyAccess, accountId]);

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
      // Verify access first - updating calendars requires 'full' access
      const hasAccess = await verifyAccess("full");
      if (!hasAccess) {
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
      // Handle permission errors
      const permissionError = handleApiError(err);
      if (permissionError) {
        requestPermission(permissionError);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while updating the calendar');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [verifyAccess, accountId]);

  /**
   * Delete a calendar
   */
  const deleteCalendar = useCallback(async (
    calendarId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Verify access first - deleting calendars requires 'full' access
      const hasAccess = await verifyAccess("full");
      if (!hasAccess) {
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
      // Handle permission errors
      const permissionError = handleApiError(err);
      if (permissionError) {
        requestPermission(permissionError);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while deleting the calendar');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [verifyAccess, accountId]);

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