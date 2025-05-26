import React, { useState } from 'react';
import { Shield, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { LocalAuthAPI } from '../api/localAuth.api';

interface BackupCodesManagerProps {
    accountId: string;
    onCodesGenerated: (codes: string[]) => void;
}

const BackupCodesManager: React.FC<BackupCodesManagerProps> = ({
    accountId,
    onCodesGenerated
}) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const handleGenerateNewCodes = async () => {
        if (!password) {
            setError('Password is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await LocalAuthAPI.generateBackupCodes(accountId, { password });

            if (response.success && response.data?.backupCodes) {
                onCodesGenerated(response.data.backupCodes);
                setPassword('');
                setShowConfirm(false);
            } else {
                setError(response.error?.message || 'Failed to generate backup codes');
            }
        } catch (error) {
            console.error('Backup codes generation error:', error);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadBackupCodes = (codes: string[]) => {
        const content = `Two-Factor Authentication Backup Codes\n\nGenerated on: ${new Date().toLocaleString()}\n\nEach code can only be used once. Store these in a safe place.\n\n${codes.join('\n')}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!showConfirm) {
        return (
            <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Generate New Backup Codes
                            </h3>
                            <p className="mt-2 text-sm text-yellow-700">
                                Generating new backup codes will invalidate all existing backup codes. 
                                Make sure to save the new codes in a safe place.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    <RefreshCw size={16} className="mr-2" />
                    Generate New Backup Codes
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-center">
                <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900">
                    Generate New Backup Codes
                </h3>
                <p className="text-sm text-gray-600">
                    Enter your password to generate new backup codes
                </p>
            </div>

            {error && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Current Password
                </label>
                <div className="mt-1">
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your password"
                    />
                </div>
            </div>

            <div className="flex space-x-3">
                <button
                    onClick={() => {
                        setShowConfirm(false);
                        setPassword('');
                        setError('');
                    }}
                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleGenerateNewCodes}
                    disabled={isLoading || !password}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                    {isLoading ? 'Generating...' : 'Generate Codes'}
                </button>
            </div>
        </div>
    );
};

export default BackupCodesManager;