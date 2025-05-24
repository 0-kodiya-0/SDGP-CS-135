import { 
    AccountStatus, 
    AccountType, 
    LocalAccount, 
    SignupRequest, 
    LocalAuthRequest,
    PasswordResetRequest,
    PasswordChangeRequest,
    SetupTwoFactorRequest,
    VerifyTwoFactorRequest,
    LocalAccountDTO
} from '../account/Account.types';
import db from '../../config/db';
import { BadRequestError, NotFoundError, ValidationError, ApiErrorCode } from '../../types/response.types';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { toLocalAccount } from '../account/Account.utils';
import { sendPasswordResetEmail, sendVerificationEmail, sendPasswordChangedNotification } from '../email/Email.service';
import { authenticator } from 'otplib';
import { addUserNotification } from '../notifications/Notification.service';
import { ValidationUtils } from '../../utils/validation';

/**
 * Create a new local account
 */
export async function createLocalAccount(signupData: SignupRequest): Promise<LocalAccount> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateRequiredFields(signupData, ['firstName', 'lastName', 'email', 'password']);
    ValidationUtils.validateEmail(signupData.email);
    ValidationUtils.validatePasswordStrength(signupData.password);
    ValidationUtils.validateStringLength(signupData.firstName, 'First name', 1, 50);
    ValidationUtils.validateStringLength(signupData.lastName, 'Last name', 1, 50);
    
    if (signupData.username) {
        ValidationUtils.validateStringLength(signupData.username, 'Username', 3, 30);
    }
    
    // Check if email already exists in either local or OAuth accounts
    const existingLocalAccount = await models.accounts.LocalAccount.findOne({
        'userDetails.email': signupData.email
    });
    
    const existingOauthAccount = await models.accounts.OAuthAccount.findOne({
        'userDetails.email': signupData.email
    });
    
    if (existingLocalAccount || existingOauthAccount) {
        throw new BadRequestError('Email already in use', 400, ApiErrorCode.USER_EXISTS);
    }
    
    // Check if username exists (if provided)
    if (signupData.username) {
        const usernameExists = await models.accounts.LocalAccount.findOne({
            'userDetails.username': signupData.username
        });
        
        if (usernameExists) {
            throw new BadRequestError('Username already in use', 400, ApiErrorCode.USER_EXISTS);
        }
    }
    
    // Create account with validated fields
    const timestamp = new Date().toISOString();
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const newAccount = await models.accounts.LocalAccount.create({
        created: timestamp,
        updated: timestamp,
        accountType: AccountType.Local,
        status: AccountStatus.Unverified, // Start as unverified
        userDetails: {
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            name: `${signupData.firstName} ${signupData.lastName}`,
            email: signupData.email,
            username: signupData.username,
            birthdate: signupData.birthdate,
            emailVerified: false,
            verificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
            verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        security: {
            password: signupData.password, // Will be hashed by the model's pre-save hook
            twoFactorEnabled: false,
            sessionTimeout: 3600,
            autoLock: false,
            failedLoginAttempts: 0
        }
    });
    
    // Send verification email (async - don't wait for it)
    sendVerificationEmail(signupData.email, signupData.firstName, verificationToken).catch(err => {
        console.error('Failed to send verification email:', err);
    });
    
    return toLocalAccount(newAccount) as LocalAccountDTO;
}

/**
 * Authenticate a user with local credentials
 */
export async function authenticateLocalUser(authData: LocalAuthRequest): Promise<LocalAccount> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    if (!authData.email && !authData.username) {
        throw new BadRequestError('Email or username is required');
    }
    
    ValidationUtils.validateRequiredFields(authData, ['password']);
    
    if (authData.email) {
        ValidationUtils.validateEmail(authData.email);
    }
    
    if (authData.username) {
        ValidationUtils.validateStringLength(authData.username, 'Username', 3, 30);
    }
    
    // Find user by email or username
    const query = authData.email 
        ? { 'userDetails.email': authData.email }
        : { 'userDetails.username': authData.username };
    
    const account = await models.accounts.LocalAccount.findOne(query);
    
    if (!account) {
        throw new NotFoundError('Invalid email/username or password', 401, ApiErrorCode.AUTH_FAILED);
    }
    
    // Check if account is locked
    if (account.security.lockoutUntil && account.security.lockoutUntil > new Date()) {
        throw new ValidationError(
            `Account is temporarily locked. Try again later or reset your password.`,
            401,
            ApiErrorCode.AUTH_FAILED
        );
    }
    
    // Check if account is suspended
    if (account.status === AccountStatus.Suspended) {
        throw new ValidationError(
            'This account has been suspended. Please contact support.',
            401,
            ApiErrorCode.AUTH_FAILED
        );
    }
    
    // Check if account is unverified
    if (account.status === AccountStatus.Unverified || !account.userDetails.emailVerified) {
        throw new ValidationError(
            'Please verify your email address before logging in.',
            401,
            ApiErrorCode.AUTH_FAILED
        );
    }
    
    // Verify password
    const isPasswordValid = await account.comparePassword(authData.password);
    
    if (!isPasswordValid) {
        // Increment failed login attempts
        account.security.failedLoginAttempts = (account.security.failedLoginAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts
        if (account.security.failedLoginAttempts >= 5) {
            account.security.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            
            await account.save();
            
            throw new ValidationError(
                'Too many failed login attempts. Account locked for 15 minutes.',
                401,
                ApiErrorCode.AUTH_FAILED
            );
        }
        
        await account.save();
        
        throw new NotFoundError('Invalid email/username or password', 401, ApiErrorCode.AUTH_FAILED);
    }
    
    // Reset failed login attempts on successful login
    if (!account.security.failedLoginAttempts || account.security.failedLoginAttempts > 0) {
        account.security.failedLoginAttempts = 0;
        account.security.lockoutUntil = undefined;
        await account.save();
    }
    
    // Return account
    return toLocalAccount(account) as LocalAccountDTO;
}

/**
 * Verify a user's email address
 */
export async function verifyEmail(token: string): Promise<boolean> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateRequiredFields({ token }, ['token']);
    ValidationUtils.validateStringLength(token, 'Verification token', 10, 200);
    
    // Hash the token to compare with stored value
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find account with matching verification token
    const account = await models.accounts.LocalAccount.findOne({
        'userDetails.verificationToken': hashedToken,
        'userDetails.verificationExpires': { $gt: new Date() }
    });
    
    if (!account) {
        throw new ValidationError('Invalid or expired verification token', 400, ApiErrorCode.TOKEN_INVALID);
    }
    
    // Mark email as verified
    account.userDetails.emailVerified = true;
    account.status = AccountStatus.Active;
    account.userDetails.verificationToken = undefined;
    account.userDetails.verificationExpires = undefined;
    
    await account.save();
    
    // Add welcome notification
    await addUserNotification({
        accountId: account._id.toString(),
        title: 'Welcome!',
        message: 'Your email has been verified. Welcome to the platform!',
        type: 'success'
    });
    
    return true;
}

/**
 * Request a password reset
 */
export async function requestPasswordReset(data: PasswordResetRequest): Promise<boolean> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateRequiredFields(data, ['email']);
    ValidationUtils.validateEmail(data.email);
    
    // Find account by email
    const account = await models.accounts.LocalAccount.findOne({
        'userDetails.email': data.email
    });
    
    // If no account found, we still return success (security through obscurity)
    // This prevents user enumeration
    if (!account) {
        return true;
    }
    
    // Generate reset token
    const resetToken = await account.generatePasswordResetToken();
    
    // Send password reset email (async - don't wait for it)
    sendPasswordResetEmail(
        account.userDetails.email as string,
        account.userDetails.firstName || account.userDetails.name.split(' ')[0],
        resetToken
    ).catch(err => {
        console.error('Failed to send password reset email:', err);
    });
    
    return true;
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateRequiredFields({ token, newPassword }, ['token', 'newPassword']);
    ValidationUtils.validateStringLength(token, 'Reset token', 10, 200);
    ValidationUtils.validatePasswordStrength(newPassword);
    
    // Hash the token to compare with stored value
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find account with matching reset token that hasn't expired
    const account = await models.accounts.LocalAccount.findOne({
        'security.passwordResetToken': hashedToken,
        'security.passwordResetExpires': { $gt: new Date() }
    });
    
    if (!account) {
        throw new ValidationError('Password reset token is invalid or has expired', 400, ApiErrorCode.TOKEN_INVALID);
    }
    
    // Check if new password matches any of the previous passwords
    if (account.security.previousPasswords && account.security.previousPasswords.length > 0) {
        // Check each previous password
        const isReused = await Promise.all(
            account.security.previousPasswords.map(oldHash => 
                bcrypt.compare(newPassword, oldHash)
            )
        ).then(results => results.some(result => result === true));
        
        if (isReused) {
            throw new ValidationError(
                'New password cannot be the same as any of your previous passwords',
                400,
                ApiErrorCode.VALIDATION_ERROR
            );
        }
    }
    
    // Reset the password
    await account.resetPassword(newPassword);
    
    // Send notification email (async - don't wait)
    sendPasswordChangedNotification(
        account.userDetails.email as string,
        account.userDetails.firstName || account.userDetails.name.split(' ')[0]
    ).catch(err => {
        console.error('Failed to send password change notification:', err);
    });
    
    // Add notification
    await addUserNotification({
        accountId: account._id.toString(),
        title: 'Password Reset',
        message: 'Your password has been reset successfully.',
        type: 'info'
    });
    
    return true;
}

/**
 * Change password (when user is logged in)
 */
export async function changePassword(accountId: string, data: PasswordChangeRequest): Promise<boolean> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateObjectId(accountId, 'Account ID');
    ValidationUtils.validateRequiredFields(data, ['oldPassword', 'newPassword']);
    ValidationUtils.validatePasswordStrength(data.newPassword);
    
    // Find account by ID
    const account = await models.accounts.LocalAccount.findById(accountId);
    
    if (!account) {
        throw new NotFoundError('Account not found', 404, ApiErrorCode.USER_NOT_FOUND);
    }
    
    // Verify current password
    const isCurrentPasswordValid = await account.comparePassword(data.oldPassword);
    
    if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect', 401, ApiErrorCode.AUTH_FAILED);
    }
    
    // Check if new password matches any of the previous passwords
    if (account.security.previousPasswords && account.security.previousPasswords.length > 0) {
        const isReused = await Promise.all(
            account.security.previousPasswords.map(oldHash => 
                bcrypt.compare(data.newPassword, oldHash)
            )
        ).then(results => results.some(result => result === true));
        
        if (isReused) {
            throw new ValidationError(
                'New password cannot be the same as any of your previous 5 passwords',
                400,
                ApiErrorCode.VALIDATION_ERROR
            );
        }
    }
    
    // Change the password
    await account.resetPassword(data.newPassword);
    
    // Send notification email
    sendPasswordChangedNotification(
        account.userDetails.email as string,
        account.userDetails.firstName || account.userDetails.name.split(' ')[0]
    ).catch(err => {
        console.error('Failed to send password change notification:', err);
    });
    
    // Add notification
    await addUserNotification({
        accountId: account._id.toString(),
        title: 'Password Changed',
        message: 'Your password has been changed successfully.',
        type: 'info'
    });
    
    return true;
}

/**
 * Set up two-factor authentication
 */
export async function setupTwoFactor(accountId: string, data: SetupTwoFactorRequest): Promise<{ secret?: string, qrCodeUrl?: string }> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateObjectId(accountId, 'Account ID');
    ValidationUtils.validateRequiredFields(data, ['password', 'enableTwoFactor']);
    
    // Find account by ID
    const account = await models.accounts.LocalAccount.findById(accountId);
    
    if (!account) {
        throw new NotFoundError('Account not found', 404, ApiErrorCode.USER_NOT_FOUND);
    }
    
    // Verify password before enabling/disabling 2FA
    const isPasswordValid = await account.comparePassword(data.password);
    
    if (!isPasswordValid) {
        throw new ValidationError('Password is incorrect', 401, ApiErrorCode.AUTH_FAILED);
    }
    
    // Enable or disable 2FA
    if (data.enableTwoFactor) {
        // Generate new secret if it doesn't exist or is being reset
        if (!account.security.twoFactorSecret) {
            const secret = authenticator.generateSecret();
            account.security.twoFactorSecret = secret;
            
            // Generate backup codes (10 codes, 8 chars each)
            const backupCodes = Array(10).fill(0).map(() => 
                crypto.randomBytes(4).toString('hex')
            );
            
            // Hash the backup codes before storing
            account.security.twoFactorBackupCodes = await Promise.all(
                backupCodes.map(async (code) => {
                    const salt = await bcrypt.genSalt(10);
                    return bcrypt.hash(code, salt);
                })
            );
            
            await account.save();
            
            // Generate QR code URL
            const appName = 'YourAppName';
            const accountName = account.userDetails.email || account.userDetails.username || accountId;
            const qrCodeUrl = authenticator.keyuri(accountName.toString(), appName, secret);
            
            // Add notification
            await addUserNotification({
                accountId: account._id.toString(),
                title: 'Two-Factor Authentication',
                message: 'Two-factor authentication has been set up. Be sure to save your backup codes.',
                type: 'info'
            });
            
            return {
                secret,
                qrCodeUrl
            };
        } else {
            // Secret already exists
            const appName = 'YourAppName';
            const accountName = account.userDetails.email || account.userDetails.username || accountId;
            const qrCodeUrl = authenticator.keyuri(accountName.toString(), appName, account.security.twoFactorSecret);
            
            return {
                secret: account.security.twoFactorSecret,
                qrCodeUrl
            };
        }
    } else {
        // Disable 2FA
        account.security.twoFactorEnabled = false;
        account.security.twoFactorSecret = undefined;
        account.security.twoFactorBackupCodes = undefined;
        
        await account.save();
        
        // Add notification
        await addUserNotification({
            accountId: account._id.toString(),
            title: 'Two-Factor Authentication',
            message: 'Two-factor authentication has been disabled.',
            type: 'info'
        });
        
        return {};
    }
}

/**
 * Verify and activate two-factor authentication
 */
export async function verifyAndEnableTwoFactor(accountId: string, token: string): Promise<boolean> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateObjectId(accountId, 'Account ID');
    ValidationUtils.validateRequiredFields({ token }, ['token']);
    ValidationUtils.validateStringLength(token, '2FA token', 6, 6); // TOTP codes are exactly 6 digits
    
    // Find account by ID
    const account = await models.accounts.LocalAccount.findById(accountId);
    
    if (!account || !account.security.twoFactorSecret) {
        throw new NotFoundError('Account not found or 2FA not set up', 404, ApiErrorCode.USER_NOT_FOUND);
    }
    
    // Verify token
    const isValid = authenticator.verify({
        token,
        secret: account.security.twoFactorSecret
    });
    
    if (!isValid) {
        throw new ValidationError('Invalid two-factor code', 401, ApiErrorCode.AUTH_FAILED);
    }
    
    // Enable 2FA
    account.security.twoFactorEnabled = true;
    await account.save();
    
    return true;
}

/**
 * Verify two-factor code during login
 */
export async function verifyTwoFactorLogin(accountId: string, data: VerifyTwoFactorRequest): Promise<boolean> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateObjectId(accountId, 'Account ID');
    ValidationUtils.validateRequiredFields(data, ['token']);
    ValidationUtils.validateStringLength(data.token, '2FA token', 6, 8); // TOTP or backup code
    
    // Find account by ID
    const account = await models.accounts.LocalAccount.findById(accountId);
    
    if (!account || !account.security.twoFactorEnabled || !account.security.twoFactorSecret) {
        throw new NotFoundError('Account not found or 2FA not enabled', 404, ApiErrorCode.USER_NOT_FOUND);
    }
    
    // Check if token is a backup code
    if (account.security.twoFactorBackupCodes && account.security.twoFactorBackupCodes.length > 0) {
        // Check if the token matches any backup code
        const backupCodeIndex = await Promise.all(
            account.security.twoFactorBackupCodes.map(async (hashedCode, index) => {
                const isMatch = await bcrypt.compare(data.token, hashedCode);
                return isMatch ? index : -1;
            })
        ).then(results => results.find(index => index !== -1));
        
        if (backupCodeIndex !== undefined && backupCodeIndex >= 0) {
            // Remove used backup code
            account.security.twoFactorBackupCodes?.splice(backupCodeIndex, 1);
            await account.save();
            
            // Add notification about backup code usage
            await addUserNotification({
                accountId: account._id.toString(),
                title: 'Backup Code Used',
                message: 'You used a backup code to sign in. Only ' + 
                         (account.security.twoFactorBackupCodes?.length || 0) + 
                         ' backup codes remain.',
                type: 'warning'
            });
            
            return true;
        }
    }
    
    // Verify regular token
    const isValid = authenticator.verify({
        token: data.token,
        secret: account.security.twoFactorSecret
    });
    
    if (!isValid) {
        throw new ValidationError('Invalid two-factor code', 401, ApiErrorCode.AUTH_FAILED);
    }
    
    return true;
}

/**
 * Generate new backup codes for two-factor authentication
 */
export async function generateNewBackupCodes(accountId: string, password: string): Promise<string[]> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateObjectId(accountId, 'Account ID');
    ValidationUtils.validateRequiredFields({ password }, ['password']);
    
    // Find account by ID
    const account = await models.accounts.LocalAccount.findById(accountId);
    
    if (!account || !account.security.twoFactorEnabled) {
        throw new NotFoundError('Account not found or 2FA not enabled', 404, ApiErrorCode.USER_NOT_FOUND);
    }
    
    // Verify password
    const isPasswordValid = await account.comparePassword(password);
    
    if (!isPasswordValid) {
        throw new ValidationError('Password is incorrect', 401, ApiErrorCode.AUTH_FAILED);
    }
    
    // Generate new backup codes (10 codes, 8 chars each)
    const backupCodes = Array(10).fill(0).map(() => 
        crypto.randomBytes(4).toString('hex')
    );
    
    // Hash the backup codes before storing
    account.security.twoFactorBackupCodes = await Promise.all(
        backupCodes.map(async (code) => {
            const salt = await bcrypt.genSalt(10);
            return bcrypt.hash(code, salt);
        })
    );
    
    await account.save();
    
    // Add notification
    await addUserNotification({
        accountId: account._id.toString(),
        title: 'New Backup Codes',
        message: 'New backup codes have been generated for your account.',
        type: 'info'
    });
    
    // Return plain text codes to show to user
    return backupCodes;
}

/**
 * Convert OAuth account to local account (set password)
 */
export async function convertOAuthToLocalAccount(oauthAccountId: string, password: string, username?: string): Promise<LocalAccount> {
    const models = await db.getModels();
    
    // UPDATED: Use ValidationUtils for validation
    ValidationUtils.validateObjectId(oauthAccountId, 'OAuth Account ID');
    ValidationUtils.validateRequiredFields({ password }, ['password']);
    ValidationUtils.validatePasswordStrength(password);
    
    if (username) {
        ValidationUtils.validateStringLength(username, 'Username', 3, 30);
    }
    
    // Find OAuth account by ID
    const oauthAccount = await models.accounts.OAuthAccount.findById(oauthAccountId);
    
    if (!oauthAccount) {
        throw new NotFoundError('Account not found', 404, ApiErrorCode.USER_NOT_FOUND);
    }
    
    // If username provided, check if it's already taken
    if (username) {
        const usernameExists = await models.accounts.LocalAccount.findOne({
            'userDetails.username': username
        });
        
        if (usernameExists) {
            throw new BadRequestError('Username already in use', 400, ApiErrorCode.USER_EXISTS);
        }
    }
    
    // Prepare local account data
    const timestamp = new Date().toISOString();
    const nameParts = oauthAccount.userDetails.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Create a new local account with same email
    const localAccount = await models.accounts.LocalAccount.create({
        created: timestamp,
        updated: timestamp,
        accountType: AccountType.Local,
        status: AccountStatus.Active,
        userDetails: {
            firstName: firstName,
            lastName: lastName,
            name: oauthAccount.userDetails.name,
            email: oauthAccount.userDetails.email,
            imageUrl: oauthAccount.userDetails.imageUrl,
            username: username,
            emailVerified: true, // OAuth emails are verified
        },
        security: {
            password: password, // Will be hashed by pre-save hook
            twoFactorEnabled: false,
            sessionTimeout: oauthAccount.security.sessionTimeout || 3600,
            autoLock: oauthAccount.security.autoLock || false,
            failedLoginAttempts: 0
        },
        // Can copy other relevant fields from OAuth account
    });
    
    // Add notification
    await addUserNotification({
        accountId: localAccount._id.toString(),
        title: 'Account Converted',
        message: 'Your account has been converted to a local account. You can now log in with your email and password.',
        type: 'info'
    });
    
    return toLocalAccount(localAccount) as LocalAccountDTO;
}