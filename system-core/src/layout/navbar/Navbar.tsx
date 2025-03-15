import { Menu, Settings, UserCircle } from 'lucide-react';
import { NavbarSearch } from '../../features/shared/search';
import { EnvironmentButton } from '../../features/default/environment';
import { LocalAccount, OAuthAccount } from '../../features/default/user_account/types/types.data';
import { AccountPopup, usePopup, UserAvatar } from '../../features/default/user_account';

interface NavbarProps {
  activeAccount: LocalAccount | OAuthAccount;
}

export function Navbar({ activeAccount }: NavbarProps) {
  const accountPopup = usePopup();

  const handleUserCircleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    accountPopup.toggle(e.currentTarget);
  };

  return (
    <>
      <nav className="h-12 border-b flex items-center bg-white">
        {/* Menu button - aligns with ProjectSidebar */}
        <div className="w-16 flex items-center justify-center flex-shrink-0">
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Environment section - aligns with ProjectList */}
        <div className={'w-64 border-x flex items-center h-full transition-all duration-200 ease-in-out'}>
          <EnvironmentButton activeAccount={activeAccount} />
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
            {activeAccount ? (
              <UserAvatar account={activeAccount} size="sm" showProviderIcon={true} />
            ) : (
              <div className="w-5 h-5 flex items-center justify-center">
                <UserCircle className="w-5 h-5" />
              </div>
            )}
          </button>
        </div>
      </nav>

      <AccountPopup
        isOpen={accountPopup.isOpen}
        onClose={accountPopup.close}
        anchorEl={accountPopup.anchorEl}
        activeAccount={activeAccount}
      />
    </>
  );
}