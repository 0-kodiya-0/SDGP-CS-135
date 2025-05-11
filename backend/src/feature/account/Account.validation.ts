import { AccountValidationError } from "../../types/response.types";
import { UserDetails, BaseAccount, AccountType, AccountStatus, OAuthAccount, OAuthProviders, OAuthScopeInfo } from "./Account.types";

export function validateUserDetails(obj?: Partial<UserDetails>): obj is UserDetails {
    return (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.name === "string" &&
        (obj.email === undefined || typeof obj.email === "string") &&
        (obj.imageUrl === undefined || typeof obj.imageUrl === "string")
    );
}

// New validation function for OAuth scope info
export function validateOAuthScopeInfo(obj?: Partial<OAuthScopeInfo>): obj is OAuthScopeInfo {
    if (
        obj !== null &&
        typeof obj === "object" &&
        Array.isArray(obj.scopes) &&
        obj.scopes.every(scope => typeof scope === "string") &&
        typeof obj.lastUpdated === "string" &&
        !isNaN(Date.parse(obj.lastUpdated))
    ) {
        return true;
    }
    
    return false;
}

export function validateBaseAccount(obj?: Omit<Partial<BaseAccount>, "id">): obj is Omit<BaseAccount, "id"> {
    if (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.created === "string" &&
        typeof obj.updated === "string" &&
        obj.accountType &&
        Object.values(AccountType).includes(obj.accountType) &&
        obj.status &&
        Object.values(AccountStatus).includes(obj.status) &&
        validateUserDetails(obj.userDetails)
    ) {
        return true;
    }

    throw new AccountValidationError("Invalid BaseAccount object");
}

export function validateOAuthAccount(obj?: Omit<Partial<OAuthAccount>, "id">): obj is Omit<OAuthAccount, "id"> {
    if (
        obj !== null &&
        validateBaseAccount(obj as OAuthAccount) &&
        obj?.accountType === AccountType.OAuth &&
        obj.provider &&
        Object.values(OAuthProviders).includes(obj.provider) &&
        typeof obj.security === "object" &&
        // Optional validation for oauthScopes if present
        (obj.oauthScopes === undefined || validateOAuthScopeInfo(obj.oauthScopes))
    ) {
        return true;
    }
    throw new AccountValidationError("Invalid OAuthAccount object");
}