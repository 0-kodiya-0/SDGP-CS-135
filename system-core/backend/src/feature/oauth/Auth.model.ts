// // Auth.model.ts (renamed from SessionTracking.model.ts to match your structure)
// import mongoose, { Document, Schema } from 'mongoose';
// import { SessionTrackingData } from '../../types/session.types';
// import dbConfig from '../../config/db.config';

// // Session tracking schema
// const SessionTrackingSchema = new Schema({
//     sessionId: { type: String, required: true, unique: true, index: true },
//     userId: { type: String, required: true, index: true },
//     userAgent: { type: String },
//     ipAddress: { type: String },
//     createdAt: { type: String, required: true },
//     lastActivity: { type: String, required: true },
//     isActive: { type: Boolean, required: true, default: true }
// }, {
//     timestamps: true,
//     versionKey: false
// });

// // Create indexes for faster queries
// SessionTrackingSchema.index({ userId: 1, isActive: 1 });
// SessionTrackingSchema.index({ lastActivity: 1 });

// // Document interface for SessionTracking
// export interface SessionTrackingDocument extends Document, Omit<SessionTrackingData, '_id'> {
//     _id: mongoose.Types.ObjectId;
// }

// // Add method to update last activity
// SessionTrackingSchema.methods.updateActivity = function (this: SessionTrackingDocument) {
//     this.lastActivity = new Date().toISOString();
//     return this.save();
// };

// // Add method to deactivate session
// SessionTrackingSchema.methods.deactivate = function (this: SessionTrackingDocument) {
//     this.isActive = false;
//     return this.save();
// };

// const initAuthModels = async () => {
//     const authConnection = await dbConfig.connectAuthDB();
    
//     // Create and export the models using the auth connection
//     const AuthModels = {
//         SessionTracking: authConnection.model<SessionTrackingDocument>('SessionTracking', SessionTrackingSchema)
//     };
    
//     return AuthModels;
// };

// export default initAuthModels;