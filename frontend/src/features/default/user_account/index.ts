// Components
export { AccountPopup } from "./components/AccountPopup";
export { UserAvatar } from "./components/UserAvatar";
export { GooglePermissionRequest } from "./components/GooglePermissionRequest";
export { PasswordStrengthIndicator, usePasswordValidation } from "./components/PasswordStrengthIndicator";
export { default as BackupCodesManager } from "./components/BackupCodesManager";
export { default as TwoFactorSetup } from "./components/TwoFactorSetup";

// Types
export * from "./types/types.data";
export * from "./types/types.google.api";
export * from "./types/types.localAuth.api";

// Hooks
export { usePopup } from "./hooks/usePop";

// Contexts and Hooks
export { useAuth } from './contexts/AuthContext';
export { useAccount } from './contexts/AccountContext';
export { useGooglePermissions } from "./contexts/GooglePermissionContext";

// Pages
export { default as AccountSettingsPage } from './pages/AccountSettingsPage';
export { default as AccountSelectionPage } from "./pages/AccountSelectionPage";
export { default as TokenRevocationWarningPage } from "./pages/TokenRevocationWarningPage";

// Context Providers
export { AuthProvider } from './contexts/AuthContext';
export { AccountProvider } from './contexts/AccountContext';
export { GooglePermissionsProvider } from "./contexts/GooglePermissionContext";

// API
export { LocalAuthAPI } from "./api/localAuth.api";

// Utils
export * from "./utils/utils.google";
export * from "./utils/account.utils";