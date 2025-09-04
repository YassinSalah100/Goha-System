import type { LoginDto, RegisterDto, ChangePasswordDto, AuthResponseDto } from "@/lib/types/auth"

const API_BASE_URL = "http://20.117.240.138:3000/api/v1"

/**
 * Shift type constants matching backend enums
 */
export const SHIFT_TYPES = {
  MORNING: "morning",
  NIGHT: "night",
} as const

export const SHIFT_STATUS = {
  OPENED: "opened",
  CLOSED: "closed",
} as const

/**
 * Permission constants used throughout the application
 * These should match the backend permission system exactly
 */
export const PERMISSIONS = {
  // Core access levels
  OWNER_ACCESS: "OWNER_ACCESS",
  CASHIER_ACCESS: "access:cashier",

  // User management permissions
  USERS_READ: "access:users",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",

  // Permission management
  PERMISSIONS_READ: "access:permissions",
  PERMISSIONS_ASSIGN: "permissions:assign",
  PERMISSIONS_REVOKE: "permissions:revoke",

  // Feature access permissions (matching backend routes)
  PRODUCTS_ACCESS: "access:products",
  CATEGORIES_ACCESS: "access:category",
  SHIFTS_ACCESS: "access:shift",
  SHIFT_APPROVE: "shift:approve",
  SHIFT_SUMMARY: "shift:summary",
  SHIFT_MANAGE: "shift:manage",
  STOCK_ACCESS: "access:stock",
  ORDERS_ACCESS: "access:orders",
  ORDERS_CANCELLED: "orders:cancelled",
  EXPENSES_ACCESS: "access:expenses",
  WORKERS_ACCESS: "access:workers",

  // Specific action permissions
  INVENTORY_MANAGE: "inventory:manage",
  REPORTS_VIEW: "reports:view",
  EXTERNAL_RECEIPTS: "external:receipts",
  SHIFT_WORKERS: "shift:workers",
} as const

/**
 * Permission groups for easier management
 */
export const PERMISSION_GROUPS = {
  // Full access
  OWNER: [PERMISSIONS.OWNER_ACCESS],

  // Cashier permissions
  CASHIER: [PERMISSIONS.CASHIER_ACCESS, PERMISSIONS.ORDERS_ACCESS, PERMISSIONS.EXTERNAL_RECEIPTS],

  // User management
  USER_MANAGEMENT: [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT, PERMISSIONS.USERS_DELETE],

  // Permission management
  PERMISSION_MANAGEMENT: [PERMISSIONS.PERMISSIONS_READ, PERMISSIONS.PERMISSIONS_ASSIGN, PERMISSIONS.PERMISSIONS_REVOKE],

  // Product management
  PRODUCT_MANAGEMENT: [PERMISSIONS.PRODUCTS_ACCESS, PERMISSIONS.CATEGORIES_ACCESS],

  // Shift management
  SHIFT_MANAGEMENT: [
    PERMISSIONS.SHIFTS_ACCESS,
    PERMISSIONS.SHIFT_APPROVE,
    PERMISSIONS.SHIFT_SUMMARY,
    PERMISSIONS.SHIFT_MANAGE,
    PERMISSIONS.SHIFT_WORKERS,
  ],

  // Stock management
  STOCK_MANAGEMENT: [PERMISSIONS.STOCK_ACCESS, PERMISSIONS.INVENTORY_MANAGE],
} as const

export class AuthApiService {
  // Flag to bypass token expiration during critical operations (like shift approval waiting)
  private static bypassTokenExpiration = false

  /**
   * Set flag to bypass token expiration checks
   */
  static setBypassTokenExpiration(bypass: boolean): void {
    this.bypassTokenExpiration = bypass
    console.log(`🔧 Token expiration bypass ${bypass ? 'ENABLED' : 'DISABLED'}`)
  }

  /**
   * Normalize permission names to backend-supported forms
   */
  static normalizePermissionName(permission: string): string {
    switch (permission) {
      case "cashier:access":
        return "access:cashier"
      // Handle both formats to ensure compatibility
      case "access:cashier":
        return "access:cashier"
      default:
        return permission
    }
  }

  /**
   * Decode current auth token payload (without verifying signature)
   */
  static decodeToken(token?: string): any | null {
    try {
      const t = token || this.getAuthToken()
      if (!t) return null
      const [, payload] = t.split(".")
      if (!payload) return null
      return JSON.parse(atob(payload))
    } catch {
      return null
    }
  }

  /**
   * Normalize an array of permissions
   */
  static normalizePermissions(perms: string[] | undefined | null): string[] {
    if (!Array.isArray(perms)) return []
    // Ensure uniqueness after normalization
    const normalized = perms.map((p) => this.normalizePermissionName(p))
    return Array.from(new Set(normalized))
  }
  /**
   * Get the current auth token from localStorage
   */
  static getAuthToken(): string | null {
    if (typeof window === "undefined") return null
    const token = localStorage.getItem("authToken")

    // Check token expiration (unless bypassed for critical operations)
    if (token && !this.bypassTokenExpiration) {
      try {
        // Validate token format first
        if (!this.isValidTokenFormat(token)) {
          this.clearAuthData()
          return null
        }

        const payload = JSON.parse(atob(token.split(".")[1]))
        const now = Math.floor(Date.now() / 1000)
        const isValid = payload.exp > now

        if (!isValid) {
          console.log("🕒 Token expired, clearing auth data")
          this.clearAuthData()
          return null
        }
      } catch (e) {
        console.log("❌ Token validation failed, clearing auth data")
        this.clearAuthData()
        return null
      }
    } else if (token && this.bypassTokenExpiration) {
      console.log("⏳ Token expiration check bypassed during critical operation")
    }

    return token
  }

  /**
   * Get the current user from localStorage
   */
  static getCurrentUser(): any | null {
    if (typeof window === "undefined") return null
    const userStr = localStorage.getItem("currentUser")
    return userStr ? JSON.parse(userStr) : null
  }

  /**
   * Create headers with authentication token
   */
  static createAuthHeaders(): HeadersInit {
    const token = this.getAuthToken()
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Make an authenticated API request with enhanced error handling
   */
  static async apiRequest<T>(endpoint: string, options: RequestInit & { isRetry?: boolean } = {}): Promise<T> {
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
    console.log(`🔐 Authorization headers:`, config.headers?.['Authorization'] ? 'Bearer token present' : 'No auth token')

    // Debug token payload for critical endpoints
    if (endpoint.includes('cancelled-orders') || endpoint.includes('orders') || endpoint.includes('products')) {
      const token = this.getAuthToken()
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          console.log(`🎯 Token payload for ${endpoint}:`, {
            userId: payload.id || payload.user_id || payload.sub,
            role: payload.role,
            permissions: payload.permissions || payload.scopes || 'Not found in token',
            exp: new Date(payload.exp * 1000).toISOString()
          })
        } catch (e) {
          console.log(`⚠️ Could not decode token for debugging:`, e)
        }
      } else {
        console.log(`❌ No token found for ${endpoint}`)
      }
    }

    if (config.method !== "GET" && config.body && typeof config.body === "string") {
      console.log(`📤 Request body for ${endpoint}:`, JSON.parse(config.body))
    }

    // Check if token is expired
    const token = this.getAuthToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp < now) {
          console.log(`⚠️ TOKEN EXPIRED! Exp: ${new Date(payload.exp * 1000).toISOString()}, Now: ${new Date().toISOString()}`)
        }
      } catch (e) {
        console.log(`⚠️ Could not check token expiration:`, e)
      }
    }

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
          console.warn(
            `🚫 Backend endpoint ${endpoint} not implemented (404) - This endpoint doesn't exist on the backend`,
          )
          throw new Error(`Backend endpoint ${endpoint} not implemented`)
        }

        // For 401 - authentication failed, try token refresh
        if (response.status === 401) {
          const token = this.getAuthToken()
          console.warn(
            `🔐 Authentication failed for ${endpoint} (401) - Backend missing authMiddleware.authenticate for this route`,
          )

          // Attempt token refresh if we have a token and this isn't a retry
          if (token && !isRetry) {
            console.log("🔄 Attempting token refresh...")
            const refreshed = await this.refreshToken()
            if (refreshed) {
              console.log("✅ Token refreshed, retrying request...")
              return this.apiRequest<T>(endpoint, { ...options, isRetry: true })
            }
          }

          throw new Error("Authentication failed")
        }

        // Handle other error status codes
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          // Normalize legacy permission name in backend error messages
          if (errorMessage.includes("cashier:access")) {
            errorMessage = errorMessage.replace("cashier:access", "access:cashier (alias cashier:access)")
          }
          if (errorMessage.includes("One of these permissions required") && !/access:cashier/.test(errorMessage)) {
            // Ensure modern key is visible
            errorMessage += " | Expecting: OWNER_ACCESS or access:cashier"
          }
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        throw new Error("Invalid response format")
      }

      if (data.data.user) {
        const u = data.data.user
        const normalizedRole = (u.role || "").toString().toLowerCase()
        u.role = normalizedRole // persist normalized role client-side

        // Ensure permissions array exists
        if (!Array.isArray(u.permissions)) {
          u.permissions = []
        }

        // Normalize existing permissions (fix any inverted names like cashier:access)
        u.permissions = this.normalizePermissions(u.permissions)

        // Add role-based permissions (case-insensitive)
        if (normalizedRole === "owner" && !u.permissions.includes("OWNER_ACCESS")) {
          u.permissions.push("OWNER_ACCESS")
        }

        if (normalizedRole === "cashier" && !u.permissions.includes("access:cashier")) {
          u.permissions.push("access:cashier")
        }

        // Final fallback: if role is cashier but still no cashier related perms, flag it
        if (normalizedRole === "cashier" && !u.permissions.some((p) => p === "access:cashier")) {
          try {
            localStorage.setItem("permissionWarning", "Missing cashier permission from backend")
          } catch { }
        }

        console.log("User with normalized permissions:", u.permissions)

        // Store auth data immediately after successful login
        if (data.data.token) {
          localStorage.setItem("authToken", data.data.token)
          localStorage.setItem("currentUser", JSON.stringify(u))
        }
      }

      return data.data
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterDto): Promise<AuthResponseDto> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Registration failed" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        throw new Error("Invalid response format")
      }

      return data.data
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(): Promise<any> {
    return this.apiRequest("/auth/profile")
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<{ token: string; expiresIn: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error("Invalid refresh response format")
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
      throw error
    }
  }

  /**
   * Change user password
   */
  static async changePassword(passwordData: ChangePasswordDto): Promise<void> {
    await this.apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    })
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await this.apiRequest("/auth/logout", {
        method: "POST",
      })
    } catch (error) {
      // Don't throw error on logout, just clear local data
      console.warn("Logout request failed:", error)
    } finally {
      this.clearAuthData()
    }
  }

  /**
   * Clear authentication data from localStorage
   */
  static clearAuthData(): void {
    if (typeof window === "undefined") return

    localStorage.removeItem("authToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("currentUser")
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
    return user?.role === "owner" || (Array.isArray(user?.permissions) && user?.permissions.includes("OWNER_ACCESS"))
  }

  /**
   * Check if current user has cashier access
   */
  static hasCashierAccess(): boolean {
    const user = this.getCurrentUser()
    // Check if user has the cashier role or access:cashier permission
    return (
      user?.role === "cashier" || (Array.isArray(user?.permissions) && user?.permissions.includes("access:cashier"))
    )
  }

  /**
   * Get all user permissions including role-based ones
   */
  static getUserPermissions(): string[] {
    const user = this.getCurrentUser()
    if (!user) {
      console.log(`⚠️ getUserPermissions: No user found`)
      return []
    }

    console.log(`🔍 getUserPermissions: Raw user data:`, {
      id: user.user_id || user.id,
      role: user.role,
      permissions: user.permissions,
      fullUserObject: user
    })

    const permissions: string[] = this.normalizePermissions(
      Array.isArray(user.permissions) ? [...user.permissions] : [],
    )

    console.log(`🔍 getUserPermissions: After normalization:`, permissions)

    // Add role-based permissions
    if (user.role === "owner" && !permissions.includes("OWNER_ACCESS")) {
      permissions.push("OWNER_ACCESS")
      console.log(`✅ Added OWNER_ACCESS for owner role`)
    }

    if (user.role === "cashier") {
      // Add all cashier permissions from PERMISSION_GROUPS.CASHIER
      const cashierPermissions = [
        PERMISSIONS.CASHIER_ACCESS,      // "access:cashier"
        PERMISSIONS.ORDERS_ACCESS,       // "access:orders"
        PERMISSIONS.EXTERNAL_RECEIPTS    // "external:receipts"
      ]

      cashierPermissions.forEach(perm => {
        if (!permissions.includes(perm)) {
          permissions.push(perm)
          console.log(`✅ Added ${perm} for cashier role`)
        }
      })
    }

    console.log(`🎯 getUserPermissions: Final permissions:`, permissions)

    return permissions
  }

  /**
   * Check if current user has specific permission
   */
  static hasPermission(permission: string | string[]): boolean {
    // Owner access grants all permissions
    if (this.hasOwnerAccess()) {
      return true
    }

    const permissions = this.getUserPermissions()
    if (permissions.length === 0) {
      console.log(`⚠️ hasPermission: No permissions found for user`)
      return false
    }

    if (Array.isArray(permission)) {
      // Check if user has any of the permissions
      const hasAny = permission.some((p) => permissions.includes(p))
      console.log(`🔍 hasPermission check (OR): ${permission.join(' OR ')} -> ${hasAny}`)
      console.log(`🔍 User permissions:`, permissions)
      return hasAny
    }

    // Check single permission
    const hasSingle = permissions.includes(permission)
    console.log(`🔍 hasPermission check (single): ${permission} -> ${hasSingle}`)
    console.log(`🔍 User permissions:`, permissions)
    return hasSingle
  }

  /**
   * Check if user has any permission from a permission group
   */
  static hasPermissionGroup(group: string[]): boolean {
    return this.hasPermission(group)
  }

  /**
   * Check if user can manage users
   */
  static canManageUsers(): boolean {
    return this.hasPermission([
      PERMISSIONS.OWNER_ACCESS,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_EDIT,
      PERMISSIONS.USERS_DELETE,
    ])
  }

  /**
   * Check if user can manage permissions
   */
  static canManagePermissions(): boolean {
    return this.hasPermission([
      PERMISSIONS.OWNER_ACCESS,
      PERMISSIONS.PERMISSIONS_READ,
      PERMISSIONS.PERMISSIONS_ASSIGN,
      PERMISSIONS.PERMISSIONS_REVOKE,
    ])
  }

  /**
   * Check if user can access products
   */
  static canAccessProducts(): boolean {
    return this.hasPermission([PERMISSIONS.OWNER_ACCESS, PERMISSIONS.PRODUCTS_ACCESS, PERMISSIONS.CASHIER_ACCESS])
  }

  /**
   * Check if user can manage shifts
   */
  static canManageShifts(): boolean {
    return this.hasPermission([
      PERMISSIONS.OWNER_ACCESS,
      PERMISSIONS.SHIFTS_ACCESS,
      PERMISSIONS.SHIFT_APPROVE,
      PERMISSIONS.SHIFT_MANAGE,
    ])
  }

  /**
   * Check if user can access stock management
   */
  static canAccessStock(): boolean {
    return this.hasPermission([PERMISSIONS.OWNER_ACCESS, PERMISSIONS.STOCK_ACCESS])
  }

  /**
   * Check if user has access to cashier-specific features
   */
  static hasCashierFeatureAccess(feature: string): boolean {
    // If user has owner access or cashier access, they can access all cashier features
    if (this.hasOwnerAccess() || this.hasCashierAccess()) {
      return true
    }
    switch (feature) {
      case "orders":
        return this.hasPermission([PERMISSIONS.CASHIER_ACCESS, PERMISSIONS.ORDERS_ACCESS])
      case "shifts":
        return this.hasPermission([PERMISSIONS.CASHIER_ACCESS, PERMISSIONS.SHIFT_APPROVE])
      case "expenses":
        return this.hasPermission([PERMISSIONS.CASHIER_ACCESS, PERMISSIONS.EXPENSES_ACCESS])
      case "stock":
        return this.hasPermission([PERMISSIONS.STOCK_ACCESS])
      case "cancelled-orders":
        return this.hasPermission([PERMISSIONS.ORDERS_CANCELLED, PERMISSIONS.CASHIER_ACCESS, PERMISSIONS.ORDERS_ACCESS])
      case "external-receipts":
        return this.hasPermission([PERMISSIONS.CASHIER_ACCESS])
      case "shift-workers":
        return this.hasPermission([PERMISSIONS.CASHIER_ACCESS, PERMISSIONS.SHIFT_WORKERS])
      default:
        return false
    }
  }

  /**
   * Get cashier-specific permissions
   */
  static getCashierPermissions(): { [key: string]: boolean } {
    return {
      canAccessOrders: this.hasCashierFeatureAccess("orders"),
      canAccessShifts: this.hasCashierFeatureAccess("shifts"),
      canAccessExpenses: this.hasCashierFeatureAccess("expenses"),
      canAccessStock: this.hasCashierFeatureAccess("stock"),
      canAccessCancelledOrders: this.hasCashierFeatureAccess("cancelled-orders"),
      canAccessExternalReceipts: this.hasCashierFeatureAccess("external-receipts"),
      canAccessShiftWorkers: this.hasCashierFeatureAccess("shift-workers"),
    }
  }

  /**
   * Validate token format (basic check)
   */
  static isValidTokenFormat(token: string): boolean {
    // Basic JWT format check (3 parts separated by dots)
    const parts = token.split(".")
    return parts.length === 3
  }

  /**
   * Get current active shift for the authenticated user
   */
  static async getCurrentShift(): Promise<any | null> {
    try {
      const user = this.getCurrentUser()
      if (!user?.id) {
        console.warn("No user ID available to get current shift")
        return null
      }

      console.log(`Getting shifts for cashier ID: ${user.id}`)

      // Use the /cashier/:cashierId route to get shifts for the current user
      // This route allows ['OWNER_ACCESS', 'access:cashier', 'access:shift'] permissions
      const response: any = await this.apiRequest(`/shifts/cashier/${user.id}`)

      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        // Return the most recent active shift
        const activeShift =
          response.data.find((shift: any) => shift.status === "OPENED" || shift.status === "opened") || response.data[0]
        console.log("Found shift for cashier:", activeShift)
        return activeShift
      }

      console.log("No shifts found for cashier")
      return null
    } catch (error) {
      console.warn("Failed to get current shift:", error)
      return null
    }
  }

  /**
   * Get shift by specific ID
   */
  static async getShiftById(shiftId: string): Promise<any | null> {
    try {
      const response = await this.apiRequest(`/shifts/${shiftId}`)
      return response
    } catch (error) {
      console.warn("Failed to get shift by ID:", error)
      return null
    }
  }

  /**
   * Update shift type (for existing shifts)
   */
  static async updateShiftType(shiftId: string, type: string): Promise<any> {
    return this.apiRequest(`/shifts/${shiftId}/type`, {
      method: "PATCH",
      body: JSON.stringify({ type }),
    })
  }

  /**
   * Create a new shift (if really needed - use with caution)
   */
  static async createShift(shiftData: { type?: string } = {}): Promise<any> {
    console.warn("⚠️ Creating new shift - this may require special permissions")
    const payload = {
      type: shiftData.type || "DAY",
      ...shiftData,
    }

    try {
      const response = await this.apiRequest("/shifts", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      return response
    } catch (error) {
      console.error("Failed to create shift:", error)
      throw error
    }
  }

  /**
   * Request to close a shift
   */
  static async requestCloseShift(shiftId: string): Promise<any> {
    return this.apiRequest(`/shifts/${shiftId}/request-close`, {
      method: "PATCH",
    })
  }

  /**
   * Ensure user has an active shift (gets existing shift only)
   */
  static async ensureActiveShift(): Promise<any> {
    try {
      const user = this.getCurrentUser()
      if (!user?.id) {
        throw new Error("No user ID available - cannot check shift status")
      }

      console.log(`Checking for active shift for user: ${user.id}`)

      // Try to get existing shift using the cashier route
      const currentShift = await this.getCurrentShift()

      if (currentShift) {
        console.log("Found existing active shift:", currentShift)

        // Update user data with shift information
        const updatedUser = { ...user, shift: currentShift }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))

        return currentShift
      }

      console.log("No active shift found for user")

      // If user is cashier and has permission to create shifts, suggest creating one
      if (user.role === "cashier" && this.hasPermission(["access:cashier", "access:shift"])) {
        console.log("💡 Cashier has no active shift but can create one. Consider calling createShift().")
      }

      return null // Return null instead of trying to create
    } catch (error) {
      console.error("Error checking active shift:", error)

      // If we get authentication error (401), it means backend is missing auth middleware
      if (error instanceof Error && error.message.includes("Authentication failed")) {
        console.error(
          "🚨 Backend shift routes are missing AuthMiddleware.authenticate() - Cannot access shift endpoints without authentication",
        )
        throw new Error(
          "Backend authentication issue: Shift routes need AuthMiddleware.authenticate() before authorization checks",
        )
      }

      // If we get permission error, provide helpful message
      if (error instanceof Error && error.message.includes("403")) {
        const user = this.getCurrentUser()
        const permissions = this.getUserPermissions()
        console.error("Shift access denied. User permissions:", permissions)

        // Check if user should have cashier access
        if (user?.role === "cashier" && !permissions.includes("access:cashier")) {
          throw new Error(
            "Missing cashier permissions. Please contact administrator to grant access:cashier permission.",
          )
        }
      }

      // Don't throw error for shift checking - just return null
      console.warn("Could not check shift status, continuing without shift data")
      return null
    }
  }

  /**
   * Create a shift for the current user (cashier)
   */
  static async createShiftForCurrentUser(): Promise<any> {
    const user = this.getCurrentUser();
    if (!user?.id) {
      throw new Error("No user ID available to create shift");
    }

    // Determine shift type based on current time
    const currentHour = new Date().getHours();
    let shiftType: string;
    // If it's between 6 AM and 6 PM, it's a morning shift, otherwise night shift
    if (currentHour >= 6 && currentHour < 18) {
      shiftType = SHIFT_TYPES.MORNING;
    } else {
      shiftType = SHIFT_TYPES.NIGHT;
    }

    // Get the user ID correctly - handle different formats
    const userId = user.user_id || user.id;

    // Prompt user for initial balance
    let initialBalance = 0;
    try {
      const userInput = window.prompt("أدخل قيمة الرصيد الأولي (الأرضية):", "0");
      if (userInput !== null) {
        initialBalance = parseFloat(userInput);
        if (isNaN(initialBalance) || initialBalance < 0) {
          initialBalance = 0;
        }
      }
    } catch (error) {
      console.warn("Failed to get initial balance from user:", error);
    }

    // Ensure numeric value is properly parsed and match exactly the backend expected structure
    const parsedBalance = Number(initialBalance);
    const shiftData = {
      opened_by: userId,
      shift_type: shiftType,
      intial_balance: parsedBalance, // Misspelled as in the backend DTO but ensure it's a number
      workers: [{ worker_id: userId }] // Include current user as worker
    };

    console.log("Creating shift for current user:", shiftData);

    try {
      // Add access:shift permission temporarily if needed
      const currentPermissions = this.getUserPermissions();
      if (!currentPermissions.includes('access:shift')) {
        console.log('⚠️ Adding access:shift permission temporarily for shift creation');
        const updatedUser = { ...user };
        if (!Array.isArray(updatedUser.permissions)) {
          updatedUser.permissions = [];
        }
        updatedUser.permissions.push('access:shift');
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }

      const response: any = await this.apiRequest("/shifts", {
        method: "POST",
        body: JSON.stringify(shiftData),
      });

      if (response) {
        console.log("✅ Shift created successfully:", response);

        // Update user data with new shift
        const shiftData = response.data || response;
        const updatedUser = { ...user, shift: shiftData };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        return shiftData;
      }

      return null;
    } catch (error) {
      console.error("Failed to create shift for current user:", error);

      // If we still get validation errors, try other variations
      if (error instanceof Error && error.message.includes('Validation failed')) {
        // Log specific error details if available
        console.log("Validation error details:", error);

        try {
          // Try alternative payload format - try with empty workers array as shown in Postman
          const alternativePayload = {
            opened_by: userId,
            shift_type: shiftType,
            intial_balance: Number(initialBalance), // Ensure it's a number
            workers: [] // Try with empty workers array as shown in Postman
          };

          console.log("Trying alternative payload format:", alternativePayload);

          const response: any = await this.apiRequest("/shifts", {
            method: "POST",
            body: JSON.stringify(alternativePayload),
          });

          if (response) {
            console.log("✅ Shift created successfully with alternative format:", response);
            const shiftData = response.data || response;
            const updatedUser = { ...user, shift: shiftData };
            localStorage.setItem("currentUser", JSON.stringify(updatedUser));
            return shiftData;
          }
        } catch (retryError) {
          console.error("Failed on retry attempt:", retryError);

          // One final attempt with format exactly matching Postman example
          try {
            console.log("Making final attempt with exact Postman format");

            // Final attempt with exact format from Postman
            const finalAttemptPayload = {
              opened_by: userId,
              shift_type: shiftType,
              intial_balance: Number(initialBalance),
              workers: []
            };

            const response: any = await this.apiRequest("/shifts", {
              method: "POST",
              body: JSON.stringify(finalAttemptPayload),
            });

            if (response) {
              console.log("✅ Shift created successfully on final attempt:", response);
              const shiftData = response.data || response;
              const updatedUser = { ...user, shift: shiftData };
              localStorage.setItem("currentUser", JSON.stringify(updatedUser));
              return shiftData;
            }
          } catch (finalError) {
            console.error("All shift creation attempts failed:", finalError);
          }
        }
      }

      throw error;
    }
  }
}
