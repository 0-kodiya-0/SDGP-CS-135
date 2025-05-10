import { NextFunction, Request, Response } from 'express';
import { JsonSuccess } from '../../types/response.types';
import { asyncHandler } from '../../utils/response';
import * as EnvironmentService from './Environment.service';
import { CreateEnvironmentRequest, UpdateEnvironmentRequest } from './Environment.types';

/**
 * Get all environments for the current account
 */
export const getEnvironments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    
    const environments = await EnvironmentService.getEnvironmentsByAccount(accountId);
    
    next(new JsonSuccess(environments));
});

/**
 * Get a specific environment by ID
 */
export const getEnvironment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const environmentId = req.params.environmentId;
    
    const environment = await EnvironmentService.getEnvironmentById(environmentId, accountId);
    
    next(new JsonSuccess(environment));
});

/**
 * Create a new environment
 */
export const createEnvironment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const data: CreateEnvironmentRequest = req.body;
    
    const newEnvironment = await EnvironmentService.createEnvironment(accountId, data);
    
    next(new JsonSuccess(newEnvironment, 201));
});

/**
 * Update an existing environment
 */
export const updateEnvironment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const environmentId = req.params.environmentId;
    const data: UpdateEnvironmentRequest = req.body;
    
    const updatedEnvironment = await EnvironmentService.updateEnvironment(environmentId, accountId, data);
    
    next(new JsonSuccess(updatedEnvironment));
});

/**
 * Delete an environment
 */
export const deleteEnvironment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const environmentId = req.params.environmentId;
    
    await EnvironmentService.deleteEnvironment(environmentId, accountId);
    
    next(new JsonSuccess({ message: 'Environment deleted successfully' }));
});

/**
 * Set active environment
 */
export const setActiveEnvironment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    const environmentId = req.params.environmentId;
    
    await EnvironmentService.setActiveEnvironment(accountId, environmentId);
    
    next(new JsonSuccess({ message: 'Active environment set successfully' }));
});

/**
 * Get active environment
 */
export const getActiveEnvironment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.params.accountId;
    
    const activeEnvironment = await EnvironmentService.getActiveEnvironment(accountId);
    
    next(new JsonSuccess(activeEnvironment));
});