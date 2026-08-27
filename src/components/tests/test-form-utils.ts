import { z } from 'zod'
import type { TestType, TestWritePayload } from '@/types/test'

export const testFormSchema = z.object({
  type: z.enum(['chapterwise', 'pyq', 'mock']),
  name: z.string().min(1, 'Please enter the name of the test'),
  subject: z.string().min(1, 'Please select a subject'),
  topics: z.array(z.string()).min(1, 'Please select at least one topic'),
  sub_topics: z.array(z.string()).min(1, 'Please select at least one sub topic'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  total_time: z.coerce.number().int().min(1, 'Please enter duration in minutes'),
  wrong_marks: z.coerce.number(),
  unattempt_marks: z.coerce.number(),
  correct_marks: z.coerce.number(),
  total_questions: z.coerce.number().int().min(1, 'Enter number of questions'),
  total_marks: z.coerce.number().min(1, 'Enter total marks'),
})

export type TestFormValues = z.infer<typeof testFormSchema>

export const defaultTestFormValues: TestFormValues = {
  type: 'chapterwise',
  name: '',
  subject: '',
  topics: [],
  sub_topics: [],
  difficulty: 'easy',
  total_time: 60,
  wrong_marks: -1,
  unattempt_marks: 0,
  correct_marks: 5,
  total_questions: 1,
  total_marks: 5,
}

export const TYPE_TABS: { value: TestType; label: string }[] = [
  { value: 'chapterwise', label: 'Chapterwise' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'mock', label: 'Mock Test' },
]

export function toWritePayload(values: TestFormValues): TestWritePayload {
  return {
    name: values.name.trim(),
    type: values.type,
    subject: values.subject,
    topics: values.topics,
    sub_topics: values.sub_topics,
    correct_marks: values.correct_marks,
    wrong_marks: values.wrong_marks,
    unattempt_marks: values.unattempt_marks,
    difficulty: values.difficulty,
    total_time: values.total_time,
    total_marks: values.total_marks,
    total_questions: values.total_questions,
  }
}
