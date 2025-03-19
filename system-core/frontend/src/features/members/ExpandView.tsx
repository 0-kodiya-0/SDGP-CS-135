// src/features/default/members/ExpandView.tsx
import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Star, Plus, Loader2, Trash2 } from 'lucide-react';
import { Contact } from '../../utils/people-utils';
import { usePeople } from '../../contexts/PeopleContext';
import { useContactOperations } from '../../../src/hooks/useContactOperations';
import ContactForm from './ContactForm';

interface ExpandViewProps {
  selectedContact?: Contact | null;
  accountId?: string;
}

const ExpandView: React.FC<ExpandViewProps> = ({ selectedContact, accountId = 'current-account' }) => {
  const { getContact, isLoading, fetchContacts } = usePeople();
  const { deleteContact, addToFavorites, removeFromFavorites, isLoading: isOperationLoading } = useContactOperations();
  const [contactDetails, setContactDetails] = useState<Contact | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Fetch detailed contact information when selected contact changes
  useEffect(() => {
    const fetchContactDetails = async () => {
      if (selectedContact?.resourceName) {
        setIsLoadingDetails(true);
        try {
          const details = await getContact(selectedContact.resourceName);
          if (details) {
            setContactDetails(details);
          }
        } catch (error) {
          console.error('Error fetching contact details:', error);
        } finally {
          setIsLoadingDetails(false);
        }
      } else {
        setContactDetails(null);
      }
    };

    fetchContactDetails();
  }, [selectedContact, getContact]);

  // Combine the selected contact with detailed information
  const contact = contactDetails || selectedContact;

  // Handle toggle favorite
  const handleToggleFavorite = async () => {
    if (!contact) return;
    
    if (contact.isFavorite) {
      const updated = await removeFromFavorites(accountId, contact);
      if (updated) {
        setContactDetails(updated);
      }
    } else {
      const updated = await addToFavorites(accountId, contact);
      if (updated) {
        setContactDetails(updated);
      }
    }
  };

  // Handle delete contact
  const handleDeleteContact = async () => {
    if (!contact?.resourceName) return;
    
    const success = await deleteContact(accountId, contact.resourceName);
    if (success) {
      setContactDetails(null);
      fetchContacts();
      setShowDeleteConfirm(false);
    }
  };

  // Loading state
  if (isLoading || isLoadingDetails || isOperationLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 text-blue-500 animate-spin h-8 w-8" />
          <h3 className="text-xl font-medium mb-2">Loading contact details...</h3>
        </div>
      </div>
    );
  }

  // No contact selected
  if (!contact) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium mb-2">No Contact Selected</h3>
          <p className="text-gray-500">Select a contact from the list to view details</p>
        </div>
      </div>
    );
  }

  // Get the primary phone number and address
  const primaryPhone = contact.phoneNumbers && contact.phoneNumbers.length > 0 
    ? contact.phoneNumbers[0] 
    : 'Not available';

  const primaryAddress = contact.addresses && contact.addresses.length > 0
    ? contact.addresses[0]
    : 'Not available';

  // Get company and position
  const company = contact.companies && contact.companies.length > 0
    ? contact.companies[0].name || 'Not available'
    : 'Not available';

  const position = contact.companies && contact.companies.length > 0
    ? contact.companies[0].title || 'Not available'
    : 'Not available';

  return (
    <div className="w-full h-full bg-white p-6 overflow-y-auto">
      {/* Contact Header */}
      <div className="flex items-start mb-8">
        <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mr-6 flex-shrink-0 overflow-hidden">
          {contact.hasAvatar && contact.photos && contact.photos.length > 0 ? (
            <img 
              src={contact.photos[0]} 
              alt={contact.name} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <User size={36} className="text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold mr-2">{contact.name}</h2>
            {contact.isFavorite && <Star size={18} className="text-yellow-500 fill-yellow-500" />}
          </div>
          <p className="text-gray-500 mb-1">{position}</p>
          <p className="text-gray-500 mb-3">{company}</p>
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100"
              onClick={handleToggleFavorite}
            >
              {contact.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
            </button>
            <button 
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-200"
              onClick={() => setIsEditFormOpen(true)}
            >
              Edit
            </button>
            <button 
              className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={14} className="inline mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-5">
          <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
          
          <div className="flex items-center">
            <Mail size={18} className="text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-800">{contact.email || 'Not available'}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Phone size={18} className="text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-800">{primaryPhone}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <MapPin size={18} className="text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-gray-800">{primaryAddress}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <h3 className="text-lg font-semibold mb-3">Employment Details</h3>
          
          <div className="flex items-center">
            <Briefcase size={18} className="text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Company</p>
              <p className="text-gray-800">{company}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <User size={18} className="text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Position</p>
              <p className="text-gray-800">{position}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Calendar size={18} className="text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Join Date</p>
              <p className="text-gray-800">{contact.joinDate || 'Not available'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Notes</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-gray-700">{contact.notes || 'No notes available for this contact.'}</p>
        </div>
      </div>

      {/* Activity Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <button className="text-blue-500 flex items-center text-sm">
            <Plus size={14} className="mr-1" /> Add Activity
          </button>
        </div>
        
        <div className="border rounded-md divide-y">
          <div className="p-4 text-center text-gray-500">
            No recent activities found for this contact.
          </div>
        </div>
      </div>
    
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete Contact</h3>
            <p className="mb-6">Are you sure you want to delete this contact? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md"
                onClick={handleDeleteContact}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Contact Form */}
      <ContactForm
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        contact={contact}
        accountId={accountId}
      />
    </div>
  );
};

export default ExpandView;