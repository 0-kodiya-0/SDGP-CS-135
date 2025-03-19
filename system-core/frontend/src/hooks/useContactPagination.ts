// src/hooks/useContactPagination.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { PersonType } from '../../../backend/src/feature/google/services/people/people.types';
import { Contact, transformPersonToContact } from '../utils/people-utils';

interface UsePaginationReturn {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export const useContactPagination = (accountId: string): UsePaginationReturn => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Base API URL
  const apiBaseUrl = '/api/google/people';

  // Function to fetch contacts with pagination
  const fetchContacts = useCallback(async (pageToken?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiBaseUrl}/contacts`, {
        params: {
          accountId,
          pageToken,
          maxResults: 20, // Number of results per page
          personFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,photos'
        }
      });
      
      if (response.data) {
        const newContacts = response.data.contacts?.map(
          (person: PersonType) => transformPersonToContact(person)
        ) || [];
        
        setContacts(prevContacts => pageToken 
          ? [...prevContacts, ...newContacts] 
          : newContacts
        );
        
        setNextPageToken(response.data.nextPageToken || null);
        setHasMore(!!response.data.nextPageToken);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  // Load more contacts
  const loadMore = useCallback(async (): Promise<void> => {
    if (!isLoading && hasMore && nextPageToken) {
      await fetchContacts(nextPageToken);
    }
  }, [fetchContacts, isLoading, hasMore, nextPageToken]);

  // Reset pagination and fetch first page
  const reset = useCallback((): void => {
    setContacts([]);
    setNextPageToken(null);
    setHasMore(true);
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset
  };
};