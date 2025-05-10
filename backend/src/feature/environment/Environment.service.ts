import { BadRequestError, NotFoundError } from '../../types/response.types';
import db from '../../config/db';
import { EnvironmentDocument } from './Environment.model';
import { 
    CreateEnvironmentRequest, 
    EnvironmentDTO, 
    EnvironmentPrivacy, 
    EnvironmentStatus, 
    UpdateEnvironmentRequest 
} from './Environment.types';

/**
 * Transform a Mongoose document to a DTO
 */
export function toEnvironmentDTO(doc: EnvironmentDocument): EnvironmentDTO {
    return {
        id: doc._id.toString(),
        accountId: doc.accountId,
        name: doc.name,
        created: doc.created,
        lastModified: doc.lastModified,
        status: doc.status,
        privacy: doc.privacy
    };
}

/**
 * Get all environments for an account
 */
export async function getEnvironmentsByAccount(accountId: string): Promise<EnvironmentDTO[]> {
    const models = await db.getModels();
    const environments = await models.environments.Environment.find({ accountId });
    return environments.map(toEnvironmentDTO);
}

/**
 * Get a specific environment by ID
 */
export async function getEnvironmentById(id: string, accountId: string): Promise<EnvironmentDTO | null> {
    const models = await db.getModels();
    const environment = await models.environments.Environment.findOne({ _id: id, accountId });
    return environment ? toEnvironmentDTO(environment) : null;
}

/**
 * Create a new environment
 */
export async function createEnvironment(
    accountId: string, 
    data: CreateEnvironmentRequest
): Promise<EnvironmentDTO> {
    const models = await db.getModels();
    
    // Validate input
    if (!data.name) {
        throw new BadRequestError('Environment name is required');
    }
    
    const timestamp = new Date().toISOString();
    
    // Create new environment
    const environment = await models.environments.Environment.create({
        accountId,
        name: data.name,
        created: timestamp,
        lastModified: timestamp,
        status: data.status || EnvironmentStatus.Active,
        privacy: data.privacy || EnvironmentPrivacy.Private
    });
    
    // If this is the first environment for this account, set it as active
    const existingCount = await models.environments.Environment.countDocuments({ accountId });
    if (existingCount === 1) {
        await setActiveEnvironment(accountId, environment._id.toString());
    }
    
    return toEnvironmentDTO(environment);
}

/**
 * Update an existing environment
 */
export async function updateEnvironment(
    id: string, 
    accountId: string, 
    data: UpdateEnvironmentRequest
): Promise<EnvironmentDTO> {
    const models = await db.getModels();
    
    // Check if environment exists
    const environment = await models.environments.Environment.findOne({ _id: id, accountId });
    if (!environment) {
        throw new NotFoundError('Environment not found');
    }
    
    // Update fields
    if (data.name !== undefined) environment.name = data.name;
    if (data.status !== undefined) environment.status = data.status;
    if (data.privacy !== undefined) environment.privacy = data.privacy;
    
    // Update timestamp
    environment.lastModified = new Date().toISOString();
    
    // Save changes
    await environment.save();
    
    return toEnvironmentDTO(environment);
}

/**
 * Delete an environment
 */
export async function deleteEnvironment(id: string, accountId: string): Promise<void> {
    const models = await db.getModels();
    
    // Check if environment exists
    const environment = await models.environments.Environment.findOne({ _id: id, accountId });
    if (!environment) {
        throw new NotFoundError('Environment not found');
    }
    
    // Check if this environment is active
    const activeEnv = await models.environments.ActiveEnvironment.findOne({ 
        accountId,
        environmentId: id
    });
    
    // Delete environment
    await environment.deleteOne();
    
    // If this was the active environment, clear it
    if (activeEnv) {
        await activeEnv.deleteOne();
    }
}

/**
 * Set the active environment for an account
 */
export async function setActiveEnvironment(accountId: string, environmentId: string): Promise<void> {
    const models = await db.getModels();
    
    // Check if environment exists
    const environment = await models.environments.Environment.findOne({ 
        _id: environmentId, 
        accountId 
    });
    
    if (!environment) {
        throw new NotFoundError('Environment not found');
    }
    
    // Update or create active environment record
    await models.environments.ActiveEnvironment.updateOne(
        { accountId },
        { 
            accountId,
            environmentId,
            lastSelected: new Date().toISOString()
        },
        { upsert: true }
    );
}

/**
 * Get the active environment for an account
 */
export async function getActiveEnvironment(accountId: string): Promise<EnvironmentDTO | null> {
    const models = await db.getModels();
    
    // Get active environment record
    const activeEnv = await models.environments.ActiveEnvironment.findOne({ accountId });
    
    if (!activeEnv) {
        return null;
    }
    
    // Get the environment details
    const environment = await models.environments.Environment.findOne({ 
        _id: activeEnv.environmentId, 
        accountId 
    });
    
    if (!environment) {
        // Clean up stale reference
        await activeEnv.deleteOne();
        return null;
    }
    
    return toEnvironmentDTO(environment);
}