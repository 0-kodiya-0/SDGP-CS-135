import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit, Trash2, Globe, Heart, Tag, Bookmark, Info, ChevronDown } from 'lucide-react';
import { useContacts } from '../hooks/useContacts.google';
import { PersonType } from '../types/types.data';

interface ExpandViewProps {
  selectedContact?: PersonType | null;
  accountId: string;
  onContactDeleted?: () => void;
  onContactUpdated?: (contact: PersonType) => void;
}

const ExpandView: React.FC<ExpandViewProps> = ({
  selectedContact,
  accountId,
  onContactDeleted,
  onContactUpdated
}) => {
  const { deleteContact } = useContacts(accountId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    contactInfo: true,
    employmentDetails: true,
    addresses: true,
    personalInfo: true,
    notes: true
  });

  if (!selectedContact) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Contact Selected</h3>
          <p className="text-gray-500 max-w-md">Select a contact from the list to view details</p>
        </div>
      </div>
    );
  }

  const handleDeleteContact = async () => {
    if (!selectedContact.resourceName) return;

    const success = await deleteContact(selectedContact.resourceName);
    if (success && onContactDeleted) {
      onContactDeleted();
      setConfirmDelete(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Format date string from birthday object
  const formatBirthday = (birthday: any) => {
    if (!birthday?.date) return 'Not specified';

    const { year, month, day } = birthday.date;
    const parts = [];

    if (month) parts.push(new Date(0, month - 1).toLocaleString('default', { month: 'long' }));
    if (day) parts.push(day);
    if (year) parts.push(year);

    return parts.join(' ');
  };

  // Section rendering helper
  const renderSection = (
    title: string,
    sectionKey: keyof typeof expandedSections,
    icon: React.ReactNode,
    content: React.ReactNode
  ) => (
    <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-500 transition-transform ${expandedSections[sectionKey] ? 'transform rotate-180' : ''}`}
        />
      </div>
      {expandedSections[sectionKey] && (
        <div className="p-4 bg-white">
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full bg-white overflow-y-auto p-6">
      {/* Header with actions */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mr-4 overflow-hidden">
            {selectedContact.photos && selectedContact.photos[0]?.url ? (
              <img
                src={selectedContact.photos[0].url}
                alt={selectedContact.names?.[0]?.displayName || 'Contact'}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={32} className="text-blue-600" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedContact.names?.[0]?.displayName || 'Unnamed Contact'}
            </h2>
            {selectedContact.organizations && selectedContact.organizations[0]?.title && (
              <p className="text-gray-600">
                {selectedContact.organizations[0].title}
                {selectedContact.organizations[0].name && (
                  <> at {selectedContact.organizations[0].name}</>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
            title="Edit contact"
          >
            <Edit size={20} />
          </button>
          <button
            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
            title="Delete contact"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="mb-3 text-red-800">Are you sure you want to delete this contact?</p>
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={handleDeleteContact}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Contact Information */}
      {renderSection(
        "Contact Information",
        "contactInfo",
        <Info size={18} className="text-blue-500" />,
        <div className="space-y-4">
          {/* Email addresses */}
          {selectedContact.emailAddresses && selectedContact.emailAddresses.length > 0 ? (
            selectedContact.emailAddresses.map((email, index) => (
              <div key={`email-${index}`} className="flex items-start">
                <Mail size={18} className="text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">{email.type ? email.formattedType || email.type : 'Email'}</p>
                  <p className="text-gray-800">{email.value}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-start">
              <Mail size={18} className="text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-400 italic">No email address</p>
              </div>
            </div>
          )}

          {/* Phone numbers */}
          {selectedContact.phoneNumbers && selectedContact.phoneNumbers.length > 0 ? (
            selectedContact.phoneNumbers.map((phone, index) => (
              <div key={`phone-${index}`} className="flex items-start">
                <Phone size={18} className="text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">{phone.type ? phone.formattedType || phone.type : 'Phone'}</p>
                  <p className="text-gray-800">{phone.value}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-start">
              <Phone size={18} className="text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-400 italic">No phone number</p>
              </div>
            </div>
          )}

          {/* Websites/URLs */}
          {selectedContact.urls && selectedContact.urls.length > 0 && (
            selectedContact.urls.map((url, index) => (
              <div key={`url-${index}`} className="flex items-start">
                <Globe size={18} className="text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">{url.type ? url.formattedType || url.type : 'Website'}</p>
                  <a
                    href={url.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {url.value}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Employment Details */}
      {selectedContact.organizations && selectedContact.organizations.length > 0 && (
        renderSection(
          "Employment Details",
          "employmentDetails",
          <Briefcase size={18} className="text-blue-500" />,
          <div className="space-y-4">
            {selectedContact.organizations.map((org, index) => (
              <div key={`org-${index}`} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                {org.name && (
                  <div className="flex items-start mb-3">
                    <Briefcase size={18} className="text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-gray-800">{org.name}</p>
                    </div>
                  </div>
                )}

                {org.title && (
                  <div className="flex items-start mb-3">
                    <User size={18} className="text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Title</p>
                      <p className="text-gray-800">{org.title}</p>
                    </div>
                  </div>
                )}

                {org.department && (
                  <div className="flex items-start">
                    <Tag size={18} className="text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="text-gray-800">{org.department}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Addresses */}
      {selectedContact.addresses && selectedContact.addresses.length > 0 && (
        renderSection(
          "Addresses",
          "addresses",
          <MapPin size={18} className="text-blue-500" />,
          <div className="space-y-4">
            {selectedContact.addresses.map((address, index) => (
              <div key={`address-${index}`} className="flex items-start">
                <MapPin size={18} className="text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">
                    {address.type ? address.formattedType || address.type : 'Address'}
                  </p>
                  <p className="text-gray-800">
                    {address.formattedValue || [
                      address.streetAddress,
                      address.city,
                      address.region,
                      address.postalCode,
                      address.country
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Personal Information */}
      {selectedContact.birthdays && selectedContact.birthdays.length > 0 && (
        renderSection(
          "Personal Information",
          "personalInfo",
          <Heart size={18} className="text-blue-500" />,
          <div className="space-y-4">
            {selectedContact.birthdays.map((birthday, index) => (
              <div key={`birthday-${index}`} className="flex items-start">
                <Calendar size={18} className="text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Birthday</p>
                  <p className="text-gray-800">{formatBirthday(birthday)}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Notes */}
      {selectedContact.biographies && selectedContact.biographies.length > 0 && (
        renderSection(
          "Notes",
          "notes",
          <Bookmark size={18} className="text-blue-500" />,
          <div className="space-y-4">
            {selectedContact.biographies.map((bio, index) => (
              <div key={`bio-${index}`} className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700 whitespace-pre-wrap">{bio.value}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* Synced with Google indicator */}
      <div className="mt-8 flex items-center justify-center py-3 border-t border-gray-200 text-gray-500 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Synced with Google Contacts
      </div>
    </div>
  );
};

export default ExpandView;