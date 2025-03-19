// src/features/default/members/ContactForm.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Contact } from '../../utils/people-utils';
import { useContactOperations } from '../../../src/hooks/useContactOperations';
import { usePeople } from '../../contexts/PeopleContext';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  accountId: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ 
  isOpen, 
  onClose, 
  contact = null,
  accountId
}) => {
  const isEditing = !!contact;
  const { createContact, updateContact, isLoading, error, success } = useContactOperations();
  const { fetchContacts } = usePeople();
  
  // Form state
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    email: '',
    phoneNumbers: [''],
    addresses: [''],
    companies: [{ name: '', title: '' }],
    notes: ''
  });

  // Initialize form with contact data when editing
  useEffect(() => {
    if (contact) {
      setFormData({
        resourceName: contact.resourceName,
        name: contact.name || '',
        email: contact.email || '',
        phoneNumbers: contact.phoneNumbers?.length ? contact.phoneNumbers : [''],
        addresses: contact.addresses?.length ? contact.addresses : [''],
        companies: contact.companies?.length ? contact.companies : [{ name: '', title: '' }],
        notes: contact.notes || ''
      });
    } else {
      // Reset form when creating a new contact
      setFormData({
        name: '',
        email: '',
        phoneNumbers: [''],
        addresses: [''],
        companies: [{ name: '', title: '' }],
        notes: ''
      });
    }
  }, [contact, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhoneNumbers = [...(formData.phoneNumbers || [''])];
    newPhoneNumbers[index] = value;
    setFormData(prev => ({ ...prev, phoneNumbers: newPhoneNumbers }));
  };

  const handleAddPhone = () => {
    setFormData(prev => ({ 
      ...prev, 
      phoneNumbers: [...(prev.phoneNumbers || []), ''] 
    }));
  };

  const handleRemovePhone = (index: number) => {
    const newPhoneNumbers = [...(formData.phoneNumbers || [''])];
    newPhoneNumbers.splice(index, 1);
    setFormData(prev => ({ ...prev, phoneNumbers: newPhoneNumbers }));
  };

  const handleAddressChange = (index: number, value: string) => {
    const newAddresses = [...(formData.addresses || [''])];
    newAddresses[index] = value;
    setFormData(prev => ({ ...prev, addresses: newAddresses }));
  };

  const handleAddAddress = () => {
    setFormData(prev => ({ 
      ...prev, 
      addresses: [...(prev.addresses || []), ''] 
    }));
  };

  const handleRemoveAddress = (index: number) => {
    const newAddresses = [...(formData.addresses || [''])];
    newAddresses.splice(index, 1);
    setFormData(prev => ({ ...prev, addresses: newAddresses }));
  };

  const handleCompanyChange = (index: number, field: 'name' | 'title', value: string) => {
    const newCompanies = [...(formData.companies || [{ name: '', title: '' }])];
    newCompanies[index] = { 
      ...newCompanies[index], 
      [field]: value 
    };
    setFormData(prev => ({ ...prev, companies: newCompanies }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name) {
      alert('Name is required');
      return;
    }
    
    try {
      if (isEditing && contact) {
        // Update existing contact
        await updateContact(accountId, formData);
      } else {
        // Create new contact
        await createContact(accountId, formData);
      }
      
      // Refresh contacts list after successful operation
      if (!error) {
        fetchContacts();
        onClose();
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-600 p-3 mb-4 rounded-md">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          {/* Phone Numbers */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Numbers
            </label>
            {formData.phoneNumbers?.map((phone, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                  placeholder="Phone number"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhone(index)}
                  className="bg-red-50 text-red-500 p-2 rounded-md"
                  disabled={formData.phoneNumbers?.length === 1}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPhone}
              className="text-blue-500 text-sm mt-1"
            >
              + Add another phone
            </button>
          </div>
          
          {/* Addresses */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Addresses
            </label>
            {formData.addresses?.map((address, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(index, e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                  placeholder="Address"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAddress(index)}
                  className="bg-red-50 text-red-500 p-2 rounded-md"
                  disabled={formData.addresses?.length === 1}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddAddress}
              className="text-blue-500 text-sm mt-1"
            >
              + Add another address
            </button>
          </div>
          
          {/* Company Information */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employment Details
            </label>
            {formData.companies?.map((company, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={company.name || ''}
                  onChange={(e) => handleCompanyChange(index, 'name', e.target.value)}
                  className="p-2 border rounded-md"
                  placeholder="Company name"
                />
                <input
                  type="text"
                  value={company.title || ''}
                  onChange={(e) => handleCompanyChange(index, 'title', e.target.value)}
                  className="p-2 border rounded-md"
                  placeholder="Job title"
                />
              </div>
            ))}
          </div>
          
          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-blue-300"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;