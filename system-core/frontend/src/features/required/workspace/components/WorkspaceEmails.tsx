import React, { useEffect, useState } from 'react';
import { Trash2, Mail, Search, ExternalLink, User, Calendar, Tag } from 'lucide-react';
import { useWorkspaceFeature } from '../hooks/useWorkspaceFeature';
import { WorkspaceFeatureType, WorkspaceContent } from '../types/workspace.types';

interface WorkspaceEmailsProps {
    workspaceId: string;
}

const WorkspaceEmails: React.FC<WorkspaceEmailsProps> = ({ workspaceId }) => {
    const {
        featureContents,
        loading,
        error,
        fetchFeatureContents,
        removeFeatureContent
    } = useWorkspaceFeature(WorkspaceFeatureType.Email);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<WorkspaceContent | null>(null);

    // Fetch emails when component mounts
    useEffect(() => {
        fetchFeatureContents();
    }, [fetchFeatureContents, workspaceId]);

    // Filter emails based on search query
    const filteredEmails = searchQuery
        ? featureContents.filter(email =>
            email.metadata.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.metadata.sender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : featureContents;

    // Handle email removal
    const handleRemoveEmail = async (email: WorkspaceContent, e: React.MouseEvent) => {
        e.stopPropagation();

        if (window.confirm('Are you sure you want to remove this email from the workspace?')) {
            const success = await removeFeatureContent(email.id);

            if (success && selectedEmail?.id === email.id) {
                setSelectedEmail(null);
            }
        }
    };

    // Format date string
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Email List Panel */}
            <div className="w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search emails..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    </div>
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
                            <p>Failed to load emails:</p>
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

                {/* Email List */}
                {!loading && !error && (
                    <div className="flex-1 overflow-auto">
                        {filteredEmails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                <Mail className="w-12 h-12 text-gray-300 mb-2" />
                                <p className="text-gray-500">
                                    {searchQuery
                                        ? 'No emails match your search'
                                        : 'No emails shared to this workspace yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {filteredEmails.map(email => (
                                    <div
                                        key={email.id}
                                        onClick={() => setSelectedEmail(email)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between">
                                            <h3 className="font-medium text-sm text-gray-900 truncate">
                                                {email.metadata.title || 'No Subject'}
                                            </h3>
                                            <button
                                                onClick={(e) => handleRemoveEmail(email, e)}
                                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                                                title="Remove from workspace"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-1">
                                            From: {email.metadata.sender || 'Unknown sender'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                            {email.metadata.description || email.metadata.snippet || ''}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">{formatDate(email.metadata.date)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Email Detail Panel */}
            <div className="flex-1 overflow-auto flex flex-col">
                {selectedEmail ? (
                    <div className="flex-1 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {selectedEmail.metadata.title || 'No Subject'}
                            </h2>
                            <div className="mt-4 space-y-3">
                                <div className="flex">
                                    <User className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                    <p className="text-gray-700">
                                        <span className="font-medium">From: </span>
                                        {selectedEmail.metadata.sender || 'Unknown sender'}
                                    </p>
                                </div>
                                <div className="flex">
                                    <Calendar className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                    <p className="text-gray-700">
                                        <span className="font-medium">Date: </span>
                                        {formatDate(selectedEmail.metadata.date)}
                                    </p>
                                </div>
                                {selectedEmail.metadata.labels && selectedEmail.metadata.labels.length > 0 && (
                                    <div className="flex">
                                        <Tag className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                        <div>
                                            <span className="font-medium text-gray-700">Labels: </span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedEmail.metadata.labels.map(label => (
                                                    <span
                                                        key={label}
                                                        className="inline-flex text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800"
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <div className="prose max-w-none">
                                <p>{selectedEmail.metadata.description || selectedEmail.metadata.snippet || 'No content available'}</p>
                            </div>

                            {selectedEmail.metadata.hasAttachment && (
                                <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                                    <p className="flex items-center text-gray-700">
                                        <Mail className="w-5 h-5 text-gray-400 mr-2" />
                                        This email has attachments. View in Gmail to access them.
                                    </p>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <a
                                    href={`https://mail.google.com/mail/u/0/#search/rfc822msgid:${selectedEmail.contentId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View in Gmail
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <Mail className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select an email to view</h3>
                        <p className="text-gray-500 max-w-md">
                            Choose an email from the list to view its contents here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceEmails;