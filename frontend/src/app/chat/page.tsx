// src/app/chat/page.tsx

"use client";

import DirectChatPanel from "@/components/chat/direct-chat-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocket } from "@/hooks/use-socket";
import browserClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { MessageSquare, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ChatUser {
    id: string
    username: string
    is_online: boolean
    profile_image_url: string | null
}

function Chat() {
    const { connected, socket } = useSocket();
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();

    const [users, setUsers] = useState<ChatUser[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/sign-in");
            return;
        }

        let isMounted = true;

        async function load() {
            setLoadingUsers(true);
            try {
                const res = await browserClient.get("/api/auth/users");
                if (!isMounted) return;
                const usersList: ChatUser[] = res.data.data || [];
                setUsers(usersList);
                if (usersList.length > 0 && activeUserId === null) {
                    setActiveUserId(usersList[0].id);
                }
            } catch (err) {
                console.log(err);
            } finally {
                if (isMounted) setLoadingUsers(false);
            }
        }

        load();

        return () => { isMounted = false; };
    }, [isAuthenticated]);

    useEffect(() => {
        if (!socket) return;

        socket.on("user_online", (data: { user_id: string }) => {
            setUsers((prev) =>
                prev.map((u) => u.id === data.user_id ? { ...u, is_online: true } : u)
            );
        });

        socket.on("user_offline", (data: { user_id: string }) => {
            setUsers((prev) =>
                prev.map((u) => u.id === data.user_id ? { ...u, is_online: false } : u)
            );
        });

        return () => {
            socket.off("user_online");
            socket.off("user_offline");
        };
    }, [socket]);

    const activeUser = activeUserId !== null
        ? users.find((u) => u.id === activeUserId) ?? null
        : null;

    const onlineCount = users.filter((u) => u.is_online).length;

    return (
        <div className="max-w-6xl mx-auto flex w-full flex-col gap-4 py-6 md:flex-row md:gap-6">
            <aside className="w-full shrink-0 md:w-72">
                <Card className="h-full border-border/70 bg-card md:sticky md:top-24">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <CardTitle className="text-sm text-foreground">
                                Tin nhắn trực tiếp
                            </CardTitle>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {onlineCount} Online - {users.length} người dùng
                        </p>
                    </CardHeader>
                    <CardContent className="flex max-h-[calc(100vh-12rem)] flex-col gap-1 overflow-y-auto">
                        {loadingUsers && (
                            <p className="text-muted-foreground text-sm">Đang tải...</p>
                        )}

                        {!loadingUsers && users.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center py-4">
                                Chưa có người dùng nào
                            </p>
                        )}

                        {!loadingUsers && users.map((u) => {
                            const isActive = activeUserId === u.id;

                            return (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => setActiveUserId(u.id)}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs transition-colors duration-150",
                                        isActive
                                            ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                                            : "text-muted-foreground hover:bg-card/90"
                                    )}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                                {u.username[0].toUpperCase()}
                                            </span>
                                        </div>
                                        {u.is_online && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex flex-1 flex-col">
                                        <span className="truncate text-[12px] font-medium text-foreground">
                                            {u.username}
                                        </span>
                                        <span className={cn(
                                            "text-[12px]",
                                            u.is_online ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {u.is_online ? "Online" : "Offline"}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </CardContent>
                </Card>
            </aside>

            <main className="min-h-[calc(100vh-8rem)] flex-1 md:min-h-auto">
                {activeUserId && activeUser ? (
                    <DirectChatPanel
                        otherUserId={activeUserId}
                        otherUser={activeUser}
                        socket={socket}
                        connected={connected}
                    />
                ) : (
                    <Card className="flex h-full items-center justify-center border-border/70 bg-card">
                        <CardContent className="text-center">
                            <Users className="mx-auto mb-3 w-12 h-12 opacity-55 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Chọn người dùng để bắt đầu chat...
                            </p>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}

export default Chat;