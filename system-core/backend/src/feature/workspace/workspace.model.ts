import mongoose, { Document, Schema } from 'mongoose';
import dbConfig from '../../config/db.config';
import {
    Workspace,
    WorkspaceMember,
    WorkspaceContent,
    WorkspaceFeatureType,
    WorkspaceRole,
    WorkspacePermissionOperation
} from './workspace.types';

// Workspace Feature Schema
const WorkspaceFeatureSchema = new Schema({
    type: {
        type: String,
        enum: Object.values(WorkspaceFeatureType),
        required: true
    },
    enabled: {
        type: Boolean,
        default: true
    }
}, { _id: false });

// Workspace Schema
const WorkspaceSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    created: {
        type: String,
        required: true
    },
    updated: {
        type: String,
        required: true
    },
    ownerId: {
        type: String,
        required: true
    },
    features: [WorkspaceFeatureSchema]
}, {
    timestamps: true,
    versionKey: false
});

// Create indexes for faster queries
WorkspaceSchema.index({ ownerId: 1 });

// Workspace Permission Schema
const WorkspacePermissionSchema = new Schema({
    feature: {
        type: String,
        enum: Object.values(WorkspaceFeatureType),
        required: true
    },
    operations: [{
        type: String,
        enum: Object.values(WorkspacePermissionOperation),
        required: true
    }]
}, { _id: false });

// Workspace Member Schema
const WorkspaceMemberSchema = new Schema({
    workspaceId: {
        type: String,
        required: true
    },
    accountId: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: Object.values(WorkspaceRole),
        required: true
    },
    joinedAt: {
        type: String,
        required: true
    },
    permissions: [WorkspacePermissionSchema]
}, {
    timestamps: true,
    versionKey: false
});

// Create compound index for faster lookups
WorkspaceMemberSchema.index({ workspaceId: 1, accountId: 1 }, { unique: true });

// Workspace Content Metadata Schema
const WorkspaceContentMetadataSchema = new Schema({
    title: { type: String },
    description: { type: String },
    createdAt: { type: String },
    modifiedAt: { type: String },
    fileType: { type: String },
    size: { type: Number },
    thumbnailUrl: { type: String },
    url: { type: String }
}, { _id: false, strict: false }); // Set strict: false to allow additional fields

// Workspace Content Schema
const WorkspaceContentSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    workspaceId: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        enum: Object.values(WorkspaceFeatureType),
        required: true
    },
    contentId: {
        type: String,
        required: true
    },
    sharedBy: {
        type: String,
        required: true
    },
    sharedAt: {
        type: String,
        required: true
    },
    metadata: WorkspaceContentMetadataSchema
}, {
    timestamps: true,
    versionKey: false
});

// Create compound index for faster content lookups
WorkspaceContentSchema.index({ workspaceId: 1, contentType: 1 });
WorkspaceContentSchema.index({ contentId: 1, contentType: 1 });

// Define document interfaces
export interface WorkspaceDocument extends Document, Omit<Workspace, 'id'> {
    id: string;
    _id: mongoose.Types.ObjectId;
}

export interface WorkspaceMemberDocument extends Document, Omit<WorkspaceMember, '_id'> {
    _id: mongoose.Types.ObjectId;
}

export interface WorkspaceContentDocument extends Document, Omit<WorkspaceContent, 'id'> {
    id: string;
    _id: mongoose.Types.ObjectId;
}

// Initialize models with Accounts database connection
const initWorkspaceModels = async () => {
    const accountsConnection = await dbConfig.connectAccountsDB();

    // Create and export the models using the accounts connection
    const WorkspaceModels = {
        Workspace: accountsConnection.model<WorkspaceDocument>('Workspace', WorkspaceSchema),
        WorkspaceMember: accountsConnection.model<WorkspaceMemberDocument>('WorkspaceMember', WorkspaceMemberSchema),
        WorkspaceContent: accountsConnection.model<WorkspaceContentDocument>('WorkspaceContent', WorkspaceContentSchema)
    };

    return WorkspaceModels;
};

export default initWorkspaceModels;