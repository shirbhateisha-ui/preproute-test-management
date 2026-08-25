export interface Subject {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface Topic {
  id: string
  subject_id: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface SubTopic {
  id: string
  topic_id: string
  name: string
  created_at?: string
  updated_at?: string
}
