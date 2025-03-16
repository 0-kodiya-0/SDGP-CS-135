import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { OAuthAccount } from '../feature/account/Account.types';
import { OAuthState, SignUpState, SignInState } from '../feature/oauth/Auth.types';

interface DBSchema {
    oauthAccounts: OAuthAccount[];
    oauthStates: OAuthState[];
    signUpStates: SignUpState[];
    signInStates: SignInState[];
}

const adapter = new JSONFile<DBSchema>('db.json');
const db = new Low<DBSchema>(adapter, { oauthAccounts: [], oauthStates: [], signInStates: [], signUpStates: [] });

export default db;