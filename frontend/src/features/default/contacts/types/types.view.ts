/**
 * Extend the base ComponentTypes enum with Chat-specific components
 * using TypeScript's declaration merging
 */
export const ContactViewsTypes = {
    CONTACT_SUMMARY_VIEW: 'ContactSummaryView',
    CONTACT_EXPAND_VIEW: 'ContactExpandView',
    CONTACT_GROUP_VIEW: 'ContactGroupView',
    CONTACT_GROUP_DETAIL_VIEW: 'ContactGroupDetailView',
    CONTACT_CREATE_CONTACT_FORM: 'CreateContactForm',
    CONTACT_CREATE_GROUP_FORM: 'CreateGroupForm'
} as const;