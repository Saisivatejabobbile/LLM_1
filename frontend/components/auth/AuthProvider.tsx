'use client'

import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { User } from '@/lib/types'
import { api } from '@/lib/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('slm_token')
      const storedUser = localStorage.getItem('slm_user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))

        // Verify token is still valid
        try {
          const freshUser = await api.auth.me()
          setUser(freshUser)
          localStorage.setItem('slm_user', JSON.stringify(freshUser))
        } catch {
          // Token invalid — clear
          localStorage.removeItem('slm_token')
          localStorage.removeItem('slm_user')
          setToken(null)
          setUser(null)
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStoredAuth()
  }, [loadStoredAuth])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await api.auth.login({ email, password })
      setToken(response.token)
      setUser(response.user)
      localStorage.setItem('slm_token', response.token)
      localStorage.setItem('slm_user', JSON.stringify(response.user))
      toast.success(`Welcome back, ${response.user.name}!`)
      router.push('/dashboard')
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Check your credentials.'
      toast.error(msg)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      const response = await api.auth.register({ email, password, name })
      setToken(response.token)
      setUser(response.user)
      localStorage.setItem('slm_token', response.token)
      localStorage.setItem('slm_user', JSON.stringify(response.user))
      toast.success(`Welcome to SLM Forge, ${response.user.name}!`)
      router.push('/dashboard')
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.'
      toast.error(msg)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('slm_token')
    localStorage.removeItem('slm_user')
    toast.success('Logged out successfully')
    router.push('/login')
  }, [router])

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await api.auth.me()
      setUser(freshUser)
      localStorage.setItem('slm_user', JSON.stringify(freshUser))
    } catch {
      logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
