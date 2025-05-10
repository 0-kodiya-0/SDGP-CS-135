import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useContacts } from '../hooks/useContacts.google';
import { PersonType } from '../types/types.data';

interface CreateContactFormProps {
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
  onContactCreated?: (contact: PersonType) => void;
}

type ContactFormData = {
  firstName: string;
  lastName: string;
  emails: Array<{ value: string; type: string }>;
  phoneNumbers: Array<{ value: string; type: string }>;
  organization: { name: string; title: string; department: string };
  address: { value: string; type: string };
  birthday: { year: string; month: string; day: string };
  notes: string;
}

const CreateContactForm: React.FC<CreateContactFormProps> = ({
  accountId,
  isOpen,
  onClose,
  onContactCreated
}) => {
  const { createContact } = useContacts(accountId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    emails: [{ value: '', type: 'home' }],
    phoneNumbers: [{ value: '', type: 'mobile' }],
    organization: { name: '', title: '', department: '' },
    address: { value: '', type: 'home' },
    birthday: { year: '', month: '', day: '' },
    notes: ''
  });

  if (!isOpen) {
    return null;
  }

  const handleChange = (
    field: keyof ContactFormData,
    value: string | Array<{ value: string; type: string }> | any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailChange = (index: number, field: 'value' | 'type', value: string) => {
    const updatedEmails = [...formData.emails];
    updatedEmails[index][field] = value;
    handleChange('emails', updatedEmails);
  };

  const handlePhoneChange = (index: number, field: 'value' | 'type', value: string) => {
    const updatedPhones = [...formData.phoneNumbers];
    updatedPhones[index][field] = value;
    handleChange('phoneNumbers', updatedPhones);
  };

  const addEmail = () => {
    handleChange('emails', [...formData.emails, { value: '', type: 'home' }]);
  };

  const addPhone = () => {
    handleChange('phoneNumbers', [...formData.phoneNumbers, { value: '', type: 'mobile' }]);
  };

  const removeEmail = (index: number) => {
    const updatedEmails = formData.emails.filter((_, i) => i !== index);
    handleChange('emails', updatedEmails);
  };

  const removePhone = (index: number) => {
    const updatedPhones = formData.phoneNumbers.filter((_, i) => i !== index);
    handleChange('phoneNumbers', updatedPhones);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Transform formData to the format expected by the API
      const contactData = {
        names: [
          {
            givenName: formData.firstName,
            familyName: formData.lastName,
            displayName: `${formData.firstName} ${formData.lastName}`.trim()
          }
        ],
        emailAddresses: formData.emails.filter(email => email.value.trim() !== '').map(email => ({
          value: email.value,
          type: email.type
        })),
        phoneNumbers: formData.phoneNumbers.filter(phone => phone.value.trim() !== '').map(phone => ({
          value: phone.value,
          type: phone.type
        })),
        organizations: formData.organization.name || formData.organization.title ?
          [{
            name: formData.organization.name,
            title: formData.organization.title,
            department: formData.organization.department
          }] :
          undefined,
        addresses: formData.address.value ?
          [{
            formattedValue: formData.address.value,
            type: formData.address.type
          }] :
          undefined,
        birthdays: (formData.birthday.year || formData.birthday.month || formData.birthday.day) ?
          [{
            date: {
              year: formData.birthday.year ? parseInt(formData.birthday.year) : undefined,
              month: formData.birthday.month ? parseInt(formData.birthday.month) : undefined,
              day: formData.birthday.day ? parseInt(formData.birthday.day) : undefined
            }
          }] :
          undefined,
        biographies: formData.notes ?
          [{
            value: formData.notes,
            contentType: 'TEXT_PLAIN'
          }] :
          undefined
      };

      const newContact = await createContact(contactData);
      if (newContact && onContactCreated) {
        onContactCreated(newContact);
      }
      onClose();
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Create New Contact</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex-grow">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Email Addresses */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-700">Email Addresses</h3>
                <button
                  type="button"
                  onClick={addEmail}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  <Plus size={16} className="mr-1" /> Add Email
                </button>
              </div>
              <div className="space-y-3">
                {formData.emails.map((email, index) => (
                  <div key={`email-${index}`} className="flex items-center space-x-2">
                    <select
                      value={email.type}
                      onChange={(e) => handleEmailChange(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-1/4"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email.value}
                      onChange={(e) => handleEmailChange(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmail(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Phone Numbers */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-700">Phone Numbers</h3>
                <button
                  type="button"
                  onClick={addPhone}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  <Plus size={16} className="mr-1" /> Add Phone
                </button>
              </div>
              <div className="space-y-3">
                {formData.phoneNumbers.map((phone, index) => (
                  <div key={`phone-${index}`} className="flex items-center space-x-2">
                    <select
                      value={phone.type}
                      onChange={(e) => handlePhoneChange(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-1/4"
                    >
                      <option value="mobile">Mobile</option>
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phone.value}
                      onChange={(e) => handlePhoneChange(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.phoneNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhone(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Organization Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Organization</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    id="orgName"
                    value={formData.organization.name}
                    onChange={(e) => handleChange('organization', { ...formData.organization, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.organization.title}
                      onChange={(e) => handleChange('organization', { ...formData.organization, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      id="department"
                      value={formData.organization.department}
                      onChange={(e) => handleChange('organization', { ...formData.organization, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Address</h3>
              <div className="flex items-start space-x-2">
                <select
                  value={formData.address.type}
                  onChange={(e) => handleChange('address', { ...formData.address, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-1/4"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  value={formData.address.value}
                  onChange={(e) => handleChange('address', { ...formData.address, value: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>
            </div>

            {/* Birthday */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Birthday</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    id="month"
                    value={formData.birthday.month}
                    onChange={(e) => handleChange('birthday', { ...formData.birthday, month: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">
                    Day
                  </label>
                  <input
                    type="number"
                    id="day"
                    min="1"
                    max="31"
                    value={formData.birthday.day}
                    onChange={(e) => handleChange('birthday', { ...formData.birthday, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                    Year (optional)
                  </label>
                  <input
                    type="number"
                    id="year"
                    min="1900"
                    max="2100"
                    value={formData.birthday.year}
                    onChange={(e) => handleChange('birthday', { ...formData.birthday, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
          </div>
        </form>

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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Contact'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateContactForm;