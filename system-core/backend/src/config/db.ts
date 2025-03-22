import initAccountModels from '../feature/account/Account.model';
import initAuthModels from '../feature/oauth/Auth.model';
import initChatModels from '../feature/chat/chat.model'; // Import the Chat models
import dbConfig from './db.config';

// Define model types for type safety
export type AccountModels = Awaited<ReturnType<typeof initAccountModels>>;
export type AuthModels = Awaited<ReturnType<typeof initAuthModels>>;
export type ChatModels = Awaited<ReturnType<typeof initChatModels>>;

// Database models container with proper typing
interface DatabaseModels {
    accounts: AccountModels;
    auth: AuthModels;
    chat: ChatModels;
}

// Track initialization state
let isInitialized = false;
let models: DatabaseModels | null = null;

/**
 * Initialize all database connections and models
 * This ensures models are available before they're used
 */
const initializeDB = async (): Promise<DatabaseModels> => {
    try {
        // Connect to all databases
        await dbConfig.connectAllDatabases();

        // Initialize models for all databases
        const [accountModels, authModels, chatModels] = await Promise.all([
            initAccountModels(),
            initAuthModels(),
            initChatModels()
        ]);

        // Store initialized models
        models = {
            accounts: accountModels,
            auth: authModels,
            chat: chatModels
        };

        isInitialized = true;
        console.log('Database models initialized successfully');

        return models;
    } catch (error) {
        console.error('Failed to initialize database models:', error);
        throw error;
    }
};

/**
 * Get models for database operations
 * This function ensures models are initialized before access
 * and throws a clear error if something goes wrong
 */
const getModels = async (): Promise<DatabaseModels> => {
    if (!isInitialized || !models) {
        try {
            return await initializeDB();
        } catch (error) {
            throw new Error(`Failed to initialize database connections: ${error}`);
        }
    }
    return models;
};

/**
 * Close all database connections
 */
const close = async (): Promise<void> => {
    await dbConfig.closeAllConnections();
    models = null;
    isInitialized = false;
};

export default {
    initializeDB,
    getModels,
    close
};