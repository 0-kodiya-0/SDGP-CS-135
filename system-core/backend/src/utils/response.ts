/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, RequestHandler, Response, Request, ErrorRequestHandler } from "express";
import {
    ApiResponse,
    ApiErrorCode,
    BaseError,
    JsonSuccess,
    RedirectError,
    RedirectSuccess,
    AuthError,
    ValidationError,
    NotFoundError,
    BadRequestError,
    ServerError,
    AccountValidationError,
    ChatValidationError,
    SessionValidationError,
    ProviderValidationError
} from "../types/response.types";
import { redirectWithError, redirectWithSuccess } from "./redirect";
import { MongoError } from "mongodb";
import { Error as MongooseError } from "mongoose";
import { GaxiosError } from "gaxios";
import jwt from "jsonwebtoken";

export const createSuccessResponse = <T>(data: T): ApiResponse<T> => ({
    success: true,
    data
});

export const createErrorResponse = <T>(code: ApiErrorCode, message: T): ApiResponse => ({
    success: false,
    error: {
        code,
        message
    }
});

export const sendSuccess = <T>(res: Response, status: number, data: T): void => {
    res.status(status).send(createSuccessResponse(data));
};

export const sendError = <T>(res: Response, status: number, code: ApiErrorCode, message: T): void => {
    res.status(status).send(createErrorResponse(code, message));
};


export const asyncHandler = (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    fn: Function
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export const asyncHandlerWithErr = (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    fn: Function
): ErrorRequestHandler => {
    return (err, req, res, next) => {
        Promise.resolve(fn(err, req, res, next)).catch(next);
    };
};

export const jwtErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Check if error is a JWT error
    if (err instanceof jwt.JsonWebTokenError ||
        err instanceof jwt.TokenExpiredError ||
        err instanceof jwt.NotBeforeError ||
        (err && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError'))) {

        console.error('JWT Error:', err);

        // Handle specific JWT error types
        if (err instanceof jwt.TokenExpiredError || err.name === 'TokenExpiredError') {
            return res.status(401).json(createErrorResponse(
                ApiErrorCode.TOKEN_EXPIRED,
                'The provided token has expired'
            ));
        }

        if (err instanceof jwt.NotBeforeError || err.name === 'NotBeforeError') {
            return res.status(401).json(createErrorResponse(
                ApiErrorCode.TOKEN_INVALID,
                'The token cannot be used yet (not before error)'
            ));
        }

        // Handle generic JWT errors (malformed, invalid signature, etc.)
        if (err instanceof jwt.JsonWebTokenError || err.name === 'JsonWebTokenError') {
            return res.status(401).json(createErrorResponse(
                ApiErrorCode.TOKEN_INVALID,
                err.message || 'Invalid token provided'
            ));
        }

        // Generic JWT error fallback
        return res.status(401).json(createErrorResponse(
            ApiErrorCode.AUTH_FAILED,
            'Authentication failed due to token issues'
        ));
    }

    // Not a JWT error, pass to next handler
    next(err);
};

// MongoDB Error Handler
export const mongoErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Check if error is a MongoDB or Mongoose error
    if (err instanceof MongoError || err instanceof MongooseError ||
        (err && (err.name === 'MongoError' || err.name === 'MongooseError'))) {

        console.error('Database Error:', err);

        // Handle specific MongoDB error codes
        if (err.code === 11000) {
            // Duplicate key error
            return res.status(409).json(createErrorResponse(
                ApiErrorCode.RESOURCE_EXISTS,
                'Resource already exists with the provided unique fields'
            ));
        }

        // Handle Mongoose validation errors
        if (err instanceof MongooseError.ValidationError || err.name === 'ValidationError') {
            // Extract detailed validation errors from Mongoose
            const validationErrors: Record<string, {
                message: string;
                kind?: string;
                path?: string;
                value?: any;
            }> = {};

            // Mongoose validation errors contain an 'errors' object with field-specific details
            if (err.errors) {
                Object.keys(err.errors).forEach(field => {
                    validationErrors[field] = {
                        message: err.errors[field].message,
                        kind: err.errors[field].kind,
                        path: err.errors[field].path,
                        value: err.errors[field].value
                    };
                });
            }

            return res.status(400).json(createErrorResponse(
                ApiErrorCode.VALIDATION_ERROR,
                {
                    message: 'Schema validation failed',
                    fields: validationErrors
                }
            ));
        }

        // Handle Mongoose cast errors (often from invalid ObjectId)
        if (err instanceof MongooseError.CastError || err.name === 'CastError') {
            return res.status(400).json(createErrorResponse(
                ApiErrorCode.INVALID_PARAMETERS,
                {
                    message: `Invalid ${err.path}: ${err.value}`,
                    field: err.path,
                    value: err.value
                }
            ));
        }

        // Handle Mongoose version error (document was modified between retrieving and saving)
        if (err instanceof MongooseError.VersionError || err.name === 'VersionError') {
            return res.status(409).json(createErrorResponse(
                ApiErrorCode.INVALID_STATE,
                'Document has been modified by another process'
            ));
        }

        // Handle Mongoose strict mode errors
        if (err.name === 'StrictModeError') {
            return res.status(400).json(createErrorResponse(
                ApiErrorCode.INVALID_PARAMETERS,
                {
                    message: err.message,
                    field: err.path
                }
            ));
        }

        // Handle other MongoDB/Mongoose errors
        return res.status(500).json(createErrorResponse(
            ApiErrorCode.DATABASE_ERROR,
            err.message || 'Database operation failed'
        ));
    }

    // Not a MongoDB error, pass to next handler
    next(err);
};

// Google API Error Handler
export const googleApiErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Check if error is a Google API error
    if (err instanceof GaxiosError || (err && err.name === 'GaxiosError')) {
        console.error('Google API Error:', err);

        const statusCode = err.response?.status || 500;
        const errorMessage = err.response?.data?.error?.message || err.message || 'Google API request failed';

        // Map Google API error codes to our API error codes
        let apiErrorCode = ApiErrorCode.SERVICE_UNAVAILABLE;

        if (statusCode === 401 || statusCode === 403) {
            apiErrorCode = ApiErrorCode.AUTH_FAILED;
        } else if (statusCode === 404) {
            apiErrorCode = ApiErrorCode.RESOURCE_NOT_FOUND;
        } else if (statusCode === 400) {
            apiErrorCode = ApiErrorCode.INVALID_PARAMETERS;
        } else if (statusCode === 429) {
            apiErrorCode = ApiErrorCode.RATE_LIMIT_EXCEEDED;
        } else if (statusCode >= 500) {
            apiErrorCode = ApiErrorCode.SERVICE_UNAVAILABLE;
        }

        return res.status(statusCode).json(createErrorResponse(apiErrorCode, errorMessage));
    }

    // Not a Google API error, pass to next handler
    next(err);
};

// Generic API request error handler
export const apiRequestErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Check if error is a generic API request error (axios, fetch, etc.)
    if (err.isAxiosError || (err.response && err.request) || err.name === 'FetchError') {
        console.error('API Request Error:', err);

        const statusCode = err.response?.status || 500;
        const errorMessage = err.response?.data?.message || err.message || 'External API request failed';

        // Map status codes to our error codes
        let apiErrorCode = ApiErrorCode.CONNECTION_ERROR;

        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
            apiErrorCode = ApiErrorCode.TIMEOUT_ERROR;
        } else if (statusCode === 401 || statusCode === 403) {
            apiErrorCode = ApiErrorCode.AUTH_FAILED;
        } else if (statusCode === 404) {
            apiErrorCode = ApiErrorCode.RESOURCE_NOT_FOUND;
        } else if (statusCode === 400) {
            apiErrorCode = ApiErrorCode.INVALID_REQUEST;
        } else if (statusCode === 429) {
            apiErrorCode = ApiErrorCode.RATE_LIMIT_EXCEEDED;
        } else if (statusCode >= 500) {
            apiErrorCode = ApiErrorCode.SERVICE_UNAVAILABLE;
        }

        return res.status(statusCode).json(createErrorResponse(apiErrorCode, errorMessage));
    }

    // Not an API request error, pass to next handler
    next(err);
};

// Success response middleware
export const successHandler = (result: any, req: Request, res: Response, next: NextFunction) => {
    // Skip if not a success response or is an error
    if (!result || result instanceof Error || result instanceof BaseError) {
        next(result);
        return;
    }

    // Handle BaseSuccess responses
    if (result instanceof RedirectSuccess) {
        redirectWithSuccess(
            res,
            result.redirectPath,
            {
                originalUrl: result.originalUrl,
                message: result.message,
                data: result.data,
                sendStatus: result.sendStatus
            }
        );
        return;
    }

    if (result instanceof JsonSuccess) {
        res.status(result.statusCode).json(createSuccessResponse(result.data));
        return;
    }

    // Handle direct data responses (treat as JsonSuccess)
    if (typeof result === 'object' && result !== null) {
        res.status(200).json(createSuccessResponse(result));
        return;
    }

    // Handle primitive type responses
    if (result !== undefined) {
        res.status(200).json(createSuccessResponse(result));
        return;
    }

    // Pass to next middleware if not handled
    next(result);
};

// Enhanced error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Log the error
    console.error('Error:', err);

    // Handle different error types
    if (err instanceof RedirectError) {
        redirectWithError(
            res,
            err.redirectPath,
            err.code,
            {
                originalUrl: err.originalUrl,
                message: err.message,
                data: err.data,
                sendStatus: err.sendStatus
            }
        );
        return;
    }

    // Handle all the different BaseError types
    if (err instanceof AuthError) {
        res.status(err.statusCode).json(createErrorResponse(err.code, err.message));
        return;
    }

    if (err instanceof ValidationError ||
        err instanceof AccountValidationError ||
        err instanceof ChatValidationError ||
        err instanceof SessionValidationError ||
        err instanceof ProviderValidationError) {
        res.status(err.statusCode).json(createErrorResponse(
            err.code,
            typeof err.message === "object" ?
                { ...err.message as object, data: err.data } :
                { message: err.message, data: err.data }
        ));
        return;
    }

    if (err instanceof NotFoundError) {
        res.status(err.statusCode).json(createErrorResponse(err.code, err.message));
        return;
    }

    if (err instanceof BadRequestError) {
        res.status(err.statusCode).json(createErrorResponse(err.code, err.message));
        return;
    }

    if (err instanceof ServerError) {
        res.status(err.statusCode).json(createErrorResponse(err.code, err.message));
        return;
    }

    if (err instanceof BaseError) {
        res.status(err.statusCode).json(createErrorResponse(err.code, err.message));
        return;
    }

    // Handle other standard errors
    if (err instanceof Error) {
        res.status(500).json(createErrorResponse(
            ApiErrorCode.SERVER_ERROR,
            err.message || 'An unexpected error occurred'
        ));
        return;
    }

    // Handle generic errors as a fallback
    res.status(500).json(createErrorResponse(
        ApiErrorCode.SERVER_ERROR,
        'An unexpected error occurred'
    ));
};

// Example of how to apply all middleware in the correct order
export const applyErrorHandlers = (app: any) => {
    // Apply in order from most specific to most general
    app.use(jwtErrorHandler);
    app.use(mongoErrorHandler);
    app.use(googleApiErrorHandler);
    app.use(apiRequestErrorHandler);
    app.use(successHandler);
    app.use(errorHandler);

    // Catch-all for unhandled errors
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error('Unhandled error:', err);
        res.status(500).json(createErrorResponse(
            ApiErrorCode.SERVER_ERROR,
            'A server error occurred'
        ));
    });
};