import { createApiClient } from "./apiClient";

export interface AdminUser {
    id: string;
    email: string;
    role: string;
}

export interface LoginResponse {
    token: string;
    user: AdminUser;
}

const client = createApiClient("/");

export async function handleAdminLogin(email: string, password: string) {
    const { data } = await client.post<LoginResponse>("login", {
        email,
        password,
    });

    // Set cookie
    // Note: For better security, this should be done in a Server Action or Middleware if possible,
    // but for a client-side login flow as requested, we set it here or rely on the component.
    // The user requested: "set that token in cookies if valid".
    // We can use a library like 'js-cookie' or just document.cookie.
    // Since we are in the API file, we might return the data and let the component handle the cookie?
    // Or we can just set it here.

    if (typeof document !== 'undefined') {
        document.cookie = `admin_token=${data.token}; path=/; max-age=86400; SameSite=Lax; Secure`;
    }

    return data;
}

export function logoutAdmin() {
    if (typeof document !== 'undefined') {
        document.cookie = `admin_token=; path=/; max-age=0; SameSite=Lax; Secure`;
    }
    window.location.href = "/login";
}
