import {
    Device,
    UserDetails,
    DeviceType,
    OsType
} from '../types/types.data.ts';

/**
 * Creates a new Device object with detected values
 * @param overrides Optional values to override detected defaults
 * @returns A new Device object
 */
export const createDevice = (overrides?: Partial<Device>): Device => {
    // Detect OS and device information if running in browser environment
    const detectDeviceInfo = (): {
        deviceType: DeviceType;
        os: OsType;
        version: string;
    } => {
        // If not in browser environment, return defaults
        if (typeof window === 'undefined' || !window.navigator) {
            return {
                deviceType: DeviceType.Web,
                os: OsType.Windows,
                version: '10.0'
            };
        }

        const ua = window.navigator.userAgent;

        // Detect device type
        let deviceType = DeviceType.Web;
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            deviceType = DeviceType.Mobile;
        } else if (/Electron|NW.js/i.test(ua) || (navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches) {
            deviceType = DeviceType.Desktop;
        }

        // Detect OS
        let os = OsType.Windows; // Default
        let version = '10.0';

        // Detect Windows
        if (/Windows/.test(ua)) {
            os = OsType.Windows;
            const matches = ua.match(/Windows NT ([0-9.]+)/);
            version = matches ? matches[1] : '10.0';
        }
        // Detect Android
        else if (/Android/.test(ua)) {
            os = OsType.Android;
            const matches = ua.match(/Android ([0-9.]+)/);
            version = matches ? matches[1] : '10.0';
        }
        // For other OSes, default to Windows (as per the provided enum)
        else {
            os = OsType.Windows;
        }

        return { deviceType, os, version };
    };

    const deviceInfo = detectDeviceInfo();

    const defaultDevice: Device = {
        id: crypto.randomUUID(),
        deviceType: deviceInfo.deviceType,
        os: deviceInfo.os,
    };

    return { ...defaultDevice, ...overrides };
};

// /**
//  * Creates a new LocalAccount
//  * @param params Required parameters for account creation
//  * @returns A new LocalAccount object
//  */
// export const createLocalAccount = (params: {
//     device: Device;
//     password: string;
//     userDetails: UserDetails;
// }): LocalAccount => {
//     const { device, password, userDetails } = params;

//     return {
//         id: crypto.randomUUID(),
//         created: new Date().toISOString(),
//         updated: new Date().toISOString(),
//         device,
//         accountType: AccountType.Local,
//         status: AccountStatus.Active,
//         userDetails,
//         security: {
//             password
//         }
//     };
// };

/**
 * Validates if user details are valid
 * @param userDetails The user details to validate
 * @returns Boolean indicating if details are valid
 */
export const validateUserDetails = (userDetails: Partial<UserDetails>): boolean => {
    return (
        !!userDetails.name &&
        !!userDetails.email &&
        typeof userDetails.name === 'string' &&
        typeof userDetails.email === 'string' &&
        userDetails.email.includes('@')
    );
};

/**
 * Validates if device information is valid
 * @param device The device to validate
 * @returns Boolean indicating if device is valid
 */
export const validateDevice = (device: Partial<Device>): boolean => {
    return (
        !!device.id &&
        !!device.deviceType &&
        !!device.os
    );
};