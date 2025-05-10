import { GoogleScopes } from "../config";

export function isValidGoogleService(service: string): boolean {
    return Object.keys(GoogleScopes).includes(service);
}