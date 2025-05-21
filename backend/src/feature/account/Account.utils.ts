import db from "../../config/db";
import { OAuthAccountDocument, LocalAccountDocument } from "./Account.model";
import { OAuthAccount, OAuthAccountDTO, LocalAccount, LocalAccountDTO } from "./Account.types";

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
    // Include oauthScopes if available
    oauthScopes: doc.oauthScopes
  };

  return account;
};

// Convert Mongoose document to LocalAccount type
export const toLocalAccount = (doc: LocalAccountDocument | null): LocalAccountDTO | null => {
  if (!doc) return null;

  // Create a new object with only the properties we want
  const account: LocalAccountDTO = {
    id: doc._id.toHexString(),
    created: doc.created,
    updated: doc.updated,
    accountType: doc.accountType,
    status: doc.status,
    userDetails: doc.userDetails,
    security: {
      // Don't expose sensitive security details
      twoFactorEnabled: doc.security.twoFactorEnabled,
      sessionTimeout: doc.security.sessionTimeout,
      autoLock: doc.security.autoLock,
      // Don't include password, salt, or other sensitive fields
    } as never // Type assertion to avoid TypeScript errors about missing fields
  };

  return account;
};

export const findUserByEmail = async (email: string): Promise<OAuthAccount | LocalAccount | null> => {
  const models = await db.getModels();

  // Try to find in OAuth accounts
  const oauthDoc = await models.accounts.OAuthAccount.findOne({
    'userDetails.email': email
  });

  if (oauthDoc) {
    return { id: oauthDoc._id.toHexString(), ...oauthDoc.toObject() };
  }
  
  // Try to find in Local accounts
  const localDoc = await models.accounts.LocalAccount.findOne({
    'userDetails.email': email
  });
  
  if (localDoc) {
    return { id: localDoc._id.toHexString(), ...localDoc.toObject() };
  }

  return null;
};

export const findUserById = async (id: string): Promise<OAuthAccount | LocalAccount | null> => {
  const models = await db.getModels();

  // Try to find in OAuth accounts
  try {
    const oauthDoc = await models.accounts.OAuthAccount.findById(id);
    
    if (oauthDoc) {
      return { id: oauthDoc._id.toHexString(), ...oauthDoc.toObject() };
    }
  } catch {
    // ID might not be in OAuth accounts, try Local accounts
  }
  
  // Try to find in Local accounts
  try {
    const localDoc = await models.accounts.LocalAccount.findById(id);
    
    if (localDoc) {
      return { id: localDoc._id.toHexString(), ...localDoc.toObject() };
    }
  } catch {
    // ID might not be valid or not in Local accounts either
  }

  return null;
};

export const findUserByUsername = async (username: string): Promise<LocalAccount | null> => {
  const models = await db.getModels();
  
  // Find in Local accounts by username
  const localDoc = await models.accounts.LocalAccount.findOne({
    'userDetails.username': username
  });
  
  if (localDoc) {
    return { id: localDoc._id.toHexString(), ...localDoc.toObject() };
  }
  
  return null;
};

export const userEmailExists = async (email: string): Promise<boolean> => {
  const models = await db.getModels();

  // Check in OAuth accounts
  const oauthExists = await models.accounts.OAuthAccount.exists({
    'userDetails.email': email
  });
  
  if (oauthExists) return true;
  
  // Check in Local accounts
  const localExists = await models.accounts.LocalAccount.exists({
    'userDetails.email': email
  });

  return localExists ? true : false;
};

export const userUsernameExists = async (username: string): Promise<boolean> => {
  const models = await db.getModels();
  
  // Check in Local accounts
  const exists = await models.accounts.LocalAccount.exists({
    'userDetails.username': username
  });
  
  return exists ? true : false;
};

export const userIdExists = async (id: string): Promise<boolean> => {
  const models = await db.getModels();

  // Check in OAuth accounts
  try {
    const oauthExists = await models.accounts.OAuthAccount.exists({
      _id: id
    });
    
    if (oauthExists) return true;
  } catch {
    // ID might not be valid for OAuth accounts
  }
  
  // Check in Local accounts
  try {
    const localExists = await models.accounts.LocalAccount.exists({
      _id: id
    });
    
    return localExists ? true : false;
  } catch {
    // ID might not be valid
    return false;
  }
};

// Determine account type from ID
export const getAccountTypeById = async (id: string): Promise<AccountType | null> => {
  const models = await db.getModels();

  // Check if it's an OAuth account
  const oauthExists = await models.accounts.OAuthAccount.exists({ _id: id });
  if (oauthExists) return AccountType.OAuth;

  // Check if it's a local account
  const localExists = await models.accounts.LocalAccount.exists({ _id: id });
  if (localExists) return AccountType.Local;

  // Not found
  return null;
};

// Get both OAuth and local accounts for a specific email
export const getAllAccountsByEmail = async (email: string): Promise<(OAuthAccount | LocalAccount)[]> => {
  const models = await db.getModels();

  // Get all OAuth accounts with this email
  const oauthDocs = await models.accounts.OAuthAccount.find({
    'userDetails.email': email
  });

  // Get all local accounts with this email
  const localDocs = await models.accounts.LocalAccount.find({
    'userDetails.email': email
  });

  // Convert and combine results
  const oauthAccounts = oauthDocs.map(doc => ({ id: doc._id.toHexString(), ...doc.toObject() }));
  const localAccounts = localDocs.map(doc => ({ id: doc._id.toHexString(), ...doc.toObject() }));

  return [...oauthAccounts, ...localAccounts];
};