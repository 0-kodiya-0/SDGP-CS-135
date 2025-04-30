import { registerComponent } from '../../../required/tab_view/utils/componentRegistry';
import { ComponentTypes } from '../../../required/tab_view/types/types.views';

/**
 * Register all email-related components for dynamic loading
 * This function should be called during application initialization
 */
export function registerEmailComponents() {
    // Register email components using the extended ComponentTypes enum
    registerComponent(
        ComponentTypes.EMAIL_SUMMARY_VIEW,
        () => import('../components/EmailSummaryView')
    );

    registerComponent(
        ComponentTypes.EMAIL_DETAILS_VIEW,
        () => import('../components/EmailDetailsView')
    );

    registerComponent(
        ComponentTypes.EMAIL_CREATE_EMAIL_VIEW,
        () => import('../components/CreateEmailView')
    );

    registerComponent(
        ComponentTypes.EMAIL_LABEL_MANAGER,
        () => import('../components/LabelManager')
    );

    registerComponent(
        ComponentTypes.EMAIL_LIST_ITEM,
        () => import('../components/EmailListItem')
    );

    console.log('Email components registered for dynamic loading');
}