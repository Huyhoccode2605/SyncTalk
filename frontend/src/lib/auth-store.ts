// src/lib/auth-store.ts

import { create } from 'zustand'
import Cookies from 'js-cookie'

interface User {
    id: string
    username: string
    email: string
    profile_image_url: string | null
    is_online: boolean
}

interface AuthState {
    user: User | null
    token: string | null
    isLoaded: boolean
    isAuthenticated: boolean
    setUser: (user: User) => void
    setToken: (token: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: Cookies.get('token') || null,
    isLoaded: false,
    isAuthenticated: !!Cookies.get('token'),

    setUser: (user) => set({ user, isAuthenticated: true, isLoaded: true }),

    setToken: (token) => {
        Cookies.set('token', token, { expires: 1 })
        set({ token, isAuthenticated: true })
    },

    logout: () => {
        Cookies.remove('token')
        set({ user: null, token: null, isAuthenticated: false, isLoaded: true })
    }
}))