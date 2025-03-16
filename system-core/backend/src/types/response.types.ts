export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export enum ApiErrorCode {
    INVALID_STATE = 'INVALID_STATE',
    INVALID_PROVIDER = 'INVALID_PROVIDER',
    MISSING_DATA = 'MISSING_DATA',
    DATABASE_ERROR = 'DATABASE_ERROR',
    AUTH_FAILED = 'AUTH_FAILED',
    USER_EXISTS = 'USER_EXISTS',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    MISSING_EMAIL = 'MISSING_EMAIL',
    INVALID_DETAILS = 'INVALID_DETAILS',
}