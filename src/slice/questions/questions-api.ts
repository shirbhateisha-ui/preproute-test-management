import { api } from '@/slice/api/api-slice'
import type { ApiResponse } from '@/types/api'
import type {
  Question,
  QuestionCreatePayload,
  QuestionUpdatePayload,
} from '@/types/question'

export const questionsApi = api.injectEndpoints({
  endpoints: (build) => ({
    bulkCreateQuestions: build.mutation<Question[], QuestionCreatePayload[]>({
      query: (questions) => ({
        url: '/questions/bulk',
        method: 'POST',
        body: { questions },
      }),
      transformResponse: (res: ApiResponse<Question[]>) => res.data,
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),
    fetchBulkQuestions: build.query<Question[], string[]>({
      query: (question_ids) => ({
        url: '/questions/fetchBulk',
        method: 'POST',
        body: { question_ids },
      }),
      transformResponse: (res: ApiResponse<Question[]>) => res.data,
      providesTags: [{ type: 'Question', id: 'LIST' }],
    }),
    updateQuestion: build.mutation<
      Question,
      { id: string; body: QuestionUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `/questions/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (res: ApiResponse<Question>) => res.data,
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),
    deleteQuestion: build.mutation<null, string>({
      query: (id) => ({ url: `/questions/${id}`, method: 'DELETE' }),
      transformResponse: (res: ApiResponse<null>) => res.data,
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),
  }),
})

export const {
  useBulkCreateQuestionsMutation,
  useFetchBulkQuestionsQuery,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} = questionsApi
