import { createApiClient } from "./apiClient";

export const adminClient = createApiClient("/");

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LifecycleStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

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

export async function toggleFeatureApproval(type: 'hackathon' | 'event' | 'festival', id: string, status: ApprovalStatus) {
    return adminClient.put(`/features/approval/${type}/${id}`, { status });
}

export async function getFeatureDetail(type: string, slug: string) {
    return adminClient.get(`/features/detail/${type}/${slug}`);
}

export async function updateFeatureDetail(type: string, id: string, data: any) {
    return adminClient.put(`/features/detail/${type}/${id}`, data);
}

export async function getPayments(params: { page?: number; limit?: number }) {
    return adminClient.get("/payments", { params });
}

// Users
export const usersClient = createApiClient("/users");

export async function getUsers(params: { page?: number; search?: string }) {
    return usersClient.get("/", { params });
}

export async function getUserDetail(id: string) {
    return usersClient.get(`/${id}`);
}