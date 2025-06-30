"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

interface ShiftGuardProps {
  children: React.ReactNode
  requiredRole?: "cashier" | "admin" | "owner"
  requireActiveShift?: boolean
}

export default function ShiftGuard({ children, requiredRole = "cashier", requireActiveShift = true }: ShiftGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        console.log("ShiftGuard: Starting authorization check")

        // Get stored user data
        const currentUser = localStorage.getItem("currentUser")
        const authToken = localStorage.getItem("authToken")

        if (!currentUser || !authToken) {
          console.log("ShiftGuard: No user data found")
          toast.error("يرجى تسجيل الدخول أولاً")
          router.push("/login")
          return
        }

        const userData = JSON.parse(currentUser)
        console.log("ShiftGuard: User data found:", userData)

        // Check role authorization
        if (userData.role !== requiredRole && requiredRole !== "owner") {
          console.log(`ShiftGuard: Role mismatch. Required: ${requiredRole}, Got: ${userData.role}`)
          toast.error(`غير مصرح لك بالوصول لهذه الصفحة`)
          router.push("/login")
          return
        }

        // For cashiers, validate shift access
        if (requiredRole === "cashier" && requireActiveShift) {
          // Check if user has shift data stored
          if (!userData.shift || !userData.shift.shift_id) {
            console.log("ShiftGuard: No shift data in stored user")
            toast.error("لا يمكن الوصول لهذه الصفحة بدون جلسة وردية نشطة")

            // Clear invalid session
            localStorage.removeItem("currentUser")
            localStorage.removeItem("authToken")
            localStorage.removeItem("refreshToken")

            router.push("/login")
            return
          }

          // Verify shift is still active from backend
          try {
            const response = await fetch(`${API_BASE_URL}/shifts/cashier/${userData.user_id}`, {
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
                  localStorage.removeItem("currentUser")
                  localStorage.removeItem("authToken")
                  localStorage.removeItem("refreshToken")

                  router.push("/login")
                  return
                }

                console.log("ShiftGuard: Active shift verified:", activeShift)
              } else {
                console.log("ShiftGuard: No shift data in API response")
                toast.error("لا يمكن التحقق من حالة الوردية")
                router.push("/login")
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
        localStorage.removeItem("currentUser")
        localStorage.removeItem("authToken")
        localStorage.removeItem("refreshToken")

        router.push("/login")
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
