import { Request, Response, NextFunction } from 'express';
import { ApiErrorCode } from '../../types/response.types';
import { sendError } from '../../utils/response';
import { SessionManager } from './session.manager';

/**
 * Middleware to verify JWT token from cookies and add session to request
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
    const sessionManager = SessionManager.getInstance();
    const session = sessionManager.extractSession(req);

    if (!session) {
        return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Authentication required');
    }

    // Update session activity in the database
    sessionManager.updateSessionActivity(session.sessionId)
        .catch(err => console.error('Failed to update session activity:', err));

    // Add session data to request object
    req.session = session;
    next();
};

/**
 * Middleware to track user activity
 * Updates the last activity timestamp for the session without blocking the request
 */
export const trackActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.extractSession(req);
        
        if (session) {
            // Update session activity asynchronously (don't wait for completion)
            sessionManager.updateSessionActivity(session.sessionId)
                .catch(err => console.error('Failed to update session activity:', err));
        }
    } catch (error) {
        // Log but don't block the request
        console.error('Error in activity tracking middleware:', error);
    }
    
    // Always continue to the next middleware
    next();
};

/**
 * Middleware to select a specific account from the session
 * This allows users to switch between accounts without logging out
 */
export const selectAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { accountId } = req.params;
    
    if (!accountId) {
        return next();
    }
    
    const sessionManager = SessionManager.getInstance();
    const session = sessionManager.extractSession(req);
    
    if (!session) {
        return next();
    }
    
    // Check if the requested account is in the session
    const accountExists = session.accounts.some(acc => acc.accountId === accountId);
    
    if (accountExists) {
        // Update the selected account
        session.selectedAccountId = accountId;
        
        // This is needed to update the session cookie
        sessionManager.createSessionToken(res, session);
    }
    
    next();
};

export const validateAccountAccess = (req: Request, res: Response, next: NextFunction) => {
    const sessionManager = SessionManager.getInstance();
    const session = sessionManager.extractSession(req);
    
    if (!session) {
        return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Authentication required');
    }
    
    const accountId = req.params.accountId;

    if (!accountId) {
        return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Account ID is required');
    }

    // Check if requested account is in the session
    const accountExists = session.accounts.some(acc => acc.accountId === accountId);

    if (!accountExists) {
        return sendError(res, 403, ApiErrorCode.AUTH_FAILED, 'No access to this account');
    }

    // Add session to request
    req.session = session;
    next();
};