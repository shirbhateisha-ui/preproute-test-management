import { Bell, ChevronDown, LogOut } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/slice/auth/auth-slice'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function Topbar() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const initials = (user?.name ?? user?.userId ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-16 items-center gap-4 border-b border-line bg-surface px-6">
      <SidebarTrigger className="text-ink-muted" />

      <div className="ml-auto flex items-center gap-4">
      <button className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted hover:bg-bg-muted">
        <Bell className="h-4.5 w-4.5" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none hover:bg-bg-muted">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary">
            {initials}
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-medium text-ink-strong">
              {user?.name ?? user?.userId}
            </span>
            <span className="block text-xs capitalize text-ink-subtle">{user?.role}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-ink-subtle" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => dispatch(logout())}>
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  )
}
