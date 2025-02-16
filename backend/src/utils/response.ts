import { Response } from "express";
import { ApiResponse, ApiErrorCode } from "../types/response.types";

export const createSuccessResponse = <T>(data: T): ApiResponse<T> => ({
    success: true,
    data
});

export const createErrorResponse = (code: ApiErrorCode, message: string): ApiResponse => ({
    success: false,
    error: {
        code,
        message
    }
});

export const sendSuccess = <T>(res: Response, status: number, data: T): void => {
    res.status(status).json(createSuccessResponse(data));
};

export const sendError = (res: Response, status: number, code: ApiErrorCode, message: string): void => {
    res.status(status).json(createErrorResponse(code, message));
};

export const redirectWithError = (res: Response, path: string, code: ApiErrorCode): void => {
    res.redirect(`..${path}?error=${code}`);
};