import React, { useState, useEffect } from 'react';
import { PersonType, useContacts } from '../../contacts';
import { GooglePermissionRequest, useGooglePermissions } from '../../user_account';

interface ContactSearchComponentProps {
    accountId: string;
    onClose?: () => void;
    onSelectContact: (contact: PersonType) => void;
    isEmbedded?: boolean;
    selectedContacts?: PersonType[];
}

const ContactSearchComponent: React.FC<ContactSearchComponentProps> = ({
    accountId,
    onClose,
    onSelectContact,
    isEmbedded = false,
    selectedContacts = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PersonType[]>([]);

    // Use Google permissions hook
    const {
        hasRequiredPermission,
        permissionsLoading,
        permissionError,
        checkAllServicePermissions,
    } = useGooglePermissions();

    // Use contacts hook
    const {
        loading,
        searchContacts
    } = useContacts(accountId);

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
    };

    // Effect to perform search when query changes
    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.trim().length >= 2 && hasRequiredPermission(accountId, 'people', 'full')) {
                const result = await searchContacts(searchQuery, {
                    pageSize: 10,
                    readMask: 'names,emailAddresses,phoneNumbers,photos'
                });

                if (result) {
                    setSearchResults(result.contacts);
                } else {
                    setSearchResults([]);
                }
            } else {
                setSearchResults([]);
            }
        };

        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, hasRequiredPermission, accountId, searchContacts]);

    // Check if a contact is already selected (for group creation)
    const isContactSelected = (contact: PersonType) => {
        return selectedContacts.some(c => c.resourceName === contact.resourceName);
    };

    if (!hasRequiredPermission(accountId, "people", "full")) {
        return (
            <GooglePermissionRequest
                serviceType="people"
                requiredScopes={['full']}
                loading={permissionsLoading}
                error={permissionError}
                onRequestPermission={() => checkAllServicePermissions(accountId, 'people', true)}
                // Optional custom messaging
                title="People Access Required"
                description="To access your contacts, we need your permission to access your Google Contacts."
            />
        );
    }

    if (isEmbedded) {
        return (
            <div>
                <input
                    type="text"
                    placeholder="Search contacts by name or email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />

                <div className="mt-4 max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                            {searchQuery.length >= 2 ? 'No contacts found' : 'Enter at least 2 characters to search'}
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {searchResults.map((contact) => {
                                const name = contact.names && contact.names[0]?.displayName || 'Unnamed Contact';
                                const email = contact.emailAddresses && contact.emailAddresses[0]?.value || '';
                                const isSelected = isContactSelected(contact);

                                return (
                                    <li
                                        key={contact.resourceName}
                                        className={`py-3 flex items-center hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                                        onClick={() => onSelectContact(contact)}
                                    >
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            {contact.photos && contact.photos[0]?.url ? (
                                                <img src={contact.photos[0].url} alt={name} className="h-10 w-10 rounded-full" />
                                            ) : (
                                                <span className="text-lg font-medium text-gray-500">
                                                    {name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-medium text-gray-900">{name}</p>
                                            {email && <p className="text-sm text-gray-500">{email}</p>}
                                        </div>
                                        {isSelected && (
                                            <div className="flex-shrink-0 text-blue-500">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        );
    }

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
                                New Conversation
                            </h3>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    placeholder="Search contacts by name or email..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                />
                            </div>

                            <div className="mt-4 max-h-60 overflow-y-auto">
                                {loading ? (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">
                                        {searchQuery.length >= 2 ? 'No contacts found' : 'Enter at least 2 characters to search'}
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {searchResults.map((contact) => {
                                            const name = contact.names && contact.names[0]?.displayName || 'Unnamed Contact';
                                            const email = contact.emailAddresses && contact.emailAddresses[0]?.value || '';

                                            return (
                                                <li
                                                    key={contact.resourceName}
                                                    className="py-3 flex items-center hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => onSelectContact(contact)}
                                                >
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        {contact.photos && contact.photos[0]?.url ? (
                                                            <img src={contact.photos[0].url} alt={name} className="h-10 w-10 rounded-full" />
                                                        ) : (
                                                            <span className="text-lg font-medium text-gray-500">
                                                                {name.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">{name}</p>
                                                        {email && <p className="text-sm text-gray-500">{email}</p>}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-200 text-base font-medium text-gray-700 hover:bg-gray-300 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactSearchComponent;