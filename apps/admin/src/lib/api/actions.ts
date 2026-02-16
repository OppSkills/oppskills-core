import { createApiClient } from "./apiClient";

export const adminClient = createApiClient("/");

// Add interceptor to attach token from cookie
adminClient.interceptors.request.use((config) => {
    // Basic client-side cookie parsing
    if (typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )admin_token=([^;]+)'));
        if (match) {
            config.headers.Authorization = `Bearer ${match[2]}`;
        }
    }
    return config;
});

export async function getMe() {
    return adminClient.get("/me");
}