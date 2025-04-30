import mongoose from 'mongoose';

// Create separate connections for accounts and auth
const connections = {
  accounts: null as mongoose.Connection | null,
  chat: null as mongoose.Connection | null
};

const username = encodeURIComponent("Fusionspace");
const password = encodeURIComponent("k#od#@1234")

/**
 * Connect to the accounts database
 */
export const connectAccountsDB = async (): Promise<mongoose.Connection> => {
  try {
    const accountsURI = process.env.ACCOUNTS_DB_URI || `mongodb+srv://${username}:${password}@fusion-space.vb7xt.mongodb.net/accounts-db?retryWrites=true&w=majority&appName=Fusion-space`;

    // Create a new connection
    if (!connections.accounts) {
      connections.accounts = mongoose.createConnection(accountsURI);
      console.log('Accounts database connected successfully');

      // Setup connection error handlers
      connections.accounts.on('error', (err) => {
        console.error('Accounts database connection error:', err);
      });

      connections.accounts.on('disconnected', () => {
        console.warn('Accounts database disconnected');
      });
    }

    return connections.accounts;
  } catch (error) {
    console.error('Accounts database connection error:', error);
    process.exit(1);
  }
};

/**
 * Connect to the chat database
 */
export const connectChatDB = async (): Promise<mongoose.Connection> => {
  try {
    const chatURI = process.env.CHAT_DB_URI || `mongodb+srv://${username}:${password}@fusion-space.vb7xt.mongodb.net/chat-db?retryWrites=true&w=majority&appName=Fusion-space`;

    // Create a new connection
    if (!connections.chat) {
      connections.chat = mongoose.createConnection(chatURI);
      console.log('Chat database connected successfully');

      // Setup connection error handlers
      connections.chat.on('error', (err) => {
        console.error('Chat database connection error:', err);
      });

      connections.chat.on('disconnected', () => {
        console.warn('Chat database disconnected');
      });
    }

    return connections.chat;
  } catch (error) {
    console.error('Chat database connection error:', error);
    process.exit(1);
  }
};


/**
 * Connect to both databases
 */
export const connectAllDatabases = async (): Promise<void> => {
  await Promise.all([
    connectAccountsDB(),
    connectChatDB()
  ]);
  console.log('All database connections established');
};

/**
 * Close all database connections
 */
export const closeAllConnections = async (): Promise<void> => {
  await Promise.all([
    connections.accounts?.close(),
    connections.chat?.close()
  ]);
  console.log('All database connections closed');
};

export default {
  connectAccountsDB,
  connectChatDB,
  connectAllDatabases,
  closeAllConnections,
  connections
};