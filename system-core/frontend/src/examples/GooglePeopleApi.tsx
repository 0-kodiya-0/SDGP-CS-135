import { useEffect, useState } from "react";
import {
    useContacts,
    PersonType,
    SimpleContactInput,
    simpleContactToApi,
    useContactGroups,
    ContactGroupType
} from "../features/default/contacts";
import { useAccount, useAuth } from "../features/default/user_account";

interface ContactsListProps {
    accountId: string;
    onEditContact?: (contact: PersonType) => void;
}

const ContactsList: React.FC<ContactsListProps> = ({ accountId, onEditContact }) => {
    const {
        contacts,
        loading,
        error,
        nextPageToken,
        fetchContacts,
        deleteContact
    } = useContacts(accountId);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const handleLoadMore = () => {
        if (nextPageToken) {
            fetchContacts({ pageToken: nextPageToken });
        }
    };

    const handleDeleteContact = async (resourceName: string) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            const success = await deleteContact(resourceName);
            if (success) {
                fetchContacts();
            }
        }
    };

    if (loading && contacts.length === 0) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Contacts</h2>

            {contacts.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No contacts found.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contacts.map((contact: PersonType) => (
                            <div key={contact.resourceName} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center transition-all hover:shadow-md">
                                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mb-2 overflow-hidden">
                                    {contact.photos && contact.photos[0]?.url ? (
                                        <img
                                            src={contact.photos[0].url}
                                            alt={contact.names?.[0]?.displayName || 'Contact'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>

                                <div className="text-center mb-3 flex-1">
                                    <h3 className="font-semibold text-gray-800">
                                        {contact.names?.[0]?.displayName || 'Unnamed Contact'}
                                    </h3>
                                    {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-1">{contact.emailAddresses[0].value}</p>
                                    )}
                                    {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-1">{contact.phoneNumbers[0].value}</p>
                                    )}
                                </div>

                                <div className="flex justify-center gap-2 w-full">
                                    {onEditContact && (
                                        <button
                                            onClick={() => onEditContact(contact)}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteContact(contact.resourceName!)}
                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {nextPageToken && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {loading ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

interface ContactFormProps {
    accountId: string;
    contactToEdit?: PersonType;
    onSuccess?: (contact: PersonType) => void;
    onCancel?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({
    accountId,
    contactToEdit,
    onSuccess,
    onCancel
}) => {
    const { createContact, updateContact, loading, error } = useContacts(accountId);
    const [formValues, setFormValues] = useState<SimpleContactInput>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        address: '',
        notes: ''
    });

    useEffect(() => {
        if (contactToEdit) {
            setFormValues({
                firstName: contactToEdit.names?.[0]?.givenName || '',
                lastName: contactToEdit.names?.[0]?.familyName || '',
                email: contactToEdit.emailAddresses?.[0]?.value || '',
                phone: contactToEdit.phoneNumbers?.[0]?.value || '',
                company: contactToEdit.organizations?.[0]?.name || '',
                jobTitle: contactToEdit.organizations?.[0]?.title || '',
                address: contactToEdit.addresses?.[0]?.formattedValue || '',
                notes: contactToEdit.biographies?.[0]?.value || ''
            });
        }
    }, [contactToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const contactData = simpleContactToApi(formValues);
            let result: PersonType | null;

            if (contactToEdit) {
                result = await updateContact(
                    contactToEdit.resourceName!,
                    {
                        ...contactData,
                        etag: contactToEdit.etag
                    }
                );
            } else {
                result = await createContact(contactData);
            }

            if (result && onSuccess) {
                onSuccess(result);
            }
        } catch (err) {
            console.error('Error saving contact:', err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-800">{contactToEdit ? 'Edit Contact' : 'Create New Contact'}</h2>

            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-md">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formValues.firstName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formValues.lastName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formValues.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formValues.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            value={formValues.company}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                        <input
                            type="text"
                            id="jobTitle"
                            name="jobTitle"
                            value={formValues.jobTitle}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={formValues.address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formValues.notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {loading ? 'Saving...' : (contactToEdit ? 'Update Contact' : 'Create Contact')}
                </button>
            </div>
        </form>
    );
};

interface ContactGroupsProps {
    accountId: string;
}

const ContactGroups: React.FC<ContactGroupsProps> = ({ accountId }) => {
    const {
        groups,
        loading,
        error,
        fetchGroups,
        createGroup,
        deleteGroup,
        addContactsToGroup,
        removeContactsFromGroup
    } = useContactGroups(accountId);

    const { contacts, fetchContacts } = useContacts(accountId);
    const [selectedGroup, setSelectedGroup] = useState<ContactGroupType | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

    useEffect(() => {
        fetchGroups();
        fetchContacts();
    }, [fetchGroups, fetchContacts]);

    const handleGroupSelect = (group: ContactGroupType) => {
        setSelectedGroup(group);
        setSelectedContacts([]);
    };

    const handleContactSelect = (resourceName: string) => {
        setSelectedContacts(prev => {
            if (prev.includes(resourceName)) {
                return prev.filter(name => name !== resourceName);
            } else {
                return [...prev, resourceName];
            }
        });
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        const result = await createGroup(newGroupName);
        if (result) {
            setNewGroupName('');
            fetchGroups();
        }
    };

    const handleDeleteGroup = async (resourceName: string) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            const success = await deleteGroup(resourceName);
            if (success) {
                if (selectedGroup?.resourceName === resourceName) {
                    setSelectedGroup(null);
                }
                fetchGroups();
            }
        }
    };

    const handleAddToGroup = async () => {
        if (!selectedGroup || selectedContacts.length === 0) return;

        const result = await addContactsToGroup(
            selectedGroup.resourceName!,
            selectedContacts
        );

        if (result) {
            setSelectedContacts([]);
            fetchGroups();
        }
    };

    const handleRemoveFromGroup = async () => {
        if (!selectedGroup || selectedContacts.length === 0) return;

        const result = await removeContactsFromGroup(
            selectedGroup.resourceName!,
            selectedContacts
        );

        if (result) {
            setSelectedContacts([]);
            fetchGroups();
        }
    };

    const isContactInSelectedGroup = (contactResourceName: string): boolean => {
        if (!selectedGroup?.memberResourceNames) return false;
        return selectedGroup.memberResourceNames.includes(contactResourceName);
    };

    if (loading && groups.length === 0) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Groups</h3>

                    <form onSubmit={handleCreateGroup} className="mb-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="New group name"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            <button
                                type="submit"
                                disabled={loading || !newGroupName.trim()}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Create
                            </button>
                        </div>
                    </form>

                    <div className="space-y-2">
                        {groups.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <p className="text-gray-500">No groups found</p>
                            </div>
                        ) : (
                            groups.map((group) => (
                                <div
                                    key={group.resourceName}
                                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedGroup?.resourceName === group.resourceName
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    onClick={() => handleGroupSelect(group)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-gray-800">{group.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {group.memberCount || 0} {group.memberCount === 1 ? 'contact' : 'contacts'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteGroup(group.resourceName!);
                                            }}
                                            className="text-red-600 hover:text-red-800 focus:outline-none"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full md:w-2/3">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Contacts</h3>

                    {selectedGroup && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <span className="text-gray-700">Selected Group: </span>
                                    <span className="font-semibold text-gray-900">{selectedGroup.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddToGroup}
                                        disabled={selectedContacts.length === 0}
                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                                    >
                                        Add to Group
                                    </button>
                                    <button
                                        onClick={handleRemoveFromGroup}
                                        disabled={selectedContacts.length === 0}
                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600">
                                {selectedContacts.length > 0
                                    ? `${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''} selected`
                                    : 'Select contacts to add or remove from this group'}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {contacts.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <p className="text-gray-500">No contacts found</p>
                            </div>
                        ) : (
                            contacts.map((contact) => (
                                <div
                                    key={contact.resourceName}
                                    className={`border rounded-lg p-3 cursor-pointer transition-colors
                    ${isContactInSelectedGroup(contact.resourceName!) ? 'border-l-4 border-l-blue-500' : 'border-gray-200'}
                    ${selectedContacts.includes(contact.resourceName!) ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                                    onClick={() => handleContactSelect(contact.resourceName!)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {contact.photos && contact.photos[0]?.url ? (
                                                <img
                                                    src={contact.photos[0].url}
                                                    alt={contact.names?.[0]?.displayName || 'Contact'}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>

                                        <div>
                                            <div className="font-medium text-gray-800">
                                                {contact.names?.[0]?.displayName || 'Unnamed Contact'}
                                            </div>
                                            {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                                                <div className="text-sm text-gray-600">{contact.emailAddresses[0].value}</div>
                                            )}
                                        </div>

                                        {isContactInSelectedGroup(contact.resourceName!) && (
                                            <div className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                In Group
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface SearchContactsProps {
    accountId: string;
}

const SearchContacts: React.FC<SearchContactsProps> = ({ accountId }) => {
    const { searchContacts, loading, error } = useContacts(accountId);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PersonType[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        const results = await searchContacts(searchQuery);
        if (results) {
            setSearchResults(results.contacts);
            setNextPageToken(results.nextPageToken);
            setHasSearched(true);
        }
    };

    const handleLoadMore = async () => {
        if (!nextPageToken) return;

        const results = await searchContacts(searchQuery, { pageToken: nextPageToken });
        if (results) {
            setSearchResults(prev => [...prev, ...results.contacts]);
            setNextPageToken(results.nextPageToken);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Search Contacts</h2>

            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter name, email, or phone number"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                        type="submit"
                        disabled={loading || !searchQuery.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            {hasSearched && (
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Search Results</h3>

                    {searchResults.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <p className="text-gray-500">No contacts found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 mb-4">
                                {searchResults.map((contact) => (
                                    <div key={contact.resourceName} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {contact.photos && contact.photos[0]?.url ? (
                                                    <img
                                                        src={contact.photos[0].url}
                                                        alt={contact.names?.[0]?.displayName || 'Contact'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>

                                            <div>
                                                <div className="font-medium text-gray-800">
                                                    {contact.names?.[0]?.displayName || 'Unnamed Contact'}
                                                </div>
                                                {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                                                    <div className="text-sm text-gray-600">{contact.emailAddresses[0].value}</div>
                                                )}
                                                {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                                                    <div className="text-sm text-gray-600">{contact.phoneNumbers[0].value}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {nextPageToken && (
                                <div className="text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    >
                                        {loading ? 'Loading...' : 'Load More Results'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

interface ContactsAppProps {
    accountId: string;
}

const ContactsApp: React.FC<ContactsAppProps> = ({ accountId }) => {
    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'groups' | 'search'>('list');
    const [contactToEdit, setContactToEdit] = useState<PersonType | undefined>();

    const handleEditContact = (contact: PersonType) => {
        setContactToEdit(contact);
        setActiveTab('create');
    };

    const handleContactSaved = () => {
        setContactToEdit(undefined);
        setActiveTab('list');
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <nav className="flex flex-wrap gap-2">
                    <button
                        className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${activeTab === 'list'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        onClick={() => setActiveTab('list')}
                    >
                        My Contacts
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${activeTab === 'create'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        onClick={() => {
                            setContactToEdit(undefined);
                            setActiveTab('create');
                        }}
                    >
                        {contactToEdit ? 'Edit Contact' : 'Create New'}
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${activeTab === 'groups'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        onClick={() => setActiveTab('groups')}
                    >
                        Contact Groups
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${activeTab === 'search'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        onClick={() => setActiveTab('search')}
                    >
                        Search
                    </button>
                </nav>
            </div>

            <div className="space-y-6">
                {activeTab === 'list' && (
                    <ContactsList
                        accountId={accountId}
                        onEditContact={handleEditContact}
                    />
                )}
                {activeTab === 'create' && (
                    <ContactForm
                        accountId={accountId}
                        contactToEdit={contactToEdit}
                        onSuccess={handleContactSaved}
                        onCancel={() => setActiveTab('list')}
                    />
                )}
                {activeTab === 'groups' && (
                    <ContactGroups accountId={accountId} />
                )}
                {activeTab === 'search' && (
                    <SearchContacts accountId={accountId} />
                )}
            </div>
        </div>
    );
};

const GooglePeopleApi: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { currentAccount } = useAccount();

    if (isLoading) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm p-4">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800">Google Contacts Manager</h1>
                </div>
            </header>
            <main className="container mx-auto p-4">
                {isAuthenticated && currentAccount?.id ? (
                    <ContactsApp accountId={currentAccount.id} />
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
                        <p className="text-gray-600">Please sign in to access your contacts.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GooglePeopleApi;