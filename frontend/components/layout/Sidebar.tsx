'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
  Zap,
  Plus,
  Circle,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const navItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/projects',
    icon: FolderOpen,
    label: 'Projects',
  },
]

interface SidebarProject {
  id: string
  name: string
  status: string
}

interface SidebarProps {
  projects?: SidebarProject[]
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

export function Sidebar({ projects = [], collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [projectsOpen, setProjectsOpen] = useState(true)

  const statusDot: Record<string, string> = {
    draft: 'bg-slate-500',
    training: 'bg-cyan-500 animate-pulse',
    completed: 'bg-emerald-500',
    failed: 'bg-red-500',
    deployed: 'bg-violet-500',
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-surface border-r border-border overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-bold text-lg text-gradient-primary">SLM Forge</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => onCollapse?.(!collapsed)}
        className={cn(
          'absolute top-[4.5rem] -right-3 z-10',
          'w-6 h-6 rounded-full bg-surface border border-border',
          'flex items-center justify-center',
          'hover:border-primary/50 hover:bg-surface2',
          'transition-all duration-200 shadow-card'
        )}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-muted" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted" />
        )}
      </button>

      <ScrollArea className="flex-1 px-2 py-3">
        {/* Main nav */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'sidebar-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium',
                  active
                    ? 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px]'
                    : 'text-muted hover:bg-surface2 hover:text-text'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Projects list */}
        {!collapsed && (
          <div className="mt-6">
            <button
              onClick={() => setProjectsOpen((o) => !o)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-text transition-colors"
            >
              <span>Recent Projects</span>
              <ChevronDown
                className={cn('w-3 h-3 transition-transform', !projectsOpen && '-rotate-90')}
              />
            </button>

            <AnimatePresence>
              {projectsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-1 space-y-0.5"
                >
                  {projects.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted italic">No projects yet</p>
                  ) : (
                    projects.slice(0, 8).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-all',
                          pathname.startsWith(`/projects/${project.id}`)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted hover:bg-surface2 hover:text-text'
                        )}
                      >
                        <Circle
                          className={cn(
                            'w-2 h-2 shrink-0 rounded-full',
                            statusDot[project.status] ?? 'bg-slate-500'
                          )}
                          fill="currentColor"
                        />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    ))
                  )}

                  <Link
                    href="/projects/new"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-primary hover:bg-primary/10 transition-colors mt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Project</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* User info at bottom */}
      <div className="border-t border-border p-3 shrink-0">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text truncate">{user?.name ?? 'User'}</p>
              <p className="text-xs text-muted truncate">{user?.email ?? ''}</p>
            </div>
            <Link href="/settings">
              <Settings className="w-4 h-4 text-muted hover:text-text transition-colors" />
            </Link>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-emerald-400">Backend Connected</span>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
