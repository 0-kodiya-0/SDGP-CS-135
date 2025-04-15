import { OAuthProviders } from "../feature/account/Account.types";

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: T;
    };
}

export enum ApiErrorCode {
    // Existing error codes
    INVALID_STATE = 'INVALID_STATE',
    INVALID_PROVIDER = 'INVALID_PROVIDER',
    MISSING_DATA = 'MISSING_DATA',
    DATABASE_ERROR = 'DATABASE_ERROR',
    AUTH_FAILED = 'AUTH_FAILED',
    USER_EXISTS = 'USER_EXISTS',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
    WORKSPACE_MEMBER_NOT_FOUND = 'WORKSPACE_MEMBER_NOT_FOUND',
    MISSING_EMAIL = 'MISSING_EMAIL',
    INVALID_DETAILS = 'INVALID_DETAILS',

    // New error codes for permissions and API access
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    INSUFFICIENT_SCOPE = 'INSUFFICIENT_SCOPE',
    INVALID_REQUEST = 'INVALID_REQUEST',
    INVALID_SERVICE = 'INVALID_SERVICE',
    INVALID_SCOPE = 'INVALID_SCOPE',
    SERVER_ERROR = 'SERVER_ERROR',

    // API resource errors
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    RESOURCE_EXISTS = 'RESOURCE_EXISTS',
    RESOURCE_DELETED = 'RESOURCE_DELETED',

    // Rate limiting and quota errors
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

    // Connection errors
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    CONNECTION_ERROR = 'CONNECTION_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',

    // Token errors
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    TOKEN_INVALID = 'TOKEN_INVALID',
    TOKEN_REVOKED = 'TOKEN_REVOKED',

    // Validation errors
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_PARAMETERS = 'INVALID_PARAMETERS'
}

// Base error class
export class BaseError<T> extends Error {
    constructor(
        public readonly code: ApiErrorCode,
        message: string,
        public readonly statusCode: number = 400,
        public readonly details?: T
    ) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, BaseError.prototype);
    }
}

export class AuthError<T> extends BaseError<T> {
    constructor(
        message: string,
        statusCode: number = 401,
        code: ApiErrorCode = ApiErrorCode.AUTH_FAILED,
        details?: T
    ) {
        super(code, message, statusCode, details);
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

export class ValidationError<T> extends BaseError<T> {
    constructor(
        message: string,
        statusCode: number = 400,
        code: ApiErrorCode = ApiErrorCode.VALIDATION_ERROR,
        details?: T
    ) {
        super(code, message, statusCode, details);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class AccountValidationError<T> extends ValidationError<T> {
}

export class ChatValidationError<T> extends ValidationError<T> {
}

export class SessionValidationError<T> extends ValidationError<T> {
}

export class ProviderValidationError<T extends object> extends ValidationError<T & { provider: OAuthProviders }> {
    constructor(
        provider: OAuthProviders,
        message: string,
        statusCode: number = 400,
        code: ApiErrorCode = ApiErrorCode.VALIDATION_ERROR,
        details?: T
    ) {
        super(message, statusCode, code, { ...(details || {}), provider } as T & { provider: OAuthProviders });
        Object.setPrototypeOf(this, ProviderValidationError.prototype);
    }
}

export class NotFoundError<T> extends BaseError<T> {
    constructor(
        message: string,
        statusCode: number = 404,
        code: ApiErrorCode = ApiErrorCode.RESOURCE_NOT_FOUND,
        details?: T
    ) {
        super(code, message, statusCode, details);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class BadRequestError<T> extends BaseError<T> {
    constructor(
        message: string,
        statusCode: number = 400,
        code: ApiErrorCode = ApiErrorCode.MISSING_DATA,
        details?: T
    ) {
        super(code, message, statusCode, details);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}

export class ServerError<T> extends BaseError<T> {
    constructor(
        message: string,
        statusCode: number = 500,
        code: ApiErrorCode = ApiErrorCode.SERVER_ERROR,
        details?: T
    ) {
        super(code, message, statusCode, details);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}

// Redirect error with additional redirect path
export class RedirectError<T> extends BaseError<T> {
    constructor(
        code: ApiErrorCode,
        public readonly redirectPath: string,
        message: string = '',
        statusCode: number = 302,
        details?: T,
        public readonly originalUrl?: string
    ) {
        super(code, message, statusCode, details);
        Object.setPrototypeOf(this, RedirectError.prototype);
    }
}

// Base success class with data type
export class BaseSuccess<T> {
    constructor(
        public readonly data: T,
        public readonly statusCode: number = 200,
    ) { }
}

// JSON success response
export class JsonSuccess<T> extends BaseSuccess<T> {
    constructor(data: T, statusCode: number = 200) {
        super(data, statusCode);
    }
}

// Redirect success response
export class RedirectSuccess<T> extends BaseSuccess<T> {
    constructor(data: T, public readonly redirectPath?: string, statusCode: number = 302, public readonly originalUrl?: string) {
        super(data, statusCode);
    }
}