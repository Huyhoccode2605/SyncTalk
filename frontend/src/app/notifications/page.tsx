// src/app/notifications/page.tsx

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useNotificationCount } from "@/hooks/use-notification-count";
import browserClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { Inbox, MessageCircle, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Notification {
    id: string
    type: string
    message: string
    is_read: boolean
    reference_id: string | null
    created_at: string
}

function NotificationsPage() {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const { decrementUnread } = useNotificationCount();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/sign-in");
            return;
        }

        let isMounted = true;

        async function load() {
            setIsLoading(true);
            try {
                const res = await browserClient.get("/api/notifications");
                if (!isMounted) return;
                setNotifications(res.data.data || []);
            } catch (error) {
                console.log(error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        load();
        return () => { isMounted = false; };
    }, [isAuthenticated]);

    async function handleMarkRead(n: Notification) {
        try {
            if (!n.is_read) {
                await browserClient.put(`/api/notifications/${n.id}/read`);
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.id === n.id ? { ...notif, is_read: true } : notif
                    )
                );
                decrementUnread();
            }
        } catch (err) {
            console.log(err);
        }

        if (n.reference_id) {
            router.push(`/threads/${n.reference_id}`);
        }
    }

    return (
        <div className="mx-auto flex w-full flex-col gap-6 py-8 px-4">
            <div>
                <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
                    <Inbox className="h-7 w-7 text-primary" />
                    Thông báo
                </h1>
            </div>

            <Card className="border-border/70 bg-card">
                {isLoading && (
                    <CardContent className="py-10 text-center">
                        <p className="text-sm text-muted-foreground">Đang tải...</p>
                    </CardContent>
                )}
                {!isLoading && notifications.length === 0 && (
                    <CardContent className="py-10 text-center">
                        <p className="text-sm text-muted-foreground">
                            Chưa có thông báo nào...
                        </p>
                    </CardContent>
                )}

                {!isLoading && notifications.length > 0 && (
                    <CardContent className="divide-y divide-border/70">
                        {notifications.map((n) => {
                            const isUnread = !n.is_read;
                            const icon = n.type === "reply"
                                ? <MessageCircle className="h-4 w-4 text-chart-2" />
                                : <ThumbsUp className="h-4 w-4 text-primary" />;

                            return (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => handleMarkRead(n)}
                                    className={`flex w-full items-start gap-4 px-3 py-4 text-left transition-colors duration-200 ${
                                        isUnread
                                            ? "bg-primary/5 hover:bg-primary/10"
                                            : "hover:bg-primary/20"
                                    }`}
                                >
                                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-background/60">
                                        {icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                            <p className={`text-sm ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                                {n.message}
                                            </p>
                                            <span className={`shrink-0 text-xs ${isUnread ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                                {new Date(n.created_at).toLocaleString("vi-VN")}
                                            </span>
                                        </div>
                                        {isUnread && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[12px] text-primary">
                                                    Mới
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

export default NotificationsPage;