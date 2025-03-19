// components/ContactSearch.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useContacts } from '../hooks/useGoogleContacts';
import { PersonType } from '../types/people.types';
import { debounce } from 'lodash';

interface ContactSearchProps {
  accountId: string;
  onContactSelect?: (contact: PersonType) => void;
}

const ContactSearch: React.FC<ContactSearchProps> = ({ accountId, onContactSelect }) => {
  const { searchContacts } = useContacts(accountId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PersonType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      setError(null);
      
      try {
        const results = await searchContacts({
          query,
          readMask: 'names,emailAddresses,phoneNumbers,photos',
          pageSize: 10
        });
        
        setSearchResults(results.contacts || []);
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to search contacts. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [searchContacts]
  );

  // Execute search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
    
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // Helper function to get primary display name
  const getDisplayName = useCallback((contact: PersonType): string => {
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
  }, []);

  // Helper function to get primary email
  const getPrimaryEmail = useCallback((contact: PersonType): string => {
    if (!contact.emailAddresses || contact.emailAddresses.length === 0) {
      return '';
    }
    
    // Try to find the primary email first
    const primaryEmail = contact.emailAddresses.find(email => email.metadata?.primary);
    if (primaryEmail?.value) {
      return primaryEmail.value;
    }
    
    // Fallback to the first email in the array
    return contact.emailAddresses[0].value || '';
  }, []);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isSearching && (
          <div className="absolute right-3 top-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      
      {searchResults.length > 0 && (
        <ul className="mt-2 border rounded-md shadow-sm max-h-80 overflow-y-auto">
          {searchResults.map((contact) => (
            <li 
              key={contact.resourceName} 
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => onContactSelect && onContactSelect(contact)}
            >
              <div className="flex items-center space-x-3">
                {contact.photos && contact.photos.length > 0 && contact.photos[0].url ? (
                  <img 
                    src={contact.photos[0].url} 
                    alt={getDisplayName(contact)} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                    {getDisplayName(contact).charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-medium">{getDisplayName(contact)}</div>
                  {getPrimaryEmail(contact) && (
                    <div className="text-sm text-gray-500">{getPrimaryEmail(contact)}</div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="mt-2 p-2 text-gray-500 text-center text-sm">
          No contacts found matching your search.
        </div>
      )}
    </div>
  );
};

export default ContactSearch;