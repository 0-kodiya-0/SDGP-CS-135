import React, { FC, useState, useEffect } from 'react';
import { X, Users, Search, Check, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useContacts } from '../hooks/useContacts.google';
import { PersonType } from '../types/types.data';

interface CreateGroupFormProps {
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
  onContactCreated?: (contact: any) => void;
}

interface FormData {
  name: string;
  description: string;
  memberResourceNames: string[];
}

const CreateGroupForm: FC<CreateGroupFormProps> = ({
  accountId,
  isOpen,
  onClose,
  onContactCreated
}) => {
  const { contacts, loading, error, fetchContacts } = useContacts(accountId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    memberResourceNames: []
  });

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen, fetchContacts]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleMemberSelector = () => {
    setShowMemberSelector(!showMemberSelector);
    setSearchTerm('');
  };

  const toggleContactSelection = (contact: PersonType) => {
    if (!contact.resourceName) return;

    const isSelected = formData.memberResourceNames.includes(contact.resourceName);
    
    if (isSelected) {
      // Remove from selection
      handleChange(
        'memberResourceNames', 
        formData.memberResourceNames.filter(id => id !== contact.resourceName)
      );
    } else {
      // Add to selection
      handleChange(
        'memberResourceNames', 
        [...formData.memberResourceNames, contact.resourceName]
      );
    }
  };

  // Filter contacts based on search term
  const filteredContacts = searchTerm.trim() === '' 
    ? contacts 
    : contacts.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        return contact.names?.some(name => 
          name.displayName?.toLowerCase().includes(searchLower) ||
          name.givenName?.toLowerCase().includes(searchLower) ||
          name.familyName?.toLowerCase().includes(searchLower)
        ) ||
        contact.emailAddresses?.some(email => 
          email.value?.toLowerCase().includes(searchLower)
        ) ||
        contact.phoneNumbers?.some(phone => 
          phone.value?.toLowerCase().includes(searchLower)
        );
      });

  // Get selected contacts
  const selectedContacts = contacts.filter(
    contact => contact.resourceName && formData.memberResourceNames.includes(contact.resourceName)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      console.error("Group name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Creating contact group with data:", formData);

      // Create the request payload
      const payload = {
        contactGroup: {
          name: formData.name.trim(),
          formattedName: formData.name.trim(),
          memberResourceNames: formData.memberResourceNames
        }
      };

      // Add description if provided
      if (formData.description && formData.description.trim()) {
        // Using type assertion to tell TypeScript this is valid
        (payload.contactGroup as any).description = formData.description.trim();
      }

      // Log the request payload for debugging
      console.log("Request payload:", JSON.stringify(payload));

      // Make the API request
      const response = await fetch(`/api/accounts/${accountId}/contactGroups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      // Check for HTTP error responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", response.status, errorText);
        throw new Error(`Failed to create group: ${response.status} ${errorText}`);
      }

      const newGroup = await response.json();
      console.log("Group created successfully:", newGroup);
      
      if (onContactCreated) {
        onContactCreated(newGroup);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating contact group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Create New Group</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Group name field */}
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name *
              </label>
              <input
                id="groupName"
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description field */}
            <div>
              <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="groupDescription"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter group description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Member Selection Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                onClick={toggleMemberSelector}
              >
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-800">Select Members</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {formData.memberResourceNames.length} selected
                  </span>
                  {showMemberSelector ? 
                    <ChevronUp size={18} className="text-gray-500" /> : 
                    <ChevronDown size={18} className="text-gray-500" />
                  }
                </div>
              </div>

              {/* Selected members summary */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {selectedContacts.length === 0 ? (
                    <p className="text-sm text-gray-500">No members selected</p>
                  ) : (
                    selectedContacts.map(contact => (
                      <div 
                        key={contact.resourceName} 
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                      >
                        <span>{contact.names?.[0]?.displayName || 'Unnamed Contact'}</span>
                        <button 
                          type="button"
                          onClick={() => toggleContactSelection(contact)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Contact selection list */}
              {showMemberSelector && (
                <div className="border-t border-gray-200">
                  {/* Search bar */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <Search 
                        size={16} 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                      />
                    </div>
                  </div>

                  {/* Contact list */}
                  <div className="max-h-60 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500">
                        Loading contacts...
                      </div>
                    ) : error ? (
                      <div className="p-4 text-center text-red-500">
                        Error loading contacts. Please try again.
                      </div>
                    ) : filteredContacts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No contacts found matching your search.
                      </div>
                    ) : (
                      filteredContacts.map(contact => {
                        const isSelected = contact.resourceName && 
                          formData.memberResourceNames.includes(contact.resourceName);
                        
                        return (
                          <div 
                            key={contact.resourceName}
                            onClick={() => toggleContactSelection(contact)}
                            className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                              isSelected ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex-shrink-0 mr-3">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {contact.photos && contact.photos[0]?.url ? (
                                  <img
                                    src={contact.photos[0].url}
                                    alt={contact.names?.[0]?.displayName || 'Contact'}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <User size={16} className="text-gray-500" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {contact.names?.[0]?.displayName || 'Unnamed Contact'}
                              </p>
                              {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                                <p className="text-xs text-gray-500 truncate">
                                  {contact.emailAddresses[0].value}
                                </p>
                              )}
                            </div>
                            <div className={`w-5 h-5 rounded-full border ${
                              isSelected 
                                ? 'bg-blue-600 border-blue-600 flex items-center justify-center' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupForm;