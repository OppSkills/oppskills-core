import { createApiClient } from "./apiClient";

export const adminClient = createApiClient("/");

// Add interceptor to attach token from cookie
adminClient.interceptors.request.use(async (config) => {
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

export async function getMe() {
    return adminClient.get("/me");
}

export async function getAdmins() {
    return adminClient.get("/admin");
}


export async function createAdmin(data: any) {
    return adminClient.post("/admin", data);
}

export async function updateAdmin(id: string, data: any) {
    return adminClient.put(`/admin/${id}`, data);
}

export async function deleteAdmin(id: string) {
    return adminClient.delete(`/admin/${id}`);
}