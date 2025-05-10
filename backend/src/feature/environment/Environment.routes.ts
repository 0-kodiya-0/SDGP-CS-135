import express from 'express';
import { 
    createEnvironment,
    deleteEnvironment,
    getActiveEnvironment,
    getEnvironment,
    getEnvironments,
    setActiveEnvironment,
    updateEnvironment
} from './Environment.controller';

const router = express.Router({ mergeParams: true });

// Get all environments for the account
router.get('/', getEnvironments);

// Get active environment
router.get('/active', getActiveEnvironment);

// Create a new environment
router.post('/', createEnvironment);

// Get specific environment
router.get('/:environmentId', getEnvironment);

// Update environment
router.put('/:environmentId', updateEnvironment);

// Delete environment
router.delete('/:environmentId', deleteEnvironment);

// Set active environment
router.post('/:environmentId/activate', setActiveEnvironment);

export default router;