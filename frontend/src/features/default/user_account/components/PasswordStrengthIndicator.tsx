import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
    password: string;
    className?: string;
}

interface PasswordRequirement {
    id: string;
    label: string;
    test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
    {
        id: 'length',
        label: 'At least 8 characters',
        test: (password) => password.length >= 8
    },
    {
        id: 'uppercase',
        label: 'At least one uppercase letter',
        test: (password) => /[A-Z]/.test(password)
    },
    {
        id: 'lowercase',
        label: 'At least one lowercase letter',
        test: (password) => /[a-z]/.test(password)
    },
    {
        id: 'number',
        label: 'At least one number',
        test: (password) => /[0-9]/.test(password)
    },
    {
        id: 'special',
        label: 'At least one special character',
        test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
];

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
    password,
    className = ''
}) => {
    const getPasswordStrength = (): { score: number; label: string; color: string } => {
        const passedRequirements = passwordRequirements.filter(req => req.test(password)).length;
        const totalRequirements = passwordRequirements.length;
        
        if (passedRequirements === 0) {
            return { score: 0, label: 'Enter a password', color: 'text-gray-500' };
        } else if (passedRequirements <= 2) {
            return { score: passedRequirements, label: 'Weak', color: 'text-red-600' };
        } else if (passedRequirements <= 4) {
            return { score: passedRequirements, label: 'Fair', color: 'text-yellow-600' };
        } else {
            return { score: passedRequirements, label: 'Strong', color: 'text-green-600' };
        }
    };

    const strength = getPasswordStrength();
    const progress = (strength.score / passwordRequirements.length) * 100;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Password strength bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Password strength</span>
                    <span className={`text-sm font-medium ${strength.color}`}>
                        {strength.label}
                    </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                            strength.score <= 2 
                                ? 'bg-red-500' 
                                : strength.score <= 4 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Requirements checklist */}
            {password.length > 0 && (
                <div className="space-y-1">
                    <span className="text-sm text-gray-600">Requirements:</span>
                    <ul className="space-y-1">
                        {passwordRequirements.map((requirement) => {
                            const isPassed = requirement.test(password);
                            return (
                                <li
                                    key={requirement.id}
                                    className={`flex items-center text-sm ${
                                        isPassed ? 'text-green-600' : 'text-gray-500'
                                    }`}
                                >
                                    {isPassed ? (
                                        <Check size={14} className="mr-2 flex-shrink-0" />
                                    ) : (
                                        <X size={14} className="mr-2 flex-shrink-0" />
                                    )}
                                    <span>{requirement.label}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

/**
 * Hook to validate password strength
 */
export const usePasswordValidation = (password: string) => {
    const getValidationResults = () => {
        const results = passwordRequirements.map(req => ({
            ...req,
            passed: req.test(password)
        }));
        
        const passedCount = results.filter(r => r.passed).length;
        const isValid = passedCount === passwordRequirements.length;
        
        return {
            requirements: results,
            passedCount,
            totalCount: passwordRequirements.length,
            isValid,
            strength: passedCount <= 2 ? 'weak' : passedCount <= 4 ? 'fair' : 'strong'
        };
    };

    return getValidationResults();
};