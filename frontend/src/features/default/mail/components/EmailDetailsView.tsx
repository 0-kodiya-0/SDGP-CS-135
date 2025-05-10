import React, { useState } from 'react';
import {
    Reply,
    ReplyAll,
    Forward,
    Trash,
    Star,
    Tag,
    Download,
    ChevronDown,
    X,
    MoreHorizontal,
    Archive,
    Clock,
    Calendar,
    File,
    Paperclip
} from 'lucide-react';
import {
    ParsedEmail,
    GmailLabel,
    SendMessageParams,
    GMAIL_SYSTEM_LABELS
} from '../types/types.google.api';
import { formatEmailAddress } from '../utils/utils.google.api';

interface EmailDetailsViewProps {
    email: ParsedEmail;
    onReply: (params: SendMessageParams) => Promise<any>;
    onDelete: () => void;
    onToggleStarred: (isStarred: boolean) => Promise<void>;
    onToggleImportant: (isImportant: boolean) => Promise<void>;
    availableLabels: GmailLabel[];
    onLabelChange: (addLabelIds: string[], removeLabelIds: string[]) => Promise<void>;
}

const EmailDetailsView: React.FC<EmailDetailsViewProps> = ({
    email,
    onReply,
    onDelete,
    onToggleStarred,
    availableLabels,
    onLabelChange
}) => {
    const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
    const [replyType, setReplyType] = useState<'reply' | 'replyAll' | 'forward'>('reply');
    const [replyContent, setReplyContent] = useState<string>('');
    const [showLabelMenu, setShowLabelMenu] = useState<boolean>(false);
    const [showMoreActions, setShowMoreActions] = useState<boolean>(false);
    const [emailCollapsed, setEmailCollapsed] = useState<boolean>(false);

    // Create a mapping for quick label lookup
    const labelsMap = availableLabels.reduce((acc, label) => {
        acc[label.id] = label;
        return acc;
    }, {} as Record<string, GmailLabel>);

    // Filter out system labels we don't want to show
    const hiddenSystemLabels = [
        GMAIL_SYSTEM_LABELS.UNREAD,
        GMAIL_SYSTEM_LABELS.INBOX,
        GMAIL_SYSTEM_LABELS.SENT,
        GMAIL_SYSTEM_LABELS.DRAFT
    ];

    const visibleLabels = (email.labelIds || [])
        .filter(id => !hiddenSystemLabels.includes(id))
        .map(id => labelsMap[id])
        .filter(Boolean);

    // Handler for sending a reply
    const handleSendReply = async () => {
        if (!replyContent.trim()) return;

        let to: string[] = [];
        let subject = email.subject || '';

        if (!subject.startsWith('Re:') && (replyType === 'reply' || replyType === 'replyAll')) {
            subject = `Re: ${subject}`;
        } else if (!subject.startsWith('Fwd:') && replyType === 'forward') {
            subject = `Fwd: ${subject}`;
        }

        if (replyType === 'reply') {
            // Reply to the original sender - ensure email is a string
            to = email.from?.email ? [email.from.email] : [];
        } else if (replyType === 'replyAll') {
            // Reply to the original sender and all recipients - ensure all emails are strings
            const fromEmail = email.from?.email;
            const toEmails = (email.to || [])
                .map(recipient => recipient.email)
                .filter((email): email is string => email !== undefined);

            // Combine from and to emails, ensuring fromEmail exists
            to = fromEmail ? [fromEmail, ...toEmails] : toEmails;

            // Deduplicate
            to = [...new Set(to)];
        } else if (replyType === 'forward') {
            // Forward requires the user to input recipients
            to = [];
        }

        // Create email template with original message quoted
        const originalContent = email.body?.html || email.body?.text || '';
        const quotedContent = `
      <div>
        ${replyContent}
        <br><br>
        <div style="padding-left: 10px; border-left: 1px solid #ddd; margin: 10px 0;">
          <div>---------- Original Message ----------</div>
          <div><b>From:</b> ${email.from ? formatEmailAddress({
            name: email.from.name,
            email: email.from.email || 'Unknown'
        }) : 'Unknown'}</div>
          <div><b>Date:</b> ${email.date?.toLocaleString() || 'Unknown'}</div>
          <div><b>Subject:</b> ${email.subject || 'No Subject'}</div>
          <div><b>To:</b> ${(email.to || [])
                .map(t => formatEmailAddress({
                    name: t.name,
                    email: t.email || 'Unknown'
                }))
                .join(', ') || 'Unknown'}</div>
          <br>
          <div>${originalContent}</div>
        </div>
      </div>
    `;

        const params: SendMessageParams = {
            to,
            subject,
            body: quotedContent,
            isHtml: true
        };

        // Add CC if replying all and there were CC recipients in the original
        if (replyType === 'replyAll' && email.cc && email.cc.length > 0) {
            // Filter out undefined email addresses
            const ccEmails = email.cc
                .map(recipient => recipient.email)
                .filter((email): email is string => email !== undefined);

            if (ccEmails.length > 0) {
                params.cc = ccEmails;
            }
        }

        await onReply(params);
        setShowReplyForm(false);
        setReplyContent('');
    };

    // Handle toggling a label
    const handleToggleLabel = async (labelId: string) => {
        const hasLabel = email.labelIds?.includes(labelId) || false;

        if (hasLabel) {
            await onLabelChange([], [labelId]);
        } else {
            await onLabelChange([labelId], []);
        }

        setShowLabelMenu(false);
    };

    // Get relative time for email
    const getRelativeTime = (date: Date | undefined): string => {
        if (!date || !(date instanceof Date)) return '';

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            // Today - show time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    // Get file icon based on mimetype
    const getFileIcon = (mimetype: string | undefined): React.ReactNode => {
        if (!mimetype) return <File className="w-5 h-5" />;

        if (mimetype.includes('image')) {
            return <img src="/placeholder-image-icon.svg" className="w-5 h-5" alt="image" />;
        } else if (mimetype.includes('pdf')) {
            return <File className="w-5 h-5 text-red-500" />;
        } else if (mimetype.includes('word') || mimetype.includes('document')) {
            return <File className="w-5 h-5 text-blue-500" />;
        } else if (mimetype.includes('excel') || mimetype.includes('sheet')) {
            return <File className="w-5 h-5 text-green-500" />;
        } else {
            return <File className="w-5 h-5" />;
        }
    };

    // Render the label selection menu
    const renderLabelMenu = () => {
        if (!showLabelMenu) return null;

        // Exclude certain system labels from the menu
        const excludedIds = [
            ...hiddenSystemLabels,
            GMAIL_SYSTEM_LABELS.TRASH,
            GMAIL_SYSTEM_LABELS.SPAM
        ];

        const menuLabels = availableLabels.filter(label =>
            !excludedIds.includes(label.id)
        );

        return (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64 overflow-hidden">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <span className="font-medium text-gray-700">Labels</span>
                    <button
                        className="p-1 hover:bg-gray-200 rounded-full"
                        onClick={() => setShowLabelMenu(false)}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="max-h-60 overflow-y-auto no-scrollbar">
                    {menuLabels.map(label => {
                        const isChecked = email.labelIds?.includes(label.id) || false;
                        return (
                            <div
                                key={label.id}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                                onClick={() => handleToggleLabel(label.id)}
                            >
                                <input
                                    type="checkbox"
                                    className="mr-3 h-4 w-4 accent-blue-500"
                                    checked={isChecked}
                                    readOnly
                                />
                                <span className="text-sm">{label.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render more actions menu
    const renderMoreActions = () => {
        if (!showMoreActions) return null;

        return (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48 overflow-hidden">
                <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" onClick={() => setShowMoreActions(false)}>
                        <Archive className="w-4 h-4 mr-3 text-gray-500" />
                        <span>Archive</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" onClick={() => setShowMoreActions(false)}>
                        <Clock className="w-4 h-4 mr-3 text-gray-500" />
                        <span>Snooze</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" onClick={() => setShowMoreActions(false)}>
                        <Calendar className="w-4 h-4 mr-3 text-gray-500" />
                        <span>Add to Calendar</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center"
                        onClick={() => {
                            onDelete();
                            setShowMoreActions(false);
                        }}
                    >
                        <Trash className="w-4 h-4 mr-3" />
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* Email header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-gray-900 mb-1">{email.subject || 'No Subject'}</h1>

                        {/* Labels */}
                        {visibleLabels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {visibleLabels.map(label => (
                                    <div
                                        key={label.id}
                                        className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 flex items-center"
                                    >
                                        <span>{label.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                        <button
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            onClick={() => onToggleStarred(!email.isStarred)}
                            title={email.isStarred ? "Unstar" : "Star"}
                        >
                            <Star className={`w-5 h-5 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                        <button
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                            onClick={() => setShowLabelMenu(!showLabelMenu)}
                            title="Labels"
                        >
                            <Tag className="w-5 h-5" />
                            {renderLabelMenu()}
                        </button>
                        <div className="relative">
                            <button
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                onClick={() => setShowMoreActions(!showMoreActions)}
                                title="More options"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                            {renderMoreActions()}
                        </div>
                    </div>
                </div>

                {/* Sender information */}
                <div className="flex items-start">
                    <div className="flex-shrink-0 rounded-full h-10 w-10 mr-4 bg-blue-100 flex items-center justify-center overflow-hidden">
                        <span className="text-blue-600 font-medium text-lg">
                            {(email.from?.name || email.from?.email || '?').charAt(0).toUpperCase()}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between">
                            <div className="flex items-baseline flex-wrap">
                                <h2 className="text-base font-semibold text-gray-900 mr-2">
                                    {email.from?.name || email.from?.email || 'Unknown Sender'}
                                </h2>
                                <span className="text-sm text-gray-500 mr-2">
                                    {email.from?.email && email.from.name ? `<${email.from.email}>` : ''}
                                </span>
                            </div>

                            <div className="flex items-center text-sm text-gray-500 ml-auto">
                                <span>{email.date ? getRelativeTime(email.date) : ''}</span>
                                <button
                                    className="ml-2 p-1 rounded-full hover:bg-gray-100"
                                    onClick={() => setEmailCollapsed(!emailCollapsed)}
                                >
                                    <ChevronDown className={`w-4 h-4 transform transition-transform ${emailCollapsed ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {!emailCollapsed && (
                            <>
                                <div className="mt-1 text-sm text-gray-700">
                                    <span className="text-gray-500">To: </span>
                                    <span>
                                        {email.to?.map(recipient => recipient.name || recipient.email).join(', ') || 'No recipients'}
                                    </span>
                                </div>

                                {email.cc && email.cc.length > 0 && (
                                    <div className="mt-0.5 text-sm text-gray-700">
                                        <span className="text-gray-500">Cc: </span>
                                        <span>
                                            {email.cc.map(recipient => recipient.name || recipient.email).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <button
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center text-sm transition-colors"
                        onClick={() => {
                            setReplyType('reply');
                            setShowReplyForm(true);
                        }}
                    >
                        <Reply className="w-4 h-4 mr-2" />
                        Reply
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center text-sm transition-colors"
                        onClick={() => {
                            setReplyType('replyAll');
                            setShowReplyForm(true);
                        }}
                    >
                        <ReplyAll className="w-4 h-4 mr-2" />
                        Reply All
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center text-sm transition-colors"
                        onClick={() => {
                            setReplyType('forward');
                            setShowReplyForm(true);
                        }}
                    >
                        <Forward className="w-4 h-4 mr-2" />
                        Forward
                    </button>
                </div>
            </div>

            {/* Email body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                {/* Attachments section */}
                {email.attachments && email.attachments.length > 0 && (
                    <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="font-medium mb-3 text-sm text-gray-700 flex items-center">
                            <Paperclip className="w-4 h-4 mr-2" />
                            Attachments ({email.attachments.length})
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {email.attachments.map((attachment, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-lg px-3 py-2 flex items-center bg-white hover:shadow-sm transition-shadow"
                                >
                                    <div className="mr-3">
                                        {getFileIcon(attachment.mimeType)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{attachment.filename}</p>
                                        <p className="text-xs text-gray-500">
                                            {(attachment.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button className="ml-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-600" title="Download">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Email content */}
                <div className="email-content rounded-lg border border-gray-100 p-6 shadow-sm bg-white">
                    {email.body?.html ? (
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: email.body.html }} />
                    ) : (
                        <div className="whitespace-pre-wrap text-gray-800">
                            {email.body?.text || 'No content'}
                        </div>
                    )}
                </div>
            </div>

            {/* Reply form */}
            {showReplyForm && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-medium flex items-center">
                                {replyType === 'reply' ? (
                                    <><Reply className="w-4 h-4 mr-2" /> Reply</>
                                ) : replyType === 'replyAll' ? (
                                    <><ReplyAll className="w-4 h-4 mr-2" /> Reply All</>
                                ) : (
                                    <><Forward className="w-4 h-4 mr-2" /> Forward</>
                                )}
                            </h3>
                            <button
                                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                                onClick={() => setShowReplyForm(false)}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <textarea
                            className="w-full border-0 p-4 min-h-[150px] focus:outline-none focus:ring-0 resize-none"
                            placeholder="Write your reply here..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        ></textarea>

                        <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                {/* Could add formatting options here */}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
                                    onClick={() => setShowReplyForm(false)}
                                >
                                    Discard
                                </button>
                                <button
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium"
                                    onClick={handleSendReply}
                                    disabled={!replyContent.trim()}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add some styles for no scrollbar */}

        </div>
    );
};

export default EmailDetailsView;