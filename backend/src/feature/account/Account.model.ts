import mongoose, { Document, Schema } from 'mongoose';
import dbConfig from '../../config/db.config';
import { AccountStatus, AccountType, LocalAccount, OAuthAccount, OAuthProviders } from '../../feature/account/Account.types';
import bcrypt from 'bcrypt';
import crypto from "crypto";

// User details schema
const UserDetailsSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String, required: true },
    email: { type: String },
    imageUrl: { type: String },
    birthdate: { type: String },
    username: { type: String },
    emailVerified: { type: Boolean, default: false }
}, { _id: false });

// Base security settings schema
const BaseSecuritySettingsSchema = {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    twoFactorBackupCodes: { type: [String] },
    sessionTimeout: { type: Number, default: 3600 },
    autoLock: { type: Boolean, default: false }
};

// OAuth Security settings schema
const OAuthSecuritySettingsSchema = new Schema(BaseSecuritySettingsSchema, { _id: false });

// Local Security settings schema
const LocalSecuritySettingsSchema = new Schema({
    ...BaseSecuritySettingsSchema,
    password: { type: String, required: true },
    passwordSalt: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    lastPasswordChange: { type: Date },
    previousPasswords: { type: [String], default: [] },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date }
}, { _id: false });

// New schema for OAuth scopes
const OAuthScopeInfoSchema = new Schema({
    scopes: { type: [String], default: [] },
    lastUpdated: { type: String, required: true }
}, { _id: false });

const BaseAccountSchema = {
    created: { type: String, required: true },
    updated: { type: String, required: true },
    status: {
        type: String,
        enum: Object.values(AccountStatus),
        default: AccountStatus.Active
    },
    userDetails: { type: UserDetailsSchema, required: true }
};

// OAuth Account Schema
const OAuthAccountSchema = new Schema({
    ...BaseAccountSchema,
    accountType: {
        type: String,
        enum: [AccountType.OAuth],
        default: AccountType.OAuth,
        required: true
    },
    provider: {
        type: String,
        enum: Object.values(OAuthProviders),
        required: true
    },
    security: { type: OAuthSecuritySettingsSchema, required: true },
    oauthScopes: { type: OAuthScopeInfoSchema }
}, {
    timestamps: true,
    versionKey: false
});

// Local Account Schema
const LocalAccountSchema = new Schema({
    ...BaseAccountSchema,
    accountType: {
        type: String,
        enum: [AccountType.Local],
        default: AccountType.Local,
        required: true
    },
    security: { type: LocalSecuritySettingsSchema, required: true }
}, {
    timestamps: true,
    versionKey: false
});

OAuthAccountSchema.index({ 'userDetails.email': 1, 'provider': 1 }, { unique: true });
LocalAccountSchema.index({ 'userDetails.email': 1 }, { unique: true });
LocalAccountSchema.index({ 'userDetails.username': 1 }, { sparse: true, unique: true });

export interface OAuthAccountDocument extends Document, Omit<OAuthAccount, 'id'> {
    _id: mongoose.Types.ObjectId;
}

export interface LocalAccountDocument extends Document, Omit<LocalAccount, 'id'> {
    _id: mongoose.Types.ObjectId;
    
    // Instance methods
    comparePassword(candidatePassword: string): Promise<boolean>;
    generatePasswordResetToken(): Promise<string>;
    resetPassword(newPassword: string): Promise<void>;
}

// Add methods to the schema - for local accounts

// Password comparison method
LocalAccountSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.security.password);
};

// Password reset token generation
LocalAccountSchema.methods.generatePasswordResetToken = async function(): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing
    this.security.passwordResetToken = crypto.createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    // Set expiration to 10 minutes from now
    this.security.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    await this.save();
    
    return resetToken;
};

// Password reset method
LocalAccountSchema.methods.resetPassword = async function(newPassword: string): Promise<void> {
    // Store the current password in previous passwords array (limited to last 5)
    if (this.security.password) {
        this.security.previousPasswords = this.security.previousPasswords || [];
        
        // Add current password to history and keep only the last 5
        this.security.previousPasswords.push(this.security.password);
        if (this.security.previousPasswords.length > 5) {
            this.security.previousPasswords.shift();
        }
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    this.security.password = await bcrypt.hash(newPassword, salt);
    
    // Clear reset token and expiration
    this.security.passwordResetToken = undefined;
    this.security.passwordResetExpires = undefined;
    
    // Update last password change timestamp
    this.security.lastPasswordChange = new Date();
    
    // Reset failed login attempts
    this.security.failedLoginAttempts = 0;
    this.security.lockoutUntil = undefined;
    
    await this.save();
};

// Pre-save middleware to hash passwords
LocalAccountSchema.pre('save', async function(next) {
    const account = this as LocalAccountDocument;
    
    // Only hash password if it's modified (or new)
    if (!account.isModified('security.password')) return next();
    
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        
        // Hash the password with the new salt
        account.security.password = await bcrypt.hash(account.security.password, salt);
        account.security.passwordSalt = salt;
        
        // If this is a new password (not just a new account), record the change time
        if (account.security.lastPasswordChange || !account.isNew) {
            account.security.lastPasswordChange = new Date();
        }
        
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Initialize models with Accounts database connection
const initAccountModels = async () => {
    const accountsConnection = await dbConfig.connectAccountsDB();

    // Create and export the models using the accounts connection
    const AccountModels = {
        OAuthAccount: accountsConnection.model<OAuthAccountDocument>('OAuthAccount', OAuthAccountSchema),
        LocalAccount: accountsConnection.model<LocalAccountDocument>('LocalAccount', LocalAccountSchema)
    };

    return AccountModels;
};

export default initAccountModels;