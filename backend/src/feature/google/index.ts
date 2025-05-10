import express from 'express';
import calendarRoutes from './api/calender';
import gmailRoutes from './api/gmail';
import driveRoutes from './api/drive';
import peopleRoutes from './api/people';
import meetRoutes from './api/meet';
import tokenRoutes from './api/token';

// Create the main router for all Google API services
const router = express.Router({ mergeParams: true });

/**
 * These imports will be uncommented as each service is implemented
 */
router.use('/gmail', gmailRoutes);

router.use('/calendar', calendarRoutes);

router.use('/drive', driveRoutes);

router.use('/meet', meetRoutes);

router.use('/people', peopleRoutes);

router.use('/token', tokenRoutes);

export { router };