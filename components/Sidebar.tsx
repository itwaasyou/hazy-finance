"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    PieChart,
    Wallet,
    TrendingUp,
    Settings,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Portfolio", href: "/portfolio", icon: Wallet },
    { name: "Transactions", href: "/transactions", icon: TrendingUp },
    { name: "SIP Tracker", href: "/sip", icon: PieChart },
    { name: "Analytics", href: "/analytics", icon: PieChart },
    { name: "Members", href: "/members", icon: Wallet }, // Using Wallet icon temporarily or import Users
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen w-64 flex-col border-r border-border bg-card text-card-foreground">
            <div className="flex h-16 items-center border-b border-border px-6">
                <h1 className="text-xl font-bold tracking-tight text-gradient">Hazy Finance</h1>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-border p-4">
                <div className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                            {user?.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-foreground truncate">{user?.displayName || "User"}</span>
                        <span className="text-xs truncate max-w-[120px]" title={user?.email || ""}>{user?.email}</span>
                    </div>
                    <LogOut
                        onClick={logout}
                        className="ml-auto h-4 w-4 cursor-pointer hover:text-destructive transition-colors"
                    />
                </div>
            </div>
        </div>
    );
}
