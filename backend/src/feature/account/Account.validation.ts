import { AccountValidationError } from "../../types/response.types";
import { ValidationUtils } from "../../utils/validation";
import {
    UserDetails,
    Account,
    AccountType,
    AccountStatus,
    OAuthProviders,
    SecuritySettings,
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

export function validateSecuritySettings(obj?: Partial<SecuritySettings>, accountType?: AccountType): obj is SecuritySettings {
    if (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.twoFactorEnabled === "boolean" &&
        typeof obj.sessionTimeout === "number" &&
        typeof obj.autoLock === "boolean"
    ) {
        // For local accounts, password is required
        if (accountType === AccountType.Local && !obj.password) {
            throw new AccountValidationError("Local accounts must have a password");
        }
        
        // For OAuth accounts, password should not be present
        if (accountType === AccountType.OAuth && obj.password) {
            throw new AccountValidationError("OAuth accounts should not have a password");
        }
        
        return true;
    }
    
    throw new AccountValidationError("Invalid SecuritySettings object");
}

export function validateAccount(obj?: Omit<Partial<Account>, "id">): obj is Omit<Account, "id"> {
    if (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.created === "string" &&
        typeof obj.updated === "string" &&
        obj.accountType &&
        Object.values(AccountType).includes(obj.accountType) &&
        obj.status &&
        Object.values(AccountStatus).includes(obj.status) &&
        validateUserDetails(obj.userDetails) &&
        validateSecuritySettings(obj.security, obj.accountType)
    ) {
        // Validate OAuth accounts have provider
        if (obj.accountType === AccountType.OAuth && !obj.provider) {
            throw new AccountValidationError("OAuth accounts must have a provider");
        }
        
        // Validate provider is valid
        if (obj.provider && !Object.values(OAuthProviders).includes(obj.provider)) {
            throw new AccountValidationError("Invalid OAuth provider");
        }
        
        // Validate local accounts don't have provider
        if (obj.accountType === AccountType.Local && obj.provider) {
            throw new AccountValidationError("Local accounts should not have a provider");
        }
        
        return true;
    }

    throw new AccountValidationError("Invalid Account object");
}

// Validate signup request
export function validateSignupRequest(request: SignupRequest): string | null {
    // Check if fields are present
    ValidationUtils.validateRequiredFields(request, ['firstName', 'lastName', 'email', 'password', 'confirmPassword']);
    
    // Validate email format
    ValidationUtils.validateEmail(request.email);
    
    // Validate password strength
    try {
        ValidationUtils.validatePasswordStrength(request.password);
    } catch (error) {
        return error instanceof Error ? error.message : 'Invalid password';
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
    if (request.username) {
        ValidationUtils.validateStringLength(request.username, 'Username', 3);
    }
    
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
    try {
        ValidationUtils.validatePasswordStrength(request.newPassword);
    } catch (error) {
        return error instanceof Error ? error.message : 'Invalid new password';
    }
    
    // Validate password confirmation
    if (request.newPassword !== request.confirmPassword) {
        return "New passwords do not match";
    }
    
    return null;
}