import React from 'react';
import { Settings } from 'lucide-react';
import { MenuButton } from './MenuButton';
import { EnvironmentButton } from '../../features/default/environment';
import { AccountPopup, useAccount, usePopup, UserAvatar } from '../../features/default/user_account';
import { NavbarSearch } from '../../features/shared/search';
import { NotificationBell } from '../../features/shared/notifications';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const accountPopup = usePopup();
  const navigate = useNavigate();
  const { currentAccount, isLoading } = useAccount();

  const handleUserCircleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    accountPopup.toggle(e.currentTarget);
  };

  const handleMenuToggle = (isOpen: boolean) => {
    // You can add additional logic when menu is toggled
    console.log('Menu is now', isOpen ? 'open' : 'closed');
  };

  const handleSettingPageOpen = () => {
    if (!currentAccount?.id) return;
    navigate(`/app/${currentAccount?.id}/settings`);
  }

  return (
    <>
      <nav className="h-12 border-b flex items-center bg-white">
        {/* Menu button component */}
        <MenuButton onMenuToggle={handleMenuToggle} />

        {/* Environment section */}
        <div className="w-64 border-x flex items-center h-full transition-all duration-200 ease-in-out">
          <EnvironmentButton className="w-full" />
        </div>

        {/* Main content section */}
        <div className="flex-1 flex items-center justify-end px-4 space-x-2">
          <NavbarSearch />
          <button
            className="p-1.5 hover:bg-gray-100 rounded"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" onClick={handleSettingPageOpen} />
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          <button
            className="p-1.5 hover:bg-gray-100 rounded relative"
            onClick={handleUserCircleClick}
            aria-label="User account menu"
          >
            {isLoading ? (
              <div className="w-5 h-5 animate-pulse bg-gray-200 rounded-full"></div>
            ) : (
              <UserAvatar
                account={currentAccount}
                size="sm"
                showProviderIcon={true}
              />
            )}
          </button>
        </div>
      </nav>

      <AccountPopup
        isOpen={accountPopup.isOpen}
        onClose={accountPopup.close}
        anchorEl={accountPopup.anchorEl}
      />
    </>
  );
}

export default Navbar;