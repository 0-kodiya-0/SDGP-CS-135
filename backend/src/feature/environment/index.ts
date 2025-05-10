import environmentRoutes from './Environment.routes';

export default environmentRoutes;

// Export types
export * from './Environment.types';

// Selectively re-export from service to avoid naming conflicts
export {
    getEnvironmentsByAccount,
    getEnvironmentById,
    toEnvironmentDTO
} from './Environment.service';

// Selectively re-export from controller to avoid naming conflicts
export {
    getEnvironments,
    getEnvironment
} from './Environment.controller';