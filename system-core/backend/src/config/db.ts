import initAccountModels from '../feature/account/Account.model';
import initAuthModels from '../feature/oauth/AuthState.model';
import dbConfig from './db.config';

// Define model types for type safety
export type AuthModels = Awaited<ReturnType<typeof initAuthModels>>;
export type AccountModels = Awaited<ReturnType<typeof initAccountModels>>;

// Database models container with proper typing
interface DatabaseModels {
    auth: AuthModels;
    accounts: AccountModels;
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
        // Connect to both databases
        await dbConfig.connectAllDatabases();

        // Initialize models for both databases
        const [authModels, accountModels] = await Promise.all([
            initAuthModels(),
            initAccountModels()
        ]);

        // Store initialized models
        models = {
            auth: authModels,
            accounts: accountModels
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