import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, LogOut, Check, Key, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserAvatar } from '../components/UserAvatar';
import { useAccount } from '../contexts/AccountContext';
import {  AccountType } from '../types/types.data';

const AccountSelectionPage: React.FC = () => {
    const { isLoading, logoutAll } = useAuth();
    const { isLoading: loadingAccounts, accounts, fetchAllAccountDetails } = useAccount();
    const [preferredAccountId, setPreferredAccountId] = useState<string | null>(
        localStorage.getItem('preferredAccountId')
    );

    useEffect(() => {
        fetchAllAccountDetails(false);
    }, [])

    const navigate = useNavigate();

    const handleSelectAccount = (accountId: string) => {
        navigate(`/app/${accountId}`);
    };

    const handleSetDefaultAccount = (accountId: string, event: React.MouseEvent) => {
        event.stopPropagation();
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
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Loading accounts...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Choose an account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Select an account to continue
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-3">
                        {accounts.map((account) => {
                            const isLocal = account.accountType === AccountType.Local;
                            const isPreferred = account.id === preferredAccountId;
                            
                            return (
                                <div
                                    key={account.id}
                                    className="relative bg-white border border-gray-200 rounded-md p-3 cursor-pointer hover:border-blue-300 hover:bg-gray-50 transition-all duration-200"
                                    onClick={() => handleSelectAccount(account.id)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <UserAvatar
                                            account={account}
                                            size="sm"
                                            showProviderIcon={false}
                                        />
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {account.userDetails.name}
                                                    </p>
                                                    {isLocal ? (
                                                        <Key size={12} className="text-blue-600 flex-shrink-0" />
                                                    ) : (
                                                        <Shield size={12} className="text-green-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                                {isPreferred && (
                                                    <Check size={14} className="text-blue-600 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {account.userDetails.email}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-gray-400">
                                                    {isLocal ? 'Local Account' : `${account.provider} Account`}
                                                </span>
                                                {!isPreferred && (
                                                    <button
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                        onClick={(e) => handleSetDefaultAccount(account.id, e)}
                                                    >
                                                        Set default
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 space-y-3">
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