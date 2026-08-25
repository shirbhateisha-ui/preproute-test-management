export type TestStatus = 'draft' | 'live' | 'unpublished' | 'scheduled' | 'expired'

export type TestType = 'chapterwise' | 'pyq' | 'mock'

export type TestDifficulty = 'easy' | 'medium' | 'hard'

/** Shape returned by GET /tests and GET /tests/:id (subject/topics as name strings). */
export interface Test {
  id: string
  name: string
  type: string
  subject: string
  topics: string[]
  sub_topics: string[]
  questions: string[] | null
  correct_marks: number
  unattempt_marks: number
  wrong_marks: number
  difficulty: string
  total_marks: number
  total_time: number
  total_questions: number
  slot: unknown
  hidden_from_moderator: unknown
  created_by: number
  created_at: string
  updated_by: number
  updated_at: string
  paragraph_question: unknown
  status: TestStatus
  scheduled_date: string | null
  expiry_date: string | null
  original_files?: unknown[]
}

/** Body for POST /tests and PUT /tests/:id — subject/topics/sub_topics are UUIDs. */
export interface TestWritePayload {
  name: string
  type: TestType
  subject: string
  topics: string[]
  sub_topics: string[]
  correct_marks: number
  wrong_marks: number
  unattempt_marks: number
  difficulty: TestDifficulty
  total_time: number
  total_marks: number
  total_questions: number
  status?: TestStatus
  questions?: string[]
}
