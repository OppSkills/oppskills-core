'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '@/lib/api/actions';
import { logoutAdmin } from '@/lib/api/auth';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
    isFirstLogin?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await getMe();
            setUser(response.data);
        } catch (error: any) {
            console.error('Failed to fetch user', error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                if (pathname !== '/login') {
                    await logoutAdmin();
                }
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (user?.isFirstLogin && pathname !== '/onboarding') {
            router.push('/onboarding');
        }
    }, [user, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
