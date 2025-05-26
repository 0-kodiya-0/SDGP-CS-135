import React, { useRef, useState, useEffect } from 'react';
import { PlusCircle, ChevronUp, ChevronDown, LogOut, UserCircle, Shield, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../contexts/AccountContext';
import { useAuth } from '../contexts/AuthContext';
import { UserAvatar } from './UserAvatar';
import { Account, AccountType } from '../types/types.data';

interface AccountPopupProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

// Component to fetch and display a single account in the list
const AccountListItem: React.FC<{ account: Account; onSelect: (accountId: string) => void }> = ({
  account,
  onSelect
}) => {
  const getAccountTypeLabel = () => {
    if (account.accountType === AccountType.Local) {
      return 'Local account';
    }
    return `${account.provider} account`;
  };

  const getAccountTypeIcon = () => {
    if (account.accountType === AccountType.Local) {
      return <Key size={12} className="text-gray-500" />;
    }
    return <Shield size={12} className="text-gray-500" />;
  };

  return (
    <button
      className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left"
      onClick={() => onSelect(account.id)}
    >
      <UserAvatar
        account={account}
        size="sm"
        showProviderIcon={true}
      />
      <div className="flex-1 min-w-0 ml-3">
        <p className="text-sm font-medium">{account?.userDetails.name}</p>
        <p className="text-xs text-gray-500 truncate">{account?.userDetails.email}</p>
        <div className="flex items-center mt-1">
          {getAccountTypeIcon()}
          <span className="text-xs text-gray-500 ml-1 capitalize">
            {getAccountTypeLabel()}
          </span>
        </div>
      </div>
    </button>
  );
};

export const AccountPopup: React.FC<AccountPopupProps> = ({ isOpen, onClose, anchorEl }) => {
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, logout, logoutAll } = useAuth();
  const { currentAccount, accounts } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
        event.target !== anchorEl) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen || !anchorEl) return null;

  // Calculate position based on anchor element
  const anchorRect = anchorEl.getBoundingClientRect();
  const popupStyle = {
    top: `${anchorRect.bottom + 10}px`,
    right: `${window.innerWidth - anchorRect.right}px`,
  };

  const handleSwitchAccount = (accountId: string) => {
    // Navigate to the account page instead of opening in a new tab
    navigate(`/app/${accountId}`);
    onClose();
  };

  const handleLogout = async () => {
    if (currentAccount) {
      setLoading(true);
      await logout(currentAccount?.id);
      setLoading(false);
      onClose();
    }
  };

  const handleLogoutAll = async () => {
    setLoading(true);
    await logoutAll();
    setLoading(false);
    onClose();
  };

  const handleAddAccount = () => {
    // Redirect to login page instead of directly to OAuth sign-in
    navigate('/login');
    onClose();
  };

  const getAccountStatusInfo = (account: Account) => {
    const statusInfo = {
      color: account.status === 'active' ? 'bg-green-500' : 'bg-gray-400',
      label: account.status === 'active' ? 'Active' : 'Inactive',
      additional: null
    };

    // Add additional info for local accounts
    if (account.accountType === AccountType.Local) {
      if (account.security?.twoFactorEnabled) {
        return {
          ...statusInfo,
          additional: '2FA enabled'
        };
      }
    }

    return statusInfo;
  };

  const getSessionInfo = (account: Account) => {
    if (account.accountType === AccountType.Local) {
      const timeout = account.security?.sessionTimeout;
      return timeout ? `Session: ${timeout}s` : 'No session timeout';
    }

    // For OAuth accounts, we might not have session info
    return 'OAuth session';
  };

  const renderAccountInfo = () => {
    if (!isAuthenticated || !currentAccount) {
      return (
        <div className="text-center py-4">
          <div className="bg-gray-100 mx-auto rounded-full w-12 h-12 flex items-center justify-center mb-3">
            <UserCircle className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No accounts found</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            You haven't added any accounts yet
          </p>
          <button
            className="w-full py-2 px-4 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            onClick={handleAddAccount}
          >
            Add your first account
          </button>
        </div>
      );
    }

    const statusInfo = getAccountStatusInfo(currentAccount);

    return (
      <>
        <div className="flex items-start">
          <UserAvatar
            account={currentAccount}
            size="md"
            showProviderIcon={true}
          />
          <div className="flex-1 ml-3">
            <h2 className="text-lg font-medium">Hi, {currentAccount?.userDetails.name?.split(' ')[0] || 'User'}!</h2>
            <p className="text-sm text-gray-600 truncate">{currentAccount?.userDetails.email}</p>

            {/* Account type indicator */}
            <div className="flex items-center mt-1">
              {currentAccount.accountType === AccountType.Local ? (
                <Key size={12} className="text-gray-500" />
              ) : (
                <Shield size={12} className="text-gray-500" />
              )}
              <span className="text-xs text-gray-500 ml-1 capitalize">
                {currentAccount.accountType === AccountType.Local
                  ? 'Local account'
                  : `${currentAccount.provider} account`}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{getSessionInfo(currentAccount)}</span>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-1 ${statusInfo.color}`}></span>
            <span>{statusInfo.label}</span>
            {statusInfo.additional && (
              <span className="ml-2 text-blue-600">• {statusInfo.additional}</span>
            )}
          </div>
        </div>

        <button
          className="mt-3 w-full py-2 px-4 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          disabled={loading}
          onClick={() => navigate(`/app/${currentAccount!.id}/settings`)}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : (
            'Manage your Account'
          )}
        </button>
      </>
    );
  };

  const renderOtherAccounts = () => {
    if (!accounts || accounts.length <= 1) return null;

    // Filter out the current account ID and group by account type
    const otherAccounts = accounts.filter(account => account.id !== currentAccount?.id);

    if (otherAccounts.length === 0) return null;

    const localAccounts = otherAccounts.filter(account => account.accountType === AccountType.Local);
    const oauthAccounts = otherAccounts.filter(account => account.accountType === AccountType.OAuth);

    return (
      <>
        <button
          onClick={() => setShowAllAccounts(!showAllAccounts)}
          className="flex items-center justify-between w-full py-1 text-sm text-gray-700 hover:bg-gray-50 px-2 rounded"
        >
          <span>
            {showAllAccounts ? 'Hide' : 'Show'} more accounts ({otherAccounts.length})
          </span>
          {showAllAccounts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAllAccounts && (
          <div className="mt-2 space-y-1">
            {/* Local accounts section */}
            {localAccounts.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 px-2 py-1 flex items-center">
                  <Key size={10} className="mr-1" />
                  Local Accounts
                </div>
                {localAccounts.map((account) => (
                  <AccountListItem
                    key={account.id}
                    account={account}
                    onSelect={handleSwitchAccount}
                  />
                ))}
              </div>
            )}

            {/* OAuth accounts section */}
            {oauthAccounts.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 px-2 py-1 flex items-center">
                  <Shield size={10} className="mr-1" />
                  OAuth Accounts
                </div>
                {oauthAccounts.map((account) => (
                  <AccountListItem
                    key={account.id}
                    account={account}
                    onSelect={handleSwitchAccount}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      ref={popupRef}
      className="fixed shadow-lg bg-white border border-gray-200 w-80 z-50 rounded"
      style={popupStyle}
    >
      {/* Active account header */}
      <div className="p-4 border-b">
        {renderAccountInfo()}
      </div>

      {/* Account list section */}
      <div className="p-3">
        {renderOtherAccounts()}

        <button
          className="flex items-center w-full mt-2 p-2 hover:bg-gray-50 rounded text-gray-700 text-sm"
          onClick={handleAddAccount}
        >
          <PlusCircle size={16} className="mr-3" />
          {isAuthenticated ? 'Add another account' : 'Add an account'}
        </button>

        {isAuthenticated && (
          <div className="mt-3 pt-3 border-t">
            {accounts && accounts.length > 1 ? (
              <>
                <button
                  className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-gray-700 text-sm"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  <LogOut size={16} className="mr-3" />
                  Sign out of current account
                </button>
                <button
                  className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-gray-700 text-sm"
                  onClick={handleLogoutAll}
                  disabled={loading}
                >
                  <LogOut size={16} className="mr-3" />
                  Sign out of all accounts
                </button>
              </>
            ) : (
              <button
                className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-gray-700 text-sm"
                onClick={handleLogout}
                disabled={loading}
              >
                <LogOut size={16} className="mr-3" />
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};