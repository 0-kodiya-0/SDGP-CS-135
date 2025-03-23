import { useState, useRef } from "react";
import { useGmailMessages, fileToAttachment } from "../../mail";
import { SendMessageParams } from "../../mail/types/types.google.api";

interface EmailComposerProps {
    accountId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialRecipient?: string;
    initialSubject?: string;
    initialBody?: string;
}

function EmailComposer(props: EmailComposerProps) {
    // Log the complete props object for debugging
    console.log('EmailComposer full props:', props);
    
    // Extract props to local variables
    const { 
        accountId, 
        initialRecipient = '', 
        initialSubject = '', 
        initialBody = '' 
    } = props;
    
    // Validate required props are functions
    if (props.onSuccess && typeof props.onSuccess !== 'function') {
        console.error('onSuccess is not a function:', props.onSuccess);
    }
    
    if (props.onCancel && typeof props.onCancel !== 'function') {
        console.error('onCancel is not a function:', props.onCancel);
    }
    
    const { sendMessage, loading, error } = useGmailMessages(accountId);
    const [to, setTo] = useState(initialRecipient);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [isHtml, setIsHtml] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddAttachment = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setAttachments((prev: File[]) => [...prev, ...newFiles]);

            // Reset the input to allow selecting the same file again
            e.target.value = '';
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments((prev: File[]) => prev.filter((_, i: number) => i !== index));
    };

    const handleSend = async () => {
        if (!to || !subject || !body) {
            return;
        }

        try {
            setSendingStatus('sending');
            
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

            console.log('Sending email with params:', {
                to,
                subject,
                hasAttachments: messageAttachments.length > 0
            });

            // Send the message
            const result = await sendMessage(message);

            if (result) {
                setSendingStatus('success');
                console.log('Email sent successfully');
                
                if (props.onSuccess) {
                    props.onSuccess();
                }
            } else {
                setSendingStatus('error');
                console.error('Failed to send email: No result returned');
            }
        } catch (err) {
            setSendingStatus('error');
            console.error('Failed to send email:', err);
        }
    };
    
    const handleCancel = () => {
        console.log('Cancel button clicked');
        if (props.onCancel) {
            props.onCancel();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">New Message</h2>
                {props.onCancel && (
                    <button
                        onClick={handleCancel}
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
                            disabled={loading || !to || !subject || !body || sendingStatus === 'sending'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {sendingStatus === 'sending' ? 'Sending...' : 'Send'}
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

                    {props.onCancel && (
                        <button
                            type="button"
                            onClick={handleCancel}
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
            
            {sendingStatus === 'success' && (
                <div className="mt-4 bg-green-100 text-green-700 p-3 rounded-md">
                    Email sent successfully!
                </div>
            )}
            
            {sendingStatus === 'error' && !error && (
                <div className="mt-4 bg-red-100 text-red-700 p-3 rounded-md">
                    Failed to send email. Please try again.
                </div>
            )}
        </div>
    );
}

export default EmailComposer;