"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthApiService } from "@/lib/services/auth-api"

const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

interface ShiftGuardProps {
  children: React.ReactNode
  requiredRole?: "cashier" | "owner"
  requireActiveShift?: boolean
  requiredPermission?: string | string[]
}

export default function ShiftGuard({ 
  children, 
  requiredRole = "cashier", 
  requireActiveShift = true,
  requiredPermission
}: ShiftGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        console.log("ShiftGuard: Starting authorization check")

        // Get stored user data using AuthApiService
        const currentUser = AuthApiService.getCurrentUser()
        const authToken = AuthApiService.getAuthToken()

        if (!currentUser || !authToken) {
          console.log("ShiftGuard: No user data found")
          toast.error("يرجى تسجيل الدخول أولاً")
          router.push("/")
          return
        }

        console.log("ShiftGuard: User data found:", currentUser)

        // Check role authorization
        if (currentUser.role !== requiredRole && requiredRole !== "owner" && !AuthApiService.hasOwnerAccess()) {
          console.log(`ShiftGuard: Role mismatch. Required: ${requiredRole}, Got: ${currentUser.role}`)
          toast.error(`غير مصرح لك بالوصول لهذه الصفحة`)
          router.push("/")
          return
        }

        // Check permissions if specified
        if (requiredPermission && !AuthApiService.hasPermission(requiredPermission)) {
          console.log(`ShiftGuard: Permission denied. Required: ${requiredPermission}`)
          toast.error(`غير مصرح لك بالوصول لهذه الصفحة - صلاحيات غير كافية`)
          router.push("/")
          return
        }

        // For cashiers, validate shift access
        if (requiredRole === "cashier" && requireActiveShift) {
          // Check if user has shift data stored
          if (!currentUser.shift || !currentUser.shift.shift_id) {
            console.log("ShiftGuard: No shift data in stored user")
            toast.error("لا يمكن الوصول لهذه الصفحة بدون جلسة وردية نشطة")

            // Clear invalid session
            AuthApiService.clearAuthData()

            router.push("/")
            return
          }

          // Verify shift is still active from backend
          try {
            const response = await fetch(`${API_BASE_URL}/shifts/cashier/${currentUser.user_id}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            })

            if (response.ok) {
              const result = await response.json()
              console.log("ShiftGuard: Shift data from API:", result)

              if (result.success && result.data && result.data.length > 0) {
                // Find active shift - use same logic as login page
                const activeShift = result.data.find(
                  (shift: any) =>
                    !shift.is_closed &&
                    (shift.status === "ACTIVE" ||
                      shift.status === "active" ||
                      shift.status === "open" ||
                      shift.status === "OPEN"),
                )

                if (!activeShift) {
                  console.log("ShiftGuard: No active shift found in API")
                  toast.error("انتهت جلسة الوردية الخاصة بك", {
                    description: "يرجى تسجيل الدخول مرة أخرى",
                  })

                  // Clear session
                  AuthApiService.clearAuthData()

                  router.push("/")
                  return
                }

                console.log("ShiftGuard: Active shift verified:", activeShift)
              } else {
                console.log("ShiftGuard: No shift data in API response")
                toast.error("لا يمكن التحقق من حالة الوردية")
                router.push("/")
                return
              }
            } else {
              console.log("ShiftGuard: Failed to fetch shift data from API")
              // Don't redirect on API errors, just log and continue
            }
          } catch (apiError) {
            console.error("ShiftGuard: API error:", apiError)
            // Don't redirect on network errors, just log and continue
          }
        }

        console.log("ShiftGuard: Authorization successful")
        setIsAuthorized(true)
      } catch (error) {
        console.error("ShiftGuard: Authorization check failed:", error)
        toast.error("حدث خطأ في التحقق من الصلاحيات")

        // Clear session on error
        AuthApiService.clearAuthData()

        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthorization()
  }, [router, requiredRole, requireActiveShift])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
