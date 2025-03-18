import { UserDetails, TokenDetails, BaseAccount, AccountType, AccountStatus, OAuthAccount, OAuthProviders } from "./Account.types";
import { findUser } from "./Account.utils";

export const userExists = async (email: string, provider: OAuthProviders): Promise<boolean> => {
    const user = await findUser(email, provider);
    return user !== null;
};

export function validateUserDetails(obj?: Partial<UserDetails>): obj is UserDetails {
    return (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.name === "string" &&
        (obj.email === undefined || typeof obj.email === "string") &&
        (obj.imageUrl === undefined || typeof obj.imageUrl === "string")
    );
}

export function validateTokenDetails(obj?: Partial<TokenDetails>): obj is TokenDetails {
    return (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.accessToken === "string" &&
        typeof obj.refreshToken === "string"
    );
}

// export function validateDevicePreferences(obj?: Partial<DevicePreferences>): obj is DevicePreferences {
//     return (
//         obj !== null &&
//         typeof obj === "object" &&
//         typeof obj.theme === "string" &&
//         typeof obj.language === "string" &&
//         typeof obj.notifications === "boolean"
//     );
// }

// export function validateDevice(obj?: Partial<Device>): obj is Device {
//     if (
//         obj !== null &&
//         typeof obj === "object" &&
//         typeof obj.id === "string" &&
//         typeof obj.installationDate === "string" &&
//         typeof obj.name === "string" &&
//         typeof obj.os === "string" &&
//         typeof obj.version === "string" &&
//         typeof obj.uniqueIdentifier === "string" &&
//         validateDevicePreferences(obj.preferences)
//     ) {
//         return true;
//     }
//     throw new Error("Invalid Device object");
// }

export function validateBaseAccount(obj?: Partial<BaseAccount>): obj is BaseAccount {
    if (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.id === "string" &&
        typeof obj.created === "string" &&
        typeof obj.updated === "string" &&
        // validateDevice(obj.device) &&
        obj.accountType &&
        Object.values(AccountType).includes(obj.accountType) &&
        obj.status &&
        Object.values(AccountStatus).includes(obj.status) &&
        validateUserDetails(obj.userDetails)
    ) {
        return true;
    }

    throw new Error("Invalid BaseAccount object");
}

export function validateOAuthAccount(obj?: Partial<OAuthAccount>): obj is OAuthAccount {
    if (
        obj !== null &&
        validateBaseAccount(obj as OAuthAccount) &&
        obj?.accountType === AccountType.OAuth &&
        obj.provider &&
        Object.values(OAuthProviders).includes(obj.provider) &&
        typeof obj.security === "object" &&
        validateTokenDetails(obj.tokenDetails)
    ) {
        return true;
    }
    throw new Error("Invalid OAuthAccount object");
}