/* eslint-disable @typescript-eslint/no-explicit-any */
// API service for interacting with external data sources

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Mock data for development purposes
const MOCK_DATA = {
    summary: {
        lastUpdated: new Date().toISOString(),
        count: 42,
        status: 'Active'
    },
    detailed: {
        items: [
            { id: 1, name: 'Item 1', value: 100 },
            { id: 2, name: 'Item 2', value: 200 },
            { id: 3, name: 'Item 3', value: 300 }
        ],
        metadata: {
            totalItems: 3,
            category: 'Test'
        }
    }
};

/**
 * Service for handling API requests
 */
class ApiService {
    private baseUrl: string = '';
    private mockMode: boolean = true; // Set to false in production

    constructor() {
        // Initialize with configuration
        // In a real implementation, you might load the baseUrl from plugin settings
    }

    /**
     * Fetch basic data for the summary view
     */
    async getData(): Promise<any> {
        if (this.mockMode) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return MOCK_DATA.summary;
        }

        try {
            const response = await fetch(`${this.baseUrl}/data`);
            const json = await response.json() as ApiResponse<any>;

            if (!json.success) {
                throw new Error(json.error || 'Unknown error');
            }

            return json.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Fetch detailed data for the expanded view
     */
    async getDetailedData(): Promise<any> {
        if (this.mockMode) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            return MOCK_DATA.detailed;
        }

        try {
            const response = await fetch(`${this.baseUrl}/detailed`);
            const json = await response.json() as ApiResponse<any>;

            if (!json.success) {
                throw new Error(json.error || 'Unknown error');
            }

            return json.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Send updated data to the API
     */
    async updateData(data: any): Promise<boolean> {
        if (this.mockMode) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 600));
            console.log('Mock update data:', data);
            return true;
        }

        try {
            const response = await fetch(`${this.baseUrl}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const json = await response.json() as ApiResponse<any>;

            if (!json.success) {
                throw new Error(json.error || 'Update failed');
            }

            return true;
        } catch (error) {
            console.error('API Update Error:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const apiService = new ApiService();