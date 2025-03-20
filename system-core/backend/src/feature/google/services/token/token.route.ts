import express from "express";
import { authenticateGoogleApi } from "../../middleware";
import { getTokenInfo, checkServiceAccess } from "./token.controller";

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

export default router;