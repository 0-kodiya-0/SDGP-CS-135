import db from "../../config/db";
import { OAuthAccountDocument } from "./Account.model";
import { OAuthAccount, OAuthAccountDTO, OAuthProviders } from "./Account.types";

// Convert Mongoose document to OAuthAccount type
export const toOAuthAccount = (doc: OAuthAccountDocument | null): OAuthAccountDTO | null => {
  if (!doc) return null;

  // Create a new object with only the properties we want
  const account: OAuthAccountDTO = {
    id: doc._id.toHexString(),
    created: doc.created,
    updated: doc.updated,
    accountType: doc.accountType,
    status: doc.status,
    provider: doc.provider,
    userDetails: doc.userDetails,
    security: doc.security,
    // device: doc.device
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

  return doc ? { id: doc._id.toHexString(), ...doc } : null;
};