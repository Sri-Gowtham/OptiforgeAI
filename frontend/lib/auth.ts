'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { authAPI } from '@/lib/api'

interface User {
  email: string
  joinedAt: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

import { createElement } from 'react'

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clear any stale session so the app always starts at /login
    try {
      localStorage.removeItem('optiforge_session')
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedIn } = await authAPI.login(email, password)
    localStorage.setItem('optiforge_session', JSON.stringify(loggedIn))
    setUser(loggedIn)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { user: created } = await authAPI.register(email, password)
    localStorage.setItem('optiforge_session', JSON.stringify(created))
    setUser(created)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('optiforge_session')
    setUser(null)
  }, [])

  return createElement(AuthContext.Provider, { value: { user, loading, login, register, logout } }, children)
}

export function useAuth() {
  return useContext(AuthContext)
}
