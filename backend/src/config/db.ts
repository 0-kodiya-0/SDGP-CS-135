import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { OAuthAccount, OAuthState, SignInState, SignUpState } from '../types/data';

interface DBSchema {
    oauthAccounts: OAuthAccount[];
    oauthStates: OAuthState[];
    signUpStates: SignUpState[];
    signInStates: SignInState[];
}

const adapter = new JSONFile<DBSchema>('db.json');
const db = new Low<DBSchema>(adapter, { oauthAccounts: [], oauthStates: [], signInStates: [], signUpStates: [] });

export default db;