import initAccountModel from '../feature/account/Account.model';
import initChatModels from '../feature/chat/chat.model';
import initEnvironmentModel from '../feature/environment/Environment.model';
import initActiveEnvironmentModel from '../feature/environment/ActiveEnvironment.model';
import initNotificationModel from '../feature/notifications/Notification.model';
import initGooglePermissionsModel from '../feature/google/models/GooglePermissions.model';
import dbConfig from './db.config';

// Define model types for type safety
export type AccountModels = {
  Account: Awaited<ReturnType<typeof initAccountModel>>;
};
export type ChatModels = Awaited<ReturnType<typeof initChatModels>>;
export type EnvironmentModels = {
  Environment: Awaited<ReturnType<typeof initEnvironmentModel>>;
  ActiveEnvironment: Awaited<ReturnType<typeof initActiveEnvironmentModel>>;
};
export type NotificationModels = {
  Notification: Awaited<ReturnType<typeof initNotificationModel>>;
};
export type GoogleModels = {
  GooglePermissions: Awaited<ReturnType<typeof initGooglePermissionsModel>>;
};

// Database models container with proper typing
interface DatabaseModels {
    accounts: AccountModels;
    chat: ChatModels;
    environments: EnvironmentModels;
    notifications: NotificationModels;
    google: GoogleModels;
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

        // Initialize models for all databases
        const [accountModel, chatModels] = await Promise.all([
            initAccountModel(),
            initChatModels(),
        ]);

        // Initialize environment models on the accounts database
        const accountsConnection = dbConfig.connections.accounts!;
        const environmentModel = await initEnvironmentModel(accountsConnection);
        const activeEnvironmentModel = await initActiveEnvironmentModel(accountsConnection);
        const notificationModel = await initNotificationModel(accountsConnection);
        const googlePermissionsModel = await initGooglePermissionsModel(accountsConnection);

        // Store initialized models
        models = {
            accounts: {
                Account: accountModel
            },
            chat: chatModels,
            environments: {
                Environment: environmentModel,
                ActiveEnvironment: activeEnvironmentModel
            },
            notifications: {
                Notification: notificationModel
            },
            google: {
                GooglePermissions: googlePermissionsModel
            }
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