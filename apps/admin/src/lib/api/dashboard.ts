import { createApiClient } from "./apiClient";

const API = createApiClient("stats");

export async function getDashboardOverview() {
    return API.get("dashboard");
}