import { Settings } from 'lucide-react';
import { MenuButton } from './MenuButton';
import { EnvironmentButton } from '../../features/default/environment';
import { usePopup, UserAvatar, AccountPopup } from '../../features/default/user_account';
import { NavbarSearch } from '../../features/shared/search';
import { useAccount } from '../../services/auth';

export function Navbar() {
  const accountPopup = usePopup();
  const { currentAccount, accountDetails } = useAccount();

  const handleUserCircleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    accountPopup.toggle(e.currentTarget);
  };

  const handleMenuToggle = (isOpen: boolean) => {
    // You can add additional logic when menu is toggled
    console.log('Menu is now', isOpen ? 'open' : 'closed');
  };

  // Create account display object for avatar
  const accountDisplay = currentAccount && accountDetails ? {
    id: currentAccount.accountId,
    name: accountDetails.name,
    email: accountDetails.email,
    imageUrl: accountDetails.imageUrl,
    provider: currentAccount.provider
  } : null;

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
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Settings className="w-5 h-5" />
          </button>
          <button
            className="p-1.5 hover:bg-gray-100 rounded relative"
            onClick={handleUserCircleClick}
            aria-label="User account menu"
          >
            {accountDisplay ? (
              <UserAvatar account={accountDisplay} size="sm" showProviderIcon={true} />
            ) : (
              <div className="w-5 h-5 flex items-center justify-center">
                <UserAvatar account={null} size="sm" />
              </div>
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