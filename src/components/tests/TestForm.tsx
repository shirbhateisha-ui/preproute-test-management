import { useEffect, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { MultiSelect } from '@/components/tests/MultiSelect'
import { MarkingStepper } from '@/components/tests/MarkingStepper'
import {
  useGetSubjectsQuery,
  useGetSubTopicsMultiQuery,
  useGetTopicsQuery,
} from '@/slice/taxonomy/taxonomy-api'
import type { TestDifficulty, TestType } from '@/types/test'
import { cn } from '@/lib/utils'
import {
  TYPE_TABS,
  defaultTestFormValues,
  testFormSchema,
  type TestFormValues,
} from '@/components/tests/test-form-utils'

type TestFormProps = {
  formId: string
  defaultValues?: Partial<TestFormValues>
  onSubmit: (values: TestFormValues) => void | Promise<void>
  onTypeChange?: (type: TestType) => void
  className?: string
  /** When true, form resets from defaultValues (edit hydrate). */
  ready?: boolean
}

export function TestForm({
  formId,
  defaultValues,
  onSubmit,
  onTypeChange,
  className,
  ready = true,
}: TestFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: { ...defaultTestFormValues, ...defaultValues },
  })

  const subjectId = useWatch({ control, name: 'subject' })
  const topicIds = useWatch({ control, name: 'topics' }) ?? []

  const { data: subjects = [], isLoading: subjectsLoading } =
    useGetSubjectsQuery()
  const { data: topics = [], isLoading: topicsLoading } = useGetTopicsQuery(
    subjectId,
    { skip: !subjectId },
  )
  const { data: subTopics = [], isLoading: subTopicsLoading } =
    useGetSubTopicsMultiQuery(topicIds, { skip: topicIds.length === 0 })

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (ready && defaultValues && !hydratedRef.current) {
      reset({ ...defaultTestFormValues, ...defaultValues })
      hydratedRef.current = true
    }
    if (!ready) hydratedRef.current = false
  }, [ready, defaultValues, reset])

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-5', className)}
      noValidate
    >
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Tabs
            value={field.value}
            onValueChange={(v) => {
              const next = v as TestType
              field.onChange(next)
              onTypeChange?.(next)
            }}
          >
            <TabsList className="h-10 w-fit justify-start gap-1 rounded-lg border border-line bg-surface p-1">
              {TYPE_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-full rounded-md px-4 text-sm font-medium text-ink-muted after:hidden data-active:bg-primary-50 data-active:text-primary data-active:shadow-none"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-ink-muted">Subject</Label>
          {subjectsLoading ? (
            <Skeleton className="h-11 w-full" />
          ) : (
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(v) => {
                    field.onChange(v)
                    setValue('topics', [])
                    setValue('sub_topics', [])
                  }}
                >
                  <SelectTrigger className="h-11 w-full border-line bg-surface">
                    <SelectValue placeholder="Choose from Drop-down" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
          {errors.subject && (
            <p className="text-xs text-danger">{errors.subject.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-name`} className="text-ink-muted">
            Name of Test
          </Label>
          <Input
            id={`${formId}-name`}
            placeholder="Enter name of Test"
            className="h-11 border-line bg-surface"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-danger">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-ink-muted">Topic</Label>
          <Controller
            name="topics"
            control={control}
            render={({ field }) => (
              <MultiSelect
                options={topics}
                value={field.value}
                disabled={!subjectId || topicsLoading}
                onChange={(ids) => {
                  field.onChange(ids)
                  setValue('sub_topics', [])
                }}
              />
            )}
          />
          {errors.topics && (
            <p className="text-xs text-danger">{errors.topics.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-ink-muted">Sub Topic</Label>
          <Controller
            name="sub_topics"
            control={control}
            render={({ field }) => (
              <MultiSelect
                options={subTopics}
                value={field.value}
                disabled={topicIds.length === 0 || subTopicsLoading}
                onChange={field.onChange}
              />
            )}
          />
          {errors.sub_topics && (
            <p className="text-xs text-danger">{errors.sub_topics.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-duration`} className="text-ink-muted">
            Duration (Minutes)
          </Label>
          <Input
            id={`${formId}-duration`}
            type="number"
            min={1}
            placeholder="Enter the time"
            className="h-11 border-line bg-surface"
            aria-invalid={!!errors.total_time}
            {...register('total_time')}
          />
          {errors.total_time && (
            <p className="text-xs text-danger">{errors.total_time.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-ink-muted">Test Difficulty Level</Label>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={(v) => field.onChange(v as TestDifficulty)}
                className="flex h-11 flex-row flex-wrap items-center gap-5"
              >
                {(
                  [
                    ['easy', 'Easy'],
                    ['medium', 'Medium'],
                    ['hard', 'Difficult'],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-ink-body"
                  >
                    <RadioGroupItem value={value} />
                    {label}
                  </label>
                ))}
              </RadioGroup>
            )}
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-ink-strong">
          Marking Scheme:
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Controller
            name="wrong_marks"
            control={control}
            render={({ field }) => (
              <MarkingStepper
                id={`${formId}-wrong`}
                label="Wrong Answer"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="unattempt_marks"
            control={control}
            render={({ field }) => (
              <MarkingStepper
                id={`${formId}-unattempt`}
                label="Unattempted"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="correct_marks"
            control={control}
            render={({ field }) => (
              <MarkingStepper
                id={`${formId}-correct`}
                label="Correct Answer"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor={`${formId}-questions`} className="text-ink-muted">
              No of Questions
            </Label>
            <Input
              id={`${formId}-questions`}
              type="number"
              min={1}
              placeholder="Ex: 50"
              className="h-11 border-line bg-surface"
              aria-invalid={!!errors.total_questions}
              {...register('total_questions')}
            />
            {errors.total_questions && (
              <p className="text-xs text-danger">
                {errors.total_questions.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${formId}-marks`} className="text-ink-muted">
              Total Marks
            </Label>
            <Input
              id={`${formId}-marks`}
              type="number"
              min={1}
              placeholder="Ex: 250 Marks"
              className="h-11 border-line bg-surface"
              aria-invalid={!!errors.total_marks}
              {...register('total_marks')}
            />
            {errors.total_marks && (
              <p className="text-xs text-danger">{errors.total_marks.message}</p>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
