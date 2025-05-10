import { registerComponent } from '../../../required/tab_view/utils/componentRegistry';
import { ComponentTypes } from '../../../required/tab_view/types/types.views';

/**
 * Register all contact-related components for dynamic loading
 * This function should be called during application initialization
 */
export function registerContactComponents() {
    // Register contact components using the extended ComponentTypes enum
    registerComponent(
        ComponentTypes.CONTACT_SUMMARY_VIEW,
        () => import('../components/ContactSummaryView')
    );

    registerComponent(
        ComponentTypes.CONTACT_EXPAND_VIEW,
        () => import('../components/ContactExpandView')
    );

    registerComponent(
        ComponentTypes.CONTACT_GROUP_VIEW,
        () => import('../components/GroupView')
    );

    registerComponent(
        ComponentTypes.CONTACT_GROUP_DETAIL_VIEW,
        () => import('../components/GroupDetailView')
    );

    registerComponent(
        ComponentTypes.CONTACT_CREATE_CONTACT_FORM,
        () => import('../components/CreateContactForms')
    );

    registerComponent(
        ComponentTypes.CONTACT_CREATE_GROUP_FORM,
        () => import('../components/CreateGroupForms')
    );

    console.log('Contact components registered for dynamic loading');
}