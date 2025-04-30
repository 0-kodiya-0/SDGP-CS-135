import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Shield, User, Bell, LogOut } from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import { useAccount } from '../contexts/AccountContext';
import { useAuth } from '../contexts/AuthContext';
import { OAuthProviders } from '../types/types.data';

const AccountSettingsPage: React.FC = () => {
    const { currentAccount, isLoading, error, fetchCurrentAccountDetails } = useAccount();
    const { logout, tokenRevocation } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

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

    if (isLoading) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !currentAccount) {
        return (
            <div className="w-full h-screen flex flex-col justify-center items-center">
                <div className="text-red-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-xl font-semibold mb-2">Account not found</h1>
                <p className="text-gray-600 mb-4">{error || "Unable to load account details"}</p>
                <div className="flex space-x-4">
                    <button
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        onClick={handleGoBack}
                    >
                        Go Back
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => fetchCurrentAccountDetails()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            onClick={handleGoBack}
                            className="mr-4 p-2 rounded-full hover:bg-gray-100"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-semibold">Account Settings</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-sm text-gray-700 hover:text-red-600"
                    >
                        <LogOut size={16} className="mr-1" />
                        Sign out
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 bg-white shadow rounded-lg p-4">
                        <div className="flex items-center mb-6">
                            <UserAvatar
                                account={currentAccount}
                                size="md"
                                showProviderIcon={true}
                            />
                            <div className="ml-3">
                                <p className="font-medium">{currentAccount.userDetails.name}</p>
                                <p className="text-sm text-gray-500">{currentAccount.userDetails.email}</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            <button
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'profile'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                onClick={() => setActiveTab('profile')}
                            >
                                <User size={18} className="mr-3" />
                                Profile
                            </button>
                            <button
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'security'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                onClick={() => setActiveTab('security')}
                            >
                                <Shield size={18} className="mr-3" />
                                Security
                            </button>
                            <button
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'notifications'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                onClick={() => setActiveTab('notifications')}
                            >
                                <Bell size={18} className="mr-3" />
                                Notifications
                            </button>
                        </nav>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 bg-white shadow rounded-lg p-6">
                        {activeTab === 'profile' && (
                            <div>
                                <h2 className="text-lg font-medium mb-4">Profile Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            defaultValue={currentAccount.userDetails.name}
                                            disabled={currentAccount.provider !== 'local'} // Only editable for local accounts
                                        />
                                        {currentAccount.provider !== 'local' && (
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            defaultValue={currentAccount.userDetails.email}
                                            disabled={currentAccount.provider !== 'local'} // Only editable for local accounts
                                        />
                                        {currentAccount.provider !== 'local' && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Email is managed by your {currentAccount.provider} account
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Account Type
                                        </label>
                                        <div className="flex items-center">
                                            <UserAvatar
                                                account={currentAccount}
                                                size="sm"
                                                showProviderIcon={true}
                                            />
                                            <span className="ml-2 capitalize">{currentAccount.provider || 'Standard'} Account</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div>
                                <h2 className="text-lg font-medium mb-4">Security Settings</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">Two-Factor Authentication</h3>
                                            <p className="text-sm text-gray-500">
                                                Add an extra layer of security to your account
                                            </p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input
                                                type="checkbox"
                                                name="toggle"
                                                id="2fa-toggle"
                                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                defaultChecked={currentAccount.security?.twoFactorEnabled}
                                            />
                                            <label
                                                htmlFor="2fa-toggle"
                                                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                                            ></label>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-medium mb-2">Session Timeout</h3>
                                        <p className="text-sm text-gray-500 mb-2">
                                            Set how long before your session expires due to inactivity
                                        </p>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            defaultValue={currentAccount.security?.sessionTimeout || 30}
                                        >
                                            <option value={15}>15 minutes</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={120}>2 hours</option>
                                            <option value={240}>4 hours</option>
                                            <option value={480}>8 hours</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">Auto-Lock</h3>
                                            <p className="text-sm text-gray-500">
                                                Automatically lock your account when closing the browser
                                            </p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input
                                                type="checkbox"
                                                name="toggle"
                                                id="autolock-toggle"
                                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                defaultChecked={currentAccount.security?.autoLock}
                                            />
                                            <label
                                                htmlFor="autolock-toggle"
                                                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                                            ></label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className='w-[50%]'>
                                            <h3 className="font-medium">Revoke Access Token</h3>
                                            <p className="text-sm text-gray-500">
                                                Revoking your token will unlink all permissions and require you to sign in again.
                                                Use this if you need to update the permissions granted to this application.
                                            </p>
                                        </div>
                                        <div className="flex justify-end w-[50%] mr-2 align-middle select-none">
                                            <button
                                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                                onClick={handleRevokeToken}
                                            >
                                                Revoke Access Token
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div>
                                <h2 className="text-lg font-medium mb-4">Notification Preferences</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Manage how and when you receive notifications
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">Email Notifications</h3>
                                            <p className="text-sm text-gray-500">
                                                Receive updates and alerts via email
                                            </p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input
                                                type="checkbox"
                                                name="toggle"
                                                id="email-toggle"
                                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                defaultChecked={true}
                                            />
                                            <label
                                                htmlFor="email-toggle"
                                                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                                            ></label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">Push Notifications</h3>
                                            <p className="text-sm text-gray-500">
                                                Receive real-time notifications in your browser
                                            </p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input
                                                type="checkbox"
                                                name="toggle"
                                                id="push-toggle"
                                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                defaultChecked={false}
                                            />
                                            <label
                                                htmlFor="push-toggle"
                                                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                                            ></label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                                onClick={handleGoBack}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => setIsSaving(true)}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
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
            </main>

            {/* Custom styles for toggle switches */}
            <style>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #3b82f6;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #3b82f6;
        }
        .toggle-label {
          transition: background-color 0.2s ease;
        }
        .toggle-checkbox {
          transition: all 0.2s ease;
          right: 4px;
        }
      `}</style>
        </div>
    );
};

export default AccountSettingsPage;