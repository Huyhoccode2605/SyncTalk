// src/components/layout/navbar.tsx

"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import browserClient from "@/lib/api-client";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, isAuthenticated, logout } = useAuthStore();
    const { socket } = useSocket();
    const { unreadCount, setUnreadCount, incrementUnread } = useNotificationCount();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }

        async function loadUnreadNotifications() {
            try {
                const res = await browserClient.get("/api/notifications/unread");
                setUnreadCount(res.data.data?.length ?? 0);
            } catch (e) {
                console.log(e);
            }
        }

        loadUnreadNotifications();
    }, [isAuthenticated]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (payload: any) => {
            incrementUnread();
            toast("Thông báo mới", {
                description: payload.message || "Bạn có thông báo mới",
            });
        };

        socket.on("notification:new", handleNewNotification);

        return () => {
            socket.off("notification:new", handleNewNotification);
        };
    }, [socket, incrementUnread]);

    const handleLogout = () => {
        logout();
        router.push("/sign-in");
    };

    const navItems = [
        { href: "/chat", label: "Chat" },
        { href: "/profile", label: "Profile" },
    ];

    return (
        <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground"
                    >
                        <span className="text-teal-400">SyncTalk</span>
                    </Link>
                    <nav className="hidden items-center gap-1 md:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors bg-primary/20 text-primary shadow-sm"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {isAuthenticated ? (
                        <>
                            <Link href="/notifications">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="relative h-9 w-9 text-muted-foreground hover:bg-card/10 hover:text-foreground"
                                >
                                    <Bell className="h-4 w-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-1 -top-1 inline-flex min-w-5 min-h-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                            <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-teal-400 font-bold text-[#0a0f1c] text-xs">
                                {user?.username?.[0]?.toUpperCase() || "U"}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="h-8 w-8 text-muted-foreground hover:text-red-400"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <Link href="/sign-in">
                            <Button size="sm" className="bg-teal-500 text-black hover:bg-teal-400">
                                Đăng nhập
                            </Button>
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((open) => !open)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent text-muted-foreground transition-colors md:hidden"
                    >
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="border-t border-sidebar-border bg-sidebar/90 md:hidden">
                    <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 pb-4 pt-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors bg-primary/20 text-primary shadow-sm"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}

export default Navbar;