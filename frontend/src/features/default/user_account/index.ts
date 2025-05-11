export { AccountPopup } from "./components/AccountPopup.tsx";
export { UserAvatar } from "./components/UserAvatar.tsx";
export { GooglePermissionRequest } from "./components/GooglePermissionRequest.tsx";

export * from "./types/types.data.ts";
export * from "./types/types.google.api.ts";

export { usePopup } from "./hooks/usePop.ts";

// Export the context and hooks
export { useAuth } from './contexts/AuthContext';
export { useAccount } from './contexts/AccountContext';
export { useGooglePermissions } from "./contexts/GooglePermissionContext.tsx";

// Export pages
export { default as AccountSettingsPage } from './pages/AccountSettingsPage';
export { default as AccountSelectionPage } from "./pages/AccountSelectionPage";

// Export context providers
export { AuthProvider } from './contexts/AuthContext';
export { AccountProvider } from './contexts/AccountContext';
export { GooglePermissionsProvider } from "./contexts/GooglePermissionContext.tsx";

export * from "./utils/utils.google.ts"