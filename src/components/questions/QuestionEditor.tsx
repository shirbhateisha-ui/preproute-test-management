import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import RichTextEditor from '@/components/questions/RichTextEditor'
import type { CorrectOption } from '@/types/question'

export interface QuestionDraft {
  key: string
  id?: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: CorrectOption
  explanation: string
  difficulty: string
  topic: string
  sub_topic: string
}

export type DraftErrors = Partial<Record<keyof QuestionDraft, string>>

const OPTION_KEYS: CorrectOption[] = [
  'option1',
  'option2',
  'option3',
  'option4',
]

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Difficult' },
] as const

type Option = { id: string; name: string }

function ClearFieldButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-ink-subtle hover:text-danger"
      aria-label={label}
      title={label}
    >
      <Trash2 className="size-4" />
    </button>
  )
}

type Props = {
  value: QuestionDraft
  errors: DraftErrors
  onChange: (patch: Partial<QuestionDraft>) => void
  topics: Option[]
  subTopics: Option[]
  topicsLoading?: boolean
  subTopicsLoading?: boolean
  afterSolution?: ReactNode
}

export default function QuestionEditor({
  value,
  errors,
  onChange,
  topics,
  subTopics,
  topicsLoading,
  subTopicsLoading,
  afterSolution,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-ink-strong">Question</Label>
        <div className="relative">
          <RichTextEditor
            key={value.key}
            value={value.question}
            onChange={(html) => onChange({ question: html })}
            placeholder="Type here"
            invalid={!!errors.question}
            className="pr-0"
          />
          <div className="absolute top-12 right-2 z-10">
            <ClearFieldButton
              label="Clear question"
              onClick={() => onChange({ question: '' })}
            />
          </div>
        </div>
        {errors.question && (
          <p className="text-xs text-danger">{errors.question}</p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-ink-strong">
          Type the options below
        </p>
        <RadioGroup
          value={value.correct_option}
          onValueChange={(v) => onChange({ correct_option: v as CorrectOption })}
          className="space-y-2.5"
        >
          {OPTION_KEYS.map((key, i) => (
            <div key={key} className="flex items-center gap-3">
              <RadioGroupItem value={key} aria-label={`Mark option ${i + 1} correct`} />
              <Input
                value={value[key]}
                onChange={(e) => onChange({ [key]: e.target.value })}
                placeholder="Type Option here"
                className="h-11 flex-1 border-line bg-surface"
                aria-invalid={!!errors[key]}
              />
              <ClearFieldButton
                label={`Clear option ${i + 1}`}
                onClick={() => onChange({ [key]: '' })}
              />
            </div>
          ))}
        </RadioGroup>
        {(errors.option1 || errors.correct_option) && (
          <p className="text-xs text-danger">
            {errors.option1 ?? errors.correct_option}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="question-solution" className="text-ink-strong">
          Add Solution
        </Label>
        <div className="relative">
          <Textarea
            id="question-solution"
            value={value.explanation}
            onChange={(e) => onChange({ explanation: e.target.value })}
            placeholder="Type here"
            className="min-h-20 border-line bg-surface pr-10"
          />
          <div className="absolute right-2 bottom-2">
            <ClearFieldButton
              label="Clear solution"
              onClick={() => onChange({ explanation: '' })}
            />
          </div>
        </div>
      </div>

      {afterSolution}

      <div className="space-y-4 border-t border-line pt-5">
        <p className="text-sm font-semibold text-ink-strong">Question settings</p>

        <div className="space-y-1.5">
          <Label className="text-ink-muted">Level of Difficulty</Label>
          <Select
            value={value.difficulty || undefined}
            onValueChange={(v) => onChange({ difficulty: v })}
          >
            <SelectTrigger className="h-11 w-full border-line bg-surface">
              <SelectValue placeholder="Select from Drop-down" />
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

        <div className="space-y-1.5">
          <Label className="text-ink-muted">Topic</Label>
          <Select
            value={value.topic || undefined}
            onValueChange={(v) => onChange({ topic: v, sub_topic: '' })}
            disabled={topicsLoading || topics.length === 0}
          >
            <SelectTrigger className="h-11 w-full border-line bg-surface">
              <SelectValue placeholder="Select from Drop-down" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-ink-muted">Sub-topic</Label>
          <Select
            value={value.sub_topic || undefined}
            onValueChange={(v) => onChange({ sub_topic: v })}
            disabled={!value.topic || subTopicsLoading || subTopics.length === 0}
          >
            <SelectTrigger className="h-11 w-full border-line bg-surface">
              <SelectValue placeholder="Select from Drop-down" />
            </SelectTrigger>
            <SelectContent>
              {subTopics.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
