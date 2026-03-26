// src/app/profile/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import browserClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function ProfilePage() {
    const { user, setUser, isAuthenticated, logout } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({ username: "" });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/sign-in");
            return;
        }

        async function loadProfile() {
            setIsLoading(true);
            try {
                const res = await browserClient.get("/api/auth/profile");
                const userData = res.data.data;
                setUser(userData);
                setForm({ username: userData.username || "" });
            } catch (err) {
                console.log(err);
            } finally {
                setIsLoading(false);
            }
        }

        loadProfile();
    }, [isAuthenticated]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await browserClient.put("/api/auth/profile", {
                username: form.username,
            });
            setUser(res.data.data);
            toast.success("Cập nhật thành công!", {
                description: "Thông tin của bạn đã được lưu.",
            });
        } catch (e) {
            console.log(e);
            toast.error("Cập nhật thất bại");
        } finally {
            setIsSaving(false);
        }
    }

    const handleLogout = () => {
        logout();
        router.push("/sign-in");
    };

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
            <div>
                <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
                    <User className="w-8 h-8 text-primary" />
                    Hồ sơ cá nhân
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Quản lý thông tin cá nhân của bạn
                </p>
            </div>

            <Card className="border-border/70 bg-card">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-teal-500 flex items-center justify-center">
                            <span className="text-2xl font-bold text-black">
                                {user?.username?.[0]?.toUpperCase() || "U"}
                            </span>
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-foreground">
                                {user?.username || "Người dùng"}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card className="border-border/70 bg-card">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground">Chỉnh sửa hồ sơ</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">
                                Tên người dùng
                            </label>
                            <Input
                                placeholder="Nhập tên người dùng"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                disabled={isLoading || isSaving}
                                className="border-border mt-2 bg-background/60 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Email</label>
                            <Input
                                value={user?.email || ""}
                                disabled
                                className="border-border mt-2 bg-background/40 text-sm opacity-60"
                            />
                            <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                        </div>

                        <CardFooter className="flex justify-between border-t border-border px-0 pt-5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleLogout}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                                Đăng xuất
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || isSaving}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <Save className="mr-2 w-4 h-4" />
                                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default ProfilePage;