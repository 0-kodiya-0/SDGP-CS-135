// utils.google.consent.ts
import { useRef } from "react";
import { useConsent } from "../../../shared/notifications";
import { PermissionError } from "./utils.google";

// Map service names to human-readable names for better consent UX
const serviceNames: Record<string, string> = {
    "calendar": "Calendar",
    "gmail": "Gmail",
    "drive": "Drive",
    "meet": "Meet",
    "people": "Contacts",
};

// Map scope levels to human-readable permissions for better consent UX
const scopeLevelDescriptions: Record<string, Record<string, string>> = {
    "calendar": {
        "readonly": "view your calendar events",
        "events": "create and modify calendar events",
        "full": "manage your calendars"
    },
    "gmail": {
        "readonly": "view your emails and labels",
        "send": "send emails on your behalf",
        "compose": "create and send emails on your behalf",
        "full": "manage your emails and labels"
    },
    "drive": {
        "readonly": "view your files",
        "file": "create and modify files",
        "full": "manage your files and folders, including sharing permissions"
    },
    "meet": {
        "readonly": "view your meetings",
        "full": "create and manage meetings"
    },
    "people": {
        "readonly": "view your contacts",
        "full": "manage your contacts and contact groups"
    }
};

/**
 * Creates a human-readable permission request description based on service and scope level
 */
export function createPermissionDescription(service: string, scopeLevel: string): string {
    const serviceName = serviceNames[service] || service;
    const scopeDescription =
        (scopeLevelDescriptions[service] && scopeLevelDescriptions[service][scopeLevel]) ||
        `access your ${serviceName} data`;

    return `${serviceName} (${scopeLevel}): ${scopeDescription}`;
}

/**
 * Interface to track in-flight permission requests
 */
interface PendingPermission {
    service: string;
    scopeLevel: string;
    promise: Promise<boolean>;
}

/**
 * Hook that combines the useConsent hook with Google API permission handling
 * With added deduplication of consent requests
 */
export function useGoogleConsent() {
    const { requestConsent } = useConsent();
    
    // Use a ref to maintain pending permission requests across renders
    const pendingPermissions = useRef<PendingPermission[]>([]);

    /**
     * Check if we already have a permission request in flight for this service/scope
     */
    const getExistingPermissionPromise = (service: string, scopeLevel: string): Promise<boolean> | null => {
        const existing = pendingPermissions.current.find(
            p => p.service === service && p.scopeLevel === scopeLevel
        );
        return existing ? existing.promise : null;
    };

    /**
     * Request user consent before redirecting to the Google permission page
     * With deduplication of redundant permission requests
     * 
     * @param permissionError The permission error from the Google API
     * @returns A promise that resolves when permission is granted or rejects when denied
     */
    const requestGooglePermission = async (permissionError: PermissionError): Promise<boolean> => {
        if (!permissionError || typeof permissionError.message !== 'object') {
            throw new Error('Invalid permission error');
        }

        let service = 'Google service';
        let scopeLevel = 'access';
        let description = 'This app needs additional permissions to access your Google data.';

        // Extract permission details if available
        if (permissionError.message.requiredPermission) {
            const { service: svc, scopeLevel: scope } = permissionError.message.requiredPermission;
            service = svc;
            scopeLevel = scope;

            // Create a more detailed description
            description = createPermissionDescription(service, scopeLevel);
        }

        // Check if we already have a pending request for this permission
        const existingPromise = getExistingPermissionPromise(service, scopeLevel);
        if (existingPromise) {
            console.log(`Reusing existing permission request for ${service} (${scopeLevel})`);
            return existingPromise;
        }

        // Create a new promise for this permission request
        const permissionPromise = new Promise<boolean>((resolve, reject) => {
            // Request user consent with our Consent UI system
            requestConsent({
                title: `Allow access to ${serviceNames[service] || service}?`,
                message: `This application needs permission to ${description} to complete your request.`
            })
                .then(() => {
                    // Remove from pending list when complete
                    pendingPermissions.current = pendingPermissions.current.filter(
                        p => !(p.service === service && p.scopeLevel === scopeLevel)
                    );
                    console.log(`User approved consent for ${service} (${scopeLevel})`);
                    resolve(true);
                })
                .catch((error) => {
                    // Remove from pending list when complete
                    pendingPermissions.current = pendingPermissions.current.filter(
                        p => !(p.service === service && p.scopeLevel === scopeLevel)
                    );
                    console.log(`User denied consent for ${service} (${scopeLevel})`);
                    reject(error);
                });
        });

        // Add to pending permissions
        pendingPermissions.current.push({
            service,
            scopeLevel,
            promise: permissionPromise
        });

        return permissionPromise;
    };

    return { requestGooglePermission };
}