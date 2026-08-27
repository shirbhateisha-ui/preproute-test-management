import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CheckCircle2,
  Clock,
  ListChecks,
  Award,
  Pencil,
  CircleCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { useGetTestQuery, useUpdateTestMutation } from '@/slice/tests/tests-api'
import { useFetchBulkQuestionsQuery } from '@/slice/questions/questions-api'
import ChipList from '@/components/tests/ChipList'
import type { CorrectOption } from '@/types/question'

type PublishMode = 'now' | 'schedule'
type LiveUntil = 'always' | '1w' | '2w' | '3w' | '1m' | 'custom'

const LIVE_UNTIL_OPTIONS: { value: LiveUntil; label: string }[] = [
  { value: 'always', label: 'Always Available' },
  { value: '3w', label: '3 Weeks' },
  { value: '1w', label: '1 Week' },
  { value: '1m', label: '1 Month' },
  { value: '2w', label: '2 Weeks' },
  { value: 'custom', label: 'Custom Duration' },
]

const OPTION_KEYS: CorrectOption[] = ['option1', 'option2', 'option3', 'option4']

function addDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function expiryFrom(base: Date, liveUntil: LiveUntil, customEnd: string): string | null {
  switch (liveUntil) {
    case 'always':
      return null
    case '1w':
      return addDays(base, 7).toISOString()
    case '2w':
      return addDays(base, 14).toISOString()
    case '3w':
      return addDays(base, 21).toISOString()
    case '1m':
      return addDays(base, 30).toISOString()
    case 'custom':
      return customEnd ? new Date(customEnd).toISOString() : null
  }
}

export default function PreviewPublishPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [updateTest, { isLoading: isPublishing }] = useUpdateTestMutation()

  const { data: test, isLoading: testLoading, isError } = useGetTestQuery(id, {
    skip: !id,
  })

  const questionIds = useMemo(() => test?.questions ?? [], [test?.questions])
  const { data: questions = [], isLoading: questionsLoading } =
    useFetchBulkQuestionsQuery(questionIds, { skip: questionIds.length === 0 })

  const [mode, setMode] = useState<PublishMode>('now')
  const [liveUntil, setLiveUntil] = useState<LiveUntil>('always')
  const [customEnd, setCustomEnd] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')

  const onConfirm = async () => {
    if (mode === 'schedule' && !scheduleAt) {
      toast.error('Please pick a date and time to schedule')
      return
    }
    if (liveUntil === 'custom' && !customEnd) {
      toast.error('Please pick a custom end date')
      return
    }

    const base = mode === 'schedule' ? new Date(scheduleAt) : new Date()
    const expiry = expiryFrom(base, liveUntil, customEnd)

    const body: {
      status: 'live' | 'scheduled'
      scheduled_date?: string
      expiry_date?: string
    } = mode === 'schedule'
      ? { status: 'scheduled', scheduled_date: new Date(scheduleAt).toISOString() }
      : { status: 'live' }

    if (expiry) body.expiry_date = expiry

    try {
      await updateTest({ id, body }).unwrap()
      toast.success(mode === 'schedule' ? 'Test scheduled' : 'Test published')
      navigate('/dashboard')
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to publish. Please try again.'
      toast.error(message)
    }
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-danger">
        Couldn’t load this test. It may have been deleted.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-sm text-ink-muted">Test creation</p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-xl font-semibold text-ink-strong">Test created</h1>
          {test && (
            <Badge className="gap-1 bg-success-soft text-success">
              <CheckCircle2 className="size-3.5" />
              All {test.total_questions} Questions done
            </Badge>
          )}
        </div>
      </div>

      {testLoading || !test ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="secondary" className="bg-ink-strong/90 text-white capitalize">
                {test.type}
              </Badge>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-semibold text-ink-strong">{test.name}</span>
                <Badge className="bg-success-soft capitalize text-success">
                  {test.difficulty}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> {test.total_time} Min
              </span>
              <span className="flex items-center gap-1.5">
                <ListChecks className="size-4" /> {test.total_questions} Q’s
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="size-4" /> {test.total_marks} Marks
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-ink-muted hover:text-primary"
                onClick={() => navigate(`/tests/${id}/edit`)}
                title="Edit test details"
              >
                <Pencil />
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-xs text-ink-subtle">Subject</p>
              <p className="font-medium text-ink-body">{test.subject || '—'}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-ink-subtle">Topic</p>
              <ChipList items={test.topics} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-ink-subtle">Sub Topic</p>
              <ChipList items={test.sub_topics} />
            </div>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-strong">Questions</h2>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-line"
            onClick={() => navigate(`/tests/${id}/questions`)}
          >
            <Pencil className="size-3.5" />
            Edit Questions
          </Button>
        </div>

        {questionsLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : questions.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-ink-muted">
            No questions added yet.
          </p>
        ) : (
          <ol className="space-y-3">
            {questions.map((q, i) => (
              <li
                key={q.id}
                className="rounded-xl border border-line bg-surface p-5 shadow-card"
              >
                <p className="text-sm font-medium text-ink-strong">
                  <span className="text-ink-subtle">Q{i + 1}.</span>{' '}
                  <span dangerouslySetInnerHTML={{ __html: q.question }} />
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {OPTION_KEYS.map((key, oi) => {
                    const correct = q.correct_option === key
                    return (
                      <li
                        key={key}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                          correct
                            ? 'border-success bg-success-soft text-ink-strong'
                            : 'border-line text-ink-body',
                        )}
                      >
                        {correct ? (
                          <CircleCheck className="size-4 shrink-0 text-success" />
                        ) : (
                          <span className="text-ink-subtle">
                            {String.fromCharCode(65 + oi)}.
                          </span>
                        )}
                        {q[key]}
                      </li>
                    )
                  })}
                </ul>
                {q.explanation && (
                  <p className="mt-3 text-xs text-ink-muted">
                    <span className="font-medium">Solution:</span> {q.explanation}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <div className="flex gap-2">
          <ModeButton active={mode === 'now'} onClick={() => setMode('now')}>
            Publish Now
          </ModeButton>
          <ModeButton active={mode === 'schedule'} onClick={() => setMode('schedule')}>
            Schedule Publish
          </ModeButton>
        </div>

        {mode === 'schedule' && (
          <div className="mt-4 space-y-1.5">
            <p className="text-sm font-medium text-ink-strong">Select Date and Time</p>
            <Input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="h-11 w-full border-line bg-surface sm:w-72"
            />
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-semibold text-ink-strong">Live Until</p>
          <p className="text-xs text-ink-subtle">
            Choose how long this test should remain available on the platform.
          </p>
          <RadioGroup
            value={liveUntil}
            onValueChange={(v) => setLiveUntil(v as LiveUntil)}
            className="mt-3 grid gap-3 sm:grid-cols-2"
          >
            {LIVE_UNTIL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 text-sm text-ink-body"
              >
                <RadioGroupItem value={opt.value} />
                {opt.label}
              </label>
            ))}
          </RadioGroup>

          {liveUntil === 'custom' && (
            <Input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="mt-3 h-11 w-full border-line bg-surface sm:w-72"
            />
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            className="h-10 min-w-24 bg-primary-100 text-primary hover:bg-primary-100/80"
            disabled={isPublishing}
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10 min-w-24"
            disabled={isPublishing}
            onClick={onConfirm}
          >
            {isPublishing ? 'Saving…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition',
        active
          ? 'bg-primary-50 text-primary'
          : 'text-ink-muted hover:bg-bg-muted',
      )}
    >
      {children}
    </button>
  )
}
