import express from 'express';
import { validateAccountAccess } from '../../utils/session';
import calendarRoutes from './services/calender';
import gmailRoutes from './services/gmail';
import driveRoutes from './services/drive';
import peopleRoutes from './services/people';
import meetRoutes from './services/meet/meet.routes';

// Create the main router for all Google API services
const router = express.Router();

// Add account validation middleware to all Google routes
router.use('/:accountId', validateAccountAccess);

/**
 * These imports will be uncommented as each service is implemented
 */
router.use('/:accountId/gmail', gmailRoutes);

router.use('/:accountId/calendar', calendarRoutes);

router.use('/:accountId/drive', driveRoutes);

router.use('/:accountId/meet', meetRoutes);

router.use('/:accountId/people', peopleRoutes);

export { router };