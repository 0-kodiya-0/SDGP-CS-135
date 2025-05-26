import { AccountDocument } from "./Account.model";
import { AccountDTO, SecuritySettings } from "./Account.types";

// Convert Mongoose document to Account DTO
export const toAccount = (doc: AccountDocument | null): AccountDTO | null => {
  if (!doc) return null;

  const account: AccountDTO = {
    id: doc._id.toHexString(),
    created: doc.created,
    updated: doc.updated,
    accountType: doc.accountType,
    status: doc.status,
    provider: doc.provider,
    userDetails: doc.userDetails,
    security: {
      // Only include non-sensitive security information
      twoFactorEnabled: doc.security.twoFactorEnabled,
      sessionTimeout: doc.security.sessionTimeout,
      autoLock: doc.security.autoLock,
      // Don't include password, secrets, or other sensitive data
    } as SecuritySettings // Type assertion to avoid exposing sensitive fields
  };

  return account;
};

// Convert to safe account (removes all sensitive security data)
export const toSafeAccount = (doc: AccountDocument | null): Omit<AccountDTO, 'security'> & { security: { twoFactorEnabled: boolean; sessionTimeout: number; autoLock: boolean } } | null => {
  if (!doc) return null;

  return {
    id: doc._id.toHexString(),
    created: doc.created,
    updated: doc.updated,
    accountType: doc.accountType,
    status: doc.status,
    provider: doc.provider,
    userDetails: doc.userDetails,
    security: {
      twoFactorEnabled: doc.security.twoFactorEnabled,
      sessionTimeout: doc.security.sessionTimeout,
      autoLock: doc.security.autoLock,
    }
  };
};