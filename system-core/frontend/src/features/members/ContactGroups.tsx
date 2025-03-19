// src/features/default/members/ContactGroups.tsx
import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';

interface ContactGroup {
  resourceName: string;
  id: string;
  name: string;
  memberCount: number;
  etag?: string;
}

interface ContactGroupsProps {
  accountId: string;
  onSelectGroup?: (groupId: string) => void;
}

const ContactGroups: React.FC<ContactGroupsProps> = ({ accountId, onSelectGroup }) => {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [isEditingGroup, setIsEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState<string>('');

  // Base API URL
  const apiBaseUrl = '/api/google/people';

  // Fetch contact groups
  const fetchGroups = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiBaseUrl}/contactGroups`, {
        params: { accountId }
      });
      
      if (response.data && response.data.groups) {
        // Process the groups
        const transformedGroups = response.data.groups.map((group: any) => ({
          resourceName: group.resourceName,
          id: group.resourceName.split('/').pop(),
          name: group.name,
          memberCount: group.memberCount || 0,
          etag: group.etag
        })).filter((group: ContactGroup) => !group.name.startsWith('system:'));
        
        setGroups(transformedGroups);
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error('Error fetching contact groups:', err);
      setError('Failed to load contact groups');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new contact group
  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/contactGroups`, 
        { name: newGroupName.trim() },
        { params: { accountId } }
      );
      
      if (response.data && response.data.group) {
        // Add new group to the list
        const newGroup = {
          resourceName: response.data.group.resourceName,
          id: response.data.group.resourceName.split('/').pop(),
          name: response.data.group.name,
          memberCount: 0,
          etag: response.data.group.etag
        };
        
        setGroups(prevGroups => [...prevGroups, newGroup]);
        setNewGroupName('');
        setIsCreatingGroup(false);
      }
    } catch (err) {
      console.error('Error creating contact group:', err);
      setError('Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  // Update a contact group
  const updateGroup = async (resourceName: string) => {
    if (!editGroupName.trim() || !resourceName) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const group = groups.find(g => g.resourceName === resourceName);
      
      const response = await axios.put(
        `${apiBaseUrl}/contactGroups/${resourceName}`,
        { 
          name: editGroupName.trim(),
          etag: group?.etag 
        },
        { params: { accountId } }
      );
      
      if (response.data && response.data.group) {
        // Update group in the list
        setGroups(prevGroups => prevGroups.map(group => 
          group.resourceName === resourceName 
            ? { 
                ...group, 
                name: response.data.group.name,
                etag: response.data.group.etag 
              } 
            : group
        ));
        
        setIsEditingGroup(null);
        setEditGroupName('');
      }
    } catch (err) {
      console.error('Error updating contact group:', err);
      setError('Failed to update group');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a contact group
  const deleteGroup = async (resourceName: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${apiBaseUrl}/contactGroups/${resourceName}`, {
        params: { 
          accountId,
          deleteContacts: false // Don't delete contacts when deleting a group
        }
      });
      
      // Remove group from the list
      setGroups(prevGroups => prevGroups.filter(group => group.resourceName !== resourceName));
      
      if (selectedGroupId === resourceName.split('/').pop()) {
        setSelectedGroupId(null);
      }
    } catch (err) {
      console.error('Error deleting contact group:', err);
      setError('Failed to delete group');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle group selection
  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (onSelectGroup) {
      onSelectGroup(groupId);
    }
  };

  // Load groups on mount
  useEffect(() => {
    if (accountId) {
      fetchGroups();
    }
  }, [accountId]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Contact Groups</h3>
        <button
          className="text-blue-500 flex items-center text-sm"
          onClick={() => setIsCreatingGroup(true)}
          disabled={isCreatingGroup || isLoading}
        >
          <Plus size={16} className="mr-1" />
          New Group
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* Create group form */}
      {isCreatingGroup && (
        <div className="border rounded-md p-3 mb-4">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            className="w-full p-2 border rounded-md mb-2"
          />
          <div className="flex justify-end space-x-2">
            <button
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm"
              onClick={() => {
                setIsCreatingGroup(false);
                setNewGroupName('');
              }}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
              onClick={createGroup}
              disabled={!newGroupName.trim() || isLoading}
            >
              Create
            </button>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && !groups.length && (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      )}
      
      {/* Group list */}
      <div className="border rounded-md overflow-hidden">
        {groups.length === 0 && !isLoading ? (
          <div className="p-4 text-center text-gray-500">
            No contact groups found
          </div>
        ) : (
          <ul className="divide-y">
            {groups.map(group => (
              <li key={group.resourceName} className="p-2">
                {isEditingGroup === group.resourceName ? (
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      className="flex-1 p-1 border rounded mr-2"
                    />
                    <div className="flex space-x-1">
                      <button
                        className="p-1 text-gray-500 hover:text-gray-700"
                        onClick={() => {
                          setIsEditingGroup(null);
                          setEditGroupName('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="p-1 text-blue-500 hover:text-blue-700"
                        onClick={() => updateGroup(group.resourceName)}
                        disabled={!editGroupName.trim() || isLoading}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <button
                      className={`flex items-center flex-1 ${
                        selectedGroupId === group.id ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                      onClick={() => handleSelectGroup(group.id)}
                    >
                      <Users size={16} className="mr-2 text-gray-400" />
                      <span className="flex-1 truncate">{group.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {group.memberCount} {group.memberCount === 1 ? 'contact' : 'contacts'}
                      </span>
                    </button>
                    <div className="flex space-x-1 ml-2">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-700"
                        onClick={() => {
                          setIsEditingGroup(group.resourceName);
                          setEditGroupName(group.name);
                        }}
                        title="Edit group"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600"
                        onClick={() => deleteGroup(group.resourceName)}
                        title="Delete group"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Refresh button */}
      <div className="mt-4">
        <button
          className="w-full py-2 text-blue-500 text-sm border border-blue-500 rounded-md hover:bg-blue-50"
          onClick={fetchGroups}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Groups'}
        </button>
      </div>
    </div>
  );
};

export default ContactGroups;