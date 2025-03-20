import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, LogOut, Check } from 'lucide-react';
import { fetchAccountDetails } from '../utils/account.utils';
import { useAuth } from '../contexts/AuthContext';
import { UserAvatar } from '../components/UserAvatar';

interface AccountDisplayInfo {
    id: string;
    name: string;
    email: string;
    imageUrl?: string;
    provider: string;
    status?: string;
}

const AccountSelectionPage: React.FC = () => {
    const { session, isLoading, logoutAll } = useAuth();
    const [accounts, setAccounts] = useState<AccountDisplayInfo[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [preferredAccountId, setPreferredAccountId] = useState<string | null>(
        localStorage.getItem('preferredAccountId')
    );
    const navigate = useNavigate();

    // Fetch details for all accounts in the session
    useEffect(() => {
        const fetchAllAccountDetails = async () => {
            if (!session?.accounts) return;

            try {
                setLoadingAccounts(true);
                const accountPromises = session.accounts.map(async (account) => {
                    try {
                        const response = await fetchAccountDetails(account.accountId);
                        if (response.success) {
                            return {
                                id: account.accountId,
                                name: response.data.userDetails?.name || 'User',
                                email: response.data.userDetails?.email || '',
                                imageUrl: response.data.userDetails?.imageUrl,
                                provider: response.data.provider || account.provider,
                                status: response.data.status
                            };
                        }
                        return {
                            id: account.accountId,
                            name: `Account ${account.accountId.slice(0, 6)}...`,
                            email: 'Details unavailable',
                            provider: account.provider || 'unknown'
                        };
                    } catch {
                        return {
                            id: account.accountId,
                            name: `Account ${account.accountId.slice(0, 6)}...`,
                            email: 'Details unavailable',
                            provider: account.provider || 'unknown'
                        };
                    }
                });

                const accountDetails = await Promise.all(accountPromises);
                setAccounts(accountDetails);
            } catch (error) {
                console.error('Error fetching account details:', error);
            } finally {
                setLoadingAccounts(false);
            }
        };

        fetchAllAccountDetails();
    }, [session]);

    const handleSelectAccount = (accountId: string) => {
        navigate(`/app/${accountId}`);
    };

    const handleSetDefaultAccount = (accountId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent card click from firing
        localStorage.setItem('preferredAccountId', accountId);
        setPreferredAccountId(accountId);
    };

    const handleAddAccount = () => {
        sessionStorage.setItem('addAccountFlow', 'true');
        navigate('/login');
    };

    const handleLogoutAll = async () => {
        await logoutAll();
    };

    if (isLoading || loadingAccounts) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Choose an account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        You're signed in with multiple accounts. Select one to continue.
                    </p>
                </div>

                <div className="mt-8">
                    <div className="space-y-4">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className="relative bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200 rounded-lg p-4 cursor-pointer"
                                onClick={() => handleSelectAccount(account.id)}
                            >
                                <div className="flex items-center">
                                    <UserAvatar account={account} size="md" showProviderIcon={true} />
                                    <div className="ml-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                                {account.name}
                                                {account.status === 'inactive' && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        Inactive
                                                    </span>
                                                )}
                                            </h3>
                                            {account.id === preferredAccountId && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    <Check size={12} className="mr-1" /> Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{account.email}</p>
                                        <p className="text-xs text-gray-500 mt-1 capitalize flex items-center">
                                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${account.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></span>
                                            {account.provider} account
                                        </p>
                                    </div>
                                </div>

                                {account.id !== preferredAccountId && (
                                    <button
                                        className="absolute bottom-4 right-4 text-xs text-blue-600 hover:text-blue-800"
                                        onClick={(e) => handleSetDefaultAccount(account.id, e)}
                                    >
                                        Set as default
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 space-y-4">
                        <button
                            onClick={handleAddAccount}
                            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PlusCircle size={16} className="mr-2" />
                            Add another account
                        </button>

                        <button
                            onClick={handleLogoutAll}
                            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <LogOut size={16} className="mr-2" />
                            Sign out of all accounts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSelectionPage;