import React, { useState } from 'react';
import { QrCode, Shield, Copy, Check, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { LocalAuthAPI } from '../api/localAuth.api';

interface TwoFactorSetupProps {
    accountId: string;
    currentlyEnabled: boolean;
    onSetupComplete: (enabled: boolean) => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
    accountId,
    currentlyEnabled,
    onSetupComplete
}) => {
    const [step, setStep] = useState<'password' | 'qr' | 'verify'>('password');
    const [formData, setFormData] = useState({
        password: '',
        verificationCode: ''
    });
    const [setupData, setSetupData] = useState<{
        qrCode?: string;
        secret?: string;
        backupCodes?: string[];
    }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showSecret, setShowSecret] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState<string[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.password) {
            setErrors({ password: 'Password is required' });
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await LocalAuthAPI.setupTwoFactor(accountId, {
                password: formData.password,
                enableTwoFactor: !currentlyEnabled
            });

            if (response.success && response.data) {
                if (!currentlyEnabled && response.data.qrCode && response.data.secret) {
                    // Enabling 2FA - show QR code
                    setSetupData({
                        qrCode: response.data.qrCode,
                        secret: response.data.secret,
                        backupCodes: response.data.backupCodes
                    });
                    setStep('qr');
                } else {
                    // Disabling 2FA - complete
                    onSetupComplete(false);
                }
            } else {
                setErrors({ password: response.error?.message || 'Invalid password' });
            }
        } catch (error) {
            console.error('2FA setup error:', error);
            setErrors({ password: 'An error occurred. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.verificationCode) {
            setErrors({ verificationCode: 'Verification code is required' });
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await LocalAuthAPI.verifyTwoFactorSetup(accountId, {
                token: formData.verificationCode
            });

            if (response.success) {
                onSetupComplete(true);
            } else {
                setErrors({ verificationCode: 'Invalid verification code' });
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            setErrors({ verificationCode: 'An error occurred. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string, type: 'secret' | 'code', codeIndex?: number) => {
        try {
            await navigator.clipboard.writeText(text);
            
            if (type === 'secret') {
                setCopiedSecret(true);
                setTimeout(() => setCopiedSecret(false), 2000);
            } else if (type === 'code' && codeIndex !== undefined) {
                setCopiedCodes(prev => [...prev, codeIndex.toString()]);
                setTimeout(() => {
                    setCopiedCodes(prev => prev.filter(c => c !== codeIndex.toString()));
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const copyAllBackupCodes = async () => {
        if (setupData.backupCodes) {
            const allCodes = setupData.backupCodes.join('\n');
            await copyToClipboard(allCodes, 'code');
        }
    };

    const renderPasswordStep = () => (
        <div className="space-y-4">
            <div className="text-center">
                <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                    {currentlyEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                    {currentlyEnabled 
                        ? 'Enter your password to disable 2FA'
                        : 'Enter your password to set up 2FA for enhanced security'
                    }
                </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                errors.password ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Enter your password"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {isLoading ? 'Verifying...' : 'Continue'}
                </button>
            </form>
        </div>
    );

    const renderQRStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <QrCode className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                    Scan QR Code
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                    Use your authenticator app to scan this QR code
                </p>
            </div>

            {/* QR Code */}
            {setupData.qrCode && (
                <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <img 
                            src={setupData.qrCode} 
                            alt="2FA QR Code" 
                            className="w-48 h-48"
                        />
                    </div>
                </div>
            )}

            {/* Manual entry option */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Can't scan? Enter this code manually:
                </h4>
                <div className="flex items-center space-x-2">
                    <code className={`flex-1 px-3 py-2 bg-white border rounded text-sm font-mono ${
                        showSecret ? 'text-gray-900' : 'text-transparent bg-gray-200'
                    }`}>
                        {showSecret ? setupData.secret : '••••••••••••••••'}
                    </code>
                    <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                    >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => copyToClipboard(setupData.secret || '', 'secret')}
                        className="p-2 text-gray-500 hover:text-gray-700"
                    >
                        {copiedSecret ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                </div>
            </div>

            {/* Backup Codes */}
            {setupData.backupCodes && setupData.backupCodes.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        Important: Save these backup codes
                    </h4>
                    <p className="text-sm text-yellow-700 mb-3">
                        Store these codes in a safe place. Each code can only be used once.
                    </p>
                    
                    <div className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Backup Codes</span>
                            <button
                                type="button"
                                onClick={copyAllBackupCodes}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                                <Copy size={14} className="mr-1" />
                                Copy All
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {setupData.backupCodes.map((code, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                                    <code className="text-sm font-mono">{code}</code>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(code, 'code', index)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        {copiedCodes.includes(index.toString()) ? (
                                            <Check size={12} className="text-green-500" />
                                        ) : (
                                            <Copy size={12} />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={() => setStep('verify')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                I've saved the backup codes, continue
            </button>
        </div>
    );

    const renderVerifyStep = () => (
        <div className="space-y-4">
            <div className="text-center">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                    Verify Setup
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                    Enter the 6-digit code from your authenticator app
                </p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div>
                    <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                        Verification Code
                    </label>
                    <div className="mt-1">
                        <input
                            id="verificationCode"
                            name="verificationCode"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={formData.verificationCode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setFormData(prev => ({ ...prev, verificationCode: value }));
                            }}
                            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest ${
                                errors.verificationCode ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="000000"
                        />
                        {errors.verificationCode && (
                            <p className="mt-1 text-sm text-red-600">{errors.verificationCode}</p>
                        )}
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={() => setStep('qr')}
                        className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Verifying...' : 'Enable 2FA'}
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="max-w-md mx-auto">
            {step === 'password' && renderPasswordStep()}
            {step === 'qr' && renderQRStep()}
            {step === 'verify' && renderVerifyStep()}
        </div>
    );
};

export default TwoFactorSetup;