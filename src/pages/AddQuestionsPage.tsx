import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Trash2, Clock, ListChecks, Award, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import QuestionEditor, {
  type DraftErrors,
  type QuestionDraft,
} from '@/components/questions/QuestionEditor'
import { TYPE_TABS } from '@/components/tests/TestForm'
import ChipList from '@/components/tests/ChipList'
import { useGetTestQuery, useUpdateTestMutation } from '@/slice/tests/tests-api'
import {
  useGetSubjectsQuery,
  useGetSubTopicsQuery,
  useGetTopicsQuery,
} from '@/slice/taxonomy/taxonomy-api'
import {
  useBulkCreateQuestionsMutation,
  useDeleteQuestionMutation,
  useFetchBulkQuestionsQuery,
  useUpdateQuestionMutation,
} from '@/slice/questions/questions-api'
import type { Question, QuestionCreatePayload } from '@/types/question'
import { stripHtml } from '@/components/questions/RichTextEditor'

function normalizeDifficulty(value?: string | null) {
  const d = (value ?? '').toLowerCase()
  if (d === 'medium') return 'medium'
  if (d === 'hard' || d === 'difficult') return 'hard'
  if (d === 'easy') return 'easy'
  return ''
}

let draftSeq = 0
function emptyDraft(defaults?: Partial<QuestionDraft>): QuestionDraft {
  draftSeq += 1
  return {
    key: `q-${draftSeq}`,
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option: 'option1',
    explanation: '',
    difficulty: defaults?.difficulty ?? '',
    topic: defaults?.topic ?? '',
    sub_topic: defaults?.sub_topic ?? '',
  }
}

function toDraft(q: Question): QuestionDraft {
  return {
    key: q.id,
    id: q.id,
    question: q.question,
    option1: q.option1,
    option2: q.option2,
    option3: q.option3,
    option4: q.option4,
    correct_option: q.correct_option,
    explanation: q.explanation ?? '',
    difficulty: normalizeDifficulty(q.difficulty),
    topic: q.topic ?? '',
    sub_topic: q.sub_topic ?? '',
  }
}

function isDirty(draft: QuestionDraft, original: Question) {
  return (
    draft.question.trim() !== original.question ||
    draft.option1.trim() !== original.option1 ||
    draft.option2.trim() !== original.option2 ||
    draft.option3.trim() !== original.option3 ||
    draft.option4.trim() !== original.option4 ||
    draft.correct_option !== original.correct_option ||
    draft.explanation.trim() !== (original.explanation ?? '') ||
    draft.difficulty !== normalizeDifficulty(original.difficulty) ||
    draft.topic !== (original.topic ?? '') ||
    draft.sub_topic !== (original.sub_topic ?? '')
  )
}

function validateDraft(d: QuestionDraft): DraftErrors {
  const errors: DraftErrors = {}
  if (!stripHtml(d.question)) errors.question = 'Enter the question'
  if (!d.option1.trim() || !d.option2.trim() || !d.option3.trim() || !d.option4.trim()) {
    errors.option1 = 'Fill in all four options'
  }
  if (!d[d.correct_option].trim()) {
    errors.correct_option = 'The correct option cannot be empty'
  }
  return errors
}

function isComplete(d: QuestionDraft) {
  return Object.keys(validateDraft(d)).length === 0
}

export default function AddQuestionsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const { data: test, isLoading: testLoading, isError } = useGetTestQuery(id, {
    skip: !id,
  })
  const { data: subjects = [] } = useGetSubjectsQuery()
  const [bulkCreate, { isLoading: isCreating }] = useBulkCreateQuestionsMutation()
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateQuestionMutation()
  const [deleteQuestion, { isLoading: isDeleting }] = useDeleteQuestionMutation()
  const [updateTest, { isLoading: isLinking }] = useUpdateTestMutation()

  const questionIds = useMemo(() => test?.questions ?? [], [test?.questions])
  const { data: existing = [], isLoading: questionsLoading } =
    useFetchBulkQuestionsQuery(questionIds, { skip: questionIds.length === 0 })

  const [drafts, setDrafts] = useState<QuestionDraft[]>([])
  const [originals, setOriginals] = useState<Record<string, Question>>({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [showErrors, setShowErrors] = useState(false)

  const subjectId = useMemo(
    () => subjects.find((s) => s.name === test?.subject)?.id ?? '',
    [subjects, test?.subject],
  )

  const draftDefaults = useMemo(
    () => ({
      difficulty: normalizeDifficulty(test?.difficulty),
      topic: test?.topics?.[0] ?? '',
      sub_topic: test?.sub_topics?.[0] ?? '',
    }),
    [test?.difficulty, test?.topics, test?.sub_topics],
  )

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current || testLoading) return
    if (questionIds.length > 0 && questionsLoading) return
    const byId = Object.fromEntries(existing.map((q) => [q.id, q]))
    const ordered = questionIds
      .map((qid) => byId[qid])
      .filter((q): q is Question => !!q)
    setDrafts(
      ordered.length
        ? ordered.map(toDraft)
        : [emptyDraft(draftDefaults)],
    )
    setOriginals(byId)
    hydratedRef.current = true
  }, [testLoading, questionsLoading, questionIds, existing, draftDefaults])

  const { data: topics = [], isLoading: topicsLoading } = useGetTopicsQuery(
    subjectId,
    { skip: !subjectId },
  )

  const active = drafts[activeIndex]
  const selectedTopicId = useMemo(
    () => topics.find((t) => t.name === active?.topic)?.id ?? '',
    [topics, active?.topic],
  )
  const { data: subTopics = [], isLoading: subTopicsLoading } =
    useGetSubTopicsQuery(selectedTopicId, { skip: !selectedTopicId })

  const [pendingAction, setPendingAction] = useState<'next' | 'publish' | null>(
    null,
  )
  const errors = showErrors && active ? validateDraft(active) : {}
  const saving = isCreating || isUpdating || isDeleting || isLinking || !!pendingAction

  const updateActive = (patch: Partial<QuestionDraft>) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === activeIndex ? { ...d, ...patch } : d)),
    )
  }

  const goToDraft = (index: number) => {
    setShowErrors(false)
    setActiveIndex(index)
  }

  const addAnother = () => {
    if (!active) return
    const draftErrors = validateDraft(active)
    if (Object.keys(draftErrors).length) {
      setShowErrors(true)
      return
    }
    setDrafts((prev) => [...prev, emptyDraft(draftDefaults)])
    setActiveIndex(drafts.length)
    setShowErrors(false)
  }

  const removeDraft = (index: number) => {
    if (drafts.length === 1) return
    setDrafts((prev) => prev.filter((_, i) => i !== index))
    setActiveIndex((curr) => (curr >= index && curr > 0 ? curr - 1 : curr))
  }

  const hasEdits = useMemo(() => {
    const originalIds = Object.keys(originals)
    if (drafts.some((d) => !d.id)) return true
    if (drafts.length !== originalIds.length) return true
    return drafts.some(
      (d) => d.id && originals[d.id] && isDirty(d, originals[d.id]),
    )
  }, [drafts, originals])

  const deleteAllEdits = () => {
    const ordered = questionIds
      .map((qid) => originals[qid])
      .filter((q): q is Question => !!q)
    setDrafts(ordered.length ? ordered.map(toDraft) : [emptyDraft(draftDefaults)])
    setActiveIndex(0)
    setShowErrors(false)
    toast.success('All edits discarded')
  }

  const saveQuestions = async (): Promise<boolean> => {
    if (drafts.length === 0) return false
    const firstInvalid = drafts.findIndex((d) => !isComplete(d))
    if (firstInvalid !== -1) {
      setActiveIndex(firstInvalid)
      setShowErrors(true)
      toast.error('Please complete every question before continuing')
      return false
    }
    if (!subjectId) {
      toast.error('Could not resolve the test subject. Please try again.')
      return false
    }

    const keptIds = new Set(
      drafts.map((d) => d.id).filter((v): v is string => !!v),
    )
    const removedIds = Object.keys(originals).filter((qid) => !keptIds.has(qid))
    const edited = drafts.filter(
      (d) => d.id && originals[d.id] && isDirty(d, originals[d.id]),
    )
    const fresh = drafts.filter((d) => !d.id)

    const newPayload: QuestionCreatePayload[] = fresh.map((d) => ({
      type: 'mcq',
      question: d.question.trim(),
      option1: d.option1.trim(),
      option2: d.option2.trim(),
      option3: d.option3.trim(),
      option4: d.option4.trim(),
      correct_option: d.correct_option,
      explanation: d.explanation.trim() || undefined,
      difficulty: d.difficulty || undefined,
      test_id: id,
      subject: subjectId,
      topic: d.topic || undefined,
      sub_topic: d.sub_topic || undefined,
    }))

    await Promise.all(removedIds.map((qid) => deleteQuestion(qid).unwrap()))
    await Promise.all(
      edited.map((d) =>
        updateQuestion({
          id: d.id as string,
          body: {
            question: d.question.trim(),
            option1: d.option1.trim(),
            option2: d.option2.trim(),
            option3: d.option3.trim(),
            option4: d.option4.trim(),
            correct_option: d.correct_option,
            explanation: d.explanation.trim(),
            difficulty: d.difficulty || undefined,
            topic: d.topic || undefined,
            sub_topic: d.sub_topic || undefined,
          },
        }).unwrap(),
      ),
    )

    let createdIds: string[] = []
    if (newPayload.length) {
      const created = await bulkCreate(newPayload).unwrap()
      createdIds = created.map((q) => q.id)
    }

    let cursor = 0
    const finalIds = drafts.map((d) => d.id ?? createdIds[cursor++])
    await updateTest({
      id,
      body: {
        questions: finalIds,
        total_questions: finalIds.length,
        total_marks: finalIds.length * (test?.correct_marks ?? 0),
      },
    }).unwrap()

    return true
  }

  const goNext = async () => {
    setPendingAction('next')
    try {
      const ok = await saveQuestions()
      if (!ok) return
      toast.success('Questions saved')
      navigate(`/tests/${id}/preview`)
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to save questions. Please try again.'
      toast.error(message)
    } finally {
      setPendingAction(null)
    }
  }

  const publishNow = async () => {
    setPendingAction('publish')
    try {
      const ok = await saveQuestions()
      if (!ok) return
      await updateTest({ id, body: { status: 'live' } }).unwrap()
      toast.success('Test published')
      navigate('/dashboard')
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to publish. Please try again.'
      toast.error(message)
    } finally {
      setPendingAction(null)
    }
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-danger">
        Couldn’t load this test. It may have been deleted.
      </p>
    )
  }

  const typeKey = (test?.type ?? 'chapterwise')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('mocktest', 'mock')
  const typeLabel =
    TYPE_TABS.find((t) => t.value === typeKey)?.label ?? 'Chapterwise'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="text-sm text-ink-muted">
          <span>Test Creation</span>
          <span className="mx-1.5 text-ink-subtle">/</span>
          <span>Create Test</span>
          <span className="mx-1.5 text-ink-subtle">/</span>
          <span className="font-medium text-ink-strong">{typeLabel}</span>
        </nav>
        <Button
          type="button"
          className="h-10 min-w-24"
          disabled={saving || !test}
          onClick={() => void publishNow()}
        >
          {pendingAction === 'publish' ? 'Publishing…' : 'Publish'}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <p className="text-sm font-semibold text-ink-strong">Question creation</p>
        <p className="mt-1 text-xs text-ink-muted">
          Total Questions :{' '}
          <span className="font-medium text-ink-strong">
            {Math.max(test?.total_questions ?? 0, drafts.length)}
          </span>
        </p>

        <div className="mt-4 space-y-2">
          {drafts.map((d, i) => {
            const complete = isComplete(d)
            const active = i === activeIndex
            return (
              <div
                key={d.key}
                className={cn(
                  'group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                  complete
                    ? 'border-success/50 bg-success-soft/50'
                    : 'border-line bg-surface',
                  active && 'ring-2 ring-primary/25',
                )}
              >
                <button
                  type="button"
                  onClick={() => goToDraft(i)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <span
                    className={cn(
                      'size-2.5 shrink-0 rounded-full',
                      complete ? 'bg-success' : 'bg-ink-subtle/40',
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'truncate font-medium',
                      complete ? 'text-success' : 'text-ink-subtle',
                      active && !complete && 'text-ink-body',
                    )}
                  >
                    Question {i + 1}
                  </span>
                </button>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDraft(i)}
                    className="text-ink-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                    aria-label={`Delete question ${i + 1}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => goToDraft(i)}
                  className={cn(
                    'shrink-0',
                    complete ? 'text-success' : 'text-ink-subtle',
                  )}
                  aria-label={`Open question ${i + 1}`}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-3 h-9 w-full gap-2 border-line"
          onClick={addAnother}
        >
          <Plus className="size-4" />
          Add Another Question
        </Button>
      </aside>

      <div className="space-y-5">
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
              <div className="flex items-start gap-3">
                <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" /> {test.total_time} Min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ListChecks className="size-4" /> {test.total_questions} Q’s
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="size-4" /> {test.total_marks} Marks
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-primary hover:bg-primary-50 hover:text-primary"
                  asChild
                >
                  <Link to={`/tests/${id}/edit`} title="Edit test">
                    <Pencil className="size-4" />
                    <span className="sr-only">Edit test</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
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

        <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
          {!active ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-ink-strong">
                  Question {activeIndex + 1}
                  {test ? (
                    <span className="text-ink-subtle">
                      {' '}
                      / {Math.max(test.total_questions, drafts.length)}
                    </span>
                  ) : null}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 gap-1.5 border-primary/30 bg-primary-50 text-primary hover:bg-primary-50/80"
                    onClick={addAnother}
                  >
                    <Plus className="size-4" />
                    MCQ
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
                    disabled={!hasEdits || saving}
                    onClick={deleteAllEdits}
                  >
                    <Trash2 className="size-4" />
                    Delete All Edits
                  </Button>
                </div>
              </div>

              <QuestionEditor
                value={active}
                errors={errors}
                onChange={updateActive}
                topics={topics}
                subTopics={subTopics}
                topicsLoading={topicsLoading}
                subTopicsLoading={subTopicsLoading}
                afterSolution={
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 border-line"
                      disabled={activeIndex === 0}
                      onClick={() => goToDraft(activeIndex - 1)}
                      aria-label="Previous question"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-xs text-ink-subtle">
                      {activeIndex + 1} / {drafts.length}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 border-line"
                      disabled={activeIndex >= drafts.length - 1}
                      onClick={() => goToDraft(activeIndex + 1)}
                      aria-label="Next question"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                }
              />
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            className="h-10 min-w-36 bg-danger text-white hover:bg-danger/90"
            disabled={saving}
            onClick={() => navigate('/dashboard')}
          >
            Exit Test Creation
          </Button>
          <Button
            type="button"
            className="h-10 min-w-24"
            disabled={saving}
            onClick={() => void goNext()}
          >
            {pendingAction === 'next' ? 'Saving…' : 'Next'}
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}

