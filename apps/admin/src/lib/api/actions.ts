import { createApiClient } from "./apiClient";

export const adminClient = createApiClient("/");


import { logoutAdmin } from "./auth";

export async function getMe() {
    try {
        return await adminClient.get("/me");
    } catch (error: any) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            logoutAdmin();
        }
        throw error;
    }
}

export async function getAdmins() {
    return adminClient.get("/admin");
}

export async function updateAdminPassword(data: { password: string }) {
    return adminClient.put(`/admin`, data);
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