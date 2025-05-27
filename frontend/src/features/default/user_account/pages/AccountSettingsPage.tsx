import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Shield, User, Bell, LogOut, Key, Download, ExternalLink } from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import { useAccount } from '../contexts/AccountContext';
import { useAuth } from '../contexts/AuthContext';
import { OAuthProviders, AccountType } from '../types/types.data';
import BackupCodesManager from '../components/BackupCodesManager';

const AccountSettingsPage: React.FC = () => {
    const { currentAccount, isLoading, error, fetchCurrentAccountDetails } = useAccount();
    const { logout, tokenRevocation } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [showMessage, setShowMessage] = useState('');

    const isLocalAccount = currentAccount?.accountType === AccountType.Local;

    // Show message from navigation state
    useEffect(() => {
        if (location.state?.message) {
            setShowMessage(location.state.message);
            // Clear the message after 5 seconds
            setTimeout(() => setShowMessage(''), 5000);
            // Clear the state to prevent showing message on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleGoBack = () => {
        navigate(`/app/${currentAccount?.id}`);
    };

    const handleLogout = async () => {
        if (currentAccount) {
            await logout(currentAccount.id);
        }
    };

    const handleRevokeToken = () => {
        if (currentAccount) {
            tokenRevocation(currentAccount.id, OAuthProviders.Google);
        }
    };

    const handlePasswordReset = () => {
        navigate('/forgot-password', {
            state: {
                email: currentAccount?.userDetails.email,
                isAccountSettings: true
            }
        });
    };

    const handleTwoFactorSetup = () => {
        navigate(`/app/${currentAccount?.id}/two-factor-setup`);
    };

    const handleBackupCodesGenerated = (codes: string[]) => {
        setShowBackupCodes(false);
        // Auto-download the codes
        downloadBackupCodes(codes);
        setShowMessage('New backup codes have been generated and downloaded.');
        setTimeout(() => setShowMessage(''), 5000);
    };

    const downloadBackupCodes = (codes: string[]) => {
        const content = `Two-Factor Authentication Backup Codes\n\nGenerated on: ${new Date().toLocaleString()}\n\nEach code can only be used once. Store these in a safe place.\n\n${codes.join('\n')}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        
        try {
            // Simulate save operation
            await new Promise(resolve => setTimeout(resolve, 1000));
            setShowMessage('Settings saved successfully!');
            setTimeout(() => setShowMessage(''), 5000);
        } catch (error) {
            console.error('Save error:', error);
            setShowMessage('Failed to save settings. Please try again.');
            setTimeout(() => setShowMessage(''), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Loading account settings...</span>
                </div>
            </div>
        );
    }

    if (error || !currentAccount) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Account not found</h2>
                        <p className="text-gray-600 mb-6">{error || "Unable to load account details"}</p>
                        <div className="flex space-x-4 justify-center">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={handleGoBack}
                            >
                                Go Back
                            </button>
                            <button
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => fetchCurrentAccountDetails()}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={handleGoBack}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Back to app
                    </button>
                    <h1 className="text-3xl font-extrabold text-gray-900">Account Settings</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage your account preferences and security settings
                    </p>
                </div>

                {/* Success/Error Messages */}
                {showMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                        {showMessage}
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white shadow sm:rounded-lg">
                    {/* Sidebar Navigation */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {[
                                { id: 'profile', name: 'Profile', icon: User },
                                { id: 'security', name: 'Security', icon: Shield },
                                { id: 'notifications', name: 'Notifications', icon: Bell }
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <Icon size={16} className="mr-2" />
                                            {tab.name}
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex items-center space-x-4 mb-6">
                                    <UserAvatar
                                        account={currentAccount}
                                        size="lg"
                                        showProviderIcon={true}
                                    />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{currentAccount.userDetails.name}</h3>
                                        <p className="text-sm text-gray-500">{currentAccount.userDetails.email}</p>
                                        <div className="flex items-center mt-1">
                                            {isLocalAccount ? (
                                                <Key size={12} className="text-blue-600 mr-1" />
                                            ) : (
                                                <Shield size={12} className="text-green-600 mr-1" />
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {isLocalAccount ? 'Local Account' : `${currentAccount.provider} Account`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            defaultValue={currentAccount.userDetails.name}
                                            disabled={!isLocalAccount}
                                        />
                                        {!isLocalAccount && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Name is managed by your {currentAccount.provider} account
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            defaultValue={currentAccount.userDetails.email}
                                            disabled={!isLocalAccount}
                                        />
                                        {!isLocalAccount && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Email is managed by your {currentAccount.provider} account
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                {/* Password Reset - Only for Local Accounts */}
                                {isLocalAccount && (
                                    <div className="border-b border-gray-200 pb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">Password</h3>
                                                <p className="text-sm text-gray-500">
                                                    Reset your account password using the password reset flow
                                                </p>
                                            </div>
                                            <button
                                                onClick={handlePasswordReset}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <Key className="mr-2 h-4 w-4" />
                                                Reset Password
                                                <ExternalLink className="ml-2 h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Two-Factor Authentication */}
                                <div className="border-b border-gray-200 pb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                                            <p className="text-sm text-gray-500">
                                                {isLocalAccount 
                                                    ? 'Add an extra layer of security to your account'
                                                    : 'Two-factor authentication is not available for OAuth accounts'
                                                }
                                            </p>
                                        </div>
                                        {isLocalAccount && (
                                            <div className="flex items-center space-x-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    currentAccount.security?.twoFactorEnabled 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {currentAccount.security?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                                <button
                                                    onClick={handleTwoFactorSetup}
                                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    {currentAccount.security?.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Backup Codes Management */}
                                    {isLocalAccount && currentAccount.security?.twoFactorEnabled && (
                                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium text-yellow-800">Backup Codes</h4>
                                                    <p className="text-sm text-yellow-700">
                                                        Generate new backup codes for emergency access
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setShowBackupCodes(true)}
                                                    className="inline-flex items-center px-3 py-2 border border-yellow-300 shadow-sm text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Generate New Codes
                                                </button>
                                            </div>

                                            {showBackupCodes && (
                                                <div className="mt-4">
                                                    <BackupCodesManager
                                                        accountId={currentAccount.id}
                                                        onCodesGenerated={handleBackupCodesGenerated}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Session Timeout */}
                                <div className="border-b border-gray-200 pb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Session Timeout</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Set how long before your session expires due to inactivity
                                    </p>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        defaultValue={currentAccount.security?.sessionTimeout || 30}
                                        disabled={!isLocalAccount}
                                    >
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>1 hour</option>
                                        <option value={120}>2 hours</option>
                                        <option value={240}>4 hours</option>
                                        <option value={480}>8 hours</option>
                                    </select>
                                    {!isLocalAccount && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Session settings are managed by your {currentAccount.provider} account
                                        </p>
                                    )}
                                </div>

                                {/* Revoke Access Token - Only for OAuth accounts */}
                                {!isLocalAccount && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Revoke Access Token</h3>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Revoking your token will unlink all permissions and require you to sign in again.
                                            Use this if you need to update the permissions granted to this application.
                                        </p>
                                        <button
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            onClick={handleRevokeToken}
                                        >
                                            Revoke Access Token
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        Manage how and when you receive notifications
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                                            <p className="text-sm text-gray-500">
                                                Receive updates and alerts via email
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                defaultChecked={true}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                                            <p className="text-sm text-gray-500">
                                                Receive real-time notifications in your browser
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                defaultChecked={false}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between py-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">Security Alerts</h4>
                                            <p className="text-sm text-gray-500">
                                                Get notified about important security events
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                defaultChecked={true}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <LogOut size={16} className="mr-2" />
                            Sign out
                        </button>

                        <button
                            type="submit"
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={handleSaveChanges}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} className="mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettingsPage;