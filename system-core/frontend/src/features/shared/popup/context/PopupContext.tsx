import React, { createContext, useState, useContext, ReactNode, ComponentType } from 'react';

// Interface for the base popup props that all popups will have
export interface BasePopupProps {
    onClose: () => void;
}

// Define the popup item type that will be stored in state
// We use a more specific type than 'any' for better type safety
interface PopupItem {
    id: number;
    component: ComponentType<BasePopupProps>;
    props: Record<string, unknown>;
    createdAt: number; // Timestamp to help with re-renders
}

// This is the context type that's exposed to consumers
interface PopupContextType {
    popups: ReadonlyArray<PopupItem>;
    showPopup: <T extends BasePopupProps>(
        component: ComponentType<T>,
        props: Omit<T, 'onClose'>
    ) => number;
    hidePopup: (id: number) => void;
    closeLatestPopup: () => void;
    closeAllPopups: () => void;
}

// Create the context with default values
const PopupContext = createContext<PopupContextType | undefined>(undefined);

// Props for the PopupProvider
interface PopupProviderProps {
    children: ReactNode;
}

// Popup provider component
export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
    const [popups, setPopups] = useState<PopupItem[]>([]);

    // Add a new popup to the stack with generic typing
    const showPopup = <T extends BasePopupProps>(
        component: ComponentType<T>,
        props: Omit<T, 'onClose'>
    ): number => {
        const id = Date.now(); // Simple unique ID

        // We know this type casting is safe because T extends BasePopupProps
        // and we're going to provide the onClose prop when rendering
        const popupItem: PopupItem = {
            id,
            component: component as ComponentType<BasePopupProps>,
            props: props as Record<string, unknown>,
            createdAt: Date.now() // Adding a timestamp to help with re-renders
        };

        setPopups(current => [...current, popupItem]);
        return id;
    };

    // Remove a popup by ID
    const hidePopup = (id: number): void => {
        setPopups(current => current.filter(popup => popup.id !== id));
    };

    // Close the most recent popup
    const closeLatestPopup = (): void => {
        setPopups(current => current.slice(0, -1));
    };

    // Close all popups
    const closeAllPopups = (): void => {
        setPopups([]);
    };

    return (
        <PopupContext.Provider
            value={{
                popups,
                showPopup,
                hidePopup,
                closeLatestPopup,
                closeAllPopups
            }}
        >
            {children}
        </PopupContext.Provider>
    );
};

// Custom hook for using the popup context
export const usePopup = (): PopupContextType => {
    const context = useContext(PopupContext);
    if (!context) {
        throw new Error('usePopup must be used within a PopupProvider');
    }
    return context;
};

export default PopupContext;