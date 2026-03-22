"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// User roles matching backend UserRole enum
export type UserRole = 'Admin' | 'Doctor' | 'Nurse';

interface AuthContextType {
    isAuthenticated: boolean;
    role: UserRole | null;
    staffId: string | null;
    token: string | null;
    login: (token: string, role: UserRole, staffId: string) => void;
    logout: () => void;
    hasAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState<UserRole | null>(null);
    const [staffId, setStaffId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    // Initialize from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role') as UserRole | null;
        const storedStaffId = localStorage.getItem('staff_id');

        if (storedToken && storedRole && storedStaffId) {
            setToken(storedToken);
            setRole(storedRole);
            setStaffId(storedStaffId);
            setIsAuthenticated(true);
        }
    }, []);

    const login = useCallback((newToken: string, newRole: UserRole, newStaffId: string) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', newRole);
        localStorage.setItem('staff_id', newStaffId);

        setToken(newToken);
        setRole(newRole);
        setStaffId(newStaffId);
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('staff_id');

        setToken(null);
        setRole(null);
        setStaffId(null);
        setIsAuthenticated(false);

        router.push('/login');
    }, [router]);

    const hasAccess = useCallback((allowedRoles: UserRole[]): boolean => {
        if (!role) return false;
        return allowedRoles.includes(role);
    }, [role]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            role,
            staffId,
            token,
            login,
            logout,
            hasAccess
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
