'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  RefreshCw,
  PenTool,
  UserCircle,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/create', label: 'AI Create', icon: Sparkles },
  { href: '/optimizer', label: 'Optimizer', icon: RefreshCw },
  { href: '/editor', label: 'Manual Design', icon: PenTool },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  function handleLogout() {
    logout()
    toast.success('Signed out successfully')
    router.push('/login')
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const userInitial = user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#0d0d14] dark:bg-[#0d0d14] light:bg-slate-100 border-r border-white/[0.06] dark:border-white/[0.06] shrink-0">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-white/[0.06] dark:border-white/[0.06] border-gray-200">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 font-bold text-white text-base select-none shadow-lg shadow-indigo-600/30">
            O
          </div>
          <div className="flex-1">
            <div className="font-bold text-white dark:text-white text-gray-900 text-sm leading-tight">OptiForge AI</div>
            <div className="text-xs text-white/40 dark:text-white/40 text-gray-500 leading-tight">Design Platform</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
                active
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-white/60 dark:text-white/60 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-white/5 dark:hover:bg-white/5 hover:bg-gray-100'
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r" />
              )}
              <Icon size={18} className={active ? 'text-indigo-400' : 'text-white/40 dark:text-white/40 text-gray-400'} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/[0.06] dark:border-white/[0.06] border-gray-200 px-3 py-4 flex flex-col gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all
            text-white/60 dark:text-white/60 text-gray-600
            hover:text-white dark:hover:text-white hover:text-gray-900
            hover:bg-white/5 dark:hover:bg-white/5 hover:bg-gray-100"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-amber-400 shrink-0" />
          ) : (
            <Moon size={18} className="text-indigo-500 shrink-0" />
          )}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* User Info */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 dark:hover:bg-white/5 hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 font-semibold text-white text-xs">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs text-white/90 dark:text-white/90 text-gray-800 font-medium truncate">
                {user?.email?.split('@')[0] ?? 'User'}
              </div>
              <div className="text-xs text-emerald-400 font-medium">Free Plan</div>
            </div>
            <ChevronDown
              size={16}
              className={cn(
                'text-white/40 dark:text-white/40 text-gray-400 transition-transform',
                showMenu && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white/[0.08] dark:bg-white/[0.08] bg-white backdrop-blur border border-white/[0.1] dark:border-white/[0.1] border-gray-200 rounded-lg overflow-hidden shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link
                href="/profile"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/70 dark:text-white/70 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-white/5 dark:hover:bg-white/5 hover:bg-gray-50 transition-colors"
              >
                <UserCircle size={16} />
                Profile
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/70 dark:text-white/70 text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/[0.06] dark:border-white/[0.06] border-gray-100"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Profile Link */}
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
            pathname === '/profile'
              ? 'bg-indigo-600/20 text-indigo-400'
              : 'text-white/60 dark:text-white/60 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-white/5 dark:hover:bg-white/5 hover:bg-gray-100'
          )}
        >
          {pathname === '/profile' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r" />
          )}
          <UserCircle size={18} className={pathname === '/profile' ? 'text-indigo-400' : 'text-white/40 dark:text-white/40 text-gray-400'} />
          <span>Profile</span>
        </Link>
      </div>
    </aside>
  )
}
