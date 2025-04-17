import { useState, useCallback } from 'react';
import axios from 'axios';
import { ApiResponse, API_BASE_URL } from '../../../../conf/axios';
import { MeetingData, CreateMeetingParams, UpdateMeetingParams, UseMeetApiReturn } from '../types/types.google.api';
import { useTokenApi } from '../../user_account';
import { createPermissionError, requestPermission, handleApiError } from '../../user_account/utils/utils.google';

/**
 * Hook for managing Google Meet meetings
 */
export const useMeetApi = (accountId: string): UseMeetApiReturn => {
    const [meetings, setMeetings] = useState<MeetingData[]>([]);
    const [meeting, setMeeting] = useState<MeetingData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();

    // Use token API to check for scopes
    const { checkServiceAccess } = useTokenApi();

    /**
     * Verify the user has appropriate access for operation
     */
    const verifyAccess = useCallback(async (
        scopeLevel: "readonly" | "full" = "readonly"
    ): Promise<boolean> => {
        try {
            const accessCheck = await checkServiceAccess(accountId, "meet", scopeLevel);

            if (!accessCheck || !accessCheck.hasAccess) {
                // Create and handle permission error
                const permissionError = createPermissionError("meet", scopeLevel, accountId);
                requestPermission(permissionError);
                setError(`You need additional permissions to access Meet`);
                return false;
            }

            return true;
        } catch (err) {
            console.error("Error checking meet access:", err);
            return false;
        }
    }, [accountId, checkServiceAccess]);

    /**
     * Get a specific Google Meet meeting
     */
    const getMeeting = useCallback(async (
        meetingId: string
    ): Promise<MeetingData | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.get<ApiResponse<{ meeting: MeetingData }>>(
                `${API_BASE_URL}/${accountId}/google/meet/meetings/${meetingId}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const fetchedMeeting = response.data.data.meeting;
                setMeeting(fetchedMeeting);
                return fetchedMeeting;
            } else {
                setError(response.data.error?.message || 'Failed to get meeting');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while getting the meeting');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Check if a user is available during a proposed meeting time
     */
    const checkAvailability = useCallback(async (
        email: string,
        startTime: string,
        endTime: string
    ): Promise<boolean | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first
            const hasAccess = await verifyAccess("readonly");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ isAvailable: boolean }>>(
                `${API_BASE_URL}/${accountId}/google/meet/availability`,
                { email, startTime, endTime },
                { withCredentials: true }
            );

            if (response.data.success && response.data.data !== undefined) {
                return response.data.data.isAvailable;
            } else {
                setError(response.data.error?.message || 'Failed to check availability');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while checking availability');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Remove a participant from a meeting
     */
    const removeParticipant = useCallback(async (
        meetingId: string,
        email: string
    ): Promise<MeetingData | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - modifying participants requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.delete<ApiResponse<{ meeting: MeetingData }>>(
                `${API_BASE_URL}/${accountId}/google/meet/meetings/${meetingId}/participants`,
                {
                    withCredentials: true,
                    data: { email } // Body for DELETE request
                }
            );

            if (response.data.success && response.data.data) {
                const updatedMeeting = response.data.data.meeting;
                setMeeting(updatedMeeting);

                // Update the meeting in the meetings list if it exists
                setMeetings(prev => prev.map(m => m.id === meetingId ? updatedMeeting : m));

                return updatedMeeting;
            } else {
                setError(response.data.error?.message || 'Failed to remove participant');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while removing participant');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Add a participant to a meeting
     */
    const addParticipant = useCallback(async (
        meetingId: string,
        email: string,
        optional: boolean = false
    ): Promise<MeetingData | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - modifying participants requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ meeting: MeetingData }>>(
                `${API_BASE_URL}/${accountId}/google/meet/meetings/${meetingId}/participants`,
                { email, optional },
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const updatedMeeting = response.data.data.meeting;
                setMeeting(updatedMeeting);

                // Update the meeting in the meetings list if it exists
                setMeetings(prev => prev.map(m => m.id === meetingId ? updatedMeeting : m));

                return updatedMeeting;
            } else {
                setError(response.data.error?.message || 'Failed to add participant');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while adding participant');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * List Google Meet meetings
     */
    const listMeetings = useCallback(async (
        params?: {
            pageToken?: string;
            maxResults?: number;
            timeMin?: string;
            timeMax?: string;
            q?: string;
            singleEvents?: boolean;
            orderBy?: 'startTime' | 'updated';
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
            if (params?.timeMin) queryParams.append('timeMin', params.timeMin);
            if (params?.timeMax) queryParams.append('timeMax', params.timeMax);
            if (params?.q) queryParams.append('q', params.q);
            if (params?.singleEvents !== undefined) queryParams.append('singleEvents', params.singleEvents.toString());
            if (params?.orderBy) queryParams.append('orderBy', params.orderBy);

            const response = await axios.get<ApiResponse<{
                meetings: MeetingData[];
                nextPageToken?: string;
            }>>(
                `${API_BASE_URL}/${accountId}/google/meet/meetings?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                if (params?.pageToken) {
                    // If using pagination, append to existing meetings
                    setMeetings(prev => [...prev, ...response.data.data!.meetings]);
                } else {
                    // Otherwise replace the meetings list
                    setMeetings(response.data.data.meetings);
                }
                setNextPageToken(response.data.data.nextPageToken);
            } else {
                setError(response.data.error?.message || 'Failed to list meetings');
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while listing meetings');
            }
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Delete a Google Meet meeting
     */
    const deleteMeeting = useCallback(async (
        meetingId: string,
        notifyAttendees: boolean = true
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - deleting meetings requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return false;
            }

            const queryParams = new URLSearchParams();
            if (notifyAttendees) {
                queryParams.append('notifyAttendees', 'true');
            }

            const response = await axios.delete<ApiResponse<{ message: string }>>(
                `${API_BASE_URL}/${accountId}/google/meet/meetings/${meetingId}?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setMeeting(null);
                // Update the meetings list if it contains the deleted meeting
                setMeetings(prev => prev.filter(m => m.id !== meetingId));
                return true;
            } else {
                setError(response.data.error?.message || 'Failed to delete meeting');
                return false;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while deleting the meeting');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Update an existing Google Meet meeting
     */
    const updateMeeting = useCallback(async (
        meetingId: string,
        params: UpdateMeetingParams
    ): Promise<MeetingData | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - updating meetings requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.put<ApiResponse<{ meeting: MeetingData }>>(
                `${API_BASE_URL}/${accountId}/google/meet/meetings/${meetingId}`,
                params,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const updatedMeeting = response.data.data.meeting;
                setMeeting(updatedMeeting);
                return updatedMeeting;
            } else {
                setError(response.data.error?.message || 'Failed to update meeting');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while updating the meeting');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId]);

    /**
     * Create a new Google Meet meeting
     */
    const createMeeting = useCallback(async (
        params: CreateMeetingParams
    ): Promise<MeetingData | null> => {
        setLoading(true);
        setError(null);

        try {
            // Verify access first - creating meetings requires 'full' access
            const hasAccess = await verifyAccess("full");
            if (!hasAccess) {
                setLoading(false);
                return null;
            }

            const response = await axios.post<ApiResponse<{ meeting: MeetingData }>>(
                `${API_BASE_URL}/${accountId}/google/meet/meetings`,
                params,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                const newMeeting = response.data.data.meeting;
                setMeeting(newMeeting);
                return newMeeting;
            } else {
                setError(response.data.error?.message || 'Failed to create meeting');
                return null;
            }
        } catch (err) {
            // Handle permission errors
            const permissionError = handleApiError(err);
            if (permissionError) {
                requestPermission(permissionError);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred while creating the meeting');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [verifyAccess, accountId])


    return {
        meetings,
        meeting,
        loading,
        error,
        nextPageToken,
        createMeeting,
        getMeeting,
        updateMeeting,
        deleteMeeting,
        listMeetings,
        addParticipant,
        removeParticipant,
        checkAvailability
    };
};