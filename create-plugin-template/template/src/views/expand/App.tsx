/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { apiService } from '../../common/services/api';
import '../../index.css';

const App: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [detailedData, setDetailedData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'data' | 'settings'>('data');

    useEffect(() => {
        const fetchDetailedData = async () => {
            setLoading(true);
            try {
                const result = await apiService.getDetailedData();
                setDetailedData(result);
            } catch (error) {
                console.error('Error fetching detailed data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetailedData();
    }, []);

    return (
        <div className="expand-view p-6 text-gray-800">
            <h1 className="text-2xl font-bold mb-6">Expanded View</h1>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`py-2 px-4 font-medium ${activeTab === 'data'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('data')}
                >
                    Data
                </button>
                <button
                    className={`py-2 px-4 font-medium ${activeTab === 'settings'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'data' ? (
                loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-pulse text-blue-500">Loading detailed data...</div>
                    </div>
                ) : detailedData ? (
                    <div className="space-y-6">
                        <div className="detailed-data-container bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold mb-3">Metadata</h2>
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">Total Items:</span>
                                <span>{detailedData.metadata.totalItems}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Category:</span>
                                <span>{detailedData.metadata.category}</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold mb-3">Items</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {detailedData.items.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-gray-500 text-center">
                        No detailed data available
                    </div>
                )
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold mb-4">Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <label className="font-medium text-gray-700" htmlFor="enableNotifications">
                                Enable Notifications
                            </label>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input
                                    type="checkbox"
                                    name="enableNotifications"
                                    id="enableNotifications"
                                    className="checked:bg-blue-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                />
                                <label
                                    htmlFor="enableNotifications"
                                    className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                                ></label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <label className="font-medium text-gray-700" htmlFor="darkMode">
                                Dark Mode
                            </label>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input
                                    type="checkbox"
                                    name="darkMode"
                                    id="darkMode"
                                    className="checked:bg-blue-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                />
                                <label
                                    htmlFor="darkMode"
                                    className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                                ></label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <label className="font-medium text-gray-700" htmlFor="dataRefreshRate">
                                Data Refresh Rate
                            </label>
                            <select
                                id="dataRefreshRate"
                                className="block w-1/3 p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                <option value="30">30 seconds</option>
                                <option value="60">1 minute</option>
                                <option value="300">5 minutes</option>
                                <option value="600">10 minutes</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;