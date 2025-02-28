// src/plugin/example-plugin/src/ui.tsx
import React, { useEffect, useState } from 'react';
import { PluginUIProps } from '../../types/plugin.types';

interface PluginData {
  counter: number;
  timestamp: string;
  randomValue: number;
}

// Make sure this component is properly exported as default
const ExamplePluginUI: React.FC<PluginUIProps> = ({ proxy }) => {
  const [data, setData] = useState<PluginData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        console.log("Fetching data from example plugin proxy...");
        const result = await proxy.getData();
        console.log("Example plugin data received:", result);
        
        if (!isMounted) return;
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Plugin error:', err);
        if (!isMounted) return;
        setError('Failed to fetch data from plugin');
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

  console.log("Rendering ExamplePluginUI with data:", data, "loading:", loading, "error:", error);

  if (loading && !data) {
    return <div className="p-3 bg-slate-100 rounded">Loading example plugin data...</div>;
  }

  if (error) {
    return <div className="p-3 bg-red-100 rounded">Error: {error}</div>;
  }

  return (
    <div className="example-plugin p-4 bg-green-100 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-3">Example Plugin</h3>
      <div className="plugin-data space-y-2">
        <p><strong>Counter:</strong> <span className="text-2xl font-bold text-green-600">{data?.counter}</span></p>
        <p><strong>Timestamp:</strong> {data?.timestamp}</p>
        <p><strong>Random Value:</strong> {data?.randomValue?.toFixed(2)}</p>
      </div>
    </div>
  );
};

// Print a message when the component is first loaded
console.log("Example Plugin UI Component Loaded");

// Make sure to use a standard default export
export default ExamplePluginUI;