// components/ContactGroups.tsx
import React, { useEffect, useState } from 'react';
import { useContactGroups } from '../hooks/useGoogleContacts';
import { ContactGroupType } from '../types/people.types';

interface ContactGroupsProps {
  accountId: string;
  onViewMembers?: (groupId: string) => void;
}

const ContactGroups: React.FC<ContactGroupsProps> = ({ accountId, onViewMembers }) => {
  const {
    groups,
    isLoadingGroups,
    groupsError,
    fetchContactGroups,
    createContactGroup,
    deleteContactGroup
  } = useContactGroups(accountId);

  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchContactGroups();
  }, [fetchContactGroups]);

  const handleDeleteGroup = async (resourceName: string) => {
    if (!window.confirm('Are you sure you want to delete this group?')) {
      return;
    }
    
    setIsDeleting((prev) => ({ ...prev, [resourceName]: true }));
    try {
      await deleteContactGroup(resourceName);
      // Refresh the groups list
      fetchContactGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    } finally {
      setIsDeleting((prev) => ({ ...prev, [resourceName]: false }));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setCreateError('Group name is required');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      await createContactGroup({ name: newGroupName });
      setNewGroupName('');
      setShowCreateForm(false);
      fetchContactGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      setCreateError('Failed to create group. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  if (isLoadingGroups) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (groupsError) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4 text-red-600">Error loading contact groups: {groupsError.message}</div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={() => fetchContactGroups()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contact Groups</h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Group'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">Create New Group</h2>
          {createError && (
            <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreateGroup} className="flex items-center space-x-3">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={createLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={createLoading}
            >
              {createLoading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {!groups || !groups.items || groups.items.length === 0 ? (
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500">No contact groups found</p>
          <p className="mt-2 text-sm text-gray-400">Use the "Create Group" button to create your first contact group</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.items.map((group) => (
            <div key={group.resourceName} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{group.name}</h2>
                  <p className="text-gray-600 mt-1">
                    {group.memberCount ? `${group.memberCount} contacts` : 'No contacts'}
                  </p>
                </div>
                
                {/* Group icon or indicator */}
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
              
              <div className="flex mt-4 space-x-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => onViewMembers && group.resourceName && onViewMembers(group.resourceName)}
                >
                  View Members
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
                  onClick={() => group.resourceName && handleDeleteGroup(group.resourceName)}
                  disabled={isDeleting[group.resourceName || '']}
                >
                  {isDeleting[group.resourceName || ''] ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {groups && groups.nextPageToken && (
        <div className="mt-6 text-center">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => fetchContactGroups({ pageToken: groups.nextPageToken })}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactGroups;