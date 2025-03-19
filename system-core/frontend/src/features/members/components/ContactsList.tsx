// components/ContactsList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useContacts } from '../hooks/useGoogleContacts';
import { PersonType } from '../types/people.types';
import ContactSearch from './ContactSearch';

interface ContactsListProps {
  accountId: string;
  onEditContact?: (contact: PersonType) => void;
}

const ContactsList: React.FC<ContactsListProps> = ({ accountId, onEditContact }) => {
  const {
    contacts,
    isLoadingContacts,
    contactsError,
    fetchContacts,
    deleteContact
  } = useContacts(accountId);

  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [searchMode, setSearchMode] = useState(false);
  const [selectedContact, setSelectedContact] = useState<PersonType | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleDeleteContact = async (resourceName: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }
    
    setIsDeleting((prev) => ({ ...prev, [resourceName]: true }));
    try {
      await deleteContact(resourceName);
      // Refresh the contacts list
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact. Please try again.');
    } finally {
      setIsDeleting((prev) => ({ ...prev, [resourceName]: false }));
    }
  };

  const handleContactSelected = useCallback((contact: PersonType) => {
    setSelectedContact(contact);
    setSearchMode(false);
  }, []);

  // Helper function to get primary display name
  const getDisplayName = (contact: PersonType): string => {
    if (!contact.names || contact.names.length === 0) {
      return 'Unnamed Contact';
    }
    
    // Try to find the primary name first
    const primaryName = contact.names.find(name => name.metadata?.primary);
    if (primaryName?.displayName) {
      return primaryName.displayName;
    }
    
    // Fallback to the first name in the array
    return contact.names[0].displayName || 'Unnamed Contact';
  };

  // Helper function to get primary email
  const getPrimaryEmail = (contact: PersonType): string => {
    if (!contact.emailAddresses || contact.emailAddresses.length === 0) {
      return 'No email';
    }
    
    // Try to find the primary email first
    const primaryEmail = contact.emailAddresses.find(email => email.metadata?.primary);
    if (primaryEmail?.value) {
      return primaryEmail.value;
    }
    
    // Fallback to the first email in the array
    return contact.emailAddresses[0].value || 'No email';
  };

  // Helper function to get primary phone
  const getPrimaryPhone = (contact: PersonType): string => {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return 'No phone';
    }
    
    // Try to find the primary phone first
    const primaryPhone = contact.phoneNumbers.find(phone => phone.metadata?.primary);
    if (primaryPhone?.value) {
      return primaryPhone.value;
    }
    
    // Fallback to the first phone in the array
    return contact.phoneNumbers[0].value || 'No phone';
  };

  if (isLoadingContacts) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (contactsError) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4 text-red-600">Error loading contacts: {contactsError.message}</div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={() => fetchContacts()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {searchMode ? 'Search Contacts' : 'All Contacts'}
          </h2>
          <button
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            onClick={() => setSearchMode(!searchMode)}
          >
            {searchMode ? 'View All Contacts' : 'Search Contacts'}
          </button>
        </div>
        
        {searchMode && (
          <div className="mb-6">
            <ContactSearch 
              accountId={accountId}
              onContactSelect={handleContactSelected}
            />
          </div>
        )}
      </div>
      
      {searchMode && selectedContact ? (
        <div className="border rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold">{getDisplayName(selectedContact)}</h2>
              {selectedContact.organizations && selectedContact.organizations.length > 0 && (
                <p className="text-gray-600 mt-1">{selectedContact.organizations[0].name}</p>
              )}
            </div>
            
            {selectedContact.photos && selectedContact.photos.length > 0 && selectedContact.photos[0].url && (
              <img 
                src={selectedContact.photos[0].url} 
                alt={getDisplayName(selectedContact)} 
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Contact Information</h3>
              <div className="space-y-2">
                {selectedContact.emailAddresses && selectedContact.emailAddresses.length > 0 && (
                  <p>
                    <span className="text-gray-600">Email: </span>
                    {getPrimaryEmail(selectedContact)}
                  </p>
                )}
                
                {selectedContact.phoneNumbers && selectedContact.phoneNumbers.length > 0 && (
                  <p>
                    <span className="text-gray-600">Phone: </span>
                    {getPrimaryPhone(selectedContact)}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Address</h3>
              {selectedContact.addresses && selectedContact.addresses.length > 0 ? (
                <div>
                  <p>{selectedContact.addresses[0].streetAddress}</p>
                  <p>
                    {selectedContact.addresses[0].city}, {selectedContact.addresses[0].region} {selectedContact.addresses[0].postalCode}
                  </p>
                  <p>{selectedContact.addresses[0].country}</p>
                </div>
              ) : (
                <p className="text-gray-500">No address information</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => onEditContact && onEditContact(selectedContact)}
            >
              Edit Contact
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-300"
              onClick={() => selectedContact.resourceName && handleDeleteContact(selectedContact.resourceName)}
              disabled={isDeleting[selectedContact.resourceName || '']}
            >
              {isDeleting[selectedContact.resourceName || ''] ? 'Deleting...' : 'Delete Contact'}
            </button>
          </div>
        </div>
      ) : !searchMode && (!contacts || !contacts.items || contacts.items.length === 0) ? (
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500">No contacts found</p>
        </div>
      ) : !searchMode && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts?.items.map((contact) => (
              <div key={contact.resourceName} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{getDisplayName(contact)}</h2>
                    {contact.organizations && contact.organizations.length > 0 && (
                      <p className="text-gray-600">{contact.organizations[0].name}</p>
                    )}
                    <p className="mt-2">{getPrimaryEmail(contact)}</p>
                    <p>{getPrimaryPhone(contact)}</p>
                  </div>
                  
                  {contact.photos && contact.photos.length > 0 && contact.photos[0].url && (
                    <img 
                      src={contact.photos[0].url} 
                      alt={getDisplayName(contact)} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex mt-4 space-x-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => onEditContact && onEditContact(contact)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
                    onClick={() => contact.resourceName && handleDeleteContact(contact.resourceName)}
                    disabled={isDeleting[contact.resourceName || '']}
                  >
                    {isDeleting[contact.resourceName || ''] ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {contacts?.nextPageToken && (
            <div className="mt-4 text-center">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => fetchContacts({ pageToken: contacts.nextPageToken })}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactsList;