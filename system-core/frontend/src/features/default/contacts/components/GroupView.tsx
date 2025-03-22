import React, { useState, useEffect } from 'react';
import { Users, Plus, Folder, Settings, ChevronRight, Loader2 } from 'lucide-react';
import CreateGroupForm from './CreateGroupForms';
import { useContactGroups } from '../hooks/useContactGroups.google';
import { ContactGroupType } from '../types/types.data';

interface GroupViewProps {
  accountId: string;
  onGroupSelect: (group: ContactGroupType) => void;
  onCreateGroupClick: () => void;
  isCreateGroupModalOpen: boolean;
  onCloseCreateGroupModal: () => void;
}

const GroupView: React.FC<GroupViewProps> = ({ 
  accountId, 
  onGroupSelect,
  onCreateGroupClick,
  isCreateGroupModalOpen,
  onCloseCreateGroupModal
}) => {
  // Use the useContactGroups hook instead of managing state locally
  const {
    groups,
    loading,
    error,
    fetchGroups
  } = useContactGroups(accountId);
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Fetch groups when component mounts
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupCreated = () => {
    // Refresh groups after a new group is created
    fetchGroups();
  };

  const handleGroupClick = (group: ContactGroupType) => {
    setSelectedGroupId(group.resourceName || null);
    if (onGroupSelect) {
      onGroupSelect(group);
    }
  };

  // For system groups (like "My Contacts", "Family", etc.)
  const systemGroups = [
    { id: 'myContacts', name: 'My Contacts', icon: <Users size={16} /> },
    { id: 'starred', name: 'Starred', icon: <Folder size={16} /> },
    { id: 'frequentlyContacted', name: 'Frequently contacted', icon: <Folder size={16} /> },
    { id: 'otherContacts', name: 'Other contacts', icon: <Folder size={16} /> }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Create Group Modal */}
      {isCreateGroupModalOpen && (
        <CreateGroupForm
          accountId={accountId}
          isOpen={isCreateGroupModalOpen}
          onClose={onCloseCreateGroupModal}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {/* Header with create group button */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Contact Groups</h3>

      </div>

      {/* Groups list - scrollable section */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-500 text-center">
            <p>{error}</p>
            <button 
              onClick={() => fetchGroups()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div>
            {/* System Groups */}
            <div className="pt-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                System Groups
              </div>
              <div className="divide-y divide-gray-100">
                {systemGroups.map((group) => (
                  <div
                    key={group.id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                    onClick={() => console.log(`Selected system group: ${group.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-400">{group.icon}</div>
                      <span className="text-sm text-gray-700">{group.name}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* User Created Groups */}
            {groups.length > 0 && (
              <div className="pt-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Groups
                </div>
                <div className="divide-y divide-gray-100">
                  {groups.map((group) => (
                    <div
                      key={group.resourceName}
                      className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                        selectedGroupId === group.resourceName ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleGroupClick(group)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-400">
                          <Users size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">{group.formattedName || group.name}</span>
                          {group.memberCount && group.memberCount > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({group.memberCount} {group.memberCount === 1 ? 'contact' : 'contacts'})
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when no user groups exist */}
            {groups.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 my-6">
                <div className="bg-gray-100 rounded-full p-3 mb-4">
                  <Users size={24} className="text-gray-400" />
                </div>
                <h4 className="text-gray-700 font-medium mb-1">No custom groups yet</h4>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Create groups to organize your contacts
                </p>
                <button
                  onClick={onCreateGroupClick}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus size={16} className="inline mr-1" /> Create Group
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings button at bottom */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => console.log('Group settings clicked')}
          className="w-full py-2 px-4 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium flex items-center justify-center"
        >
          <Settings size={14} className="mr-2" /> Group Settings
        </button>
      </div>
    </div>
  );
};

export default GroupView;