export interface User {
  id: string
  userId: string
  name: string
  role: string
  subrole?: string
  phone?: string
  joiningDate?: string
  endDate?: string
  payment?: boolean
}

export interface LoginRequest {
  userId: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
