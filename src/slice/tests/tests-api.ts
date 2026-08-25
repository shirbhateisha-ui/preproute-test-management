import { api } from '@/slice/api/api-slice'
import type { ApiResponse } from '@/types/api'
import type { Test, TestWritePayload } from '@/types/test'

export const testsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTests: build.query<Test[], void>({
      query: () => '/tests',
      transformResponse: (res: ApiResponse<Test[]>) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Test' as const, id })),
              { type: 'Test', id: 'LIST' },
            ]
          : [{ type: 'Test', id: 'LIST' }],
    }),
    getTest: build.query<Test, string>({
      query: (id) => `/tests/${id}`,
      transformResponse: (res: ApiResponse<Test>) => res.data,
      providesTags: (_result, _error, id) => [{ type: 'Test', id }],
    }),
    createTest: build.mutation<Test, TestWritePayload>({
      query: (body) => ({ url: '/tests', method: 'POST', body }),
      transformResponse: (res: ApiResponse<Test>) => res.data,
      invalidatesTags: [{ type: 'Test', id: 'LIST' }],
    }),
    updateTest: build.mutation<Test, { id: string; body: Partial<TestWritePayload> }>({
      query: ({ id, body }) => ({ url: `/tests/${id}`, method: 'PUT', body }),
      transformResponse: (res: ApiResponse<Test>) => res.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Test', id },
        { type: 'Test', id: 'LIST' },
      ],
    }),
    deleteTest: build.mutation<null, string>({
      query: (id) => ({ url: `/tests/${id}`, method: 'DELETE' }),
      transformResponse: (res: ApiResponse<null>) => res.data,
      invalidatesTags: (_result, _error, id) => [
        { type: 'Test', id },
        { type: 'Test', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetTestsQuery,
  useGetTestQuery,
  useCreateTestMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
} = testsApi
