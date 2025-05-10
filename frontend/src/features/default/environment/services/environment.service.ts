import axios from 'axios';
import { Environment, EnvironmentPrivacy, EnvironmentStatus } from '../types/types.data';
import { API_BASE_URL } from '../../../../conf/axios';

/**
 * Get all environments for a specific account
 */
export const fetchEnvironments = async (accountId: string): Promise<Environment[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${accountId}/environments`);
    return response.data.data || [];
  } catch (error) {
    console.error('[EnvironmentService] Error fetching environments:', error);
    throw error;
  }
};

/**
 * Get a specific environment by ID
 */
export const fetchEnvironment = async (accountId: string, environmentId: string): Promise<Environment> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${accountId}/environments/${environmentId}`);
    return response.data.data;
  } catch (error) {
    console.error(`[EnvironmentService] Error fetching environment ${environmentId}:`, error);
    throw error;
  }
};

/**
 * Create a new environment
 */
export const createEnvironment = async (
  accountId: string, 
  data: { 
    name: string; 
    privacy?: EnvironmentPrivacy;
  }
): Promise<Environment> => {
  try {
    const payload = {
      name: data.name,
      privacy: data.privacy || EnvironmentPrivacy.Private,
      status: EnvironmentStatus.Active
    };
    
    const response = await axios.post(`${API_BASE_URL}/${accountId}/environments`, payload);
    return response.data.data;
  } catch (error) {
    console.error('[EnvironmentService] Error creating environment:', error);
    throw error;
  }
};

/**
 * Update an existing environment
 */
export const updateEnvironment = async (
  accountId: string,
  environmentId: string,
  data: Partial<Environment>
): Promise<Environment> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/${accountId}/environments/${environmentId}`, 
      data
    );
    return response.data.data;
  } catch (error) {
    console.error(`[EnvironmentService] Error updating environment ${environmentId}:`, error);
    throw error;
  }
};

/**
 * Delete an environment
 */
export const deleteEnvironment = async (accountId: string, environmentId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${accountId}/environments/${environmentId}`);
  } catch (error) {
    console.error(`[EnvironmentService] Error deleting environment ${environmentId}:`, error);
    throw error;
  }
};

/**
 * Set an environment as active for an account
 */
export const setActiveEnvironment = async (accountId: string, environmentId: string): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/${accountId}/environments/${environmentId}/activate`);
  } catch (error) {
    console.error(`[EnvironmentService] Error setting environment ${environmentId} as active:`, error);
    throw error;
  }
};

/**
 * Get the currently active environment for an account
 */
export const getActiveEnvironment = async (accountId: string): Promise<Environment | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${accountId}/environments/active`);
    return response.data.data;
  } catch (error) {
    console.error('[EnvironmentService] Error fetching active environment:', error);
    // Return null instead of throwing to handle the case when no active environment exists
    return null;
  }
};