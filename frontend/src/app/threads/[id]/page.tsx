// src/app/threads/[id]/page.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import browserClient, { apiGet } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, MessageCircle, ThumbsUp, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Author {
    id: string
    username: string
}

interface ThreadDetail {
    id: string
    title: string
    content: string
    author_id: string
    author?: Author
    like_count: number
    reply_count: number
    is_pinned: boolean
    created_at: string
    image_url?: string
}

interface Comment {
    id: string
    thread_id: string
    author_id: string
    author?: Author
    content: string
    created_at: string
}

function ThreadsDetailsPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [thread, setThread] = useState<ThreadDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [commentBeingDeletedId, setCommentBeingDeletedId] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isTogglingLike, setIsTogglingLike] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            setLoading(true);
            try {
                const [threadRes, commentsRes] = await Promise.all([
                    browserClient.get(`/api/threads/${id}`),
                    browserClient.get(`/api/threads/${id}/replies`),
                ]);

                if (!isMounted) return;

                const threadData: ThreadDetail = threadRes.data.data;
                const commentsData: Comment[] = commentsRes.data.data;

                setThread(threadData);
                setLikeCount(threadData.like_count);
                setComments(commentsData);
            } catch (e) {
                console.log(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        if (id) load();

        return () => { isMounted = false; };
    }, [id]);

    async function handleAddComment() {
        const trimmedComment = newComment.trim();
        if (trimmedComment.length < 2) return;

        if (!isAuthenticated) {
            toast.error("Cần đăng nhập", {
                description: "Vui lòng đăng nhập để bình luận",
            });
            return;
        }

        try {
            setIsPostingComment(true);
            const res = await browserClient.post(`/api/threads/${id}/replies`, {
                content: trimmedComment,
            });
            const created: Comment = res.data.data;
            setComments((prev) => [...prev, created]);
            setNewComment("");
            toast.success("Đã thêm bình luận!");
        } catch (e) {
            console.log(e);
            toast.error("Không thể thêm bình luận");
        } finally {
            setIsPostingComment(false);
        }
    }

    async function handleDeleteComment(commentId: string) {
        const confirmed = window.confirm("Xóa bình luận này? Hành động này không thể hoàn tác.");
        if (!confirmed) return;

        if (!isAuthenticated) {
            toast.error("Cần đăng nhập");
            return;
        }

        try {
            setCommentBeingDeletedId(commentId);
            await browserClient.delete(`/api/threads/replies/${commentId}`);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            toast.success("Đã xóa bình luận");
        } catch (e) {
            console.log(e);
        } finally {
            setCommentBeingDeletedId(null);
        }
    }

    async function handleToggleLike() {
        if (!thread) return;

        if (!isAuthenticated) {
            toast.error("Cần đăng nhập", {
                description: "Vui lòng đăng nhập để thích bài viết",
            });
            return;
        }

        try {
            setIsTogglingLike(true);
            if (isLiked) {
                await browserClient.delete(`/api/threads/${thread.id}/unlike`);
                setIsLiked(false);
                setLikeCount((prev) => Math.max(0, prev - 1));
                toast.success("Đã bỏ thích");
            } else {
                await browserClient.post(`/api/threads/${thread.id}/like`);
                setIsLiked(true);
                setLikeCount((prev) => prev + 1);
                toast.success("Đã thích bài viết");
            }
        } catch (e) {
            console.log(e);
        } finally {
            setIsTogglingLike(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center px-4 py-10">
                <p className="text-sm text-muted-foreground">Đang tải...</p>
            </div>
        );
    }

    if (!thread) {
        return (
            <div className="flex flex-col items-center justify-center px-4 py-10">
                <p className="text-sm text-muted-foreground">Không tìm thấy bài viết!</p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
            <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="w-fit rounded-full border border-border/70 bg-card/70 px-3 text-xs font-medium text-muted-foreground"
            >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Quay lại
            </Button>

            <Card className="border-border/70 bg-card">
                <CardHeader className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="outline" className="border-border/70 bg-secondary/70 text-[12px]">
                                    Thread
                                </Badge>
                                {thread.author?.username && (
                                    <span className="font-bold text-muted-foreground">
                                        By @{thread.author.username}
                                    </span>
                                )}
                                <span className="text-muted-foreground">
                                    {new Date(thread.created_at).toLocaleDateString("vi-VN")}
                                </span>
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                                {thread.title}
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 md:flex-col md:items-stretch">
                            {isAuthenticated && (
                                <Button
                                    size="sm"
                                    variant={isLiked ? "default" : "outline"}
                                    disabled={isTogglingLike}
                                    onClick={handleToggleLike}
                                >
                                    <ThumbsUp className="mr-2 h-4 w-4" />
                                    {isTogglingLike ? "..." : likeCount > 0 ? `${likeCount}` : "Like"}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {thread.content}
                    </p>
                    {thread.image_url && (
                        <img src={thread.image_url} alt="thread" className="w-full rounded-lg" />
                    )}
                </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        Bình luận ({comments.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {comments.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            Chưa có bình luận nào.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => {
                                const isMyComment = isAuthenticated && comment.author_id === user?.id;
                                return (
                                    <div
                                        className="rounded-lg border border-border/80 bg-background/70 p-5"
                                        key={comment.id}
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium text-foreground">
                                                    @{comment.author?.username || "Unknown"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(comment.created_at).toLocaleString("vi-VN")}
                                                </span>
                                            </div>
                                            {isMyComment && (
                                                <Button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    disabled={commentBeingDeletedId === comment.id}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                            {comment.content}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="space-y-3 border-t border-border pt-6">
                        <label className="block text-sm font-semibold text-foreground">
                            Thêm bình luận
                        </label>
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={5}
                            placeholder="Nhập bình luận của bạn..."
                            disabled={!isAuthenticated || isPostingComment}
                            className="border-border bg-background/70 text-sm"
                        />
                        <Button
                            onClick={handleAddComment}
                            disabled={isPostingComment || !newComment.trim() || !isAuthenticated}
                        >
                            {isPostingComment ? "Đang đăng..." : "Đăng bình luận"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ThreadsDetailsPage;