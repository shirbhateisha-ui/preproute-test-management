import { useMemo, useState } from 'react'
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
import {
  useDeleteTestMutation,
  useGetTestsQuery,
} from '@/slice/tests/tests-api'
import type { Test, TestDifficulty, TestStatus, TestType } from '@/types/test'
import { cn } from '@/lib/utils'

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
  { value: 'difficult', label: 'Difficult' },
]

function normalizeType(type: string): string {
  return type.toLowerCase().replace(/\s+/g, '')
}

function normalizeDifficulty(difficulty: string): string {
  const d = difficulty.toLowerCase()
  if (d === 'hard') return 'difficult'
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

function statusBadgeClass(status: TestStatus) {
  switch (status) {
    case 'live':
      return 'bg-success-soft text-success'
    case 'draft':
      return 'bg-bg-muted text-ink-muted'
    case 'scheduled':
      return 'bg-info-bg text-info'
    case 'unpublished':
      return 'bg-primary-50 text-primary'
    case 'expired':
      return 'bg-danger/10 text-danger'
    default:
      return 'bg-bg-muted text-ink-muted'
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

export default function DashboardPage() {
  const { data: tests, isLoading, isError, refetch, isFetching } =
    useGetTestsQuery()
  const [deleteTest, { isLoading: isDeleting }] = useDeleteTestMutation()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TestStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | TestType>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<
    'all' | TestDifficulty
  >('all')
  const [pendingDelete, setPendingDelete] = useState<Test | null>(null)

  const filtered = useMemo(() => {
    if (!tests) return []
    const q = search.trim().toLowerCase()
    return tests
      .filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false
        if (
          typeFilter !== 'all' &&
          normalizeType(t.type) !== normalizeType(typeFilter)
        ) {
          return false
        }
        if (
          difficultyFilter !== 'all' &&
          normalizeDifficulty(t.difficulty) !== difficultyFilter
        ) {
          return false
        }
        if (!q) return true
        return (
          t.name.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
        )
      })
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }, [tests, search, statusFilter, typeFilter, difficultyFilter])

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

  return (
    <div className="space-y-6">
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
          onValueChange={(v) =>
            setDifficultyFilter(v as 'all' | TestDifficulty)
          }
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
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="px-4 text-ink-muted">Name</TableHead>
                <TableHead className="px-4 text-ink-muted">Subject</TableHead>
                <TableHead className="px-4 text-ink-muted">Status</TableHead>
                <TableHead className="px-4 text-ink-muted">Created</TableHead>
                <TableHead className="px-4 text-right text-ink-muted">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((test) => (
                <TableRow key={test.id} className="border-line">
                  <TableCell className="px-4 py-3.5">
                    <div className="max-w-64 truncate font-medium text-ink-strong">
                      {test.name}
                    </div>
                    <div className="mt-0.5 text-xs capitalize text-ink-subtle">
                      {test.type}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-ink-body">
                    {test.subject || '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <StatusBadge status={test.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-ink-body">
                    {formatDate(test.created_at)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        asChild
                        className="text-ink-muted hover:text-ink-strong"
                      >
                        <Link to={`/tests/${test.id}/edit`} title="View">
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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
              <span className="font-medium text-ink-body">
                {pendingDelete?.name}
              </span>{' '}
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
    </div>
  )
}

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
        <p className="font-medium text-ink-strong">Couldn’t load tests</p>
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
