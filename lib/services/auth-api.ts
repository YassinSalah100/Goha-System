import { LoginDto, RegisterDto, ChangePasswordDto, AuthResponseDto } from '@/lib/types/auth'

const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

export class AuthApiService {
  /**
   * Get the current auth token from localStorage
   */
  static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem('authToken')
    
    // Check token expiration
    if (token) {
      try {
        // Validate token format first
        if (!this.isValidTokenFormat(token)) {
          this.clearAuthData()
          return null
        }
        
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        const isValid = payload.exp > now
        
        if (!isValid) {
          this.clearAuthData()
          return null
        }
      } catch (e) {
        this.clearAuthData()
        return null
      }
    }
    
    return token
  }

  /**
   * Get the current user from localStorage
   */
  static getCurrentUser(): any | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('currentUser')
    return userStr ? JSON.parse(userStr) : null
  }

  /**
   * Create headers with authentication token
   */
  static createAuthHeaders(): HeadersInit {
    const token = this.getAuthToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  /**
   * Make an authenticated API request with enhanced error handling
   */
  static async apiRequest<T>(
    endpoint: string,
    options: RequestInit & { isRetry?: boolean } = {}
  ): Promise<T> {
    const { isRetry = false, ...requestOptions } = options
    const url = `${API_BASE_URL}${endpoint}`
    
    // Always include auth headers if available
    const config: RequestInit = {
      ...requestOptions,
      headers: {
        ...this.createAuthHeaders(),
        ...requestOptions.headers,
      },
    }

    console.log(`Making request to: ${url}`)

    try {
      const response = await fetch(url, config)
      
      console.log(`Response from ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      if (!response.ok) {
        // For 404 - endpoint doesn't exist on backend
        if (response.status === 404) {
          console.warn(`🚫 Backend endpoint ${endpoint} not implemented (404) - This endpoint doesn't exist on the backend`)
          throw new Error(`Backend endpoint ${endpoint} not implemented`)
        }
        
        // For 401 - authentication failed, try token refresh
        if (response.status === 401) {
          const token = this.getAuthToken()
          console.warn(`🔐 Authentication failed for ${endpoint} (401) - Backend missing authMiddleware.authenticate for this route`)
          
          // Attempt token refresh if we have a token and this isn't a retry
          if (token && !isRetry) {
            console.log('🔄 Attempting token refresh...')
            const refreshed = await this.refreshToken()
            if (refreshed) {
              console.log('✅ Token refreshed, retrying request...')
              return this.apiRequest<T>(endpoint, { ...options, isRetry: true })
            }
          }
          
          throw new Error('Authentication failed')
        }
        
        // Handle other error status codes
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // Ignore JSON parse errors for error responses
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log(`Success response from ${endpoint}:`, data)
      return data
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginDto): Promise<AuthResponseDto> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response format')
      }
      
      // If user is owner, ensure OWNER_ACCESS is set
      if (data.data.user && data.data.user.role === 'owner') {
        if (!data.data.user.permissions) {
          data.data.user.permissions = []
        }
        if (!data.data.user.permissions.includes('OWNER_ACCESS')) {
          data.data.user.permissions.push('OWNER_ACCESS')
        }
      }

      return data.data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterDto): Promise<AuthResponseDto> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response format')
      }

      return data.data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(): Promise<any> {
    return this.apiRequest('/auth/profile')
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<{ token: string; expiresIn: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
      })
      
      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error('Invalid refresh response format')
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  /**
   * Change user password
   */
  static async changePassword(passwordData: ChangePasswordDto): Promise<void> {
    await this.apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    })
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await this.apiRequest('/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      // Don't throw error on logout, just clear local data
      console.warn('Logout request failed:', error)
    } finally {
      this.clearAuthData()
    }
  }

  /**
   * Clear authentication data from localStorage
   */
  static clearAuthData(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('currentUser')
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getAuthToken()
    const user = this.getCurrentUser()
    return !!(token && user)
  }

  /**
   * Get user role from current user data
   */
  static getUserRole(): string | null {
    const user = this.getCurrentUser()
    return user?.role || null
  }

  /**
   * Check if current user has specific role
   */
  static hasRole(role: string): boolean {
    const userRole = this.getUserRole()
    return userRole === role
  }
  
  /**
   * Check if current user has owner access
   */
  static hasOwnerAccess(): boolean {
    const user = this.getCurrentUser()
    // Check if user role is owner or has OWNER_ACCESS permission
    return user?.role === 'owner' || (Array.isArray(user?.permissions) && user?.permissions.includes('OWNER_ACCESS'))
  }

  /**
   * Check if current user has specific permission
   */
  static hasPermission(permission: string | string[]): boolean {
    // Owner access grants all permissions
    if (this.hasOwnerAccess()) {
      return true
    }
    
    const user = this.getCurrentUser()
    if (!user || !Array.isArray(user.permissions)) {
      return false
    }
    
    if (Array.isArray(permission)) {
      // Check if user has any of the permissions
      return permission.some(p => user.permissions.includes(p))
    }
    
    // Check single permission
    return user.permissions.includes(permission)
  }

  /**
   * Validate token format (basic check)
   */
  static isValidTokenFormat(token: string): boolean {
    // Basic JWT format check (3 parts separated by dots)
    const parts = token.split('.')
    return parts.length === 3
  }
}
