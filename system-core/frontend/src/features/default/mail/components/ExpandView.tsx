import React, { useState, useEffect } from "react";
import {
    useGmailMessages,
    useGmailLabels,
    getDisplayLabelName,
    getLabelColor,
    parseGmailMessage,
} from "../../mail";

// Define ExpandViewProps with renamed callbacks
interface ExpandViewProps {
    accountId: string;
    messageId: string;
    goBack: () => void;                             // Renamed from onBack
    replyToEmail: (to: string, subject: string, body: string) => void;  // Renamed from onReply
    forwardEmail: (subject: string, body: string) => void;              // Renamed from onForward
}

function ExpandView({ accountId, messageId, goBack, replyToEmail, forwardEmail }: ExpandViewProps) {
    // Note: directly destructure props
    
    // Debug output
    console.log('[ExpandView] Rendering with:', { accountId, messageId });
    
    // State variables
    const [showDetails, setShowDetails] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    
    // Use hooks
    const { message, loading, error, getMessage, modifyLabels } = useGmailMessages(accountId);
    const { labels, listLabels } = useGmailLabels(accountId);

    // Load the email message when component mounts
    useEffect(() => {
        console.log('[ExpandView] Fetching message:', messageId);
        getMessage(messageId);
        listLabels();
    }, [messageId, getMessage, listLabels]);

    // Mark message as read when opening
    useEffect(() => {
        if (message && message.labelIds?.includes('UNREAD') && !isMarkingRead) {
            console.log('[ExpandView] Marking message as read');
            setIsMarkingRead(true);
            
            modifyLabels(
                messageId,
                [], // No labels to add
                ['UNREAD'] // Remove UNREAD label
            ).finally(() => {
                setIsMarkingRead(false);
            });
        }
    }, [message, messageId, modifyLabels, isMarkingRead]);

    // Simple back button handler
    function handleBackClick() {
        console.log('[ExpandView] Back button clicked');
        goBack();
    }

    // Simple reply button handler
    function handleReplyClick() {
        console.log('[ExpandView] Reply button clicked');
        
        if (!message) {
            console.error('Cannot reply: message is null');
            return;
        }

        const parsedMessage = parseGmailMessage(message);
        const replyTo = parsedMessage.from?.email || '';
        const replySubject = parsedMessage.subject?.startsWith('Re:')
            ? parsedMessage.subject
            : `Re: ${parsedMessage.subject || ''}`;

        // Create a simple reply template
        const originalDate = parsedMessage.date ? parsedMessage.date.toLocaleString() : 'unknown date';
        const originalSender = parsedMessage.from?.name || parsedMessage.from?.email || 'unknown sender';
        const replyBody = `\n\nOn ${originalDate}, ${originalSender} wrote:\n> ${parsedMessage.body?.text?.replace(/\n/g, '\n> ') || ''}`;

        replyToEmail(replyTo, replySubject, replyBody);
    }

    // Simple forward button handler
    function handleForwardClick() {
        console.log('[ExpandView] Forward button clicked');
        
        if (!message) {
            console.error('Cannot forward: message is null');
            return;
        }

        const parsedMessage = parseGmailMessage(message);
        const forwardSubject = parsedMessage.subject?.startsWith('Fwd:')
            ? parsedMessage.subject
            : `Fwd: ${parsedMessage.subject || ''}`;

        // Create a simple forward template
        const originalDate = parsedMessage.date ? parsedMessage.date.toLocaleString() : 'unknown date';
        const originalSender = parsedMessage.from?.name || parsedMessage.from?.email || 'unknown sender';
        
        let originalRecipients = '';
        if (parsedMessage.to && parsedMessage.to.length > 0) {
            const validRecipients = parsedMessage.to.filter(to => to.email !== undefined);
            if (validRecipients.length > 0) {
                originalRecipients = `To: ${validRecipients.map(to => to.email).join(', ')}`;
            }
        }
        
        const forwardBody = `
---------- Forwarded message ---------
From: ${originalSender}
Date: ${originalDate}
Subject: ${parsedMessage.subject || '(No subject)'}
${originalRecipients}

${parsedMessage.body?.text || ''}`;

        forwardEmail(forwardSubject, forwardBody);
    }

    // Render loading state
    if (loading && !message) {
        return (
            <div className="flex flex-col justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <div className="text-gray-600">Loading message ID: {messageId}...</div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="bg-red-100 text-red-700 p-4 rounded-md">
                <div className="font-bold mb-2">Error loading message:</div>
                <div>{error}</div>
                <div className="mt-4">
                    <button 
                        onClick={handleBackClick}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Back to Inbox
                    </button>
                </div>
            </div>
        );
    }

    // Render "message not found" state
    if (!message) {
        return (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
                <div className="font-bold mb-2">Message Not Found</div>
                <div>Could not load the email with ID: {messageId}</div>
                <div className="mt-4">
                    <button 
                        onClick={handleBackClick}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Back to Inbox
                    </button>
                </div>
            </div>
        );
    }

    const parsedMessage = parseGmailMessage(message);

    // Find the message labels
    const messageLabels = labels.filter(label =>
        parsedMessage.labelIds?.includes(label.id)
    );

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header with back button and actions */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={handleBackClick}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Inbox
                </button>

                <h1 className="text-xl font-bold text-gray-800 max-w-2xl truncate">
                    {parsedMessage.subject || '(No subject)'}
                </h1>

                <div className="flex space-x-2">
                    <button
                        onClick={handleReplyClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Reply
                    </button>
                    <button
                        onClick={handleForwardClick}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Forward
                    </button>
                </div>
            </div>

            {/* Email content */}
            <div className="space-y-6">
                {/* Sender info and metadata */}
                <div className="bg-gray-50 rounded-md p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                        <div>
                            <div className="font-bold text-gray-800">
                                {parsedMessage.from?.name || parsedMessage.from?.email || 'Unknown sender'}
                            </div>
                            {parsedMessage.from?.email && (
                                <div className="text-sm text-gray-600">
                                    {`<${parsedMessage.from.email}>`}
                                </div>
                            )}
                        </div>

                        <div className="text-right text-sm text-gray-600">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <div>
                                    <span className="font-medium text-gray-700">To:</span>{' '}
                                    <span>
                                        {parsedMessage.to && parsedMessage.to.length > 0 
                                            ? parsedMessage.to
                                                .filter(to => to.email !== undefined)
                                                .map(to => to.email)
                                                .join(', ')
                                            : 'N/A'
                                        }
                                    </span>
                                </div>

                                {parsedMessage.cc && parsedMessage.cc.length > 0 && (
                                    <div>
                                        <span className="font-medium text-gray-700">Cc:</span>{' '}
                                        <span>
                                            {parsedMessage.cc
                                                .filter(cc => cc.email !== undefined)
                                                .map(cc => cc.email)
                                                .join(', ')
                                            }
                                        </span>
                                    </div>
                                )}

                                <button
                                    className="text-blue-600 hover:text-blue-800 text-xs focus:outline-none"
                                    onClick={() => setShowDetails(!showDetails)}
                                >
                                    {showDetails ? 'Hide details' : 'Show details'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Expanded details */}
                    {showDetails && (
                        <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                    <span className="font-medium text-gray-700">Date:</span>{' '}
                                    <span>{parsedMessage.date?.toLocaleString() || 'Unknown'}</span>
                                </div>

                                {messageLabels.length > 0 && (
                                    <div>
                                        <span className="font-medium text-gray-700">Labels:</span>{' '}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {messageLabels.map(label => (
                                                <div
                                                    key={label.id}
                                                    className="px-2 py-1 text-xs rounded-full"
                                                    style={getLabelColor(label) ? {
                                                        backgroundColor: getLabelColor(label)!.background,
                                                        color: getLabelColor(label)!.text
                                                    } : {
                                                        backgroundColor: '#E5E7EB',
                                                        color: '#374151'
                                                    }}
                                                >
                                                    {getDisplayLabelName(label)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Message body */}
                <div className="email-body min-h-[300px] border border-gray-200 rounded-md p-4">
                    {parsedMessage.body?.html ? (
                        <div
                            className="html-body"
                            dangerouslySetInnerHTML={{ __html: parsedMessage.body.html }}
                        />
                    ) : (
                        <div className="text-body whitespace-pre-line">
                            {parsedMessage.body?.text || 'No content'}
                        </div>
                    )}
                </div>

                {/* Attachments */}
                {parsedMessage.attachments && parsedMessage.attachments.length > 0 && (
                    <div className="border border-gray-200 rounded-md p-4">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Attachments</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {parsedMessage.attachments.map((attachment, index) => (
                                <div key={index} className="border border-gray-200 rounded-md p-3 flex items-center">
                                    <div className="text-gray-500 mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{attachment.filename}</div>
                                        <div className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 ml-2 focus:outline-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action buttons at bottom */}
                <div className="flex justify-between">
                    <button
                        onClick={handleBackClick}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Back to Inbox
                    </button>
                    
                    <div className="space-x-2">
                        <button
                            onClick={handleReplyClick}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Reply
                        </button>
                        <button
                            onClick={handleForwardClick}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Forward
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExpandView;