// src/app/sign-up/[[...sign-up]]/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import browserClient, { apiPost } from '@/lib/api-client'
import Link from 'next/link'

export default function SignUpPage() {
    const router = useRouter()
    const { setToken, setUser } = useAuthStore()
    const [form, setForm] = useState({ username: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await apiPost<any, any>(
                browserClient,
                '/api/auth/register',
                { username: form.username, email: form.email, password: form.password }
            )
            const loginRes = await apiPost<any, any>(
                browserClient,
                '/api/auth/login',
                { email: form.email, password: form.password }
            )
            setToken(loginRes.token)
            setUser(loginRes.user)
            router.push('/')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng ký thất bại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <h1 className="text-2xl font-bold text-white mb-2 text-center">Đăng ký</h1>
                <p className="text-zinc-400 text-sm text-center mb-6">
                    Tạo tài khoản mới để bắt đầu.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Tên người dùng</label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition text-sm"
                            placeholder="Nhập tên người dùng"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition text-sm"
                            placeholder="ten@congty.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Mật khẩu</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-semibold rounded-xl transition"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng ký →'}
                    </button>
                </form>

                <p className="mt-6 text-center text-zinc-500 text-sm">
                    Đã có tài khoản?{' '}
                    <Link href="/sign-in" className="text-teal-400 hover:text-teal-300">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    )
}