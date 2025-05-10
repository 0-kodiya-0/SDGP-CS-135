import mongoose, { Document, Schema } from 'mongoose';

export interface ActiveEnvironmentDocument extends Document {
    _id: mongoose.Types.ObjectId;
    accountId: string;
    environmentId: string;
    lastSelected: string;
}

// Active Environment Schema
const ActiveEnvironmentSchema = new Schema({
    accountId: { type: String, required: true },
    environmentId: { type: String, required: true },
    lastSelected: { type: String, required: true }
}, {
    timestamps: false, // We'll manage the lastSelected timestamp manually
    versionKey: false
});

// Create index for better query performance
ActiveEnvironmentSchema.index({ accountId: 1 }, { unique: true });

// Initialize model with the database connection
const initActiveEnvironmentModel = async (connection: mongoose.Connection) => {
    return connection.model<ActiveEnvironmentDocument>('ActiveEnvironment', ActiveEnvironmentSchema);
};

export default initActiveEnvironmentModel;