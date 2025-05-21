import express from 'express';
import * as LocalAuthController from './LocalAuth.controller';

// Create routers for authenticated and non-authenticated routes
export const authNotRequiredRouter = express.Router();
export const authRequiredRouter = express.Router({ mergeParams: true });

/**
 * Public routes (no authentication required)
 */

/**
 * @route POST /signup
 * @desc Register a new user account
 * @access Public
 */
authNotRequiredRouter.post('/signup', LocalAuthController.signup);

/**
 * @route POST /login
 * @desc Login with email/username and password
 * @access Public
 */
authNotRequiredRouter.post('/login', LocalAuthController.login);

/**
 * @route POST /verify-two-factor
 * @desc Verify two-factor code during login
 * @access Public (but requires temp token)
 */
authNotRequiredRouter.post('/verify-two-factor', LocalAuthController.verifyTwoFactor);

/**
 * @route GET /verify-email
 * @desc Verify email address with token
 * @access Public
 */
authNotRequiredRouter.get('/verify-email', LocalAuthController.verifyEmail);

/**
 * @route POST /reset-password-request
 * @desc Request password reset email
 * @access Public
 */
authNotRequiredRouter.post('/reset-password-request', LocalAuthController.requestPasswordReset);

/**
 * @route POST /reset-password
 * @desc Reset password with token
 * @access Public
 */
authNotRequiredRouter.post('/reset-password', LocalAuthController.resetPassword);

/**
 * Authenticated routes (require authentication)
 */

/**
 * @route POST /:accountId/change-password
 * @desc Change password (authenticated user)
 * @access Private
 */
authRequiredRouter.post('/change-password', LocalAuthController.changePassword);

/**
 * @route POST /:accountId/setup-two-factor
 * @desc Set up two-factor authentication
 * @access Private
 */
authRequiredRouter.post('/setup-two-factor', LocalAuthController.setupTwoFactor);

/**
 * @route POST /:accountId/verify-two-factor-setup
 * @desc Verify and enable two-factor authentication
 * @access Private
 */
authRequiredRouter.post('/verify-two-factor-setup', LocalAuthController.verifyAndEnableTwoFactor);

/**
 * @route POST /:accountId/generate-backup-codes
 * @desc Generate new backup codes for two-factor authentication
 * @access Private
 */
authRequiredRouter.post('/generate-backup-codes', LocalAuthController.generateBackupCodes);

/**
 * @route POST /:accountId/convert-to-local
 * @desc Convert OAuth account to local account (set password)
 * @access Private
 */
authRequiredRouter.post('/convert-to-local', LocalAuthController.convertOAuthToLocal);

export default {
    authNotRequiredRouter,
    authRequiredRouter
};