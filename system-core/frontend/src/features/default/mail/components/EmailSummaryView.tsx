import React, { useEffect, useState } from 'react';
import { useGmailMessages } from '../hooks/useGmailMessages.google';
import { useGmailLabels } from '../hooks/useLabels.google';
import { ParsedEmail, GMAIL_SYSTEM_LABELS } from '../types/types.google.api';
import { parseGmailMessage } from '../utils/utils.google.api';
import { Inbox, Send, Trash, Tag, Star, AlertCircle, RefreshCw, Search, Mail, Shield } from 'lucide-react';

// Components import
import EmailListItem from './EmailListItem';
import { ComponentTypes, useTabStore } from '../../../required/tab_view';

interface GmailSummaryViewProps {
    accountId: string;
}

const GmailSummaryView: React.FC<GmailSummaryViewProps> = ({ accountId }) => {
    // State
    const [selectedLabel, setSelectedLabel] = useState<string>(GMAIL_SYSTEM_LABELS.INBOX);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([]);
    // const [showLabels, setShowLabels] = useState(false);
    // const [permissionRequested, setPermissionRequested] = useState(false);

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

        permissionsLoading,
        permissionError,
        permissions,
        checkAllGmailPermissions
    } = useGmailMessages(accountId);

    const {
        labels,
        loading: labelsLoading,
        listLabels,
        createLabel,
        updateLabel,
        deleteLabel
    } = useGmailLabels(accountId);

    // Effects
    useEffect(() => {
        // Load labels when component mounts
        if (permissions?.readonly?.hasAccess) {
            listLabels();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permissionsLoading]);

    useEffect(() => {
        console.log(permissionsLoading, permissions)
    } , [permissionsLoading, permissions])

    // useEffect(() => {
    //     console.log("Permission state changed:", JSON.stringify(permissions));
        
    //     // If we just got readonly access, try loading messages
    //     if (permissions?.readonly) {
    //         console.log("Got readonly access, loading messages");
    //         handleRefresh();
    //     }
    // }, [permissions]); // Watch the entire permissions object

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
        if (permissions?.readonly?.hasAccess) {
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
        if (!permissions?.readonly) {
            return;
        }
        listMessages({
            labelIds: selectedLabel ? [selectedLabel] : undefined,
            q: searchQuery || undefined,
            maxResults: 20
        });
    };

    const handleTrashEmail = async (emailId: string) => {
        if (!permissions?.full?.hasAccess) {
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
        if (!permissions?.full?.hasAccess) {
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
        if (!permissions?.full?.hasAccess) {
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
        if (!permissions?.send?.hasAccess) {
            return;
        }

        addTab(
            "Compose Email",
            null,
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
        if (!permissions?.readonly) {
            return;
        }

        const fullMessage = await getMessage(emailId, 'full');
        if (fullMessage) {
            const parsedEmail = parseGmailMessage(fullMessage);
            addTab(
                parsedEmail.subject || 'No Subject',
                null,
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
        if (!permissions?.full?.hasAccess) {
            return;
        }

        addTab(
            "Manage Labels",
            null,
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

    // Render system labels at the top
    // const renderSystemLabels = () => {
    //     const systemLabelsConfig = [
    //         { id: GMAIL_SYSTEM_LABELS.INBOX, icon: <Inbox className="w-4 h-4" />, label: 'Inbox' },
    //         { id: GMAIL_SYSTEM_LABELS.SENT, icon: <Send className="w-4 h-4" />, label: 'Sent' },
    //         { id: GMAIL_SYSTEM_LABELS.STARRED, icon: <Star className="w-4 h-4" />, label: 'Starred' },
    //         { id: GMAIL_SYSTEM_LABELS.IMPORTANT, icon: <AlertCircle className="w-4 h-4" />, label: 'Important' },
    //         { id: GMAIL_SYSTEM_LABELS.TRASH, icon: <Trash className="w-4 h-4" />, label: 'Trash' }
    //     ];

    //     return (
    //         <div className="space-y-1 mb-4">
    //             {systemLabelsConfig.map(item => (
    //                 <div
    //                     key={item.id}
    //                     className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-100 
    //           ${selectedLabel === item.id ? 'bg-gray-100 font-medium' : ''}`}
    //                     onClick={() => handleLabelClick(item.id)}
    //                 >
    //                     {item.icon}
    //                     <span>{item.label}</span>
    //                 </div>
    //             ))}
    //         </div>
    //     );
    // };

    // Render user custom labels
    // const renderCustomLabels = () => {
    //     const customLabels = labels.filter(label => !label.id.toUpperCase().startsWith('CATEGORY_') && !Object.values(GMAIL_SYSTEM_LABELS).includes(label.id));

    //     if (customLabels.length === 0) {
    //         return null;
    //     }

    //     return (
    //         <div className="mt-4">
    //             <div
    //                 className="flex items-center justify-between px-3 py-2 cursor-pointer"
    //                 onClick={() => setShowLabels(!showLabels)}
    //             >
    //                 <span className="text-sm font-medium text-gray-600">Labels</span>
    //                 <ChevronDown className={`w-4 h-4 transform transition-transform ${showLabels ? 'rotate-180' : ''}`} />
    //             </div>

    //             {showLabels && (
    //                 <div className="space-y-1 mt-1">
    //                     {customLabels.map(label => (
    //                         <div
    //                             key={label.id}
    //                             className={`flex items-center px-3 py-2 rounded cursor-pointer hover:bg-gray-100
    //               ${selectedLabel === label.id ? 'bg-gray-100 font-medium' : ''}`}
    //                             onClick={() => handleLabelClick(label.id)}
    //                         >
    //                             <Tag className="w-4 h-4 mr-2" />
    //                             <span className="truncate">{label.name}</span>
    //                         </div>
    //                     ))}
    //                 </div>
    //             )}

    //             <div
    //                 className="flex items-center gap-2 px-3 py-2 mt-2 cursor-pointer hover:bg-gray-100 text-blue-600"
    //                 onClick={openLabelManagerInTab}
    //             >
    //                 <Plus className="w-4 h-4" />
    //                 <span>Manage labels</span>
    //             </div>
    //         </div>
    //     );
    // };

    const renderPermissionRequest = () => {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <Shield className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Gmail Access Required</h2>
                <p className="text-gray-600 text-center mb-6">
                    To use Gmail features, we need your permission to access your emails, labels, and send messages on your behalf.
                </p>
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    onClick={checkAllGmailPermissions}
                    disabled={permissionsLoading}
                >
                    {permissionsLoading ? 'Requesting Access...' : 'Grant Gmail Access'}
                </button>

                {permissionError && (
                    <p className="text-red-500 mt-4 text-sm">
                        Error: {permissionError}
                    </p>
                )}

                {!permissions?.readonly && (
                    <p className="text-amber-600 mt-4 text-sm">
                        Please accept the permission request in the popup window. If you don't see it, check if it was blocked by your browser.
                    </p>
                )}
            </div>
        );
    };

    // Check if we need to show the permission request screen
    if (!permissions?.readonly?.hasAccess) {
        return renderPermissionRequest();
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

            {/* Add this CSS to your global styles file */}

        </div>
    );
};

export default GmailSummaryView;