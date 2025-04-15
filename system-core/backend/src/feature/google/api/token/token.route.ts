import express from "express";
import { authenticateGoogleApi } from "../../middleware";
import { getTokenInfoController, checkServiceAccess } from "./token.controller";

const router = express.Router({ mergeParams: true });

/**
 * @route GET /google/:accountId
 * @desc Get token information and granted scopes
 * @access Private
 */
router.get('/', authenticateGoogleApi, getTokenInfoController);

/**
 * @route GET /google/:accountId/check
 * @desc Check if token has access to specific service and scope level
 * @access Private
 * @query service - Gmail, Calendar, etc.
 * @query scopeLevel - readonly, full, etc.
 */
router.get('/check', authenticateGoogleApi, checkServiceAccess);

export default router;