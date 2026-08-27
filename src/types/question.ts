export type CorrectOption = 'option1' | 'option2' | 'option3' | 'option4'

export interface Question {
  id: string
  type: 'mcq'
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: CorrectOption
  explanation?: string | null
  difficulty?: string | null
  media_url?: string | null
  test_id: string
  subject: string
  topic?: string | null
  sub_topic?: string | null
}

export interface QuestionCreatePayload {
  type: 'mcq'
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: CorrectOption
  explanation?: string
  difficulty?: string
  test_id: string
  subject: string
  topic?: string
  sub_topic?: string
}

export interface QuestionUpdatePayload {
  question?: string
  option1?: string
  option2?: string
  option3?: string
  option4?: string
  correct_option?: CorrectOption
  explanation?: string
  difficulty?: string
  topic?: string
  sub_topic?: string
}
