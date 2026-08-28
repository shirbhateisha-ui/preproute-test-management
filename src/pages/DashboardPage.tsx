import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  FileQuestion,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  AlertTriangle,
  Send,
  FileText,
  CircleCheck,
  FileEdit,
  CalendarClock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useDeleteTestMutation,
  useGetTestsQuery,
  useUpdateTestMutation,
} from '@/slice/tests/tests-api'
import type { Test, TestDifficulty, TestStatus, TestType } from '@/types/test'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: 'all' | TestStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'live', label: 'Live' },
  { value: 'unpublished', label: 'Unpublished' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
]

const TYPE_OPTIONS: { value: 'all' | TestType; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'chapterwise', label: 'Chapterwise' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'mock', label: 'Mock Test' },
]

const DIFFICULTY_OPTIONS: { value: 'all' | TestDifficulty; label: string }[] = [
  { value: 'all', label: 'All difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Difficult' },
]

type SortKey = 'name' | 'created_at' | 'total_questions' | 'total_marks' | 'difficulty'
type SortDir = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalizeType(type: string): string {
  return type.toLowerCase().replace(/\s+/g, '')
}

function normalizeDifficulty(difficulty: string): string {
  const d = difficulty.toLowerCase()
  if (d === 'difficult') return 'hard'
  return d
}

function formatDate(value: string) {
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

const DIFFICULTY_ORDER: Record<string, number> = { easy: 1, medium: 2, hard: 3, difficult: 3 }

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

function StatusBadge({ status }: { status: TestStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn('capitalize', statusBadgeClass(status))}
    >
      {status}
    </Badge>
  )
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
        'flex flex-1 min-w-0 items-center gap-3 rounded-xl border p-4 text-left shadow-card transition-all',
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

// ---------------------------------------------------------------------------
// Sortable header cell
// ---------------------------------------------------------------------------
function SortHead({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = current === sortKey
  return (
    <TableHead
      className={cn('cursor-pointer select-none px-4 text-ink-muted', className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          dir === 'asc' ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )
        ) : (
          <ChevronsUpDown className="size-3 opacity-40" />
        )}
      </span>
    </TableHead>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { data: tests, isLoading, isError, refetch, isFetching } = useGetTestsQuery()
  const [deleteTest, { isLoading: isDeleting }] = useDeleteTestMutation()
  const [updateTest, { isLoading: isPublishing }] = useUpdateTestMutation()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TestStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | TestType>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | TestDifficulty>('all')
  const [pendingDelete, setPendingDelete] = useState<Test | null>(null)
  const [pendingPublish, setPendingPublish] = useState<Test | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const stats = useMemo(() => {
    if (!tests) return { total: 0, live: 0, draft: 0, scheduled: 0 }
    return {
      total:     tests.length,
      live:      tests.filter((t) => t.status === 'live').length,
      draft:     tests.filter((t) => t.status === 'draft').length,
      scheduled: tests.filter((t) => t.status === 'scheduled').length,
    }
  }, [tests])

  const filtered = useMemo(() => {
    if (!tests) return []
    const q = search.trim().toLowerCase()
    return tests
      .filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false
        if (typeFilter !== 'all' && normalizeType(t.type) !== normalizeType(typeFilter)) return false
        if (
          difficultyFilter !== 'all' &&
          normalizeDifficulty(t.difficulty) !== difficultyFilter
        ) return false
        if (!q) return true
        return (
          t.name.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
        )
      })
      .slice()
      .sort((a, b) => {
        let cmp = 0
        switch (sortKey) {
          case 'name':
            cmp = a.name.localeCompare(b.name)
            break
          case 'created_at':
            cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            break
          case 'total_questions':
            cmp = (a.total_questions ?? 0) - (b.total_questions ?? 0)
            break
          case 'total_marks':
            cmp = (a.total_marks ?? 0) - (b.total_marks ?? 0)
            break
          case 'difficulty':
            cmp =
              (DIFFICULTY_ORDER[a.difficulty?.toLowerCase()] ?? 0) -
              (DIFFICULTY_ORDER[b.difficulty?.toLowerCase()] ?? 0)
            break
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [tests, search, statusFilter, typeFilter, difficultyFilter, sortKey, sortDir])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, typeFilter, difficultyFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteTest(pendingDelete.id).unwrap()
      toast.success('Test deleted successfully')
      setPendingDelete(null)
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to delete test. Please try again.'
      toast.error(message)
    }
  }

  const handlePublish = async () => {
    if (!pendingPublish) return
    try {
      await updateTest({ id: pendingPublish.id, body: { status: 'live' } }).unwrap()
      toast.success(`"${pendingPublish.name}" is now live`)
      setPendingPublish(null)
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to publish test. Please try again.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-strong">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage and track all your tests in one place.
          </p>
        </div>
        <Button asChild className="h-10 gap-2 px-4">
          <Link to="/tests/new">
            <Plus className="size-4" />
            Create New Test
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 flex-1 rounded-xl" />
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
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <StatCard
            label="Live"
            value={stats.live}
            icon={CircleCheck}
            iconClass="text-success"
            bgClass="bg-success-soft"
            active={statusFilter === 'live'}
            onClick={() => setStatusFilter('live')}
          />
          <StatCard
            label="Draft"
            value={stats.draft}
            icon={FileEdit}
            iconClass="text-ink-muted"
            bgClass="bg-bg-muted"
            active={statusFilter === 'draft'}
            onClick={() => setStatusFilter('draft')}
          />
          <StatCard
            label="Scheduled"
            value={stats.scheduled}
            icon={CalendarClock}
            iconClass="text-info"
            bgClass="bg-info-bg"
            active={statusFilter === 'scheduled'}
            onClick={() => setStatusFilter('scheduled')}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or subject…"
            className="h-10 border-line bg-surface pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as 'all' | TestType)}
        >
          <SelectTrigger className="h-10 w-full border-line bg-surface sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as 'all' | TestStatus)}
        >
          <SelectTrigger className="h-10 w-full border-line bg-surface sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={difficultyFilter}
          onValueChange={(v) => setDifficultyFilter(v as 'all' | TestDifficulty)}
        >
          <SelectTrigger className="h-10 w-full border-line bg-surface sm:w-44">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : !tests?.length ? (
          <EmptyState />
        ) : !filtered.length ? (
          <NoMatchState
            onClear={() => {
              setSearch('')
              setStatusFilter('all')
              setTypeFilter('all')
              setDifficultyFilter('all')
            }}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-line hover:bg-transparent">
                  <SortHead label="Name"      sortKey="name"            current={sortKey} dir={sortDir} onSort={handleSort} className="px-4" />
                  <TableHead className="px-4 text-ink-muted">Subject</TableHead>
                  <TableHead className="px-4 text-ink-muted">Status</TableHead>
                  <SortHead label="Difficulty" sortKey="difficulty"     current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortHead label="Questions"  sortKey="total_questions" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortHead label="Marks"      sortKey="total_marks"    current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortHead label="Created"    sortKey="created_at"     current={sortKey} dir={sortDir} onSort={handleSort} />
                  <TableHead className="px-4 text-right text-ink-muted">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((test) => {
                  const expiring = isExpiringSoon(test)
                  const noQuestions = (test.total_questions ?? 0) === 0
                  return (
                    <TableRow key={test.id} className="border-line">
                      {/* Name */}
                      <TableCell className="px-4 py-3.5">
                        <div className="max-w-56 truncate font-medium text-ink-strong">
                          {test.name}
                        </div>
                        <div className="mt-0.5 text-xs capitalize text-ink-subtle">
                          {test.type}
                        </div>
                      </TableCell>

                      {/* Subject */}
                      <TableCell className="px-4 py-3.5 text-ink-body">
                        {test.subject || '—'}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={test.status} />
                          {expiring && (
                            <span className="text-xs text-danger">Expiring soon</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Difficulty */}
                      <TableCell className="px-4 py-3.5 capitalize text-ink-body">
                        {test.difficulty || '—'}
                      </TableCell>

                      {/* Questions */}
                      <TableCell className="px-4 py-3.5">
                        {noQuestions ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 text-sm text-danger">
                                <AlertTriangle className="size-3.5" />0
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              No questions added yet
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-ink-body">{test.total_questions}</span>
                        )}
                      </TableCell>

                      {/* Marks */}
                      <TableCell className="px-4 py-3.5 text-ink-body">
                        {test.total_marks ?? '—'}
                      </TableCell>

                      {/* Created */}
                      <TableCell className="px-4 py-3.5 text-ink-body">
                        {formatDate(test.created_at)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {test.status === 'draft' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-ink-muted hover:text-success"
                                  onClick={() => setPendingPublish(test)}
                                >
                                  <Send />
                                  <span className="sr-only">Publish</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Publish
                              </TooltipContent>
                            </Tooltip>
                          )}
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
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            asChild
                            className="text-ink-muted hover:text-ink-strong"
                          >
                            <Link to={`/tests/${test.id}/edit`} title="Edit">
                              <Pencil />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete"
                            className="text-ink-muted hover:text-danger"
                            onClick={() => setPendingDelete(test)}
                          >
                            <Trash2 />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
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
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-medium text-ink-body">{pendingDelete?.name}</span>{' '}
              and all associated questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish confirmation */}
      <AlertDialog
        open={!!pendingPublish}
        onOpenChange={(open) => {
          if (!open && !isPublishing) setPendingPublish(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish test?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-ink-body">{pendingPublish?.name}</span>{' '}
              will be set to Live and visible to students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPublishing}
              onClick={(e) => {
                e.preventDefault()
                void handlePublish()
              }}
            >
              {isPublishing ? 'Publishing…' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------
function LoadingState() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      ))}
    </div>
  )
}

function ErrorState({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void
  isRetrying: boolean
}) {
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
        <FileQuestion className="size-6" />
      </div>
      <div>
        <p className="font-medium text-ink-strong">No tests yet</p>
        <p className="mt-1 text-sm text-ink-muted">
          Create your first test to get started.
        </p>
      </div>
      <Button asChild className="mt-2 h-9 gap-2 px-4">
        <Link to="/tests/new">
          <Plus className="size-4" />
          Create New Test
        </Link>
      </Button>
    </div>
  )
}

function NoMatchState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-bg-muted text-ink-muted">
        <Search className="size-6" />
      </div>
      <div>
        <p className="font-medium text-ink-strong">No matching tests</p>
        <p className="mt-1 text-sm text-ink-muted">
          Try a different search or clear your filters.
        </p>
      </div>
      <Button
        variant="outline"
        className="mt-2 h-9 border-line"
        onClick={onClear}
      >
        Clear filters
      </Button>
    </div>
  )
}
