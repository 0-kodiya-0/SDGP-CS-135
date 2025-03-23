import React, { useEffect, useState } from 'react';
import { Trash2, UserCheck, Search, ExternalLink, Phone, Mail, Briefcase, MapPin } from 'lucide-react';
import { useWorkspaceFeature } from '../hooks/useWorkspaceFeature';
import { WorkspaceFeatureType, WorkspaceContent } from '../types/workspace.types';

interface WorkspaceContactsProps {
    workspaceId: string;
}

const WorkspaceContacts: React.FC<WorkspaceContactsProps> = ({ workspaceId }) => {
    const {
        featureContents,
        loading,
        error,
        fetchFeatureContents,
        removeFeatureContent
    } = useWorkspaceFeature(WorkspaceFeatureType.Contacts);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContact, setSelectedContact] = useState<WorkspaceContent | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

    // Fetch contacts when component mounts
    useEffect(() => {
        fetchFeatureContents();
    }, [fetchFeatureContents, workspaceId]);

    // Filter contacts based on search query
    const filteredContacts = searchQuery
        ? featureContents.filter(contact => {
            const fullName = `${contact.metadata.givenName || ''} ${contact.metadata.familyName || ''}`.trim();
            const email = contact.metadata.emailAddresses?.map(e => e.value).join(' ') || '';
            const phone = contact.metadata.phoneNumbers?.map(p => p.value).join(' ') || '';
            const org = contact.metadata.organizations?.map(o => o.name).join(' ') || '';

            const searchFields = [
                contact.metadata.title || '',
                fullName,
                email,
                phone,
                org
            ].join(' ').toLowerCase();

            return searchFields.includes(searchQuery.toLowerCase());
        })
        : featureContents;

    // Sort contacts alphabetically by name
    const sortedContacts = [...filteredContacts].sort((a, b) => {
        const nameA = a.metadata.title || '';
        const nameB = b.metadata.title || '';
        return nameA.localeCompare(nameB);
    });

    // Handle contact removal
    const handleRemoveContact = async (contact: WorkspaceContent, e: React.MouseEvent) => {
        e.stopPropagation();

        if (window.confirm('Are you sure you want to remove this contact from the workspace?')) {
            const success = await removeFeatureContent(contact.id);

            if (success && selectedContact?.id === contact.id) {
                setSelectedContact(null);
            }
        }
    };

    // Get contact initials for avatar
    const getContactInitials = (contact: WorkspaceContent): string => {
        const firstName = contact.metadata.givenName || '';
        const lastName = contact.metadata.familyName || '';

        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`;
        } else if (firstName) {
            return firstName.charAt(0);
        } else if (lastName) {
            return lastName.charAt(0);
        } else if (contact.metadata.title) {
            return contact.metadata.title.charAt(0);
        } else {
            return '?';
        }
    };

    // Get random background color for avatar based on contact name
    const getAvatarColor = (contact: WorkspaceContent): string => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-red-500',
            'bg-teal-500'
        ];

        const name = contact.metadata.title || contact.id;
        const charCode = name.charCodeAt(0) || 0;
        return colors[charCode % colors.length];
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Contacts List Panel */}
            <div className="w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    </div>
                </div>

                {/* View Toggle */}
                <div className="p-2 border-b border-gray-200 flex">
                    <button
                        onClick={() => setViewMode('card')}
                        className={`flex-1 py-1 rounded ${viewMode === 'card' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Card View
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 py-1 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        List View
                    </button>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="flex-1 flex items-center justify-center p-4 text-center">
                        <div className="text-red-500">
                            <p>Failed to load contacts:</p>
                            <p className="font-medium">{error}</p>
                            <button
                                onClick={() => fetchFeatureContents()}
                                className="mt-4 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && sortedContacts.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                        <UserCheck className="w-16 h-16 text-gray-300 mb-2" />
                        <p className="text-gray-500">
                            {searchQuery
                                ? 'No contacts match your search'
                                : 'No contacts shared to this workspace yet'}
                        </p>
                    </div>
                )}

                {/* Card View */}
                {!loading && !error && sortedContacts.length > 0 && viewMode === 'card' && (
                    <div className="flex-1 overflow-auto p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sortedContacts.map(contact => (
                                <div
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${selectedContact?.id === contact.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="p-3 flex items-center">
                                        {contact.metadata.thumbnailUrl ? (
                                            <img
                                                src={contact.metadata.thumbnailUrl}
                                                alt={contact.metadata.title || 'Contact'}
                                                className="w-10 h-10 rounded-full mr-3"
                                            />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white mr-3 ${getAvatarColor(contact)}`}>
                                                {getContactInitials(contact)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm truncate">
                                                {contact.metadata.title || 'Unnamed Contact'}
                                            </h3>
                                            {contact.metadata.organizations && contact.metadata.organizations.length > 0 && (
                                                <p className="text-xs text-gray-500 truncate">
                                                    {contact.metadata.organizations[0].name}
                                                    {contact.metadata.organizations[0].title && (
                                                        <span> - {contact.metadata.organizations[0].title}</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => handleRemoveContact(contact, e)}
                                            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                                            title="Remove from workspace"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* List View */}
                {!loading && !error && sortedContacts.length > 0 && viewMode === 'list' && (
                    <div className="flex-1 overflow-auto">
                        <div className="divide-y divide-gray-200">
                            {sortedContacts.map(contact => (
                                <div
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center min-w-0">
                                            {contact.metadata.thumbnailUrl ? (
                                                <img
                                                    src={contact.metadata.thumbnailUrl}
                                                    alt={contact.metadata.title || 'Contact'}
                                                    className="w-9 h-9 rounded-full mr-3"
                                                />
                                            ) : (
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white mr-3 ${getAvatarColor(contact)}`}>
                                                    {getContactInitials(contact)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-sm truncate">
                                                    {contact.metadata.title || 'Unnamed Contact'}
                                                </h3>
                                                {contact.metadata.emailAddresses && contact.metadata.emailAddresses.length > 0 && (
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {contact.metadata.emailAddresses[0].value}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleRemoveContact(contact, e)}
                                            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 ml-2"
                                            title="Remove from workspace"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Contact Detail Panel */}
            <div className="flex-1 overflow-auto flex flex-col">
                {selectedContact ? (
                    <div className="flex-1 p-6">
                        <div className="flex items-center mb-6">
                            {selectedContact.metadata.thumbnailUrl ? (
                                <img
                                    src={selectedContact.metadata.thumbnailUrl}
                                    alt={selectedContact.metadata.title || 'Contact'}
                                    className="w-20 h-20 rounded-full mr-4"
                                />
                            ) : (
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white mr-4 text-xl ${getAvatarColor(selectedContact)}`}>
                                    {getContactInitials(selectedContact)}
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    {selectedContact.metadata.title || 'Unnamed Contact'}
                                </h2>
                                {selectedContact.metadata.organizations && selectedContact.metadata.organizations.length > 0 && (
                                    <p className="text-gray-600 mt-1">
                                        {selectedContact.metadata.organizations[0].name}
                                        {selectedContact.metadata.organizations[0].title && (
                                            <span> - {selectedContact.metadata.organizations[0].title}</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <div className="space-y-6">
                                {/* Email Addresses */}
                                {selectedContact.metadata.emailAddresses && selectedContact.metadata.emailAddresses.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-3">Email Addresses</h3>
                                        <div className="space-y-2">
                                            {selectedContact.metadata.emailAddresses.map((email, index) => (
                                                <div key={index} className="flex items-start">
                                                    <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                                    <div>
                                                        <a href={`mailto:${email.value}`} className="text-blue-600 hover:underline">
                                                            {email.value}
                                                        </a>
                                                        {email.type && (
                                                            <span className="text-sm text-gray-500 ml-2">({email.type})</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Phone Numbers */}
                                {selectedContact.metadata.phoneNumbers && selectedContact.metadata.phoneNumbers.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-3">Phone Numbers</h3>
                                        <div className="space-y-2">
                                            {selectedContact.metadata.phoneNumbers.map((phone, index) => (
                                                <div key={index} className="flex items-start">
                                                    <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                                    <div>
                                                        <a href={`tel:${phone.value}`} className="text-blue-600 hover:underline">
                                                            {phone.value}
                                                        </a>
                                                        {phone.type && (
                                                            <span className="text-sm text-gray-500 ml-2">({phone.type})</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Organizations */}
                                {selectedContact.metadata.organizations && selectedContact.metadata.organizations.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-3">Companies</h3>
                                        <div className="space-y-2">
                                            {selectedContact.metadata.organizations.map((org, index) => (
                                                <div key={index} className="flex items-start">
                                                    <Briefcase className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                                    <div>
                                                        <p className="text-gray-900">{org.name}</p>
                                                        {org.title && (
                                                            <p className="text-sm text-gray-500">{org.title}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Addresses */}
                                {selectedContact.metadata.addresses && selectedContact.metadata.addresses.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-3">Addresses</h3>
                                        <div className="space-y-4">
                                            {selectedContact.metadata.addresses.map((address, index) => (
                                                <div key={index} className="flex items-start">
                                                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                                    <div>
                                                        <p className="text-gray-900 whitespace-pre-line">
                                                            {address.formattedValue}
                                                        </p>
                                                        {address.type && (
                                                            <p className="text-sm text-gray-500 mt-1">{address.type}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No contact details available */}
                                {(!selectedContact.metadata.emailAddresses || selectedContact.metadata.emailAddresses.length === 0) &&
                                    (!selectedContact.metadata.phoneNumbers || selectedContact.metadata.phoneNumbers.length === 0) &&
                                    (!selectedContact.metadata.organizations || selectedContact.metadata.organizations.length === 0) &&
                                    (!selectedContact.metadata.addresses || selectedContact.metadata.addresses.length === 0) && (
                                        <div className="text-center py-4">
                                            <p className="text-gray-500">No additional contact details available</p>
                                        </div>
                                    )
                                }
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <a
                                href={`https://contacts.google.com/person/${selectedContact.contentId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View in Contacts
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <UserCheck className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a contact to view</h3>
                        <p className="text-gray-500 max-w-md">
                            Choose a contact from the list to view their details here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceContacts;