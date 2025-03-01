/**
 * Error class for permission-related errors
 */
export class PermissionError extends Error {
    constructor(operation: string) {
        super(`Permission denied: Operation "${operation}" requires appropriate permissions`);
        this.name = 'PermissionError';
    }
}