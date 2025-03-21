import React, { useState, useEffect } from 'react';
import { Users, Plus, Folder, Settings, ChevronRight, Loader2 } from 'lucide-react';
import CreateGroupForm from './CreateGroupForms';

interface ContactGroup {
  resourceName: string;
  etag: string;
  groupType: string;
  name: string;
  formattedName: string;
  description?: string;
  memberCount: number;
  memberResourceNames?: string[];
}

interface GroupViewProps {
  accountId: string;
  onGroupSelect?: (group: ContactGroup) => void;
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
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Fetch groups when component mounts
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/accounts/${accountId}/contactGroups`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contact groups');
      }
      
      const data = await response.json();
      setGroups(data.contactGroups || []);
    } catch (err) {
      console.error('Error fetching contact groups:', err);
      setError('Failed to load contact groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = (newGroup: ContactGroup) => {
    setGroups(prevGroups => [newGroup, ...prevGroups]);
    fetchGroups(); // Refresh the list to ensure consistency
  };

  const handleGroupClick = (group: ContactGroup) => {
    setSelectedGroupId(group.resourceName);
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
        <button
          onClick={onCreateGroupClick}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          title="Create new group"
        >
          <Plus size={18} />
        </button>
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
              onClick={fetchGroups}
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
                          {group.memberCount > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({group.memberCount} {group.memberCount === 1 ? 'contact' : 'contacts'})
                            </span>
                          )}
                          {group.description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{group.description}</p>
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