import { OAuthAccountDocument, LocalAccountDocument } from "./Account.model";
import { OAuthAccountDTO, LocalAccountDTO } from "./Account.types";

// Convert Mongoose document to OAuthAccount DTO
export const toOAuthAccount = (doc: OAuthAccountDocument | null): OAuthAccountDTO | null => {
  if (!doc) return null;

  const account: OAuthAccountDTO = {
    id: doc._id.toHexString(),
    created: doc.created,
    updated: doc.updated,
    accountType: doc.accountType,
    status: doc.status,
    provider: doc.provider,
    userDetails: doc.userDetails,
    security: doc.security,
    oauthScopes: doc.oauthScopes
  };

  return account;
};

// Convert Mongoose document to LocalAccount DTO
export const toLocalAccount = (doc: LocalAccountDocument | null): LocalAccountDTO | null => {
  if (!doc) return null;

  const account: LocalAccountDTO = {
    id: doc._id.toHexString(),
    created: doc.created,
    updated: doc.updated,
    accountType: doc.accountType,
    status: doc.status,
    userDetails: doc.userDetails,
    security: {
      twoFactorEnabled: doc.security.twoFactorEnabled,
      sessionTimeout: doc.security.sessionTimeout,
      autoLock: doc.security.autoLock,
    } as never // Type assertion to avoid TypeScript errors about missing fields
  };

  return account;
};