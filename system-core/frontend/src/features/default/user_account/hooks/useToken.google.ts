import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { API_BASE_URL, ApiResponse } from '../../../../conf/axios';
import { UseTokenApiReturn, TokenInfoResponse, ServiceAccessResponse } from '../types/types.google.api';

/**
 * Hook for interacting with Google Token API
 */
export const useTokenApi = (): UseTokenApiReturn => {
    const [tokenInfo, setTokenInfo] = useState<TokenInfoResponse | null>(null);
    const [serviceAccess, setServiceAccess] = useState<ServiceAccessResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Get token information including granted scopes
     */
    const getTokenInfo = useCallback(async (
        accountId: string
    ): Promise<TokenInfoResponse | null> => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get<ApiResponse<TokenInfoResponse>>(
                `${API_BASE_URL}/google/${accountId}/token`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                setTokenInfo(response.data.data);
                return response.data.data;
            } else {
                setError(response.data.error?.message || 'Failed to fetch token information');
                return null;
            }
        } catch (err) {
            const axiosError = err as AxiosError<ApiResponse<any>>;
            setError(
                axiosError.response?.data?.error?.message ||
                axiosError.message ||
                'An error occurred while fetching token information'
            );
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Check if the token has access to a specific service and scope level
     */
    const checkServiceAccess = useCallback(async (
        accountId: string,
        service: string,
        scopeLevel: string
    ): Promise<ServiceAccessResponse | null> => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters
            const queryParams = new URLSearchParams();
            queryParams.append('service', service);
            queryParams.append('scopeLevel', scopeLevel);

            const response = await axios.get<ApiResponse<ServiceAccessResponse>>(
                `${API_BASE_URL}/google/${accountId}/token/check?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                setServiceAccess(response.data.data);
                return response.data.data;
            } else {
                setError(response.data.error?.message || 'Failed to check service access');
                return null;
            }
        } catch (err) {
            const axiosError = err as AxiosError<ApiResponse<any>>;
            setError(
                axiosError.response?.data?.error?.message ||
                axiosError.message ||
                'An error occurred while checking service access'
            );
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        tokenInfo,
        serviceAccess,
        loading,
        error,
        getTokenInfo,
        checkServiceAccess
    };
};