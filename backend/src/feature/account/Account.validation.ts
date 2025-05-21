import { AccountValidationError } from "../../types/response.types";
import {
    UserDetails,
    BaseAccount,
    AccountType,
    AccountStatus,
    OAuthAccount,
    OAuthProviders,
    OAuthScopeInfo,
    LocalAccount,
    SignupRequest,
    LocalAuthRequest,
    PasswordChangeRequest
} from "./Account.types";

export function validateUserDetails(obj?: Partial<UserDetails>): obj is UserDetails {
    return (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.name === "string" &&
        (obj.email === undefined || typeof obj.email === "string") &&
        (obj.imageUrl === undefined || typeof obj.imageUrl === "string") &&
        (obj.username === undefined || typeof obj.username === "string") &&
        (obj.firstName === undefined || typeof obj.firstName === "string") &&
        (obj.lastName === undefined || typeof obj.lastName === "string") &&
        (obj.birthdate === undefined || typeof obj.birthdate === "string") &&
        (obj.emailVerified === undefined || typeof obj.emailVerified === "boolean")
    );
}

// Validation function for OAuth scope info
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

export function validateLocalAccount(obj?: Omit<Partial<LocalAccount>, "id">): obj is Omit<LocalAccount, "id"> {
    if (
        obj !== null &&
        validateBaseAccount(obj as LocalAccount) &&
        obj?.accountType === AccountType.Local &&
        typeof obj.security === "object" &&
        typeof obj.security.password === "string"
    ) {
        return true;
    }
    throw new AccountValidationError("Invalid LocalAccount object");
}

// Validate signup request
export function validateSignupRequest(request: SignupRequest): string | null {
    // Check if fields are present
    if (!request.firstName || !request.lastName || !request.email || !request.password || !request.confirmPassword) {
        return "All required fields must be provided";
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
        return "Invalid email format";
    }
    
    // Validate password strength
    if (!validatePasswordStrength(request.password)) {
        return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
    }
    
    // Validate password confirmation
    if (request.password !== request.confirmPassword) {
        return "Passwords do not match";
    }
    
    // Validate terms agreement
    if (!request.agreeToTerms) {
        return "You must agree to the terms and conditions";
    }
    
    // Validate username if provided
    if (request.username && request.username.length < 3) {
        return "Username must be at least 3 characters";
    }
    
    // If everything passes, return null (no error)
    return null;
}

// Validate login request
export function validateLoginRequest(request: LocalAuthRequest): string | null {
    // Either email or username must be provided
    if (!request.email && !request.username) {
        return "Email or username is required";
    }
    
    // Password must be provided
    if (!request.password) {
        return "Password is required";
    }
    
    // If email is provided, validate format
    if (request.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(request.email)) {
            return "Invalid email format";
        }
    }
    
    return null;
}

// Validate password change request
export function validatePasswordChangeRequest(request: PasswordChangeRequest): string | null {
    // Check if required fields are present
    if (!request.oldPassword || !request.newPassword || !request.confirmPassword) {
        return "All fields are required";
    }
    
    // Check if new password is different from old password
    if (request.oldPassword === request.newPassword) {
        return "New password must be different from the current password";
    }
    
    // Validate password strength
    if (!validatePasswordStrength(request.newPassword)) {
        return "New password must be at least 8 characters and include uppercase, lowercase, number, and special character";
    }
    
    // Validate password confirmation
    if (request.newPassword !== request.confirmPassword) {
        return "New passwords do not match";
    }
    
    return null;
}

// Validate password strength
export function validatePasswordStrength(password: string): boolean {
    // At least 8 characters
    if (password.length < 8) {
        return false;
    }
    
    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return false;
    }
    
    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return false;
    }
    
    // At least one number
    if (!/[0-9]/.test(password)) {
        return false;
    }
    
    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return false;
    }
    
    return true;
}