import React, { useState } from 'react';
import {
    Reply,
    ReplyAll,
    Forward,
    Trash,
    Star,
    AlertCircle,
    Tag,
    Download,
    ChevronDown,
    X
} from 'lucide-react';
import {
    ParsedEmail,
    GmailLabel,
    SendMessageParams,
    GMAIL_SYSTEM_LABELS,
    MessageAttachment
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
    onToggleImportant,
    availableLabels,
    onLabelChange
}) => {
    const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
    const [replyType, setReplyType] = useState<'reply' | 'replyAll' | 'forward'>('reply');
    const [replyContent, setReplyContent] = useState<string>('');
    const [showLabelMenu, setShowLabelMenu] = useState<boolean>(false);

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
            // Reply to the original sender
            to = [email.from?.email || ''];
        } else if (replyType === 'replyAll') {
            // Reply to the original sender and all recipients
            to = [
                email.from?.email || '',
                ...(email.to || []).map(recipient => recipient.email),
            ];
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
          <div><b>From:</b> ${formatEmailAddress(email.from || { email: 'Unknown' })}</div>
          <div><b>Date:</b> ${email.date?.toLocaleString() || 'Unknown'}</div>
          <div><b>Subject:</b> ${email.subject || 'No Subject'}</div>
          <div><b>To:</b> ${(email.to || []).map(t => formatEmailAddress(t)).join(', ') || 'Unknown'}</div>
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
            params.cc = email.cc.map(recipient => recipient.email);
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
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-md shadow-md z-10 w-64">
                <div className="p-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-medium">Labels</span>
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => setShowLabelMenu(false)}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {menuLabels.map(label => {
                        const isChecked = email.labelIds?.includes(label.id) || false;
                        return (
                            <div
                                key={label.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                onClick={() => handleToggleLabel(label.id)}
                            >
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={isChecked}
                                    readOnly
                                />
                                <span>{label.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-white">
            {/* Email header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-xl font-semibold">{email.subject || 'No Subject'}</h1>
                    <div className="flex items-center space-x-2">
                        <button
                            className="p-1 rounded-full hover:bg-gray-100"
                            onClick={() => onToggleStarred(email.isStarred || false)}
                        >
                            <Star className={`w-5 h-5 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                        <button
                            className="p-1 rounded-full hover:bg-gray-100"
                            onClick={() => onToggleImportant(email.isImportant || false)}
                        >
                            <AlertCircle className={`w-5 h-5 ${email.isImportant ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                        <div className="relative">
                            <button
                                className="p-1 rounded-full hover:bg-gray-100"
                                onClick={() => setShowLabelMenu(!showLabelMenu)}
                            >
                                <Tag className="w-5 h-5" />
                            </button>
                            {renderLabelMenu()}
                        </div>
                        <button
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500"
                            onClick={onDelete}
                        >
                            <Trash className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-start mb-2">
                    <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium">
                            {(email.from?.name || email.from?.email || '?').charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between">
                            <div>
                                <p className="font-medium">
                                    {email.from?.name || email.from?.email || 'Unknown Sender'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {email.from?.email && email.from.name ? `<${email.from.email}>` : ''}
                                </p>
                            </div>
                            <p className="text-sm text-gray-500">
                                {email.date?.toLocaleString() || ''}
                            </p>
                        </div>

                        <div className="mt-1 text-sm">
                            <span className="text-gray-600">To: </span>
                            <span>
                                {email.to?.map(recipient => recipient.name || recipient.email).join(', ') || 'No recipients'}
                            </span>
                        </div>

                        {email.cc && email.cc.length > 0 && (
                            <div className="mt-1 text-sm">
                                <span className="text-gray-600">Cc: </span>
                                <span>
                                    {email.cc.map(recipient => recipient.name || recipient.email).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Labels */}
                {visibleLabels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {visibleLabels.map(label => (
                            <div
                                key={label.id}
                                className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center"
                            >
                                <Tag className="w-3 h-3 mr-1" />
                                <span>{label.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex space-x-2 mt-4">
                    <button
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded flex items-center text-sm"
                        onClick={() => {
                            setReplyType('reply');
                            setShowReplyForm(true);
                        }}
                    >
                        <Reply className="w-4 h-4 mr-1" />
                        Reply
                    </button>
                    <button
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded flex items-center text-sm"
                        onClick={() => {
                            setReplyType('replyAll');
                            setShowReplyForm(true);
                        }}
                    >
                        <ReplyAll className="w-4 h-4 mr-1" />
                        Reply All
                    </button>
                    <button
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded flex items-center text-sm"
                        onClick={() => {
                            setReplyType('forward');
                            setShowReplyForm(true);
                        }}
                    >
                        <Forward className="w-4 h-4 mr-1" />
                        Forward
                    </button>
                </div>
            </div>

            {/* Email body */}
            <div className="p-6 flex-1 overflow-y-auto">
                {/* Attachments section */}
                {email.attachments && email.attachments.length > 0 && (
                    <div className="mb-6 border border-gray-200 rounded-md p-4">
                        <h3 className="font-medium mb-2 text-sm text-gray-600">
                            Attachments ({email.attachments.length})
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {email.attachments.map((attachment, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-md px-3 py-2 flex items-center"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{attachment.filename}</p>
                                        <p className="text-xs text-gray-500">
                                            {(attachment.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button className="ml-3 text-blue-600 hover:text-blue-800">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Email content */}
                <div className="email-content">
                    {email.body?.html ? (
                        <div dangerouslySetInnerHTML={{ __html: email.body.html }} />
                    ) : (
                        <div className="whitespace-pre-wrap">
                            {email.body?.text || 'No content'}
                        </div>
                    )}
                </div>
            </div>

            {/* Reply form */}
            {showReplyForm && (
                <div className="p-4 border-t border-gray-200">
                    <div className="mb-2 flex justify-between items-center">
                        <h3 className="font-medium">
                            {replyType === 'reply' ? 'Reply' :
                                replyType === 'replyAll' ? 'Reply All' : 'Forward'}
                        </h3>
                        <button
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => setShowReplyForm(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <textarea
                        className="w-full border border-gray-300 rounded-md p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Write your reply here..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                    ></textarea>

                    <div className="mt-3 flex justify-end">
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            onClick={handleSendReply}
                            disabled={!replyContent.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailDetailsView;