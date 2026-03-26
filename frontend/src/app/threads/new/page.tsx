// src/app/threads/new/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import browserClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function NewThreadsPage() {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ title: "", content: "" });
    const [errors, setErrors] = useState({ title: "", content: "" });

    function validate() {
        const newErrors = { title: "", content: "" };
        if (form.title.trim().length < 5) newErrors.title = "Tiêu đề quá ngắn (tối thiểu 5 ký tự)";
        if (form.content.trim().length < 15) newErrors.content = "Nội dung quá ngắn (tối thiểu 15 ký tự)";
        setErrors(newErrors);
        return !newErrors.title && !newErrors.content;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isAuthenticated) {
            router.push("/sign-in");
            return;
        }
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const res = await browserClient.post("/api/threads", {
                title: form.title.trim(),
                content: form.content.trim(),
            });

            const created = res.data.data;
            toast.success("Thread đã được tạo!", {
                description: "Bài viết của bạn đã được đăng.",
            });
            router.push(`/threads/${created.id}`);
        } catch (e) {
            console.log(e);
            toast.error("Không thể tạo thread");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Tạo Thread mới
                </h1>
            </div>

            <Card className="border-border/70 bg-card">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground">Chi tiết Thread</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">
                                Tiêu đề
                            </label>
                            <Input
                                placeholder="Nhập tiêu đề thread..."
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                disabled={isSubmitting}
                                className="border-border mt-3 bg-background/70 text-sm"
                            />
                            {errors.title && (
                                <p className="text-xs text-red-400">{errors.title}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">
                                Nội dung
                            </label>
                            <Textarea
                                rows={8}
                                placeholder="Nội dung thread..."
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                disabled={isSubmitting}
                                className="border-border mt-3 bg-background/70 text-sm"
                            />
                            {errors.content && (
                                <p className="text-xs text-red-400">{errors.content}</p>
                            )}
                        </div>

                        <CardFooter className="flex justify-end border-t border-border px-0 pt-5">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.back()}
                                className="mr-2"
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {isSubmitting ? "Đang đăng..." : "Đăng Thread"}
                            </Button>
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default NewThreadsPage;