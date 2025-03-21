import { useState, useCallback } from 'react';
import axios from 'axios';

export interface PersonType {
  resourceName?: string;
  etag?: string;
  names?: Array<{
    displayName?: string;
    familyName?: string;
    givenName?: string;
    displayNameLastFirst?: string;
    unstructuredName?: string;
  }>;
  photos?: Array<{
    url?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  emailAddresses?: Array<{
    value?: string;
    type?: string;
    formattedType?: string;
    metadata?: {
      primary?: boolean;
      verified?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  phoneNumbers?: Array<{
    value?: string;
    type?: string;
    formattedType?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  organizations?: Array<{
    name?: string;
    department?: string;
    title?: string;
    jobDescription?: string;
    symbol?: string;
    domain?: string;
    type?: string;
    formattedType?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  addresses?: Array<{
    type?: string;
    formattedType?: string;
    formattedValue?: string;
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  birthdays?: Array<{
    date?: {
      year?: number;
      month?: number;
      day?: number;
    };
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  biographies?: Array<{
    value?: string;
    contentType?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  urls?: Array<{
    value?: string;
    type?: string;
    formattedType?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
}

interface FetchContactsOptions {
  pageToken?: string;
  pageSize?: number;
  query?: string;
}

export function useContacts(accountId: string) {
  const [contacts, setContacts] = useState<PersonType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const fetchContacts = useCallback(async (options: FetchContactsOptions = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/accounts/${accountId}/contacts`, {
        params: {
          pageToken: options.pageToken,
          pageSize: options.pageSize || 50,
          query: options.query,
        },
      });

      const { connections, nextPageToken: token } = response.data;

      if (options.pageToken) {
        // Append to existing contacts if paginating
        setContacts(prev => [...prev, ...connections]);
      } else {
        // Replace contacts if it's a new query
        setContacts(connections);
      }

      setNextPageToken(token || null);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const createContact = useCallback(async (contactData: Partial<PersonType>): Promise<PersonType | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`/api/accounts/${accountId}/contacts`, contactData);
      
      // Add the new contact to the local state
      const newContact = response.data;
      setContacts(prev => [newContact, ...prev]);
      
      return newContact;
    } catch (err) {
      console.error('Error creating contact:', err);
      setError('Failed to create contact. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const deleteContact = useCallback(async (resourceName: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await axios.delete(`/api/contacts/${resourceName}`, {
        params: { accountId }
      });

      // Remove the contact from local state
      setContacts(prev => prev.filter(contact => contact.resourceName !== resourceName));
      
      return true;
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const updateContact = useCallback(async (contactData: PersonType): Promise<PersonType | null> => {
    if (!contactData.resourceName) {
      setError('Contact does not have a valid resource name');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.patch(`/api/contacts/${contactData.resourceName}`, contactData, {
        params: { accountId }
      });
      
      // Update the contact in local state
      const updatedContact = response.data;
      setContacts(prev => 
        prev.map(contact => 
          contact.resourceName === updatedContact.resourceName ? updatedContact : contact
        )
      );
      
      return updatedContact;
    } catch (err) {
      console.error('Error updating contact:', err);
      setError('Failed to update contact. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  return {
    contacts,
    loading,
    error,
    nextPageToken,
    fetchContacts,
    createContact,
    deleteContact,
    updateContact
  };
}