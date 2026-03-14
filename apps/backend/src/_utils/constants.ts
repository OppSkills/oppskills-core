/**
 * System user that takes ownership of soft-deleted resources.
 * Used as the fallback owner when a hackathon, event, or festival is deleted,
 * so that all referential integrity constraints remain satisfied.
 */
export const DELETED_RESOURCE_OWNER_ID = 'user_37DPlwTjdREB8MzXruzHTNMCTXA';
