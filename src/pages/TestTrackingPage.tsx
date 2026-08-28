import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  AlertCircle,
  RefreshCw,
  Activity,
  CalendarClock,
  CircleCheck,
  CircleX,
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useGetTestsQuery } from '@/slice/tests/tests-api'
import type { Test, TestStatus } from '@/types/test'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Mock attempt data — preview of what the API could return
// ---------------------------------------------------------------------------
const MOCK_ATTEMPTS: Record<string, { attempts: number; passRate: number }> = {
  mock_1: { attempts: 342, passRate: 72 },
  mock_2: { attempts: 215, passRate: 61 },
  mock_3: { attempts: 89,  passRate: 88 },
  mock_4: { attempts: 512, passRate: 55 },
  mock_5: { attempts: 176, passRate: 79 },
}

function getMockAttempts(id: string) {
  const keys = Object.keys(MOCK_ATTEMPTS)
  return MOCK_ATTEMPTS[keys[id.charCodeAt(0) % keys.length]]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function isExpiringSoon(test: Test) {
  if (test.status !== 'live' || !test.expiry_date) return false
  const diff = new Date(test.expiry_date).getTime() - Date.now()
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000
}

function statusBadgeClass(status: TestStatus) {
  switch (status) {
    case 'live':        return 'bg-success-soft text-success'
    case 'draft':       return 'bg-bg-muted text-ink-muted'
    case 'scheduled':   return 'bg-info-bg text-info'
    case 'unpublished': return 'bg-primary-50 text-primary'
    case 'expired':     return 'bg-danger/10 text-danger'
    default:            return 'bg-bg-muted text-ink-muted'
  }
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  iconClass: string
  bgClass: string
  active?: boolean
  onClick?: () => void
}

function StatCard({ label, value, icon: Icon, iconClass, bgClass, active, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 min-w-0 items-center gap-4 rounded-xl border p-4 text-left shadow-card transition-all',
        active
          ? 'border-primary bg-primary-50'
          : 'border-line bg-surface hover:border-primary/40',
      )}
    >
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', bgClass)}>
        <Icon className={cn('size-5', iconClass)} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-ink-strong">{value}</p>
        <p className="truncate text-sm text-ink-muted">{label}</p>
      </div>
    </button>
  )
}

const PAGE_SIZE = 10

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
type TabValue = 'all' | TestStatus

export default function TestTrackingPage() {
  const { data: tests, isLoading, isError, refetch, isFetching } = useGetTestsQuery()
  const [tab, setTab] = useState<TabValue>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const stats = useMemo(() => {
    if (!tests) return { total: 0, live: 0, scheduled: 0, expired: 0, expiringSoon: 0, draft: 0 }
    return {
      total:        tests.length,
      live:         tests.filter((t) => t.status === 'live').length,
      scheduled:    tests.filter((t) => t.status === 'scheduled').length,
      expired:      tests.filter((t) => t.status === 'expired').length,
      expiringSoon: tests.filter(isExpiringSoon).length,
      draft:        tests.filter((t) => t.status === 'draft').length,
    }
  }, [tests])

  const filtered = useMemo(() => {
    if (!tests) return []
    const q = search.trim().toLowerCase()
    return [...tests]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .filter((t) => {
        if (tab !== 'all' && t.status !== tab) return false
        if (!q) return true
        return (
          t.name.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q)
        )
      })
  }, [tests, tab, search])

  useEffect(() => {
    setCurrentPage(1)
  }, [tab, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-ink-strong">Test Tracking</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Monitor the status and lifecycle of all your tests.
        </p>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 flex-1 rounded-xl" />
          ))}
        </div>
      ) : isError ? null : (
        <div className="flex flex-wrap gap-3">
          <StatCard
            label="Total Tests"
            value={stats.total}
            icon={FileText}
            iconClass="text-primary"
            bgClass="bg-primary-50"
            active={tab === 'all'}
            onClick={() => setTab('all')}
          />
          <StatCard
            label="Live"
            value={stats.live}
            icon={CircleCheck}
            iconClass="text-success"
            bgClass="bg-success-soft"
            active={tab === 'live'}
            onClick={() => setTab('live')}
          />
          <StatCard
            label="Scheduled"
            value={stats.scheduled}
            icon={CalendarClock}
            iconClass="text-info"
            bgClass="bg-info-bg"
            active={tab === 'scheduled'}
            onClick={() => setTab('scheduled')}
          />
          <StatCard
            label="Expired"
            value={stats.expired}
            icon={CircleX}
            iconClass="text-danger"
            bgClass="bg-danger/10"
            active={tab === 'expired'}
            onClick={() => setTab('expired')}
          />
        </div>
      )}

      {/* Tabs + table */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : !tests?.length ? (
          <EmptyState />
        ) : (
          <>
            <div className="border-b border-line px-4 py-3 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, subject or type…"
                  className="h-9 border-line bg-bg pl-9 text-sm"
                />
              </div>
            </div>
            <div className="border-b border-line px-4 pt-3">
              <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
                <TabsList className="h-9 bg-transparent p-0 gap-1">
                  {(
                    [
                      { value: 'all',         label: `All (${stats.total})` },
                      { value: 'live',        label: `Live (${stats.live})` },
                      { value: 'scheduled',   label: `Scheduled (${stats.scheduled})` },
                      { value: 'expired',     label: `Expired (${stats.expired})` },
                      { value: 'draft',       label: `Draft (${stats.draft})` },
                    ] as { value: TabValue; label: string }[]
                  ).map(({ value, label }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="h-9 rounded-none border-b-2 border-transparent px-3 text-sm text-ink-muted data-[state=active]:border-primary data-[state=active]:text-ink-strong data-[state=active]:shadow-none"
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {filtered.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-ink-muted">
                No tests with this status.
              </div>
            ) : (
              <>
              <Table>
                <TableHeader>
                  <TableRow className="border-line hover:bg-transparent">
                    <TableHead className="px-4 text-ink-muted">Name</TableHead>
                    <TableHead className="px-4 text-ink-muted">Status</TableHead>
                    <TableHead className="px-4 text-ink-muted">Difficulty</TableHead>
                    <TableHead className="px-4 text-ink-muted">Questions</TableHead>
                    <TableHead className="px-4 text-ink-muted">Scheduled</TableHead>
                    <TableHead className="px-4 text-ink-muted">Expires</TableHead>
                    <TableHead className="px-4 text-ink-muted">
                      <span className="flex items-center gap-1">
                        Attempts
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3 cursor-default text-ink-subtle" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-48 text-center text-xs">
                            Mock data — API not available yet
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </TableHead>
                    <TableHead className="px-4 text-right text-ink-muted">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((test) => {
                    const mock = getMockAttempts(test.id)
                    const expiring = isExpiringSoon(test)
                    return (
                      <TableRow key={test.id} className="border-line">
                        <TableCell className="px-4 py-3.5">
                          <div className="max-w-56 truncate font-medium text-ink-strong">
                            {test.name}
                          </div>
                          <div className="mt-0.5 text-xs capitalize text-ink-subtle">
                            {test.type}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="secondary"
                              className={cn('w-fit capitalize', statusBadgeClass(test.status))}
                            >
                              {test.status}
                            </Badge>
                            {expiring && (
                              <span className="text-xs text-danger">Expiring soon</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 capitalize text-ink-body">
                          {test.difficulty || '—'}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-ink-body">
                          {test.total_questions ?? '—'}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-ink-body">
                          {formatDate(test.scheduled_date)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-ink-body">
                          {formatDate(test.expiry_date)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          {test.status === 'live' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-ink-body">{mock.attempts.toLocaleString()}</span>
                              <span className="text-xs text-ink-subtle">{mock.passRate}% pass</span>
                              <MockTag />
                            </div>
                          ) : (
                            <span className="text-sm text-ink-subtle">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            asChild
                            className="text-ink-muted hover:text-ink-strong"
                          >
                            <Link to={`/tests/${test.id}`} title="View">
                              <Eye />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-line px-4 py-3">
                  <p className="text-sm text-ink-muted">
                    Page {currentPage} of {totalPages} &middot;{' '}
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="border-line"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                      <span className="sr-only">Previous page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="border-line"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight className="size-4" />
                      <span className="sr-only">Next page</span>
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </>
        )}
      </div>

    </div>
  )
}

// ---------------------------------------------------------------------------
// Small "MOCK" tag
// ---------------------------------------------------------------------------
function MockTag() {
  return (
    <span className="rounded bg-primary-100 px-1 py-px text-[10px] font-medium text-primary">
      MOCK
    </span>
  )
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------
function LoadingState() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-20" />
        </div>
      ))}
    </div>
  )
}

function ErrorState({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertCircle className="size-6" />
      </div>
      <div>
        <p className="font-medium text-ink-strong">Couldn't load tests</p>
        <p className="mt-1 text-sm text-ink-muted">
          Something went wrong while fetching the list. Please try again.
        </p>
      </div>
      <Button
        variant="outline"
        className="mt-2 h-9 gap-2 border-line"
        onClick={onRetry}
        disabled={isRetrying}
      >
        <RefreshCw className={cn('size-4', isRetrying && 'animate-spin')} />
        Retry
      </Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary">
        <Activity className="size-6" />
      </div>
      <div>
        <p className="font-medium text-ink-strong">No tests to track</p>
        <p className="mt-1 text-sm text-ink-muted">
          Create your first test to start tracking its lifecycle.
        </p>
      </div>
    </div>
  )
}
