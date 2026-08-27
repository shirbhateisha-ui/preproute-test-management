import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import DOMPurify from 'dompurify'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { TYPE_TABS } from '@/components/tests/test-form-utils'
import ChipList from '@/components/tests/ChipList'
import { useGetTestQuery } from '@/slice/tests/tests-api'
import { useFetchBulkQuestionsQuery } from '@/slice/questions/questions-api'
import type { CorrectOption, Question } from '@/types/question'
import type { TestStatus } from '@/types/test'
import { cn } from '@/lib/utils'

const OPTION_KEYS: CorrectOption[] = [
  'option1',
  'option2',
  'option3',
  'option4',
]

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatSigned(n: number) {
  if (n > 0) return `+${n}`
  if (n === 0) return '+0'
  return String(n)
}

function typeLabel(type: string) {
  const key = type.toLowerCase().replace(/\s+/g, '')
  if (key === 'pyq') return 'PYQ'
  if (key === 'mock' || key === 'mocktest') return 'Mock Test'
  const match = TYPE_TABS.find((t) => t.value === key)
  return match?.label ?? type
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

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <div className="text-sm text-ink-body">{children}</div>
    </div>
  )
}


function RichText({ html }: { html: string }) {
  return (
    <span
      className="[&_p]:m-0"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  )
}

function QuestionsTable({ questions }: { questions: Question[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <Table>
        <TableHeader>
          <TableRow className="border-line hover:bg-transparent">
            <TableHead className="w-12 px-4 text-ink-muted">#</TableHead>
            <TableHead className="min-w-56 px-4 text-ink-muted">
              Question
            </TableHead>
            <TableHead className="min-w-64 px-4 text-ink-muted">
              Options
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((q, i) => (
            <TableRow key={q.id} className="border-line align-top">
              <TableCell className="px-4 py-3.5 text-ink-subtle">
                {i + 1}
              </TableCell>
              <TableCell className="max-w-md whitespace-normal px-4 py-3.5 text-sm text-ink-strong">
                <RichText html={q.question} />
              </TableCell>
              <TableCell className="whitespace-normal px-4 py-3.5">
                <ul className="space-y-1.5">
                  {OPTION_KEYS.map((key, oi) => {
                    const correct = q.correct_option === key
                    return (
                      <li
                        key={key}
                        className={cn(
                          'flex gap-2 text-sm',
                          correct
                            ? 'font-medium text-success'
                            : 'text-ink-body',
                        )}
                      >
                        <span className="shrink-0 text-ink-subtle">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span>{q[key]}</span>
                        {correct && (
                          <Badge
                            variant="secondary"
                            className="ml-auto shrink-0 bg-success-soft text-[10px] text-success"
                          >
                            Correct
                          </Badge>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function ViewTestPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: test, isLoading, isError } = useGetTestQuery(id, { skip: !id })

  const questionIds = useMemo(() => test?.questions ?? [], [test?.questions])
  const { data: questions = [], isLoading: questionsLoading } =
    useFetchBulkQuestionsQuery(questionIds, {
      skip: questionIds.length === 0,
    })

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <nav className="text-sm text-ink-muted">
        <Link to="/dashboard" className="hover:text-primary">
          Dashboard
        </Link>
        <span className="mx-1.5 text-ink-subtle">/</span>
        <span className="font-medium text-ink-strong">View Test</span>
      </nav>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError || !test ? (
          <p className="py-8 text-center text-sm text-danger">
            Couldn’t load this test. It may have been deleted.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-ink-strong">
                  {test.name}
                </h1>
                <p className="mt-1 text-sm text-ink-muted">
                  Created {formatDate(test.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={cn('capitalize', statusBadgeClass(test.status))}
                >
                  {test.status}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-primary-50 font-normal text-primary"
                >
                  {typeLabel(test.type)}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-success-soft capitalize text-success"
                >
                  {test.difficulty}
                </Badge>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Subject">{test.subject || '—'}</Field>
              <Field label="Duration">
                {test.total_time ? `${test.total_time} min` : '—'}
              </Field>
              <Field label="Topics">
                <ChipList items={test.topics} />
              </Field>
              <Field label="Sub Topics">
                <ChipList items={test.sub_topics} />
              </Field>
              <Field label="No of Questions">{test.total_questions}</Field>
              <Field label="Total Marks">{test.total_marks}</Field>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-ink-strong">
                Marking Scheme
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Wrong Answer">
                  {formatSigned(test.wrong_marks)}
                </Field>
                <Field label="Unattempted">
                  {formatSigned(test.unattempt_marks)}
                </Field>
                <Field label="Correct Answer">
                  {formatSigned(test.correct_marks)}
                </Field>
              </div>
            </div>

            <div className="mt-8 border-t border-line pt-5">
              <h2 className="mb-3 text-sm font-semibold text-ink-strong">
                Questions
                {questionIds.length > 0 && (
                  <span className="ml-1.5 font-normal text-ink-subtle">
                    ({questionIds.length})
                  </span>
                )}
              </h2>

              {questionIds.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line bg-bg px-4 py-8 text-center text-sm text-ink-muted">
                  No questions added yet.
                </p>
              ) : questionsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <QuestionsTable questions={questions} />
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
              <Button
                type="button"
                variant="secondary"
                className="h-10 min-w-24 bg-primary-100 text-primary hover:bg-primary-100/80"
                onClick={() => navigate('/dashboard')}
              >
                Close
              </Button>
              <Button
                type="button"
                className="h-10 min-w-24 gap-2"
                onClick={() => navigate(`/tests/${id}/edit`)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
