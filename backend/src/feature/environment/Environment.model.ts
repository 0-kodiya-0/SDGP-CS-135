import mongoose, { Document, Schema } from 'mongoose';
import { EnvironmentPrivacy, EnvironmentStatus } from './Environment.types';

export interface EnvironmentDocument extends Document {
    _id: mongoose.Types.ObjectId;
    accountId: string;
    name: string;
    created: string;
    lastModified: string;
    status: EnvironmentStatus;
    privacy: EnvironmentPrivacy;
}

// Environment Schema
const EnvironmentSchema = new Schema({
    accountId: { type: String, required: true },
    name: { type: String, required: true },
    created: { type: String, required: true },
    lastModified: { type: String, required: true },
    status: { 
        type: String, 
        enum: Object.values(EnvironmentStatus),
        default: EnvironmentStatus.Active,
        required: true
    },
    privacy: { 
        type: String, 
        enum: Object.values(EnvironmentPrivacy),
        default: EnvironmentPrivacy.Private,
        required: true
    }
}, {
    timestamps: false, // We'll manage timestamps manually
    versionKey: false
});

// Create indexes for better query performance
EnvironmentSchema.index({ accountId: 1 });
EnvironmentSchema.index({ accountId: 1, status: 1 });

// Initialize model with the database connection
const initEnvironmentModel = async (connection: mongoose.Connection) => {
    return connection.model<EnvironmentDocument>('Environment', EnvironmentSchema);
};

export default initEnvironmentModel;