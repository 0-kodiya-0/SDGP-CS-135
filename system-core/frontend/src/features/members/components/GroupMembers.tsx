// components/GroupMembers.tsx
import React, { useState, useEffect } from 'react';
import { useContacts, useContactGroups } from '../hooks/useGoogleContacts';
import { PersonType, ContactGroupType } from '../types/people.types';
import ContactSearch from './ContactSearch';

interface GroupMembersProps {
  accountId: string;
  groupId: string;
  onClose: () => void;
}

const GroupMembers: React.FC<GroupMembersProps> = ({ accountId, groupId, onClose }) => {
  const { fetchContactGroup, addContactsToGroup, removeContactsFromGroup } = useContactGroups(accountId);
  const { fetchContact } = useContacts(accountId);
  
  const [group, setGroup] = useState<ContactGroupType | null>(null);
  const [members, setMembers] = useState<PersonType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [processingMember, setProcessingMember] = useState<string | null>(null);

  useEffect(() => {
    loadGroupAndMembers();
  }, [groupId]);

  const loadGroupAndMembers = async () => {
    setIsLoading(true);
    try {
      const groupData = await fetchContactGroup(groupId);
      setGroup(groupData);
      
      // If the group has members, fetch each member's details
      if (groupData.memberResourceNames && groupData.memberResourceNames.length > 0) {
        const membersData = await Promise.all(
          groupData.memberResourceNames.map(resourceName => 
            fetchContact(resourceName, { personFields: 'names,emailAddresses,phoneNumbers,photos' })
          )
        );
        setMembers(membersData);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
      setError('Failed to load group members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (contact: PersonType) => {
    if (!contact.resourceName || !group?.resourceName) return;
    
    setProcessingMember(contact.resourceName);
    try {
      await addContactsToGroup(group.resourceName, [contact.resourceName]);
      await loadGroupAndMembers();
      setShowAddMember(false);
    } catch (error) {
      console.error('Error adding member to group:', error);
      setError('Failed to add contact to group. Please try again.');
    } finally {
      setProcessingMember(null);
    }
  };

  const handleRemoveMember = async (contact: PersonType) => {
    if (!contact.resourceName || !group?.resourceName) return;
    
    setProcessingMember(contact.resourceName);
    try {
      await removeContactsFromGroup(group.resourceName, [contact.resourceName]);
      // Update the local state to remove the member
      setMembers(members.filter(member => member.resourceName !== contact.resourceName));
    } catch (error) {
      console.error('Error removing member from group:', error);
      setError('Failed to remove contact from group. Please try again.');
    } finally {
      setProcessingMember(null);
    }
  };

  // Helper function to get primary display name
  const getDisplayName = (contact: PersonType): string => {
    if (!contact.names || contact.names.length === 0) {
      return 'Unnamed Contact';
    }
    
    // Try to find the primary name first
    const primaryName = contact.names.find(name => name.metadata?.primary);
    if (primaryName?.displayName) {
      return primaryName.displayName;
    }
    
    // Fallback to the first name in the array
    return contact.names[0].displayName || 'Unnamed Contact';
  };

  // Helper function to get primary email
  const getPrimaryEmail = (contact: PersonType): string => {
    if (!contact.emailAddresses || contact.emailAddresses.length === 0) {
      return 'No email';
    }
    
    // Try to find the primary email first
    const primaryEmail = contact.emailAddresses.find(email => email.metadata?.primary);
    if (primaryEmail?.value) {
      return primaryEmail.value;
    }
    
    // Fallback to the first email in the array
    return contact.emailAddresses[0].value || 'No email';
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Loading group members...</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Group Members</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadGroupAndMembers}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {group?.name || 'Group'} - Members ({members.length})
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
        >
          Close
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {showAddMember ? 'Cancel' : 'Add Members'}
        </button>
      </div>

      {showAddMember && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Search Contacts to Add</h3>
          <ContactSearch 
            accountId={accountId} 
            onContactSelect={handleAddMember} 
          />
        </div>
      )}

      {members.length === 0 ? (
        <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
          This group has no members. Use the "Add Members" button to add contacts to this group.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {members.map((member) => (
              <li 
                key={member.resourceName} 
                className="p-4 hover:bg-gray-50 flex justify-between items-center"
              >
                <div className="flex items-center space-x-3">
                  {member.photos && member.photos.length > 0 && member.photos[0].url ? (
                    <img 
                      src={member.photos[0].url} 
                      alt={getDisplayName(member)} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                      {getDisplayName(member).charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{getDisplayName(member)}</div>
                    <div className="text-sm text-gray-500">{getPrimaryEmail(member)}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                  disabled={processingMember === member.resourceName}
                >
                  {processingMember === member.resourceName ? 'Removing...' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GroupMembers;