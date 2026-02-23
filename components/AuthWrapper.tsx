"use client";

import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user && pathname !== "/login" && pathname !== "/signup") {
            router.push("/login");
        } else if (!loading && user && (pathname === "/login" || pathname === "/signup")) {
            router.push("/");
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user && pathname !== "/login" && pathname !== "/signup") {
        return null; // Or loading state while redirecting
    }

    if (pathname === "/login" || pathname === "/signup") {
        return <div className="h-screen w-screen">{children}</div>;
    }

    return (
        <>
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {children}
            </main>
        </>
    );
}
