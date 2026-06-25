'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Bell, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'

interface Breadcrumb {
  label: string
  href?: string
}

interface HeaderProps {
  breadcrumbs?: Breadcrumb[]
  title?: string
}

function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Breadcrumb[] = [{ label: 'Home', href: '/dashboard' }]

  let path = ''
  segments.forEach((segment, i) => {
    path += `/${segment}`
    const label =
      segment === 'dashboard'
        ? 'Dashboard'
        : segment === 'projects'
        ? 'Projects'
        : segment === 'new'
        ? 'New Project'
        : segment === 'dataset'
        ? 'Dataset'
        : segment === 'training'
        ? 'Training'
        : segment === 'evaluation'
        ? 'Evaluation'
        : segment === 'deploy'
        ? 'Deploy'
        : segment.length === 24 || segment.length === 36
        ? 'Project'
        : segment

    crumbs.push({
      label,
      href: i < segments.length - 1 ? path : undefined,
    })
  })

  return crumbs
}

export function Header({ breadcrumbs, title }: HeaderProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const crumbs = breadcrumbs ?? generateBreadcrumbs(pathname)

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        {title ? (
          <h1 className="text-lg font-semibold text-text">{title}</h1>
        ) : (
          <nav className="flex items-center gap-1 text-sm">
            {crumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-muted" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-muted hover:text-text transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-text font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface2 transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {getInitials(user?.name ?? 'U')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-text hidden sm:block">
                {user?.name ?? 'User'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs text-muted font-normal">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
