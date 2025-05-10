import React, { useState } from 'react';
import ContactSearchComponent from './ContactSearchComponent';
import { PersonType } from '../../contacts';

interface CreateGroupComponentProps {
    accountId: string;
    onClose: () => void;
    onCreateGroup: (groupName: string, participants: any[]) => Promise<void>;
}

const CreateGroupComponent: React.FC<CreateGroupComponentProps> = ({
    accountId,
    onClose,
    onCreateGroup
}) => {
    const [groupName, setGroupName] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<PersonType[]>([]);

    // Toggle contact selection for group creation
    const toggleContactSelection = (contact: PersonType) => {
        if (selectedContacts.some(c => c.resourceName === contact.resourceName)) {
            setSelectedContacts(selectedContacts.filter(c => c.resourceName !== contact.resourceName));
        } else {
            setSelectedContacts([...selectedContacts, contact]);
        }
    };

    // Handle creating the group
    const handleCreateGroup = async () => {
        await onCreateGroup(groupName, selectedContacts);
        resetForm();
    };

    // Reset the form
    const resetForm = () => {
        setGroupName('');
        setSelectedContacts([]);
    };

    return (
        <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                        <div className="mt-3 text-center sm:mt-0 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Create New Group
                            </h3>
                            <div className="mt-4">
                                <label htmlFor="group-name" className="block text-sm font-medium text-gray-700">
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    id="group-name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Enter group name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                />
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Add Participants
                                </label>

                                {/* Selected contacts display */}
                                {selectedContacts.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedContacts.map(contact => {
                                            const name = contact.names && contact.names[0]?.displayName || 'Unnamed Contact';

                                            return (
                                                <div
                                                    key={contact.resourceName}
                                                    className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded flex items-center"
                                                >
                                                    <span>{name}</span>
                                                    <button
                                                        type="button"
                                                        className="ml-1.5 text-blue-400 hover:text-blue-600"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleContactSelection(contact);
                                                        }}
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Contact search component (embedded) */}
                                <div className="mt-3">
                                    <ContactSearchComponent
                                        accountId={accountId}
                                        isEmbedded={true}
                                        selectedContacts={selectedContacts}
                                        onSelectContact={toggleContactSelection}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                            type="button"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:col-start-2 sm:text-sm ${!groupName.trim() || selectedContacts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || selectedContacts.length === 0}
                        >
                            Create Group
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupComponent;