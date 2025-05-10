import React, { useState } from 'react';
import { SendMessageParams, MessageAttachment } from '../types/types.google.api';
import { Paperclip, X, Bold, Italic, List, ListOrdered, Link } from 'lucide-react';
import { fileToAttachment } from '../utils/utils.google.api';

interface CreateEmailViewProps {
  accountId: string;
  onSend: (params: SendMessageParams) => Promise<any>;
  replyTo?: {
    to: string[];
    subject: string;
    quoteContent?: string;
  };
}

const CreateEmailView: React.FC<CreateEmailViewProps> = ({
  onSend,
  replyTo
}) => {
  // Form state
  const [to, setTo] = useState<string>(replyTo?.to.join(', ') || '');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [subject, setSubject] = useState<string>(replyTo?.subject || '');
  const [body, setBody] = useState<string>(replyTo?.quoteContent || '');
  const [isHtml, setIsHtml] = useState<boolean>(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCc, setShowCc] = useState<boolean>(false);
  const [showBcc, setShowBcc] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection for attachments
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...fileArray]);
    }
  };

  // Remove an attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format size in KB, MB, etc.
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Submit the form and send the email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!to.trim()) {
      setError('Recipient is required');
      return;
    }

    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }

    if (!body.trim()) {
      setError('Message body is required');
      return;
    }

    try {
      setSending(true);
      setError(null);

      // Parse recipients
      const toArray = to.split(',').map(email => email.trim()).filter(Boolean);
      const ccArray = cc ? cc.split(',').map(email => email.trim()).filter(Boolean) : undefined;
      const bccArray = bcc ? bcc.split(',').map(email => email.trim()).filter(Boolean) : undefined;

      // Convert Files to MessageAttachments
      let attachmentArray: MessageAttachment[] = [];
      if (attachments.length > 0) {
        const promises = attachments.map(file => fileToAttachment(file));
        attachmentArray = await Promise.all(promises);
      }

      const params: SendMessageParams = {
        to: toArray,
        subject,
        body,
        isHtml,
        cc: ccArray,
        bcc: bccArray,
        attachments: attachmentArray.length > 0 ? attachmentArray : undefined
      };

      await onSend(params);

      // Reset form after successful send
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAttachments([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  // Toggle formatting (if using HTML)
  const insertFormatting = (tag: string) => {
    if (!isHtml) return;

    // Simple formatting implementation
    const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);

    let formattedText = '';
    switch (tag) {
      case 'b':
        formattedText = `<b>${selectedText}</b>`;
        break;
      case 'i':
        formattedText = `<i>${selectedText}</i>`;
        break;
      case 'ul':
        formattedText = `<ul><li>${selectedText}</li></ul>`;
        break;
      case 'ol':
        formattedText = `<ol><li>${selectedText}</li></ol>`;
        break;
      case 'a':
        {
          const url = prompt('Enter URL:', 'https://');
          if (url) {
            formattedText = `<a href="${url}">${selectedText || url}</a>`;
          } else {
            return;
          }
          break;
        }
      default:
        return;
    }

    const newBody = body.substring(0, start) + formattedText + body.substring(end);
    setBody(newBody);

    // Focus back to textarea after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + formattedText.length;
      textarea.selectionEnd = start + formattedText.length;
    }, 0);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Email Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold mb-4">Compose Email</h1>

          {/* Recipients */}
          <div className="mb-3">
            <div className="flex items-center">
              <label className="w-16 text-gray-600">To:</label>
              <input
                type="text"
                className="flex-1 p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
          </div>

          {/* CC */}
          {showCc && (
            <div className="mb-3">
              <div className="flex items-center">
                <label className="w-16 text-gray-600">Cc:</label>
                <input
                  type="text"
                  className="flex-1 p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                />
              </div>
            </div>
          )}

          {/* BCC */}
          {showBcc && (
            <div className="mb-3">
              <div className="flex items-center">
                <label className="w-16 text-gray-600">Bcc:</label>
                <input
                  type="text"
                  className="flex-1 p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                />
              </div>
            </div>
          )}

          {/* CC/BCC Buttons */}
          {(!showCc || !showBcc) && (
            <div className="ml-16 mb-3 flex space-x-3">
              {!showCc && (
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setShowCc(true)}
                >
                  Add Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setShowBcc(true)}
                >
                  Add Bcc
                </button>
              )}
            </div>
          )}

          {/* Subject */}
          <div className="mb-3">
            <div className="flex items-center">
              <label className="w-16 text-gray-600">Subject:</label>
              <input
                type="text"
                className="flex-1 p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
          </div>
        </div>

        {/* Formatting toolbar (for HTML emails) */}
        {isHtml && (
          <div className="px-4 py-2 border-b border-gray-200 flex items-center space-x-2">
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => insertFormatting('b')}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => insertFormatting('i')}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => insertFormatting('ul')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => insertFormatting('ol')}
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => insertFormatting('a')}
            >
              <Link className="w-4 h-4" />
            </button>
            <div className="ml-auto flex items-center">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={isHtml}
                  onChange={(e) => setIsHtml(e.target.checked)}
                />
                HTML formatting
              </label>
            </div>
          </div>
        )}

        {/* Email body */}
        <div className="flex-1 p-4">
          <textarea
            id="email-body"
            className="w-full h-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here..."
          ></textarea>
        </div>

        {/* Attachments section */}
        <div className="p-4 border-t border-gray-200">
          {attachments.length > 0 && (
            <div className="mb-3">
              <h3 className="text-sm font-medium mb-2">Attachments</h3>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-gray-100 rounded-md px-3 py-1"
                  >
                    <span className="text-sm truncate max-w-xs">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({formatFileSize(file.size)})
                    </span>
                    <button
                      type="button"
                      className="ml-2 text-gray-500 hover:text-red-500"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex items-center text-gray-600 hover:text-gray-800">
                  <Paperclip className="w-5 h-5 mr-1" />
                  <span>Attach files</span>
                </div>
              </label>
            </div>

            <div className="flex items-center">
              {error && (
                <div className="text-red-500 mr-4 text-sm">{error}</div>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateEmailView;