import mongoose, { Document, Schema } from 'mongoose';

const RefreshTokenSchema = new Schema({
    id: { type: String, required: true, unique: true },
    accountId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    isRevoked: { type: Boolean, default: false, index: true }
}, {
    timestamps: true,
    versionKey: false
});

export interface RefreshTokenDocument extends Document {
    id: string;
    accountId: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    isRevoked: boolean;
}

export default mongoose.model<RefreshTokenDocument>('RefreshToken', RefreshTokenSchema);