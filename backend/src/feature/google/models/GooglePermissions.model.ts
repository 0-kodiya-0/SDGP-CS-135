import mongoose, { Document, Schema } from 'mongoose';

export interface GooglePermissions {
    accountId: string;
    scopes: string[];
    lastUpdated: string;
}

export interface GooglePermissionsDocument extends Document, Omit<GooglePermissions, 'id'> {
    _id: mongoose.Types.ObjectId;
}

// Google Permissions Schema
const GooglePermissionsSchema = new Schema({
    accountId: { 
        type: String, 
        required: true,
        validate: {
            validator: (value: string) => mongoose.Types.ObjectId.isValid(value),
            message: 'Invalid accountId format'
        }
    },
    scopes: { 
        type: [String], 
        required: true,
        validate: {
            validator: (scopes: string[]) => scopes.length > 0,
            message: 'At least one scope is required'
        }
    },
    lastUpdated: { 
        type: String, 
        required: true,
        default: () => new Date().toISOString(),
        validate: {
            validator: (value: string) => !isNaN(Date.parse(value)),
            message: 'Invalid timestamp format'
        }
    }
}, {
    timestamps: true,
    versionKey: false
});

// Create indexes for better query performance
GooglePermissionsSchema.index({ accountId: 1 }, { unique: true });
GooglePermissionsSchema.index({ lastUpdated: -1 });

// Utility methods
GooglePermissionsSchema.methods.addScopes = function(newScopes: string[]): void {
    const existingScopes = new Set(this.scopes);
    let hasNewScopes = false;
    
    newScopes.forEach(scope => {
        if (!existingScopes.has(scope)) {
            this.scopes.push(scope);
            hasNewScopes = true;
        }
    });
    
    if (hasNewScopes) {
        this.lastUpdated = new Date().toISOString();
    }
};

GooglePermissionsSchema.methods.removeScopes = function(scopesToRemove: string[]): void {
    const initialLength = this.scopes.length;
    this.scopes = this.scopes.filter((scope: string) => !scopesToRemove.includes(scope));
    
    if (this.scopes.length !== initialLength) {
        this.lastUpdated = new Date().toISOString();
    }
};

GooglePermissionsSchema.methods.hasScope = function(scope: string): boolean {
    return this.scopes.includes(scope);
};

GooglePermissionsSchema.methods.hasAllScopes = function(requiredScopes: string[]): boolean {
    const scopeSet = new Set(this.scopes);
    return requiredScopes.every(scope => scopeSet.has(scope));
};

// Initialize model with database connection
const initGooglePermissionsModel = async (connection: mongoose.Connection) => {
    return connection.model<GooglePermissionsDocument>('GooglePermissions', GooglePermissionsSchema);
};

export default initGooglePermissionsModel;