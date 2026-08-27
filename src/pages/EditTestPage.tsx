import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TestForm,
  TYPE_TABS,
  defaultTestFormValues,
  toWritePayload,
  type TestFormValues,
} from '@/components/tests/TestForm'
import {
  useGetTestQuery,
  useUpdateTestMutation,
} from '@/slice/tests/tests-api'
import {
  useGetSubjectsQuery,
  useGetSubTopicsMultiQuery,
  useGetTopicsQuery,
} from '@/slice/taxonomy/taxonomy-api'
import type { Test, TestDifficulty, TestType } from '@/types/test'

const FORM_ID = 'edit-test-form'

function idsByName(
  items: { id: string; name: string }[],
  names: string[] | null | undefined,
) {
  if (!names?.length) return []
  return names
    .map((name) => items.find((i) => i.name === name)?.id)
    .filter((id): id is string => !!id)
}

function normalizeType(type: string): TestType {
  const t = type.toLowerCase().replace(/\s+/g, '')
  if (t === 'pyq') return 'pyq'
  if (t === 'mock' || t === 'mocktest') return 'mock'
  return 'chapterwise'
}

function normalizeDifficulty(difficulty: string): TestDifficulty {
  const d = difficulty.toLowerCase()
  if (d === 'medium') return 'medium'
  if (d === 'hard' || d === 'difficult') return 'hard'
  return 'easy'
}

export default function EditTestPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [updateTest, { isLoading: isSaving }] = useUpdateTestMutation()
  const [typeOverride, setTypeOverride] = useState<TestType | null>(null)

  const {
    data: test,
    isLoading: testLoading,
    isError,
  } = useGetTestQuery(id, { skip: !id })

  const { data: subjects = [], isLoading: subjectsLoading } =
    useGetSubjectsQuery()

  const subjectId = useMemo(() => {
    if (!test || !subjects.length) return ''
    return subjects.find((s) => s.name === test.subject)?.id ?? ''
  }, [test, subjects])

  const { data: topics = [], isLoading: topicsLoading } = useGetTopicsQuery(
    subjectId,
    { skip: !subjectId },
  )

  const topicIds = useMemo(
    () => idsByName(topics, test?.topics),
    [topics, test?.topics],
  )

  const { data: subTopics = [], isLoading: subTopicsLoading } =
    useGetSubTopicsMultiQuery(topicIds, { skip: topicIds.length === 0 })

  const hydrated = useMemo(() => {
    if (!test || subjectsLoading) return null
    if (subjectId && topicsLoading) return null
    if (topicIds.length > 0 && subTopicsLoading) return null

    return buildFormValues(test, subjectId, topics, subTopics)
  }, [
    test,
    subjectId,
    subjectsLoading,
    topics,
    subTopics,
    topicIds.length,
    topicsLoading,
    subTopicsLoading,
  ])

  const activeType = typeOverride ?? hydrated?.type ?? 'chapterwise'
  const typeLabel =
    TYPE_TABS.find((t) => t.value === activeType)?.label ?? 'Chapterwise'

  const loading =
    testLoading || subjectsLoading || (!!test && !hydrated && !isError)

  const onSubmit = async (values: TestFormValues) => {
    try {
      await updateTest({ id, body: toWritePayload(values) }).unwrap()
      toast.success('Test updated')
      navigate('/dashboard')
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to update test. Please try again.'
      toast.error(message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <nav className="text-sm text-ink-muted">
        <span>Test Creation</span>
        <span className="mx-1.5 text-ink-subtle">/</span>
        <span>Edit Test</span>
        <span className="mx-1.5 text-ink-subtle">/</span>
        <span className="font-medium text-ink-strong">{typeLabel}</span>
      </nav>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
        {isError ? (
          <p className="py-8 text-center text-sm text-danger">
            Couldn’t load this test. It may have been deleted.
          </p>
        ) : loading || !hydrated ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <TestForm
              formId={FORM_ID}
              defaultValues={hydrated}
              ready
              onTypeChange={setTypeOverride}
              onSubmit={onSubmit}
            />

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 border-line"
                onClick={() => navigate(`/tests/${id}/questions`)}
              >
                <ListChecks className="size-4" />
                Manage Questions
                {test && test.total_questions > 0 && (
                  <span className="text-ink-subtle">({test.total_questions})</span>
                )}
              </Button>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 min-w-24 bg-primary-100 text-primary hover:bg-primary-100/80"
                  disabled={isSaving}
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form={FORM_ID}
                  className="h-10 min-w-24"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function buildFormValues(
  test: Test,
  subjectId: string,
  topics: { id: string; name: string }[],
  subTopics: { id: string; name: string }[],
): TestFormValues {
  return {
    ...defaultTestFormValues,
    type: normalizeType(test.type),
    name: test.name,
    subject: subjectId,
    topics: idsByName(topics, test.topics),
    sub_topics: idsByName(subTopics, test.sub_topics),
    difficulty: normalizeDifficulty(test.difficulty),
    total_time: test.total_time,
    wrong_marks: test.wrong_marks,
    unattempt_marks: test.unattempt_marks,
    correct_marks: test.correct_marks,
    total_questions: test.total_questions,
    total_marks: test.total_marks,
  }
}
