import express from 'express';
import * as AuthController from './Auth.controller';
import { asyncHandler } from '../../utils/response';

export const router = express.Router();

/**
 * Common Google authentication route for all auth types
 */
router.get('/auth/google', asyncHandler(AuthController.initiateGoogleAuth));

/**
 * Signup route for all providers
 */
router.get('/signup/:provider?', asyncHandler(AuthController.signup));

/**
 * Signin route for all providers
 */
router.get('/signin/:provider?', asyncHandler(AuthController.signin));

/**
 * Callback route for OAuth providers
 */
router.get('/callback/:provider', asyncHandler(AuthController.handleCallback));

/**
 * Dedicated callback route for permission requests - focused only on token handling
 */
router.get('/callback/permission/:provider', asyncHandler(AuthController.handlePermissionCallback));

/**
 * Route to request permission for a specific service and scope level
 */
router.get('/permission/:service/:scopeLevel', asyncHandler(AuthController.requestPermission));

/**
 * New route specifically for re-requesting all previously granted scopes during sign-in flow
 */
router.get('/permission/reauthorize', asyncHandler(AuthController.reauthorizePermissions));