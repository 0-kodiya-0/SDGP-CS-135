// feature/google/api/token/token.route.ts
import express from "express";
import { authenticateGoogleApi } from "../../middleware";
import { 
    getTokenInfo, 
    checkServiceAccess, 
    refreshToken, 
    getSessions, 
    terminateOtherSessions,
    switchAccount
} from "./token.controller";

const router = express.Router({ mergeParams: true });

/**
 * @route GET /google/:accountId/token
 * @desc Get token information and granted scopes
 * @access Private
 */
router.get('/token', authenticateGoogleApi, getTokenInfo);

/**
 * @route GET /google/:accountId/token/check
 * @desc Check if token has access to specific service and scope level
 * @access Private
 * @query service - Gmail, Calendar, etc.
 * @query scopeLevel - readonly, full, etc.
 */
router.get('/token/check', authenticateGoogleApi, checkServiceAccess);

/**
 * @route POST /google/:accountId/token/refresh
 * @desc Manually refresh an access token
 * @access Private
 */
router.post('/token/refresh', authenticateGoogleApi, refreshToken);

/**
 * @route GET /google/:accountId/sessions
 * @desc Get all active sessions for this user
 * @access Private
 */
router.get('/sessions', authenticateGoogleApi, getSessions);

/**
 * @route POST /google/:accountId/sessions/terminate-others
 * @desc Terminate all sessions except the current one
 * @access Private
 */
router.post('/sessions/terminate-others', authenticateGoogleApi, terminateOtherSessions);

/**
 * @route POST /google/:accountId/switch-account
 * @desc Switch the active account in the current session
 * @access Private
 * @body targetAccountId - The account ID to switch to
 */
router.post('/switch-account', authenticateGoogleApi, switchAccount);

export default router;