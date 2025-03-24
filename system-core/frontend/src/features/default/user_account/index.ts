export { AccountPopup } from "./components/AccountPopup.tsx";
export { UserAvatar } from "./components/UserAvatar.tsx";
export { default as AuthGuard } from "../../../pages/AuthGuard.tsx";

export * from "./types/types.data.ts";

export { usePopup } from "./hooks/usePop.ts";
export * from "./hooks/useToken.google.ts"


// Export the context and hooks
export { useAuth } from './contexts/AuthContext';
export { useAccount } from './contexts/AccountContext';

// Export pages
export { default as AccountSettingsPage } from './pages/AccountSettingsPage';
export { default as AccountSelectionPage } from "./pages/AccountSelectionPage"

// Export context providers
export { AuthProvider } from './contexts/AuthContext';
export { AccountProvider } from './contexts/AccountContext';

export * from "./utils/utils.google.consent.ts";
export * from "./utils/utils.google.ts"