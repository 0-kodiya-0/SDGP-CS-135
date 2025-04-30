import db from "../../config/db";
import { OAuthAccountDocument } from "./Account.model";
import { OAuthAccount, OAuthAccountDTO } from "./Account.types";

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

export const findUserByEmail = async (email: string): Promise<OAuthAccount | null> => {
  const models = await db.getModels();

  const doc = await models.accounts.OAuthAccount.findOne({
    'userDetails.email': email
  });

  return doc ? { id: doc._id.toHexString(), ...doc.toObject() } : null;
};

export const findUserById = async (id: string): Promise<OAuthAccount | null> => {
  const models = await db.getModels();

  const doc = await models.accounts.OAuthAccount.findOne({
    _id: id
  });

  return doc ? { id: doc._id.toHexString(), ...doc.toObject() } : null;
};

export const userEmailExists = async (email: string): Promise<boolean> => {
  const models = await db.getModels();

  const doc = await models.accounts.OAuthAccount.exists({
    'userDetails.email': email
  });

  return doc ? true : false;
};

export const userIdExists = async (id: string): Promise<boolean> => {
  const models = await db.getModels();

  const doc = await models.accounts.OAuthAccount.exists({
    _id: id
  });

  return doc ? true : false;
};