// src/components/threads/threads-home.tsx

"use client";

import browserClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface Thread {
    id: string
    title: string
    content: string
    author_id: string
    like_count: number
    reply_count: number
    is_pinned: boolean
    created_at: string
    image_url?: string
}

function ThreadsHomePage() {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function load() {
            setIsLoading(true);
            try {
                const res = await browserClient.get("/api/threads");
                if (!isMounted) return;
                setThreads(res.data.data || []);
            } catch (error) {
                console.log(error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        load();

        return () => { isMounted = false; };
    }, []);

    const filteredThreads = threads.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex w-full flex-col gap-6 lg:flex-row">
            <div className="flex-1 space-y-6">
                <Card className="border-border/70 bg-card/95">
                    <CardHeader className="pb-5">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            Latest Threads
                        </h1>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="flex flex-1 items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="pl-10 bg-secondary/80 text-sm text-foreground placeholder:text-muted-foreground"
                                        placeholder="Tìm kiếm threads..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {isAuthenticated && (
                            <Link href="/threads/new">
                                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 md:w-auto">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tạo Thread mới
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {isLoading && (
                        <div className="flex items-center justify-center rounded-lg border border-border bg-card py-10">
                            <p className="text-sm text-muted-foreground">Đang tải...</p>
                        </div>
                    )}

                    {!isLoading && filteredThreads.length === 0 && (
                        <Card className="border-dashed border-border bg-card">
                            <CardContent className="py-10 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Chưa có thread nào. Hãy tạo thread đầu tiên!
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {!isLoading && filteredThreads.map((thread) => (
                        <Card
                            key={thread.id}
                            className="group cursor-pointer border-border/70 bg-card transition-colors duration-150 hover:border-primary/90 hover:bg-card/90"
                        >
                            <Link href={`/threads/${thread.id}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <Badge
                                                    variant="outline"
                                                    className="border-border/70 bg-secondary/70 text-[12px]"
                                                >
                                                    Thread
                                                </Badge>
                                                <span className="text-muted-foreground/85">
                                                    {new Date(thread.created_at).toLocaleDateString("vi-VN")}
                                                </span>
                                            </div>
                                            <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary">
                                                {thread.title}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-4">
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {thread.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>💬 {thread.reply_count} bình luận</span>
                                        <span>❤️ {thread.like_count} lượt thích</span>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ThreadsHomePage;