import { api } from '@/slice/api/api-slice'
import type { ApiResponse } from '@/types/api'
import type { LoginRequest, LoginResponse } from '@/types/auth'

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (res: ApiResponse<LoginResponse>) => res.data,
    }),
  }),
})

export const { useLoginMutation } = authApi
