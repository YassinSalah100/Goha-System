// Auth DTOs matching your backend implementation
export interface LoginDto {
  username: string
  password: string
}

export interface RegisterDto {
  username: string
  fullName: string
  password: string
  phone?: string
  hourRate: number
}

export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
}

export interface UserResponseDto {
  // Handle both possible field names from backend
  user_id?: string
  id?: string
  username: string
  full_name?: string
  fullName?: string
  phone?: string
  hour_rate?: number
  hourRate?: number
  is_active?: boolean
  isActive?: boolean
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  userPermissions?: string[]
}

export interface AuthResponseDto {
  user: UserResponseDto
  token: string
  expiresIn: number
}

// Frontend-specific types for UI state management
export interface LoginFormData {
  username: string
  password: string
  shift: 'morning' | 'evening'
  selectedRole: 'owner' | 'admin' | 'cashier'
  rememberMe: boolean
}

export interface CurrentUser {
  user_id: string
  id?: string // Add optional id field for compatibility
  full_name: string
  fullName?: string // Add optional fullName field for compatibility
  username: string
  name: string // alias for compatibility
  role: 'owner' | 'admin' | 'cashier'
  permissions?: string[] // Add permissions field
  shift?: {
    shift_id: string
    type: string
    start_time: string
    status: string
    is_active: boolean
    is_closed: boolean
    opened_by: string
    shift_type: string
    workers: any[]
    shift_name: string
    end_time?: string | null
  } | null
  loginTime: string
}

export interface AuthError {
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
}
