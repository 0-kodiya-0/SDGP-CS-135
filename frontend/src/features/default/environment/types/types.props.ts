import { Environment } from "./types.data.ts";

export interface EnvironmentCardProps {
    environment: Environment;
    isSelected: boolean;
    onSelect: () => void;
}

export interface EnvironmentListProps {
    environments: Environment[];
    selectedEnvironment: Environment | null;
    onEnvironmentSelect: (environment: Environment) => void;
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

export interface LoadingViewProps {
    getSliderStyle: () => React.CSSProperties;
}

export interface ErrorViewProps extends LoadingViewProps {
    onClick: (e: React.MouseEvent) => void;
    error: string;
}

export interface EnvironmentCardProps {
    environment: Environment;
    isSelected: boolean;
    onSelect: () => void;
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