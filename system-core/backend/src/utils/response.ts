import { Response } from "express";
import { ApiResponse, ApiErrorCode } from "../types/response.types";
import { redirectWithError } from "./redirect";

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

// The old implementation is now deprecated and redirects to the new utilities
export const redirectWithError_deprecated = (res: Response, path: string, code: ApiErrorCode, message?: string): void => {
    redirectWithError(res, path, code, message);
};