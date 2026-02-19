import { createApiClient } from "./apiClient";

export const adminLogsClient = createApiClient("/logs");

adminLogsClient.interceptors.request.use(async (config) => {
    let token;

    if (typeof window === 'undefined') {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        token = cookieStore.get("admin_token")?.value;
    } else {
        // Basic client-side cookie parsing
        const match = document.cookie.match(new RegExp('(^| )admin_token=([^;]+)'));
        if (match) {
            token = match[2];
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export async function getAdminLogs({ page, search }: { page?: number; search?: string }) {
    return adminLogsClient.get("", { params: { page, search } });
}