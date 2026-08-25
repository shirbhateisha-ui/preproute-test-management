import { api } from '@/slice/api/api-slice'
import type { ApiResponse } from '@/types/api'
import type { Subject, SubTopic, Topic } from '@/types/taxonomy'

export const taxonomyApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSubjects: build.query<Subject[], void>({
      query: () => '/subjects',
      transformResponse: (res: ApiResponse<Subject[]>) => res.data,
    }),
    getTopics: build.query<Topic[], string>({
      query: (subjectId) => `/topics/subject/${subjectId}`,
      transformResponse: (res: ApiResponse<Topic[]>) => res.data,
    }),
    getSubTopics: build.query<SubTopic[], string>({
      query: (topicId) => `/sub-topics/topic/${topicId}`,
      transformResponse: (res: ApiResponse<SubTopic[]>) => res.data,
    }),
    getSubTopicsMulti: build.query<SubTopic[], string[]>({
      query: (topicIds) => ({
        url: '/sub-topics/multi-topics',
        method: 'POST',
        body: { topicIds },
      }),
      transformResponse: (res: ApiResponse<SubTopic[]>) => res.data,
      serializeQueryArgs: ({ queryArgs }) =>
        [...queryArgs].sort().join(','),
    }),
  }),
})

export const {
  useGetSubjectsQuery,
  useGetTopicsQuery,
  useGetSubTopicsQuery,
  useGetSubTopicsMultiQuery,
} = taxonomyApi
