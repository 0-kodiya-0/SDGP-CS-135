import { ActiveAccount } from "../../user_account/index.ts";
import { Environment } from "./types.data.ts";

export interface EnvironmentButtonProps {
    activeEnvironment: Environment | null;
    activeAccount: ActiveAccount
}

export interface EnvironmentSliderProps {
    onClose: () => void;
}

export interface UpdateEnvironmentInputProps {
    activeEnvironment: Environment;
    onCancel: () => void;
}

export interface EnvironmentSetupState {
    selectedEnvironment: Environment;
    isLoading: boolean;
    error: Error | null;
    status: 'idle' | 'loading' | 'success' | 'error';
}

export interface UseEnvironmentFeatureProps {
    selectedEnvironment: Environment;
    isExpanded?: boolean;
}

export interface EnvironmentError {
    isError: boolean;
    message: string;
}

export interface CreateEnvironmentState {
    isCreating: boolean;
    newEnvName: string;
}

export type GetSliderStyle = () => React.CSSProperties;

// LoadingView Props
export interface LoadingViewProps {
    getSliderStyle: GetSliderStyle;
}

// ErrorView Props
export interface ErrorViewProps {
    onClick: (e: React.MouseEvent) => void;
    getSliderStyle: GetSliderStyle;
    error: string;
}

export interface EnvironmentCardProps {
    environment: Environment;
    isSelected: boolean;
    onSelect: () => void;
}

export interface CreateEnvironmentInputProps {
    activeAccount: ActiveAccount;
    onCancel: () => void;
}

export interface CreateEnvironmentButtonProps {
    onClick: () => void;
    isCreating: boolean;
}

export interface EnvironmentListProps {
    environments: Environment[];
    selectedEnvironment: Environment | null;
    onEnvironmentSelect: (environment: Environment) => void;
}