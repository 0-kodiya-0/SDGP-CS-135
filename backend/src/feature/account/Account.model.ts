import mongoose, { Document, Schema } from 'mongoose';
import dbConfig from '../../config/db.config';
import { AccountStatus, AccountType, OAuthAccount, OAuthProviders } from '../../feature/account/Account.types';

// User details schema
const UserDetailsSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String },
    imageUrl: { type: String }
}, { _id: false });

// Security settings schema
const SecuritySettingsSchema = new Schema({
    twoFactorEnabled: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 3600 },
    autoLock: { type: Boolean, default: false }
}, { _id: false });

// New schema for OAuth scopes
const OAuthScopeInfoSchema = new Schema({
    scopes: { type: [String], default: [] },
    lastUpdated: { type: String, required: true }
}, { _id: false });

// OAuth Account Schema
const OAuthAccountSchema = new Schema({
    created: { type: String, required: true },
    updated: { type: String, required: true },
    accountType: {
        type: String,
        enum: [AccountType.OAuth],
        default: AccountType.OAuth,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(AccountStatus),
        default: AccountStatus.Active
    },
    provider: {
        type: String,
        enum: Object.values(OAuthProviders),
        required: true
    },
    userDetails: { type: UserDetailsSchema, required: true },
    // tokenDetails: { type: TokenDetailsSchema, required: true },
    security: { type: SecuritySettingsSchema, required: true },
    
    // New field to track OAuth scopes
    oauthScopes: { type: OAuthScopeInfoSchema }
}, {
    timestamps: true,
    versionKey: false
});

// Create an index on email field for faster queries
OAuthAccountSchema.index({ 'userDetails.email': 1, 'provider': 1 }, { unique: true });

export interface OAuthAccountDocument extends Document, Omit<OAuthAccount, 'id'> {
    // MongoDB adds _id by default, we'll use our custom id field
    _id: mongoose.Types.ObjectId;
}

// Initialize models with Accounts database connection
const initAccountModels = async () => {
    const accountsConnection = await dbConfig.connectAccountsDB();

    // Create and export the models using the accounts connection
    const AccountModels = {
        OAuthAccount: accountsConnection.model<OAuthAccountDocument>('OAuthAccount', OAuthAccountSchema)
    };

    return AccountModels;
};

export default initAccountModels;