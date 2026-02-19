import { createApiClient } from "./apiClient";

export const adminLogsClient = createApiClient("/logs");

export async function getAdminLogs({ page, search }: { page?: number; search?: string }) {
    return adminLogsClient.get("", { params: { page, search } });
}