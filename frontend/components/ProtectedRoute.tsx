"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, role, hasAccess } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Check authentication status
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check role-based access
        if (!hasAccess(allowedRoles)) {
            router.push('/access-denied');
            return;
        }

        setIsChecking(false);
    }, [isAuthenticated, role, allowedRoles, hasAccess, router]);

    // Show loading state while checking auth
    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <Shield className="w-16 h-16 text-indigo-500" />
                        <Loader2 className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Verifying Access...</p>
                </motion.div>
            </div>
        );
    }

    // Render protected content
    return <>{children}</>;
}
