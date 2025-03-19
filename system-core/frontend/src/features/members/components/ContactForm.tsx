// components/ContactForm.tsx
import React, { useState, useEffect } from 'react';
import { useContacts } from '../hooks/useGoogleContacts';
import { PersonType, CreateContactParams } from '../types/people.types';

interface ContactFormProps {
  accountId: string;
  contact?: PersonType;
  onSuccess: () => void;
  onCancel: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ 
  accountId, 
  contact, 
  onSuccess, 
  onCancel 
}) => {
  const isEditMode = !!contact;
  const { createContact, updateContact } = useContacts(accountId);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // Initialize form with contact data if in edit mode
  useEffect(() => {
    if (contact) {
      // Extract name components
      if (contact.names && contact.names.length > 0) {
        const primaryName = contact.names.find(name => name.metadata?.primary) || contact.names[0];
        setFirstName(primaryName.givenName || '');
        setLastName(primaryName.familyName || '');
      }

      // Extract email
      if (contact.emailAddresses && contact.emailAddresses.length > 0) {
        const primaryEmail = contact.emailAddresses.find(email => email.metadata?.primary) || contact.emailAddresses[0];
        setEmail(primaryEmail.value || '');
      }

      // Extract phone
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const primaryPhone = contact.phoneNumbers.find(phone => phone.metadata?.primary) || contact.phoneNumbers[0];
        setPhone(primaryPhone.value || '');
      }

      // Extract organization info
      if (contact.organizations && contact.organizations.length > 0) {
        const primaryOrg = contact.organizations[0];
        setCompany(primaryOrg.name || '');
        setJobTitle(primaryOrg.title || '');
      }

      // Extract address
      if (contact.addresses && contact.addresses.length > 0) {
        const primaryAddress = contact.addresses.find(addr => addr.metadata?.primary) || contact.addresses[0];
        setAddress(primaryAddress.streetAddress || '');
        setCity(primaryAddress.city || '');
        setRegion(primaryAddress.region || '');
        setPostalCode(primaryAddress.postalCode || '');
        setCountry(primaryAddress.country || '');
      }
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const contactData: CreateContactParams = {
        names: [{
          givenName: firstName,
          familyName: lastName,
          displayName: `${firstName} ${lastName}`.trim(),
        }],
        emailAddresses: email ? [{
          value: email,
          type: 'work'
        }] : undefined,
        phoneNumbers: phone ? [{
          value: phone,
          type: 'mobile'
        }] : undefined,
        organizations: (company || jobTitle) ? [{
          name: company,
          title: jobTitle
        }] : undefined,
        addresses: (address || city || region || postalCode || country) ? [{
          streetAddress: address,
          city: city,
          region: region,
          postalCode: postalCode,
          country: country,
          type: 'home'
        }] : undefined
      };

      if (isEditMode && contact?.resourceName) {
        // Update existing contact
        await updateContact(contact.resourceName, {
          ...contactData,
          etag: contact.etag
        });
      } else {
        // Create new contact
        await createContact(contactData);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving contact:', err);
      setError('Failed to save contact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Contact' : 'Add New Contact'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State/Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Contact' : 'Add Contact')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;