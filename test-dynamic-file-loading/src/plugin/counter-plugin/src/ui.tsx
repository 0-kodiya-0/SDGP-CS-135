// src/plugin/counter-plugin/src/ui.tsx
import React, { useEffect, useState } from 'react';
import { PluginUIProps } from '../../types/plugin.types';

interface CounterPluginData {
    count: number;
    lastUpdated: string;
    incrementBy: number;
}

// Make sure this component is properly exported as default
const CounterPluginUI: React.FC<PluginUIProps> = ({ proxy }) => {
    const [data, setData] = useState<CounterPluginData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                if (!isMounted) return;

                setLoading(true);
                console.log("Fetching data from counter plugin proxy...");
                const result = await proxy.getData();
                console.log("Counter plugin data received:", result);

                if (!isMounted) return;
                setData(result);
                setError(null);
            } catch (err) {
                console.error('Counter plugin error:', err);
                if (!isMounted) return;
                setError('Failed to fetch data from counter plugin');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [proxy]);

    const handleIncrement = async () => {
        try {
            console.log("Incrementing counter...");
            await proxy.incrementCounter();
            console.log("Counter incremented");

            // Refresh data after increment
            const result = await proxy.getData();
            setData(result);
        } catch (err) {
            setError('Failed to increment counter');
            console.error('Counter increment error:', err);
        }
    };

    const handleReset = async () => {
        try {
            console.log("Resetting counter...");
            await proxy.resetCounter();
            console.log("Counter reset");

            // Refresh data after reset
            const result = await proxy.getData();
            setData(result);
        } catch (err) {
            setError('Failed to reset counter');
            console.error('Counter reset error:', err);
        }
    };

    console.log("Rendering CounterPluginUI with data:", data, "loading:", loading, "error:", error);

    if (loading && !data) {
        return <div className="p-3 bg-slate-100 rounded">Loading counter plugin data...</div>;
    }

    if (error) {
        return <div className="p-3 bg-red-100 rounded">Error: {error}</div>;
    }

    return (
        <div className="counter-plugin p-4 bg-blue-100 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-3">Counter Plugin</h3>
            <div className="plugin-data space-y-2">
                <p><strong>Count:</strong> <span className="text-2xl font-bold text-blue-600">{data?.count}</span></p>
                <p><strong>Increment By:</strong> {data?.incrementBy}</p>
                <p><strong>Last Updated:</strong> {data?.lastUpdated}</p>
            </div>
            <div className="mt-4 space-x-2">
                <button
                    onClick={handleIncrement}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Increment
                </button>
                <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

// Print a message when the component is first loaded
console.log("Counter Plugin UI Component Loaded");

// Make sure to use a standard default export
export default CounterPluginUI;