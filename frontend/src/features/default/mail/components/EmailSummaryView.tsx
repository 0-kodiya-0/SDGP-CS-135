import React, { useEffect, useState } from 'react';
import { useGmailMessages } from '../hooks/useGmailMessages.google';
import { useGmailLabels } from '../hooks/useLabels.google';
import { ParsedEmail, GMAIL_SYSTEM_LABELS } from '../types/types.google.api';
import { parseGmailMessage } from '../utils/utils.google.api';
import { Inbox, Send, Trash, Tag, Star, AlertCircle, RefreshCw, Search, Mail } from 'lucide-react';

// Components import
import EmailListItem from './EmailListItem';
import { ComponentTypes, useTabStore } from '../../../required/tab_view';
import { useGooglePermissions } from '../../user_account';
import { GooglePermissionRequest } from '../../user_account/components/GooglePermissionRequest';

interface GmailSummaryViewProps {
    accountId: string;
}

const GmailSummaryView: React.FC<GmailSummaryViewProps> = ({ accountId }) => {
    // State
    const [selectedLabel, setSelectedLabel] = useState<string>(GMAIL_SYSTEM_LABELS.INBOX);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([]);

    // Hooks
    const { addTab } = useTabStore();
    const {
        messages,
        loading: messagesLoading,
        error: messagesError,
        listMessages,
        getMessage,
        trashMessage,
        modifyLabels,
        sendMessage,
        nextPageToken,
    } = useGmailMessages(accountId);

    const {
        hasRequiredPermission,
        permissionsLoading,
        permissionError,
        checkAllServicePermissions
    } = useGooglePermissions();

    useEffect(() => {
        console.log(permissionError);
    }, [permissionError]);

    const {
        labels,
        loading: labelsLoading,
        listLabels,
        createLabel,
        updateLabel,
        deleteLabel
    } = useGmailLabels(accountId);

    useEffect(() => {
        if (accountId) {
            checkAllServicePermissions(accountId, 'gmail');
        }
    }, [accountId]);

    // Effects
    useEffect(() => {
        // Load labels when component mounts
        if (hasRequiredPermission(accountId, 'gmail', 'full')) {
            listLabels();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permissionsLoading]);

    useEffect(() => {
        const loadMessages = async () => {
            const params = {
                maxResults: 20,
                labelIds: selectedLabel ? [selectedLabel] : undefined,
                q: searchQuery,
                format: 'metadata' // crucial for initial fast loading
            };
            await listMessages(params);
        };

        // Only load messages if we have permissions
        if (hasRequiredPermission(accountId, 'gmail', 'full')) {
            loadMessages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLabel, searchQuery, permissionsLoading]);

    useEffect(() => {
        // Parse messages when they change
        const processMessages = async () => {
            if (messages && messages.length > 0) {
                // Create an array to hold the parsed emails
                const parsedArray: ParsedEmail[] = [];

                // Process each message
                for (const message of messages) {
                    // Check if this message lacks payload (needs full details)
                    if (!message.payload) {
                        try {
                            // Fetch full message details
                            const fullMessage = await getMessage(message.id, 'full');
                            if (fullMessage) {
                                parsedArray.push(parseGmailMessage(fullMessage));
                            } else {
                                // Fallback if fetch fails
                                parsedArray.push(parseGmailMessage(message));
                            }
                        } catch (error) {
                            console.error('Error fetching full message:', error);
                            // Use minimal info if fetch fails
                            parsedArray.push(parseGmailMessage(message));
                        }
                    } else {
                        // Message already has payload, parse it directly
                        parsedArray.push(parseGmailMessage(message));
                    }
                }

                setParsedEmails(parsedArray);
            } else {
                setParsedEmails([]);
            }
        };

        processMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

    const handleLabelClick = (labelId: string) => {
        setSelectedLabel(labelId);
        setSelectedEmailId(null);
    };

    const handleEmailClick = (emailId: string) => {
        setSelectedEmailId(emailId);
        // Open email in a new tab
        openEmailInTab(emailId);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // The search is triggered when the selected label or search query changes via useEffect
    };

    const handleLoadMore = () => {
        if (nextPageToken) {
            listMessages({
                labelIds: selectedLabel ? [selectedLabel] : undefined,
                q: searchQuery || undefined,
                pageToken: nextPageToken,
                maxResults: 20
            });
        }
    };

    const handleRefresh = () => {
        if (!hasRequiredPermission(accountId, 'gmail', 'readonly')) {
            return;
        }
        listMessages({
            labelIds: selectedLabel ? [selectedLabel] : undefined,
            q: searchQuery || undefined,
            maxResults: 20
        });
    };

    const handleTrashEmail = async (emailId: string) => {
        if (!hasRequiredPermission(accountId, 'gmail', 'full')) {
            return;
        }
        const success = await trashMessage(emailId);
        if (success) {
            // If we were viewing this email, clear selection
            if (selectedEmailId === emailId) {
                setSelectedEmailId(null);
            }
        }
    };

    const handleToggleStarred = async (emailId: string, isStarred: boolean) => {
        if (!hasRequiredPermission(accountId, 'gmail', 'full')) {
            return;
        }

        if (isStarred) {
            // Remove STARRED label
            await modifyLabels(emailId, [], [GMAIL_SYSTEM_LABELS.STARRED]);
        } else {
            // Add STARRED label
            await modifyLabels(emailId, [GMAIL_SYSTEM_LABELS.STARRED], []);
        }
        // Refresh the list to show updated status
        handleRefresh();
    };

    const handleToggleImportant = async (emailId: string, isImportant: boolean) => {
        if (!hasRequiredPermission(accountId, 'gmail', 'full')) {
            return;
        }

        if (isImportant) {
            // Remove IMPORTANT label
            await modifyLabels(emailId, [], [GMAIL_SYSTEM_LABELS.IMPORTANT]);
        } else {
            // Add IMPORTANT label
            await modifyLabels(emailId, [GMAIL_SYSTEM_LABELS.IMPORTANT], []);
        }
        // Refresh the list to show updated status
        handleRefresh();
    };

    const openComposeInTab = () => {
        if (!hasRequiredPermission(accountId, 'gmail', 'send')) {
            return;
        }

        addTab(
            accountId,
            "Compose Email",
            ComponentTypes.EMAIL_CREATE_EMAIL_VIEW,
            {
                accountId,
                onSend: (params: any) => {
                    sendMessage(params);
                    handleRefresh();
                }
            }
        );
    };

    const openEmailInTab = async (emailId: string) => {
        if (!hasRequiredPermission(accountId, 'gmail', 'full')) {
            return;
        }

        const fullMessage = await getMessage(emailId, 'full');
        if (fullMessage) {
            const parsedEmail = parseGmailMessage(fullMessage);
            addTab(
                accountId,
                parsedEmail.subject || 'No Subject',
                ComponentTypes.EMAIL_DETAILS_VIEW,
                {
                    email: parsedEmail,
                    onReply: (params: any) => {
                        sendMessage(params);
                        handleRefresh();
                    },
                    onDelete: () => handleTrashEmail(emailId),
                    onToggleStarred: (starred: boolean) => handleToggleStarred(emailId, starred),
                    onToggleImportant: (important: boolean) => handleToggleImportant(emailId, important),
                    availableLabels: labels,
                    onLabelChange: (addLabelIds: string[], removeLabelIds: string[]) => {
                        modifyLabels(emailId, addLabelIds, removeLabelIds);
                        handleRefresh();
                    }
                }
            );
        }
    };

    const openLabelManagerInTab = () => {
        if (!hasRequiredPermission(accountId, 'gmail', 'full')) {
            return;
        }

        addTab(
            accountId,
            "Manage Labels",
            ComponentTypes.EMAIL_LABEL_MANAGER,
            {
                labels,
                loading: labelsLoading,
                onCreateLabel: createLabel,
                onUpdateLabel: updateLabel,
                onDeleteLabel: deleteLabel
            }
        );
    };

    if (!hasRequiredPermission(accountId, "gmail", "full") && !permissionsLoading) {
        return (
            <GooglePermissionRequest
                serviceType="gmail"
                requiredScopes={['full']}
                loading={permissionsLoading}
                error={permissionError}
                onRequestPermission={() => checkAllServicePermissions(accountId, 'gmail', true)}
                title="Email Access Required"
                description="To fetch and send emails, we need your permission to access your Gmail account."
            />
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Top Navigation Bar */}
            <div className="border-b border-gray-200 bg-white">
                <div className="flex items-center px-3 py-2">
                    {/* Compose Button */}
                    <button
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors mr-2"
                        onClick={openComposeInTab}
                        title="Compose"
                    >
                        <Mail className="w-4 h-4" />
                    </button>

                    {/* Search bar */}
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 mx-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full rounded-md border border-gray-300 px-8 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
                    </form>

                    {/* Refresh button */}
                    <button
                        className="p-1.5 rounded-full hover:bg-gray-100"
                        onClick={handleRefresh}
                        disabled={messagesLoading}
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${messagesLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Labels button */}
                    <button
                        className="p-1.5 rounded-full hover:bg-gray-100 ml-1"
                        onClick={openLabelManagerInTab}
                        title="Manage Labels"
                    >
                        <Tag className="w-4 h-4" />
                    </button>
                </div>

                {/* Label selector */}
                <div className="flex overflow-x-auto py-1 px-2 text-sm border-t border-gray-100 no-scrollbar">
                    {/* System labels as horizontal tabs */}
                    <button
                        className={`px-3 py-1 rounded-md whitespace-nowrap flex items-center mr-1 ${selectedLabel === GMAIL_SYSTEM_LABELS.INBOX ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                        onClick={() => handleLabelClick(GMAIL_SYSTEM_LABELS.INBOX)}
                    >
                        <Inbox className="w-3 h-3 mr-1" />
                        Inbox
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md whitespace-nowrap flex items-center mr-1 ${selectedLabel === GMAIL_SYSTEM_LABELS.STARRED ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                        onClick={() => handleLabelClick(GMAIL_SYSTEM_LABELS.STARRED)}
                    >
                        <Star className="w-3 h-3 mr-1" />
                        Starred
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md whitespace-nowrap flex items-center mr-1 ${selectedLabel === GMAIL_SYSTEM_LABELS.SENT ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                        onClick={() => handleLabelClick(GMAIL_SYSTEM_LABELS.SENT)}
                    >
                        <Send className="w-3 h-3 mr-1" />
                        Sent
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md whitespace-nowrap flex items-center mr-1 ${selectedLabel === GMAIL_SYSTEM_LABELS.IMPORTANT ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                        onClick={() => handleLabelClick(GMAIL_SYSTEM_LABELS.IMPORTANT)}
                    >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Important
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md whitespace-nowrap flex items-center mr-1 ${selectedLabel === GMAIL_SYSTEM_LABELS.TRASH ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                        onClick={() => handleLabelClick(GMAIL_SYSTEM_LABELS.TRASH)}
                    >
                        <Trash className="w-3 h-3 mr-1" />
                        Trash
                    </button>

                    {/* Show a few custom labels if available */}
                    {labels
                        .filter(label => !label.id.toUpperCase().startsWith('CATEGORY_') && !Object.values(GMAIL_SYSTEM_LABELS).includes(label.id))
                        .slice(0, 3)
                        .map(label => (
                            <button
                                key={label.id}
                                className={`px-3 py-1 rounded-md whitespace-nowrap flex items-center mr-1 ${selectedLabel === label.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                                onClick={() => handleLabelClick(label.id)}
                            >
                                <Tag className="w-3 h-3 mr-1" />
                                {label.name}
                            </button>
                        ))
                    }
                </div>
            </div>

            {/* Email List Section - Now with hidden scrollbar */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {messagesError && (
                    <div className="p-2 text-red-600 text-sm">
                        Error: {messagesError}
                    </div>
                )}

                {messagesLoading && parsedEmails.length === 0 ? (
                    <div className="flex items-center justify-center h-24">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 mb-2"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ) : parsedEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                        <Mail className="w-8 h-8 mb-2 text-gray-300" />
                        <p className="text-sm">No emails found</p>
                    </div>
                ) : (
                    <>
                        {/* Email List Header - now just a small label indicator */}
                        <div className="px-3 py-1 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                            {labels.find(l => l.id === selectedLabel)?.name || 'Inbox'}
                        </div>

                        {/* Compact Email List */}
                        <div className="email-list">
                            {parsedEmails.map((email) => (
                                <EmailListItem
                                    key={email.id}
                                    email={email}
                                    isSelected={selectedEmailId === email.id}
                                    onClick={() => handleEmailClick(email.id)}
                                    onTrash={() => handleTrashEmail(email.id)}
                                    onToggleStarred={() => handleToggleStarred(email.id, email.isStarred || false)}
                                    onToggleImportant={() => handleToggleImportant(email.id, email.isImportant || false)}
                                />
                            ))}
                        </div>

                        {nextPageToken && (
                            <div className="p-2 flex justify-center">
                                <button
                                    className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                                    onClick={handleLoadMore}
                                    disabled={messagesLoading}
                                >
                                    {messagesLoading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GmailSummaryView;