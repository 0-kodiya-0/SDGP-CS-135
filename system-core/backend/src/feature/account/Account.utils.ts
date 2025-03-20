import db from "../../config/db";
import { OAuthAccountDocument } from "./Account.model";
import { OAuthAccount, OAuthAccountDTO, OAuthProviders } from "./Account.types";

// Convert Mongoose document to OAuthAccount type
export const toOAuthAccount = (doc: OAuthAccountDocument | null): OAuthAccountDTO | null => {
  if (!doc) return null;

  // Convert to plain object and create a new object without MongoDB-specific fields
  const mongoDoc = doc.toObject ? doc.toObject() : doc;

  // Create a new object with only the properties we want
  const account: OAuthAccountDTO = {
    id: mongoDoc.id,
    created: mongoDoc.created,
    updated: mongoDoc.updated,
    accountType: mongoDoc.accountType,
    status: mongoDoc.status,
    provider: mongoDoc.provider,
    userDetails: mongoDoc.userDetails,
    security: mongoDoc.security,
    // device: mongoDoc.device
  };

  return account;
};

export const findUser = async (email: string | undefined, provider: OAuthProviders): Promise<OAuthAccount | null> => {
  if (!email) return null;

  const models = await db.getModels();

  const doc = await models.accounts.OAuthAccount.findOne({
    'userDetails.email': email,
    provider
  });

  return doc;
};