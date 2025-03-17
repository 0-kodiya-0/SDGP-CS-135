import { Schema } from 'mongoose';
import dbConfig from '../../config/db.config';
import { AuthType } from '../../feature/oauth/Auth.types';
import { OAuthProviders } from '../../feature/account/Account.types';

// Provider Response Schema (embedded in SignUp and SignIn states)
const ProviderResponseSchema = new Schema({
    provider: {
        type: String,
        enum: Object.values(OAuthProviders),
        required: true
    },
    name: { type: String, required: true },
    email: { type: String },
    imageUrl: { type: String },
    tokenDetails: {
        accessToken: { type: String, required: true },
        refreshToken: { type: String, required: true }
    }
}, { _id: false });

// OAuth State Schema
const OAuthStateSchema = new Schema({
    state: { type: String, required: true, unique: true },
    provider: {
        type: String,
        enum: Object.values(OAuthProviders),
        required: true
    },
    authType: {
        type: String,
        enum: Object.values(AuthType),
        required: true
    },
    expiresAt: { type: Date, required: true, index: true }
}, {
    timestamps: true,
    versionKey: false
});

// SignUp State Schema
const SignUpStateSchema = new Schema({
    state: { type: String, required: true, unique: true },
    oAuthResponse: { type: ProviderResponseSchema, required: true },
    accountDetails: { type: Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true, index: true }
}, {
    timestamps: true,
    versionKey: false
});

// SignIn State Schema
const SignInStateSchema = new Schema({
    state: { type: String, required: true, unique: true },
    oAuthResponse: { type: ProviderResponseSchema, required: true },
    expiresAt: { type: Date, required: true, index: true }
}, {
    timestamps: true,
    versionKey: false
});

// Refresh Token Schema
const RefreshTokenSchema = new Schema({
    id: { type: String, required: true, unique: true },
    accountId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    isRevoked: { type: Boolean, default: false, index: true }
}, {
    timestamps: true,
    versionKey: false
});

// Initialize models with Auth database connection
const initAuthModels = async () => {
    const authConnection = await dbConfig.connectAuthDB();

    // Create and export the models using the auth connection
    const AuthModels = {
        OAuthState: authConnection.model('OAuthState', OAuthStateSchema),
        SignUpState: authConnection.model('SignUpState', SignUpStateSchema),
        SignInState: authConnection.model('SignInState', SignInStateSchema),
        RefreshToken: authConnection.model('RefreshToken', RefreshTokenSchema)
    };

    return AuthModels;
};

export default initAuthModels;