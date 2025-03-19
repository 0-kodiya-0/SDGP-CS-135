// hooks/useGoogleContacts.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  PersonType, 
  ContactsList, 
  ContactGroupType,
  ContactGroupsList,
  GetContactsParams,
  GetContactParams,
  CreateContactParams,
  UpdateContactParams,
  SearchContactsParams,
  GetContactGroupsParams,
  CreateContactGroupParams,
  UpdateContactGroupParams,
  AddContactsToGroupParams,
  RemoveContactsFromGroupParams
} from '../types/people.types';
import apiClient from '../utils/apiClient';

/**
 * Base hook for handling API request states
 */
const useApiRequest = <T>() => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const resetState = () => {
    setData(null);
    setError(null);
  };

  return {
    data,
    setData,
    isLoading,
    setIsLoading,
    error,
    setError,
    resetState
  };
};

/**
 * Hook for fetching and managing contacts
 */
export const useContacts = (accountId: string) => {
  const { 
    data: contacts, 
    setData: setContacts,
    isLoading: isLoadingContacts,
    setIsLoading: setIsLoadingContacts,
    error: contactsError,
    setError: setContactsError,
    resetState: resetContactsState
  } = useApiRequest<ContactsList>();

  const fetchContacts = useCallback(async (params: GetContactsParams = {}) => {
    setIsLoadingContacts(true);
    try {
      const response = await apiClient.get(`/google/${accountId}/people/contacts`, { params });
      const data = response.data;
      setContacts(data);
      return data;
    } catch (error) {
      setContactsError(error as Error);
      throw error;
    } finally {
      setIsLoadingContacts(false);
    }
  }, [accountId, setIsLoadingContacts, setContacts, setContactsError]);

  const fetchContact = useCallback(async (resourceName: string, params: Omit<GetContactParams, 'resourceName'> = {}) => {
    try {
      const response = await apiClient.get(`/google/${accountId}/people/contacts/${encodeURIComponent(resourceName)}`, { params });
      return response.data.contact;
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  const createContact = useCallback(async (contactData: CreateContactParams) => {
    try {
      const response = await apiClient.post(`/google/${accountId}/people/contacts`, contactData);
      return response.data.contact;
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  const updateContact = useCallback(async (resourceName: string, contactData: Omit<UpdateContactParams, 'resourceName'>) => {
    try {
      const response = await apiClient.put(`/google/${accountId}/people/contacts/${encodeURIComponent(resourceName)}`, contactData);
      return response.data.contact;
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  const deleteContact = useCallback(async (resourceName: string) => {
    try {
      await apiClient.delete(`/google/${accountId}/people/contacts/${encodeURIComponent(resourceName)}`);
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  const searchContacts = useCallback(async (params: SearchContactsParams) => {
    try {
      const response = await apiClient.get(`/google/${accountId}/people/contacts/search`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  return {
    contacts,
    isLoadingContacts,
    contactsError,
    fetchContacts,
    fetchContact,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    resetContactsState
  };
};

/**
 * Hook for fetching and managing contact groups
 */
export const useContactGroups = (accountId: string) => {
  const { 
    data: groups, 
    setData: setGroups,
    isLoading: isLoadingGroups,
    setIsLoading: setIsLoadingGroups,
    error: groupsError,
    setError: setGroupsError,
    resetState: resetGroupsState
  } = useApiRequest<ContactGroupsList>();

  const fetchContactGroups = useCallback(async (params: GetContactGroupsParams = {}) => {
    setIsLoadingGroups(true);
    try {
      const response = await apiClient.get(`/google/${accountId}/people/contactGroups`, { params });
      const data = response.data;
      setGroups(data);
      return data;
    } catch (error) {
      setGroupsError(error as Error);
      throw error;
    } finally {
      setIsLoadingGroups(false);
    }
  }, [accountId, setIsLoadingGroups, setGroups, setGroupsError]);

  const fetchContactGroup = useCallback(async (resourceName: string) => {
    try {
      const response = await apiClient.get(`/google/${accountId}/people/contactGroups/${encodeURIComponent(resourceName)}`);
      return response.data.group;
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  const createContactGroup = useCallback(async (params: CreateContactGroupParams) => {
    try {
      const response = await apiClient.post(`/google/${accountId}/people/contactGroups`, params);
      return response.data.group;
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  const updateContactGroup = useCallback(async (resourceName: string, params: Omit<UpdateContactGroupParams, 'resourceName'>) => {
    try {
      const response = await apiClient.put(`/google/${accountId}/people/contactGroups/${encodeURIComponent(resourceName)}`, params);
      return response.data.group;
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  const deleteContactGroup = useCallback(async (resourceName: string, deleteContacts: boolean = false) => {
    try {
      await apiClient.delete(`/google/${accountId}/people/contactGroups/${encodeURIComponent(resourceName)}`, {
        params: { deleteContacts }
      });
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  const addContactsToGroup = useCallback(async (resourceName: string, resourceNames: string[]) => {
    try {
      const response = await apiClient.post(
        `/google/${accountId}/people/contactGroups/${encodeURIComponent(resourceName)}/members:add`, 
        { resourceNames }
      );
      return response.data.group;
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  const removeContactsFromGroup = useCallback(async (resourceName: string, resourceNames: string[]) => {
    try {
      const response = await apiClient.post(
        `/google/${accountId}/people/contactGroups/${encodeURIComponent(resourceName)}/members:remove`, 
        { resourceNames }
      );
      return response.data.group;
    } catch (error) {
      throw error;
    }
  }, [accountId]);

  return {
    groups,
    isLoadingGroups,
    groupsError,
    fetchContactGroups,
    fetchContactGroup,
    createContactGroup,
    updateContactGroup,
    deleteContactGroup,
    addContactsToGroup,
    removeContactsFromGroup,
    resetGroupsState
  };
};

/**
 * Combined hook for Google Contacts functionality
 */
export const useGoogleContacts = (accountId: string) => {
  const contactsHook = useContacts(accountId);
  const groupsHook = useContactGroups(accountId);

  return {
    ...contactsHook,
    ...groupsHook
  };
};