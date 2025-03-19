// src/contexts/PeopleContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Contact, transformPersonToContact } from '../utils/people-utils';

interface PeopleContextType {
  contacts: Contact[];
  selectedContact: Contact | null;
  isLoading: boolean;
  error: string | null;
  fetchContacts: () => Promise<void>;
  getContact: (resourceName: string) => Promise<Contact | null>;
  selectContact: (contact: Contact | null) => void;
  searchContacts: (query: string) => Promise<void>;
}

const PeopleContext = createContext<PeopleContextType>({
  contacts: [],
  selectedContact: null,
  isLoading: false,
  error: null,
  fetchContacts: async () => {},
  getContact: async () => null,
  selectContact: () => {},
  searchContacts: async () => {},
});

interface PeopleProviderProps {
  children: ReactNode;
  accountId: string;
}

export const PeopleProvider: React.FC<PeopleProviderProps> = ({ children, accountId }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Base API URL
  const apiBaseUrl = '/api/google/people';

  // Fetch contacts from the Google People API
  const fetchContacts = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiBaseUrl}/contacts`, {
        params: {
          accountId,
          personFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,photos'
        }
      });
      
      if (response.data && response.data.contacts) {
        const transformedContacts = response.data.contacts.map(transformPersonToContact);
        setContacts(transformedContacts);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to fetch contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single contact by resource name
  const getContact = async (resourceName: string): Promise<Contact | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiBaseUrl}/contacts/${resourceName}`, {
        params: {
          accountId,
          personFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,photos,biographies'
        }
      });
      
      if (response.data && response.data.contact) {
        return transformPersonToContact(response.data.contact);
      }
      return null;
    } catch (err) {
      console.error('Error fetching contact:', err);
      setError('Failed to fetch contact details. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Search contacts
  const searchContacts = async (query: string): Promise<void> => {
    if (!query) {
      // If empty query, fetch all contacts
      return fetchContacts();
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiBaseUrl}/contacts/search`, {
        params: {
          accountId,
          q: query,
          readMask: 'names,emailAddresses,phoneNumbers,addresses,organizations,photos'
        }
      });
      
      if (response.data && response.data.contacts) {
        const transformedContacts = response.data.contacts.map(transformPersonToContact);
        setContacts(transformedContacts);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('Error searching contacts:', err);
      setError('Failed to search contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Select a contact for detailed view
  const selectContact = (contact: Contact | null) => {
    setSelectedContact(contact);
  };

  // Initial fetch on mount
  useEffect(() => {
    if (accountId) {
      fetchContacts();
    }
  }, [accountId]);

  const value = {
    contacts,
    selectedContact,
    isLoading,
    error,
    fetchContacts,
    getContact,
    selectContact,
    searchContacts,
  };

  return (
    <PeopleContext.Provider value={value}>
      {children}
    </PeopleContext.Provider>
  );
};

// Hook to use the people context
export const usePeople = () => {
  const context = useContext(PeopleContext);
  if (context === undefined) {
    throw new Error('usePeople must be used within a PeopleProvider');
  }
  return context;
};