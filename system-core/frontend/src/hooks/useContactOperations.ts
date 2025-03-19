// src/hooks/useContactOperations.ts
import { useState } from 'react';
import axios from 'axios';
import { Contact } from '../utils/people-utils';

interface ContactOperationsReturn {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  createContact: (accountId: string, contactData: Partial<Contact>) => Promise<Contact | null>;
  updateContact: (accountId: string, contactData: Partial<Contact>) => Promise<Contact | null>;
  deleteContact: (accountId: string, resourceName: string) => Promise<boolean>;
  addToFavorites: (accountId: string, contact: Contact) => Promise<Contact | null>;
  removeFromFavorites: (accountId: string, contact: Contact) => Promise<Contact | null>;
}

export const useContactOperations = (): ContactOperationsReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Base API URL
  const apiBaseUrl = '/api/google/people';

  // Create a new contact
  const createContact = async (accountId: string, contactData: Partial<Contact>): Promise<Contact | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Transform our frontend Contact to Google API format
      const googleContactData = {
        names: [
          {
            givenName: contactData.name?.split(' ')[0] || '',
            familyName: contactData.name?.split(' ').slice(1).join(' ') || '',
            displayName: contactData.name
          }
        ],
        emailAddresses: contactData.email ? [{ value: contactData.email }] : undefined,
        phoneNumbers: contactData.phoneNumbers?.map(phone => ({ value: phone })),
        addresses: contactData.addresses?.map(address => ({ formattedValue: address })),
        organizations: contactData.companies?.map(company => ({
          name: company.name,
          title: company.title
        }))
      };

      const response = await axios.post(`${apiBaseUrl}/contacts`, googleContactData, {
        params: { accountId }
      });
      
      if (response.data && response.data.contact) {
        setSuccess('Contact created successfully');
        return response.data.contact;
      }
      return null;
    } catch (err) {
      console.error('Error creating contact:', err);
      setError('Failed to create contact. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing contact
  const updateContact = async (accountId: string, contactData: Partial<Contact>): Promise<Contact | null> => {
    if (!contactData.resourceName) {
      setError('Resource name is required for updating a contact');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Transform our frontend Contact to Google API format
      const googleContactData = {
        names: contactData.name ? [
          {
            givenName: contactData.name.split(' ')[0] || '',
            familyName: contactData.name.split(' ').slice(1).join(' ') || '',
            displayName: contactData.name
          }
        ] : undefined,
        emailAddresses: contactData.email ? [{ value: contactData.email }] : undefined,
        phoneNumbers: contactData.phoneNumbers?.map(phone => ({ value: phone })),
        addresses: contactData.addresses?.map(address => ({ formattedValue: address })),
        organizations: contactData.companies?.map(company => ({
          name: company.name,
          title: company.title
        }))
      };

      const response = await axios.put(
        `${apiBaseUrl}/contacts/${contactData.resourceName}`, 
        googleContactData, 
        { params: { accountId } }
      );
      
      if (response.data && response.data.contact) {
        setSuccess('Contact updated successfully');
        return response.data.contact;
      }
      return null;
    } catch (err) {
      console.error('Error updating contact:', err);
      setError('Failed to update contact. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a contact
  const deleteContact = async (accountId: string, resourceName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await axios.delete(`${apiBaseUrl}/contacts/${resourceName}`, {
        params: { accountId }
      });
      
      setSuccess('Contact deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a contact to favorites (simulation - this would need custom data storage)
  const addToFavorites = async (accountId: string, contact: Contact): Promise<Contact | null> => {
    // Since Google People API doesn't have a built-in favorites concept,
    // this would typically be implemented with your own database
    // This is a placeholder for that functionality
    setSuccess('Contact added to favorites');
    return { ...contact, isFavorite: true };
  };

  // Remove a contact from favorites (simulation - this would need custom data storage)
  const removeFromFavorites = async (accountId: string, contact: Contact): Promise<Contact | null> => {
    // Since Google People API doesn't have a built-in favorites concept,
    // this would typically be implemented with your own database
    // This is a placeholder for that functionality
    setSuccess('Contact removed from favorites');
    return { ...contact, isFavorite: false };
  };

  return {
    isLoading,
    error,
    success,
    createContact,
    updateContact,
    deleteContact,
    addToFavorites,
    removeFromFavorites
  };
};