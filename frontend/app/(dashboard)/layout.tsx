'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/components/auth/AuthProvider'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else {
        setChecking(false)
      }
    }
  }, [user, loading, router])

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center space-y-4 text-slate-400">
        <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
        <span className="text-sm font-medium">Authorizing session...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex text-slate-200">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
