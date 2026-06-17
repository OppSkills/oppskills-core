import { AnalyticsGeneralStatsDto } from '@oppskills/types';
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/analytics");

/**
 * Fetch general statistics for an event.
 * Requires an authentication token.
 * 
 * @param token - The user's authentication token.
 * @param slug - The unique slug of the event.
 * @returns Promise<AnalyticsGeneralStatsDto>
 */
export async function getEventGeneralStats(token: string, slug: string): Promise<AnalyticsGeneralStatsDto> {
    const res = await API.get(`/event/${slug}/general`, {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch general statistics for a hackathon.
 * Requires an authentication token.
 * 
 * @param token - The user's authentication token.
 * @param slug - The unique slug of the hackathon.
 * @returns Promise<AnalyticsGeneralStatsDto>
 */
export async function getHackathonGeneralStats(token: string, slug: string): Promise<AnalyticsGeneralStatsDto> {
    const res = await API.get(`/hackathon/${slug}/general`, {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch detailed statistics for an event.
 * Requires an authentication token.
 * 
 * @param token - The user's authentication token.
 * @param slug - The unique slug of the event.
 * @returns Promise<any> - Returns detailed stats (registrations array and gender distribution).
 */
export async function getEventDetailedStats(token: string, slug: string): Promise<any> {
    const res = await API.get(`/event/${slug}/detailed`, {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch detailed statistics for a hackathon.
 * Requires an authentication token.
 * 
 * @param token - The user's authentication token.
 * @param slug - The unique slug of the hackathon.
 * @returns Promise<any> - Returns detailed stats (registrations array and gender distribution).
 */
export async function getHackathonDetailedStats(token: string, slug: string): Promise<any> {
    const res = await API.get(`/hackathon/${slug}/detailed`, {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer stats (overview of all events/hackathons/festivals).
 */
export async function getOrganizerStats(token: string): Promise<unknown> {
    const res = await API.get("/organizer-stats", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer registration trends (last 7 days).
 */
export async function getOrganizerRegistrationTrends(token: string): Promise<unknown> {
    const res = await API.get("/organizer-trends", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer top listings (top 3 by registrations).
 */
export async function getTopListings(token: string): Promise<unknown> {
    const res = await API.get("/organizer-top-listings", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch highest performing listings (Event and Hackathon).
 */
export async function getHighestPerformingListings(token: string): Promise<unknown> {
    const res = await API.get("/organizer-highest-performing", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer registrations summary card data.
 */
export async function getOrganizerRegistrationsSummary(token: string): Promise<{
    totalRegistrations: number;
    pendingReview: number;
    approved: number;
}> {
    const res = await API.get("/organizer/registrations-summary", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer opportunities summary card data.
 */
export async function getOrganizerOpportunitiesSummary(token: string): Promise<{
    draftsInProgress: number;
    readyToPublish: number;
    avgSetupTime: string;
}> {
    const res = await API.get("/organizer/opportunities-summary", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer payments summary card data.
 */
export async function getOrganizerPaymentsSummary(token: string): Promise<{
    totalCollected: string;
    pendingPayout: string;
    refunds: number;
}> {
    const res = await API.get("/organizer/payments-summary", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer referrals summary card data.
 */
export async function getOrganizerReferralsSummary(token: string): Promise<{
    totalReferrals: number;
    converted: number;
    rewardsIssued: number;
}> {
    const res = await API.get("/organizer/referrals-summary", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer pipeline summary card data.
 */
export async function getOrganizerPipelineSummary(token: string): Promise<{
    totalRegistrations: number;
    shortlisted: number;
    waitlisted: number;
}> {
    const res = await API.get("/organizer/pipeline-summary", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer roles summary card data.
 */
export async function getOrganizerRolesSummary(token: string): Promise<{
    verifiedCampuses: number;
    adminSeats: number;
    renewalsDue: number;
}> {
    const res = await API.get("/organizer/roles-summary", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}

/**
 * Fetch organizer notifications summary card data.
 */
export async function getOrganizerNotificationsSummary(token: string): Promise<{
    queuedAlerts: number;
    sentToday: number;
    openRate: string;
}> {
    const res = await API.get("/organizer/notifications-summary", {
        headers: buildAuthHeaders(token),
    });
    return res.data;
}
