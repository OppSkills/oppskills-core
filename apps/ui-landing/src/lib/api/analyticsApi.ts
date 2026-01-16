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
