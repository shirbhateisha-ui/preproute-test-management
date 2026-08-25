import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import {
  TestForm,
  TYPE_TABS,
  toWritePayload,
  type TestFormValues,
} from '@/components/tests/TestForm'
import { useCreateTestMutation } from '@/slice/tests/tests-api'
import type { TestType } from '@/types/test'

const FORM_ID = 'create-test-form'

export default function CreateTestPage() {
  const navigate = useNavigate()
  const [createTest, { isLoading }] = useCreateTestMutation()
  const [activeType, setActiveType] = useState<TestType>('chapterwise')
  const intentRef = useRef<'draft' | 'next'>('next')

  const typeLabel =
    TYPE_TABS.find((t) => t.value === activeType)?.label ?? 'Chapterwise'

  const onSubmit = async (values: TestFormValues) => {
    const goNext = intentRef.current === 'next'
    try {
      const created = await createTest({
        ...toWritePayload(values),
        status: 'draft',
      }).unwrap()
      toast.success(goNext ? 'Test created' : 'Draft saved')
      if (goNext) navigate(`/tests/${created.id}/questions`)
      else navigate('/dashboard')
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to create test. Please try again.'
      toast.error(message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <nav className="text-sm text-ink-muted">
        <span>Test Creation</span>
        <span className="mx-1.5 text-ink-subtle">/</span>
        <span>Create Test</span>
        <span className="mx-1.5 text-ink-subtle">/</span>
        <span className="font-medium text-ink-strong">{typeLabel}</span>
      </nav>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
        <TestForm
          formId={FORM_ID}
          onTypeChange={setActiveType}
          onSubmit={onSubmit}
        />

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            className="h-10 min-w-24 bg-primary-100 text-primary hover:bg-primary-100/80"
            disabled={isLoading}
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="outline"
            className="h-10 min-w-28 border-line"
            disabled={isLoading}
            onClick={() => {
              intentRef.current = 'draft'
            }}
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            className="h-10 min-w-24"
            disabled={isLoading}
            onClick={() => {
              intentRef.current = 'next'
            }}
          >
            {isLoading ? 'Saving…' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
