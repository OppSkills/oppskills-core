import { createApiClient } from "./apiClient";

export const adminClient = createApiClient("/");




export async function getMe() {
    try {
        return await adminClient.get("/me");
    } catch (error: any) {
        // Let the caller (AuthContext) handle 401/403 and logout
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
    return adminClient.delete("/admin", { data: { id } });
}

// Features
export async function getHackathons(limit: number, cursor?: string, filterPending?: boolean) {
    return adminClient.get("/features/hackathons", {
        params: { limit, cursor, filterPending }
    });
}

export async function getEvents(limit: number, cursor?: string, filterPending?: boolean) {
    return adminClient.get("/features/events", {
        params: { limit, cursor, filterPending }
    });
}

export async function getFestivals(limit: number, cursor?: string, filterPending?: boolean) {
    return adminClient.get("/features/festivals", {
        params: { limit, cursor, filterPending }
    });
}

export async function toggleFeatureApproval(type: 'hackathon' | 'event' | 'festival', id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
    return adminClient.put(`/features/approval/${type}/${id}`, { status });
}

// Users
export const usersClient = createApiClient("/users");

export async function getUsers(params: { page?: number; search?: string }) {
    return usersClient.get("/", { params });
}

export async function deleteUserById(userId: string) {
    return usersClient.delete("/by-id", { data: { userId } });
}

export async function deleteUserByEmail(email: string) {
    return usersClient.delete("/by-email", { data: { email } });
}