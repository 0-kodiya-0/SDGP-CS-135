import db from "../../config/db";
import { OAuthAccount, OAuthProviders } from "./Account.types";

export const findUser = (email: string | undefined, provider: OAuthProviders): OAuthAccount | undefined => {
    return db.data.oauthAccounts.find(account =>
        account.userDetails.email === email &&
        account.provider === provider
    );
};