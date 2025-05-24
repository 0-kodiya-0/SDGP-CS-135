import express from 'express';
import * as AccountController from './Account.controller';

export const authenticatedNeedRouter = express.Router({ mergeParams: true });
export const authenticationNotNeedRouter = express.Router();

// Public routes (no authentication required)
authenticationNotNeedRouter.get('/search', AccountController.searchAccount);

authenticationNotNeedRouter.get('/logout/all', AccountController.logoutAll);

authenticationNotNeedRouter.get('/logout', AccountController.logout);

// Private routes (authentication required)

// Get account details
authenticatedNeedRouter.get('/', AccountController.getAccount);

// Update OAuth account
authenticatedNeedRouter.patch('/', AccountController.updateAccount);

// Get account email
authenticatedNeedRouter.get('/email', AccountController.getAccountEmail);

// Update OAuth account security settings
authenticatedNeedRouter.patch('/security', AccountController.updateAccountSecurity);

// Refresh token
authenticatedNeedRouter.get('/refreshToken', AccountController.refreshToken);

// Revoke tokens
authenticatedNeedRouter.get('/refreshToken/revoke', AccountController.revokeToken);