import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types/auth'

const TOKEN_KEY = 'preproute_token'
const USER_KEY = 'preproute_user'

interface AuthState {
  token: string | null
  user: User | null
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

const initialState: AuthState = {
  token: localStorage.getItem(TOKEN_KEY),
  user: loadUser(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token
      state.user = action.payload.user
      localStorage.setItem(TOKEN_KEY, action.payload.token)
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user))
    },
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
