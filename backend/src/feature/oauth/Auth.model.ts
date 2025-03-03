import mongoose, { Schema, Document } from "mongoose";
import { OAuthProviders, OAuthAccount, AccountType} from '../account/Account.types';


const TokenDetailsSchema = new Schema({
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true }
  });

const OAuthSecuritySettingsSchema = new Schema({
    

    twoFactorEnabled: { type: Boolean, required: true },
    sessionTimeout: { type: Number, required: true },
    autoLock: { type: Boolean, required: true }
});



const OAuthModel = mongoose.model<Document & OAuthAccount>("OAuth", OAuthSecuritySettingsSchema);

const OAuthAccountSchema = new Schema({
    provider: { type: String, enum: Object.values(OAuthProviders), required: true }, // Google, Microsoft, Facebook
    security: { type: OAuthSecuritySettingsSchema, required: true },
    tokenDetails: { type: TokenDetailsSchema, required: true }
  });

export const OAuthAccountModel = OAuthModel.discriminator<Document & OAuthAccount>(

    AccountType.OAuth,
    OAuthAccountSchema
);

export default OAuthAccountModel;
  