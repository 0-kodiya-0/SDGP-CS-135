import React, { useState } from "react";
import SummaryView from "./SummaryView";
import ExpandView from "./ExpandView";
import EmailComposer from "./EmailComposer";
import { useAccount } from "../../user_account";

// Type definitions for view state and compose parameters
type MailView = 'summary' | 'detail' | 'compose';

type ComposeParams = {
    to: string;
    subject: string;
    body: string;
};

function Mail() {
    // Get current account information
    const { currentAccount } = useAccount();
    
    // State management
    const [currentView, setCurrentView] = useState<MailView>('summary');
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [composeParams, setComposeParams] = useState<ComposeParams | null>(null);

    // Debug logging
    console.log('[Mail] Rendering with:', {
        accountId: currentAccount?.accountId,
        currentView,
        selectedMessageId
    });

    // Message selection handler - directly defined, not using useCallback
    function handleSelectMessage(messageId: string) {
        console.log('[Mail] Message selected:', messageId);
        setSelectedMessageId(messageId);
        setCurrentView('detail');
    }

    // Back to summary handler
    function handleBackToSummary() {
        console.log('[Mail] Going back to summary');
        setCurrentView('summary');
        setSelectedMessageId(null);
    }

    // Compose new email handler
    function handleComposeNew() {
        console.log('[Mail] Composing new email');
        setComposeParams(null);
        setCurrentView('compose');
    }

    // Reply to email handler
    function handleReply(to: string, subject: string, body: string) {
        console.log('[Mail] Replying to email');
        setComposeParams({ to, subject, body });
        setCurrentView('compose');
    }

    // Forward email handler
    function handleForward(subject: string, body: string) {
        console.log('[Mail] Forwarding email');
        setComposeParams({ to: '', subject, body });
        setCurrentView('compose');
    }

    // Mail sent handler
    function handleMailSent() {
        console.log('[Mail] Email sent');
        setCurrentView('summary');
    }

    // Guard against missing account
    if (!currentAccount?.accountId) {
        return (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
                Please sign in to access your Mail
            </div>
        );
    }

    // Render appropriate view based on state
    return (
        <div className="container mx-auto p-4">
            <header className="bg-white shadow-sm p-4 mb-6 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-800">Mail</h1>
            </header>

            {currentView === 'summary' && (
                <SummaryView 
                    accountId={currentAccount.accountId}
                    selectMessage={handleSelectMessage} // Note: renamed from onSelectMessage
                    composeNew={handleComposeNew}      // Note: renamed from onComposeNew
                />
            )}

            {currentView === 'detail' && selectedMessageId && (
                <ExpandView
                    accountId={currentAccount.accountId}
                    messageId={selectedMessageId}
                    goBack={handleBackToSummary}  // Note: renamed from onBack
                    replyToEmail={handleReply}    // Note: renamed from onReply
                    forwardEmail={handleForward}  // Note: renamed from onForward
                />
            )}

            {currentView === 'compose' && (
                <EmailComposer
                    accountId={currentAccount.accountId}
                    initialRecipient={composeParams?.to || ''}
                    initialSubject={composeParams?.subject || ''}
                    initialBody={composeParams?.body || ''}
                    onSuccess={handleMailSent}
                    onCancel={handleBackToSummary}
                />
            )}
        </div>
    );
}

export default Mail;