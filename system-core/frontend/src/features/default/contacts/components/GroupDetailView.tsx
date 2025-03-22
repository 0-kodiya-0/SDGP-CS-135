import React, { useState, useEffect } from 'react';
import { User, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { useContacts } from '../hooks/useContacts.google';
import { useContactGroups } from '../hooks/useContactGroups.google';
import { PersonType, ContactGroupType } from '../types/types.data';

interface GroupDetailViewProps {
  group: ContactGroupType;
  accountId: string;
  onRefresh?: () => void;
}

const GroupDetailView: React.FC<GroupDetailViewProps> = ({ 
  group, 
  accountId,
  onRefresh 
}) => {
  const { contacts, fetchContacts } = useContacts(accountId);
  const { 
    addContactsToGroup, 
    removeContactsFromGroup,
    getGroup,
    loading,
    error
  } = useContactGroups(accountId);
  
  const [groupMembers, setGroupMembers] = useState<PersonType[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch contacts when component mounts
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Fetch group details to get updated member list
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (group.resourceName) {
        const updatedGroup = await getGroup(group.resourceName);
        if (updatedGroup && updatedGroup.memberResourceNames) {
          // Filter contacts to find group members
          const members = contacts.filter(contact => 
            contact.resourceName && updatedGroup.memberResourceNames?.includes(contact.resourceName)
          );
          setGroupMembers(members);
        }
      }
    };

    fetchGroupDetails();
  }, [group, contacts, getGroup, refreshKey]);

  const handleAddMembersClick = () => {
    setIsAddingMembers(true);
    setSelectedContacts([]);
  };

  const handleContactSelect = (contactResourceName: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactResourceName)) {
        return prev.filter(id => id !== contactResourceName);
      } else {
        return [...prev, contactResourceName];
      }
    });
  };

  const handleAddMembersConfirm = async () => {
    if (!group.resourceName || selectedContacts.length === 0) return;

    try {
      await addContactsToGroup(group.resourceName, selectedContacts);
      setIsAddingMembers(false);
      setSelectedContacts([]);
      setRefreshKey(prev => prev + 1);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error adding members to group:", error);
    }
  };

  const handleRemoveMember = async (contactResourceName: string) => {
    if (!group.resourceName) return;

    try {
      await removeContactsFromGroup(group.resourceName, [contactResourceName]);
      setRefreshKey(prev => prev + 1);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error removing member from group:", error);
    }
  };

  // Filter out contacts that are already members
  const availableContacts = contacts.filter(contact => 
    contact.resourceName && !groupMembers.some(member => 
      member.resourceName === contact.resourceName
    )
  );

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Group: {group.name || group.formattedName || "Unnamed Group"}
        </h2>
        <button
          onClick={handleAddMembersClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <UserPlus size={16} />
          Add Members
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Group stats */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-700">
          {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'} in this group
        </p>
      </div>

      {/* Member listing */}
      {!isAddingMembers ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Group Members</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading members...</p>
            </div>
          ) : groupMembers.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <User size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No members in this group</p>
              <p className="text-sm text-gray-400 mt-1">Add members to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupMembers.map(member => (
                <div key={member.resourceName} className="border border-gray-200 rounded-lg p-4 flex items-start">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 overflow-hidden flex-shrink-0">
                    {member.photos && member.photos[0]?.url ? (
                      <img
                        src={member.photos[0].url}
                        alt={member.names?.[0]?.displayName || 'Contact'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={18} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {member.names?.[0]?.displayName || 'Unnamed Contact'}
                    </h4>
                    {member.emailAddresses && member.emailAddresses.length > 0 && (
                      <p className="text-sm text-gray-500 truncate">
                        {member.emailAddresses[0].value}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => member.resourceName && handleRemoveMember(member.resourceName)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove from group"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Add Members to Group</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingMembers(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembersConfirm}
                disabled={selectedContacts.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Selected ({selectedContacts.length})
              </button>
            </div>
          </div>

          {availableContacts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No contacts available to add</p>
              <p className="text-sm text-gray-400 mt-1">All your contacts are already in this group</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {availableContacts.map(contact => (
                <div 
                  key={contact.resourceName}
                  className={`p-4 flex items-center cursor-pointer hover:bg-gray-50 ${
                    contact.resourceName && selectedContacts.includes(contact.resourceName) 
                      ? 'bg-blue-50' 
                      : ''
                  }`}
                  onClick={() => contact.resourceName && handleContactSelect(contact.resourceName)}
                >
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 overflow-hidden">
                    {contact.photos && contact.photos[0]?.url ? (
                      <img
                        src={contact.photos[0].url}
                        alt={contact.names?.[0]?.displayName || 'Contact'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={18} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {contact.names?.[0]?.displayName || 'Unnamed Contact'}
                    </h4>
                    {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                      <p className="text-sm text-gray-500 truncate">
                        {contact.emailAddresses[0].value}
                      </p>
                    )}
                  </div>
                  <div className={`h-5 w-5 rounded border ${
                    contact.resourceName && selectedContacts.includes(contact.resourceName)
                      ? 'bg-blue-600 border-blue-600 flex items-center justify-center'
                      : 'border-gray-300'
                  }`}>
                    {contact.resourceName && selectedContacts.includes(contact.resourceName) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupDetailView;