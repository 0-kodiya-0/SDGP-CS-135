import * as Comlink from "comlink";
import {
  PluginWorkerAPI,
  PluginStatus,
  MessageTarget
} from "../types";

// Create an interface for the exposed API from the main thread
interface SystemExposedAPI {
  get: <T>(key: string, defaultValue?: T) => Promise<T | undefined>,
  set: <T>(key: string, value: T) => Promise<void>,
  sendMessage: <T>(target: string, topic: string, payload: T) => Promise<boolean>;
}

let mainThreadAPI: Comlink.Remote<SystemExposedAPI>;

try {
  // Use proper type assertion for the Comlink endpoint
  // The error occurs because 'self' in a worker context needs to be properly typed for Comlink
  mainThreadAPI = Comlink.wrap<SystemExposedAPI>(self as unknown as Comlink.Endpoint);
  console.log("Comlink proxy created successfully");
} catch (error) {
  console.error("Error creating Comlink proxy:", error);
  throw `Failed to initialize Comlink proxy: ${error instanceof Error ? error.message : String(error)}`;
}

/**
 * Implementation of the worker API that will be exposed to the main thread
 */
const workerAPI: PluginWorkerAPI = {
  /**
   * Initialize the worker
   */
  async initialize(): Promise<void> {
    console.log("Worker initialized");

    try {

      if (mainThreadAPI) {
        console.log(mainThreadAPI.get);
        console.log(mainThreadAPI.set);
        await mainThreadAPI.set("hi", "hello")
        console.log(await mainThreadAPI.get("hi"))
        console.log(mainThreadAPI.sendMessage)
      }

      // Test if sendMessage function is available
      if (mainThreadAPI && typeof mainThreadAPI.sendMessage === 'function') {
        console.log("sendMessage function found, attempting to call it");

        // Send a test message
        mainThreadAPI.sendMessage(
          MessageTarget.ALL_VIEWS,
          "worker_ready",
          {
            timestamp: Date.now(),
            message: "Worker successfully initialized"
          }
        );

        console.log("Message sent successfully");
      } else {
        console.log("sendMessage function not available on proxy");
      }
    } catch (error) {
      console.error("Error during worker initialization:", error);
    }
  },

  /**
   * Get the current status of the worker
   */
  async getStatus(): Promise<PluginStatus> {
    return {
      isActive: true,
      version: "1.0.0",
      features: ["sync", "storage"],
      lastError: null,
      resourceUsage: {
        memory: 0,
        cpu: 0
      }
    };
  },

  /**
   * Handle termination request
   */
  async terminate(): Promise<void> {
    console.log("Worker termination requested");

    try {
      // Send a final message before termination
      if (mainThreadAPI && typeof mainThreadAPI.sendMessage === 'function') {
        mainThreadAPI.sendMessage(
          MessageTarget.ALL_VIEWS,
          "worker_terminated",
          {
            timestamp: Date.now(),
            message: "Worker terminating gracefully"
          }
        );
      }
    } catch (error) {
      console.error("Error during termination:", error);
    }

    console.log("Worker terminated");
  },

  /**
   * Handle a message from the main thread
   * @param type Message type/topic
   * @param payload Message payload
   */
  async handleMessage<T>(type: string, payload: T): Promise<void> {
    console.log(`Received message of type "${type}":`, payload);

    // Handle different message types
    switch (type) {
      case "sync-request":
        console.log("Sync requested");

        // Simulate a sync operation and respond
        setTimeout(() => {
          try {
            if (mainThreadAPI && typeof mainThreadAPI.sendMessage === 'function') {
              mainThreadAPI.sendMessage(
                MessageTarget.BACKGROUND,
                "sync-complete",
                {
                  itemCount: 5,
                  timestamp: Date.now()
                }
              );
              console.log("Sync complete message sent");
            }
          } catch (error) {
            console.error("Error sending sync complete message:", error);
          }
        }, 1000);
        break;

      case "state-request":
        console.log("State requested");

        // Send a state update
        try {
          if (mainThreadAPI && typeof mainThreadAPI.sendMessage === 'function') {
            mainThreadAPI.sendMessage(
              MessageTarget.ALL_VIEWS,
              "state-update",
              {
                state: {
                  items: [],
                  lastSynced: Date.now(),
                  isSyncing: false,
                  error: null,
                  settings: {
                    syncInterval: 30000,
                    dataEndpoint: "https://api.example.com/data",
                    autoSync: true
                  }
                }
              }
            );
            console.log("State update message sent");
          }
        } catch (error) {
          console.error("Error sending state update:", error);
        }
        break;

      case "settings-updated":
        console.log("Settings updated");
        break;

      default:
        console.log(`Unhandled message type: ${type}`);
    }
  }
};

// Expose the worker API to the main thread using Comlink
Comlink.expose(workerAPI);

// Log that the worker has started
console.log("Worker started and API exposed");