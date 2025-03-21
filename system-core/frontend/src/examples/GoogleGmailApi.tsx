import { useState, useEffect, useRef } from "react";
import { useAuth, useAccount } from "../features/default/user_account";
import {
    useGmailMessages,
    useGmailLabels,
    GMAIL_SYSTEM_LABELS,
    getDisplayLabelName,
    getLabelColor,
    parseGmailMessage,
    formatEmailDate,
    fileToAttachment,
    SendMessageParams,
    GmailLabel,
    isSystemLabel,
    formatEmailAddress
} from "../features/default/mail";

interface InboxViewProps {
    accountId: string;
    onSelectMessage?: (messageId: string) => void;
}

const InboxView: React.FC<InboxViewProps> = ({ accountId, onSelectMessage }) => {
    const { messages, loading, error, nextPageToken, listMessages } = useGmailMessages(accountId);
    const { labels, listLabels } = useGmailLabels(accountId);
    const [currentLabel, setCurrentLabel] = useState<string>(GMAIL_SYSTEM_LABELS.INBOX);
    const [searchQuery, setSearchQuery] = useState('');

    // Load messages when component mounts or when selected label changes
    useEffect(() => {
        listMessages({
            labelIds: [currentLabel],
            maxResults: 20
        });

        // Also load labels
        listLabels();
    }, [accountId, currentLabel, listMessages, listLabels]);

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        let query = searchQuery;
        if (currentLabel !== GMAIL_SYSTEM_LABELS.INBOX) {
            // Add label to the search query
            query = `${query} label:${currentLabel}`;
        }

        listMessages({
            q: query,
            maxResults: 20
        });
    };

    // Handle loading more messages
    const handleLoadMore = () => {
        if (!nextPageToken) return;

        listMessages({
            labelIds: [currentLabel],
            maxResults: 20,
            pageToken: nextPageToken
        });
    };

    // Group labels for sidebar display
    const systemLabels = labels.filter(label => label.type === 'system');
    const userLabels = labels.filter(label => label.type !== 'system');

    // Render loading state
    if (loading && messages.length === 0) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-4 h-min">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Gmail</h2>

                <div className="space-y-6">
                    <div className="space-y-1">
                        {systemLabels.map(label => (
                            <div
                                key={label.id}
                                className={`px-3 py-2 rounded-md cursor-pointer flex items-center justify-between ${currentLabel === label.id
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'hover:bg-gray-100'
                                    }`}
                                onClick={() => setCurrentLabel(label.id)}
                            >
                                <span className="font-medium">{getDisplayLabelName(label)}</span>
                                {label.messagesUnread && label.messagesUnread > 0 && (
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                        {label.messagesUnread}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {userLabels.length > 0 && (
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">Labels</h3>
                            <div className="space-y-1">
                                {userLabels.map(label => (
                                    <div
                                        key={label.id}
                                        className={`px-3 py-2 rounded-md cursor-pointer flex items-center justify-between ${currentLabel === label.id
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'hover:bg-gray-100'
                                            }`}
                                        onClick={() => setCurrentLabel(label.id)}
                                    >
                                        <div className="flex items-center">
                                            <span
                                                className="w-3 h-3 rounded-full mr-2"
                                                style={getLabelColor(label) ? {
                                                    backgroundColor: getLabelColor(label)!.background,
                                                    borderColor: getLabelColor(label)!.text
                                                } : {}}
                                            ></span>
                                            <span className="font-medium truncate">{label.name}</span>
                                        </div>
                                        {label.messagesUnread && label.messagesUnread > 0 && (
                                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                                {label.messagesUnread}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            {getDisplayLabelName(labels.find(l => l.id === currentLabel) || { id: currentLabel, name: currentLabel })}
                        </h2>

                        <form onSubmit={handleSearch} className="w-full md:w-auto flex">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search in email"
                                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="space-y-2">
                        {messages.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-8 text-center">
                                <p className="text-gray-500">No messages found</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message) => {
                                    const parsedMessage = parseGmailMessage(message);
                                    return (
                                        <div
                                            key={message.id}
                                            className={`p-4 border rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${parsedMessage.isUnread ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                                                }`}
                                            onClick={() => onSelectMessage && onSelectMessage(message.id!)}
                                        >
                                            <div className="flex items-start gap-3">
                                                {parsedMessage.isImportant && (
                                                    <span className="text-yellow-500 flex-shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </span>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-1">
                                                        <div className="font-medium truncate">
                                                            {parsedMessage.from?.name || parsedMessage.from?.email || 'Unknown sender'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {parsedMessage.date ? formatEmailDate(parsedMessage.date) : ''}
                                                        </div>
                                                    </div>

                                                    <div className="font-medium text-gray-800 truncate mt-1">
                                                        {parsedMessage.subject || '(No subject)'}
                                                    </div>

                                                    <div className="text-sm text-gray-600 line-clamp-2 mt-1">
                                                        {message.snippet}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {nextPageToken && (
                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loading}
                                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            {loading ? 'Loading...' : 'Load more'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface EmailComposerProps {
    accountId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialRecipient?: string;
    initialSubject?: string;
    initialBody?: string;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
    accountId,
    onSuccess,
    onCancel,
    initialRecipient = '',
    initialSubject = '',
    initialBody = ''
}) => {
    const { sendMessage, loading, error } = useGmailMessages(accountId);
    const [to, setTo] = useState(initialRecipient);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [isHtml, setIsHtml] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [showCcBcc, setShowCcBcc] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddAttachment = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);

            // Reset the input to allow selecting the same file again
            e.target.value = '';
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (!to || !subject || !body) return;

        try {
            // Convert File objects to MessageAttachment objects
            const messageAttachments = await Promise.all(
                attachments.map(file => fileToAttachment(file))
            );

            // Create message payload
            const message: SendMessageParams = {
                to,
                subject,
                body,
                isHtml,
                attachments: messageAttachments.length > 0 ? messageAttachments : undefined
            };

            // Add CC and BCC if provided
            if (cc) message.cc = cc;
            if (bcc) message.bcc = bcc;

            // Send the message
            const result = await sendMessage(message);

            if (result && onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error('Failed to send email:', err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">New Message</h2>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center">
                        <label htmlFor="to" className="w-12 text-gray-700 font-medium">To:</label>
                        <input
                            type="text"
                            id="to"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="Recipient email address"
                            required
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {!showCcBcc && (
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => setShowCcBcc(true)}
                                className="text-blue-600 hover:text-blue-800 text-sm focus:outline-none"
                            >
                                Cc/Bcc
                            </button>
                        </div>
                    )}

                    {showCcBcc && (
                        <>
                            <div className="flex items-center">
                                <label htmlFor="cc" className="w-12 text-gray-700 font-medium">Cc:</label>
                                <input
                                    type="text"
                                    id="cc"
                                    value={cc}
                                    onChange={(e) => setCc(e.target.value)}
                                    placeholder="Cc email addresses"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div className="flex items-center">
                                <label htmlFor="bcc" className="w-12 text-gray-700 font-medium">Bcc:</label>
                                <input
                                    type="text"
                                    id="bcc"
                                    value={bcc}
                                    onChange={(e) => setBcc(e.target.value)}
                                    placeholder="Bcc email addresses"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex items-center">
                        <label htmlFor="subject" className="w-12 text-gray-700 font-medium">Subject:</label>
                        <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject"
                            required
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div className="border-t border-b border-gray-200 py-2">
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your message here..."
                        rows={10}
                        required
                        className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-0 sm:text-sm"
                    />
                </div>

                <div className="flex items-center">
                    <label className="flex items-center text-sm">
                        <input
                            type="checkbox"
                            checked={isHtml}
                            onChange={(e) => setIsHtml(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2">Use HTML formatting</span>
                    </label>
                </div>

                {attachments.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
                        <ul className="space-y-2">
                            {attachments.map((file, index) => (
                                <li key={index} className="flex items-center justify-between bg-white p-2 rounded-md border border-gray-200">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAttachment(index)}
                                        className="text-red-600 hover:text-red-800 focus:outline-none"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={loading || !to || !subject || !body}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </button>

                        <button
                            type="button"
                            onClick={handleAddAttachment}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            Attach
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            multiple
                        />
                    </div>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Discard
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 bg-red-100 text-red-700 p-3 rounded-md">
                    {error}
                </div>
            )}
        </div>
    );
};

interface LabelsManagerProps {
    accountId: string;
}

const LabelsManager: React.FC<LabelsManagerProps> = ({ accountId }) => {
    const { labels, loading, error, listLabels, createLabel, updateLabel, deleteLabel } = useGmailLabels(accountId);
    const [newLabelName, setNewLabelName] = useState('');
    const [editingLabel, setEditingLabel] = useState<GmailLabel | null>(null);
    const [editedName, setEditedName] = useState('');

    useEffect(() => {
        // Load labels when component mounts
        listLabels();
    }, [listLabels]);

    const handleCreateLabel = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newLabelName.trim()) return;

        const result = await createLabel({
            name: newLabelName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show'
        });

        if (result) {
            setNewLabelName('');
        }
    };

    const handleEditLabel = (label: GmailLabel) => {
        setEditingLabel(label);
        setEditedName(label.name);
    };

    const handleSaveEdit = async () => {
        if (!editingLabel || !editedName.trim()) return;

        await updateLabel(editingLabel.id, {
            name: editedName
        });

        setEditingLabel(null);
        setEditedName('');
    };

    const handleCancelEdit = () => {
        setEditingLabel(null);
        setEditedName('');
    };

    const handleDeleteLabel = async (labelId: string) => {
        if (window.confirm('Are you sure you want to delete this label?')) {
            await deleteLabel(labelId);
        }
    };

    // Filter out system labels that cannot be edited
    const userLabels = labels.filter(label => !isSystemLabel(label.id));

    if (loading && labels.length === 0) {
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
            <h2 className="text-xl font-bold text-gray-800 mb-6">Manage Labels</h2>

            <form onSubmit={handleCreateLabel} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Enter new label name"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                    type="submit"
                    disabled={loading || !newLabelName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {loading ? 'Creating...' : 'Create Label'}
                </button>
            </form>

            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Your Labels</h3>

                {userLabels.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-md">No custom labels created yet</p>
                ) : (
                    <div className="space-y-2">
                        {userLabels.map(label => (
                            <div key={label.id} className="border border-gray-200 rounded-md p-3">
                                {editingLabel?.id === label.id ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            autoFocus
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={!editedName.trim()}
                                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span
                                                className="w-4 h-4 rounded-full mr-3"
                                                style={getLabelColor(label) ? {
                                                    backgroundColor: getLabelColor(label)!.background,
                                                    borderColor: getLabelColor(label)!.text
                                                } : {}}
                                            ></span>
                                            <span className="font-medium">{label.name}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditLabel(label)}
                                                className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                                title="Edit label"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLabel(label.id)}
                                                className="text-red-600 hover:text-red-800 focus:outline-none"
                                                title="Delete label"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">System Labels</h3>
                    <p className="text-gray-600 text-sm">System labels like Inbox, Sent, Drafts, etc. cannot be edited or deleted.</p>
                </div>
            </div>
        </div>
    );
};

interface EmailDetailsProps {
    accountId: string;
    messageId: string;
    onBack?: () => void;
    onReply?: (to: string, subject: string, body: string) => void;
}

const EmailDetails: React.FC<EmailDetailsProps> = ({
    accountId,
    messageId,
    onBack,
    onReply
}) => {
    const { message, loading, error, getMessage } = useGmailMessages(accountId);
    const { labels, listLabels } = useGmailLabels(accountId);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Load the email message
        getMessage(messageId);

        // Also load labels for display
        listLabels();
    }, [accountId, messageId, getMessage, listLabels]);

    const handleReply = () => {
        if (!message || !onReply) return;

        const parsedMessage = parseGmailMessage(message);
        const replyTo = parsedMessage.from?.email || '';
        const replySubject = parsedMessage.subject?.startsWith('Re:')
            ? parsedMessage.subject
            : `Re: ${parsedMessage.subject || ''}`;

        // Create a simple reply template
        const originalDate = parsedMessage.date ? parsedMessage.date.toLocaleString() : 'unknown date';
        const originalSender = parsedMessage.from?.name || parsedMessage.from?.email || 'unknown sender';
        const replyBody = `\n\nOn ${originalDate}, ${originalSender} wrote:\n> ${parsedMessage.body?.text?.replace(/\n/g, '\n> ') || ''}`;

        onReply(replyTo, replySubject, replyBody);
    };

    if (loading && !message) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    }

    if (!message) {
        return <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">Email not found</div>;
    }

    const parsedMessage = parseGmailMessage(message);

    // Find the message labels
    const messageLabels = labels.filter(label =>
        parsedMessage.labelIds?.includes(label.id)
    );

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back
                    </button>
                )}

                <h1 className="text-xl font-bold text-gray-800">{parsedMessage.subject || '(No subject)'}</h1>

                {onReply && (
                    <button
                        onClick={handleReply}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Reply
                    </button>
                )}
            </div>

            <div className="space-y-6">
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
                                    <span>{parsedMessage.to?.map(to => formatEmailAddress(to)).join(', ') || 'N/A'}</span>
                                </div>

                                {parsedMessage.cc && parsedMessage.cc.length > 0 && (
                                    <div>
                                        <span className="font-medium text-gray-700">Cc:</span>{' '}
                                        <span>{parsedMessage.cc.map(cc => formatEmailAddress(cc)).join(', ')}</span>
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
            </div>
        </div>
    );
};

interface GmailAppProps {
    accountId: string;
}

type AppView = 'inbox' | 'compose' | 'detail' | 'labels';

const GmailApp: React.FC<GmailAppProps> = ({ accountId }) => {
    const [currentView, setCurrentView] = useState<AppView>('inbox');
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [composeParams, setComposeParams] = useState<{
        to: string;
        subject: string;
        body: string;
    } | null>(null);

    const handleComposeNew = () => {
        setComposeParams(null);
        setCurrentView('compose');
    };

    const handleMessageSelect = (messageId: string) => {
        setSelectedMessageId(messageId);
        setCurrentView('detail');
    };

    const handleReplyToEmail = (to: string, subject: string, body: string) => {
        setComposeParams({ to, subject, body });
        setCurrentView('compose');
    };

    const handleBackToInbox = () => {
        setCurrentView('inbox');
        setSelectedMessageId(null);
    };

    const handleMailSent = () => {
        setCurrentView('inbox');
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex space-x-4">
                        <button
                            className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${currentView === 'inbox'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            onClick={handleBackToInbox}
                        >
                            Inbox
                        </button>

                        <button
                            className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${currentView === 'labels'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            onClick={() => setCurrentView('labels')}
                        >
                            Manage Labels
                        </button>
                    </div>

                    <button
                        onClick={handleComposeNew}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Compose
                        </span>
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {currentView === 'inbox' && (
                    <InboxView
                        accountId={accountId}
                        onSelectMessage={handleMessageSelect}
                    />
                )}

                {currentView === 'compose' && (
                    <EmailComposer
                        accountId={accountId}
                        initialRecipient={composeParams?.to || ''}
                        initialSubject={composeParams?.subject || ''}
                        initialBody={composeParams?.body || ''}
                        onSuccess={handleMailSent}
                        onCancel={handleBackToInbox}
                    />
                )}

                {currentView === 'detail' && selectedMessageId && (
                    <EmailDetails
                        accountId={accountId}
                        messageId={selectedMessageId}
                        onBack={handleBackToInbox}
                        onReply={handleReplyToEmail}
                    />
                )}

                {currentView === 'labels' && (
                    <LabelsManager accountId={accountId} />
                )}
            </div>
        </div>
    );
};

const GoogleGmailApi: React.FC = () => {
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
                    <h1 className="text-2xl font-bold text-gray-800">Gmail Manager</h1>
                </div>
            </header>
            <main className="container mx-auto p-4">
                {isAuthenticated && currentAccount?.accountId ? (
                    <GmailApp accountId={currentAccount.accountId} />
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
                        <p className="text-gray-600">Please sign in to access your Gmail.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GoogleGmailApi;