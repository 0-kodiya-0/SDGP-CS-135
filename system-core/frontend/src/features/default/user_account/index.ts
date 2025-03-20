export { AccountPopup } from "./components/AccountPopup.tsx";
export { UserAvatar } from "./components/UserAvatar.tsx";
export { usePopup } from "./hooks/usePop.ts";
export * from "./types/types.data.ts";


// Export the context and hooks
export { useAuth } from './contexts/AuthContext';
export { useAccount } from './contexts/AccountContext';

// Export components
export { ProtectedRoute, AccountRedirect } from '../../../ProtectedRoute.tsx';

// Export pages
export { default as LoginPage } from './pages/LoginPage';
export { default as SignupPage } from './pages/SignupPage';
export { default as AccountSettingsPage } from './pages/AccountSettingsPage';
export { default as AccountSelectionPage } from "./pages/AccountSelectionPage"

// Export context providers
export { AuthProvider } from './contexts/AuthContext';
export { AccountProvider } from './contexts/AccountContext';