// src/features/default/members/SummaryView.tsx
import React, { useState } from 'react';
import { User, Search, Loader2, UserPlus } from 'lucide-react';
import { Environment } from '../default/environment/types/types.data'; 
import { usePeople } from '../../contexts/PeopleContext';
import { Contact } from '../../utils/people-utils';
import ContactForm from './ContactForm';

export interface ContactSummaryViewProps {
  environment: Environment;
  onContactSelect?: (contact: Contact) => void;
}

const ContactSummaryView: React.FC<ContactSummaryViewProps> = ({ 
  environment,
  onContactSelect 
}) => {
  const { contacts, isLoading, error, fetchContacts, searchContacts, selectContact } = usePeople();
  const [selectedContactId, setSelectedContactId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewContactFormOpen, setIsNewContactFormOpen] = useState<boolean>(false);
  
  const handleContactClick = (contact: Contact) => {
    setSelectedContactId(contact.id);
    selectContact(contact);
    if (onContactSelect) {
      onContactSelect(contact);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchContacts(searchQuery);
  };

  const handleRefresh = () => {
    fetchContacts();
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-xl font-bold">Contact List</h3>
        <button
          onClick={() => setIsNewContactFormOpen(true)}
          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          title="Add new contact"
        >
          <UserPlus size={16} />
        </button>
      </div>
      
      {/* Search bar */}
      <div className="p-3 border-b">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="pl-8 pr-3 py-2 w-full border rounded-md text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}
      
      {/* Error state */}
      {error && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-red-500 mb-3 text-center">{error}</p>
          <button 
            onClick={handleRefresh} 
            className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && contacts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <User size={32} className="text-gray-300 mb-2" />
          <p className="text-gray-500 mb-3 text-center">No contacts found</p>
          <button 
            onClick={handleRefresh} 
            className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      )}
      
      {/* Contact list */}
      {!isLoading && !error && contacts.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y">
            {contacts.map(contact => (
              <div 
                key={contact.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedContactId === contact.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleContactClick(contact)}
              >
                <div className="flex items-center gap-2">
                  {contact.hasAvatar && contact.photos && contact.photos.length > 0 ? (
                    <img 
                      src={contact.photos[0]} 
                      alt={contact.name} 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
                    />
                  ) : (
                    <User size={18} className="text-blue-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h4 className="font-medium truncate">{contact.name}</h4>
                    <p className="text-sm text-gray-600 truncate">{contact.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Pagination/Show More button */}
      {!isLoading && contacts.length > 0 && (
        <div className="p-4 border-t">
          <button 
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            onClick={handleRefresh}
          >
            Refresh Contacts
          </button>
        </div>
      )}
      
      {/* New Contact Form */}
      <ContactForm
        isOpen={isNewContactFormOpen}
        onClose={() => setIsNewContactFormOpen(false)}
        accountId={environment.id.toString()}
      />
    </div>
  );
};

export default ContactSummaryView;
export type { Contact };