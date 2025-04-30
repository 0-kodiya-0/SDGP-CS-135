import React, { useState, useEffect } from 'react';
import { apiService } from '../../common/services/api';
import '@/index.css';

const App: React.FC = () => {
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await apiService.getData();
                setData(result);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="summary-view p-4 text-gray-800">
            <h1 className="text-xl font-bold mb-4">Summary View</h1>

            {loading ? (
                <div className="flex items-center justify-center p-4">
                    <div className="animate-pulse text-blue-500">Loading...</div>
                </div>
            ) : data ? (
                <div className="data-container bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between mb-2">
                        <span className="font-medium">Status:</span>
                        <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                            {data.status}
                        </span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="font-medium">Count:</span>
                        <span>{data.count}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Updated:</span>
                        <span className="text-gray-500 text-sm">
                            {new Date(data.lastUpdated).toLocaleString()}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-500 text-center">
                    No data available
                </div>
            )}
        </div>
    );
};

export default App;