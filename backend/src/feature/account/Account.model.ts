import mongoose, {Schema, Document} from "mongoose";
import { AccountType, AccountStatus, LocalAccount} from "./Account.types";



const DevicePreferencesSchema = new Schema({
  theme: { type: String, required: true },
  language: { type: String, required: true },
  notifications: { type: Boolean, required: true }
});


const DeviceSchema = new Schema({
  id: { type: String, required: true },
  installationDate: { type: String, required: true },
  name: { type: String, required: true },
  os: { type: String, required: true },
  version: { type: String, required: true },
  uniqueIdentifier: { type: String, required: true },
  preferences: { type: DevicePreferencesSchema, required: true }
});


const UserDetailsSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  imageUrl: { type: String }
});


const LocalSecuritySettingsSchema = new Schema({
  password: { type: String, required: true }
});


export const BaseAccountSchema = new Schema(
  {
    id: { type: String, required: true },
    created: { type: String, required: true },
    email: { type: String, required: true },
    updated: { type: String, required: true },
    device: { type: DeviceSchema, required: true },
    accountType: { type: String, enum: [AccountType.Local], required: true }, // Ensure it is only Local Account
    status: { type: String, enum: Object.values(AccountStatus), required: true },
    userDetails: { type: UserDetailsSchema, required: true }
  },
  { discriminatorKey: "accountType", timestamps: true }
);


const AccountModel = mongoose.model<Document & LocalAccount>("Account", BaseAccountSchema);

const LocalAccountSchema = new Schema({
  security: { type: LocalSecuritySettingsSchema, required: true } 
});

// mongodb provides discrimnator for join the base model with diffrent setting models
export const LocalAccountModel = AccountModel.discriminator<Document & LocalAccount>(
  AccountType.Local,
  LocalAccountSchema
);

export default LocalAccountModel;


