import express from 'express';
import calendarRoutes from './api/calender';
import gmailRoutes from './api/gmail';
import driveRoutes from './api/drive';
import peopleRoutes from './api/people';
import meetRoutes from './api/meet';
import tokenRoutes from './api/token';
import { validateAccountAccess, validateTokenAccess } from '../../services/session';

// Create the main router for all Google API services
const router = express.Router();

router.use('/:accountId', validateAccountAccess, validateTokenAccess);

/**
 * These imports will be uncommented as each service is implemented
 */
router.use('/:accountId/gmail', gmailRoutes);

router.use('/:accountId/calendar', calendarRoutes);

router.use('/:accountId/drive', driveRoutes);

router.use('/:accountId/meet', meetRoutes);

router.use('/:accountId/people', peopleRoutes);

router.use('/:accountId/token', tokenRoutes);

export { router };