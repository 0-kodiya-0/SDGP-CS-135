import { CalendarViewsTypes } from "../../../default/calender/types/types.views";
import { ChatViewsTypes } from "../../../default/chat/types/types.views";
import { ContactViewsTypes } from "../../../default/contacts/types/types.view";
import { FileViewsTypes } from "../../../default/files/types/types.views";
import { MailViewsTypes } from "../../../default/mail/types/types.views";

/**
 * Base component type enum for all registered components
 * This is the central definition that can be expanded using declaration merging
 */
export enum BaseComponentTypes {
    // Base system components
    PLACEHOLDER = 'Placeholder',
    ERROR_VIEW = 'ErrorView',
    LOADING_VIEW = 'LoadingView'
}

export const ComponentTypes = {
    ...BaseComponentTypes,
    ...CalendarViewsTypes,
    ...ChatViewsTypes,
    ...ContactViewsTypes,
    ...FileViewsTypes,
    ...MailViewsTypes
} as const;

// Type for all component types
export type ComponentType =
    | BaseComponentTypes
    | typeof CalendarViewsTypes[keyof typeof CalendarViewsTypes]
    | typeof ChatViewsTypes[keyof typeof ChatViewsTypes]
    | typeof ContactViewsTypes[keyof typeof ContactViewsTypes]
    | typeof FileViewsTypes[keyof typeof FileViewsTypes]
    | typeof MailViewsTypes[keyof typeof MailViewsTypes]