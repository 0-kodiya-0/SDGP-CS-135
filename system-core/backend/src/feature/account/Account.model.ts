import mongoose, { Document, Schema } from 'mongoose';
import dbConfig from '../../config/db.config';
import { AccountStatus, AccountType, OAuthAccount, OAuthProviders } from '../../feature/account/Account.types';

// Device preferences schema
// const DevicePreferencesSchema = new Schema({
//     theme: { type: String, required: true },
//     language: { type: String, required: true },
//     notifications: { type: Boolean, required: true }
// }, { _id: false });

// // Device schema
// const DeviceSchema = new Schema({
//     id: { type: String, required: true },
//     installationDate: { type: String, required: true },
//     name: { type: String, required: true },
//     os: { type: String, required: true },
//     version: { type: String, required: true },
//     uniqueIdentifier: { type: String, required: true },
//     preferences: { type: DevicePreferencesSchema, required: true }
// }, { _id: false });

// User details schema
const UserDetailsSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String },
    imageUrl: { type: String }
}, { _id: false });

// Token details schema
const TokenDetailsSchema = new Schema({
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expireAt: { type: Number, required: true },
    tokenCreatedAt: { type: Number, required: true }
}, { _id: false });

// Security settings schema
const SecuritySettingsSchema = new Schema({
    twoFactorEnabled: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 3600 },
    autoLock: { type: Boolean, default: false }
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
    tokenDetails: { type: TokenDetailsSchema, required: true },
    security: { type: SecuritySettingsSchema, required: true }
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