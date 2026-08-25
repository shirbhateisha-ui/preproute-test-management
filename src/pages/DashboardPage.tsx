import { ChevronDown, LogOut } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/slice/auth/auth-slice'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const initials = (user?.name ?? user?.userId ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <span className="font-semibold text-ink-strong">Dashboard</span>

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
      </header>

      <main className="p-8 text-ink-strong">DashboardPage — TODO</main>
    </div>
  )
}
