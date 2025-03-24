// CreateCalendarView.tsx
import React, { useState } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useCalendarList } from '../hooks/useCalendarList.google';
import { useTabStore } from '../../../required/tab_view';
import { COMMON_TIMEZONES } from '../../chat';
import { CreateCalendarParams } from '../types/types.google.api';

interface CreateCalendarViewProps {
  accountId: string;
}

const CreateCalendarView: React.FC<CreateCalendarViewProps> = ({ accountId }) => {
  const [formData, setFormData] = useState<CreateCalendarParams>({
    summary: '',
    description: '',
    location: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track success state
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { createCalendar, loading: loadingCalendars } = useCalendarList(accountId);
  const { closeTab } = useTabStore();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const newCalendar = await createCalendar(formData);
      if (newCalendar) {
        // Indicate success
        setSaveSuccess(true);

        // Optionally close the tab after a short delay
        setTimeout(() => closeTab('current'), 2000);
      } else {
        setError('Failed to create calendar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // If save was successful, show a success message and close after 2 seconds
  if (saveSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-green-500 text-lg mb-4">Calendar successfully created!</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <button
            onClick={() => closeTab('current')}
            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded mr-2"
            title="Cancel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-medium">Create New Calendar</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => closeTab('current')}
            className="flex items-center px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loadingCalendars}
            className={`flex items-center px-3 py-1 text-sm text-white rounded ${
              saving || loadingCalendars
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            <Save className="w-4 h-4 mr-1" />
            {saving || loadingCalendars ? 'Saving...' : 'Save Calendar'}
          </button>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {/* Calendar Summary */}
            <div className="mb-6">
              <label
                htmlFor="summary"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Calendar Summary*
              </label>
              <input
                type="text"
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter calendar name"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>

            {/* Location */}
            <div className="mb-6">
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter location (optional)"
              />
            </div>

            {/* Time Zone */}
            <div className="mb-6">
              <label
                htmlFor="timeZone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Time Zone
              </label>
              <select
                id="timeZone"
                name="timeZone"
                value={formData.timeZone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCalendarView;
