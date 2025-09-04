"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Clock, User, Calendar, CheckCircle, Loader2, RefreshCw, DollarSign, AlertCircle } from "lucide-react"
import { AuthApiService, SHIFT_STATUS, SHIFT_TYPES } from "@/lib/services/auth-api"

// Interfaces
interface CashierInfo {
  id: string
  name: string
  email?: string
  phone?: string
}

interface CloseRequestDetails {
  shift_id: string
  opened_by:
    | {
        id: string
        username: string
        fullName: string
        phone?: string
        hourRate?: string
      }
    | string // Can be either object or string for backward compatibility
  closed_by?:
    | {
        id: string
        username: string
        fullName: string
        phone?: string
        hourRate?: string
      }
    | string
    | null
  shift_type: string
  status: string
  start_time: string
  end_time: string
  initial_balance?: string
  intial_balance?: string // API has typo, handle both
  created_at: string
  is_closed: boolean
  is_close_requested: boolean
  cashier_info?: CashierInfo
}

export default function ShiftRequestsPage() {
  const [closeRequests, setCloseRequests] = useState<CloseRequestDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(true)

  const fetchCashierInfo = async (cashierId: string): Promise<CashierInfo | null> => {
    try {
      console.log(`🔍 Fetching cashier info for ID: ${cashierId}`)
      const result = await AuthApiService.apiRequest<any>(`/users/${cashierId}`)
      console.log(`📊 Cashier API response:`, result)

      // Safeguard against null or undefined result
      if (!result) {
        console.warn(`⚠️ No result data returned for cashier ${cashierId}`)
        return {
          id: cashierId,
          name: "غير محدد (بيانات غير متوفرة)",
        }
      }

      if (result && (result.id || result.user_id)) {
        const cashierInfo = {
          id: result.id || result.user_id,
          name: result.fullName || result.full_name || result.name || result.username || "غير محدد",
          email: result.email || "",
          phone: result.phone || "",
        }
        console.log(`✅ Cashier info processed:`, cashierInfo)
        return cashierInfo
      }
      
      // Fallback if data structure is unexpected
      return {
        id: cashierId,
        name: "غير محدد (تنسيق غير متوقع)",
      }
    } catch (err) {
      console.warn(`❌ Failed to fetch cashier info for ${cashierId}:`, err)
      // Return a safe fallback instead of null
      return {
        id: cashierId,
        name: "غير محدد (خطأ في جلب البيانات)",
      }
    }
  }

  const fetchShiftDetails = async (shiftId: string): Promise<any> => {
    try {
      console.log(`🔍 Fetching shift details for ID: ${shiftId}`)
      const result = await AuthApiService.apiRequest<any>(`/shifts/${shiftId}`)
      console.log(`📊 Shift details response:`, result)
      return result
    } catch (err) {
      console.warn(`❌ Failed to fetch shift details for ${shiftId}:`, err)
      return null
    }
  }

  // Fetch close requests
  const fetchCloseRequests = async () => {
    if (!isMounted) return // Prevent fetch if component unmounted

    setLoading(true)
    setError(null)
    try {
      console.log("🔍 Fetching shift close requests...")
      const result = await AuthApiService.apiRequest<any>("/shifts/close/requested")

      console.log("📊 Raw API result:", result)
      console.log("📊 Result type:", typeof result)
      console.log("📊 Is array:", Array.isArray(result))

      // Handle different response formats
      let requests: any[] = []
      if (Array.isArray(result)) {
        requests = result
        console.log("✅ Processing direct array response")
      } else if (result && typeof result === "object" && result.data) {
        requests = Array.isArray(result.data) ? result.data : []
        console.log("✅ Processing wrapped response")
      } else if (result && typeof result === "object") {
        requests = [result]
        console.log("✅ Processing single object response")
      } else {
        console.warn("❌ Unexpected response format:", result)
        setError("تنسيق استجابة غير متوقع من الخادم")
        return
      }

      // Filter for shifts that have close requests pending
      const closeRequestedShifts = requests.filter(
        (request) => request.is_close_requested === true && !request.is_closed,
      )

      console.log(
        `🔍 Found ${closeRequestedShifts.length} shifts with close requests out of ${requests.length} total shifts`,
      )

      // Process requests - handle both API formats (object vs string IDs)
      const processedRequests = await Promise.all(
        closeRequestedShifts.map(async (request) => {
          let cashierInfo: CashierInfo | null = null
          let shiftDetails: any = null

          // Try to get shift details first
          shiftDetails = await fetchShiftDetails(request.shift_id)

          if (typeof request.opened_by === "object" && request.opened_by) {
            // New format: cashier info included as object
            cashierInfo = {
              id: request.opened_by.id,
              name: request.opened_by.fullName || request.opened_by.username,
              email: "", // Not provided in this API
              phone: request.opened_by.phone || "",
            }
          } else if (typeof request.opened_by === "string") {
            // Old format: only ID provided, fetch details
            console.log(`🔍 Fetching cashier info for ID: ${request.opened_by}`)
            cashierInfo = await fetchCashierInfo(request.opened_by)
          }

          // Merge shift details if available
          const enhancedRequest = {
            ...request,
            cashier_info: cashierInfo,
            shift_details: shiftDetails,
          }

          console.log(`✅ Enhanced request for shift ${request.shift_id}:`, enhancedRequest)
          return enhancedRequest
        }),
      )

      console.log("✅ Close requests processed:", processedRequests.length, "requests")
      if (isMounted) {
        setCloseRequests(processedRequests)
      }
    } catch (err) {
      console.error("❌ Error fetching close requests:", err)
      if (isMounted) {
        setError(err instanceof Error ? err.message : "حدث خطأ في تحميل البيانات")
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }

  // Approve shift close
  const approveShiftClose = async (shiftId: string) => {
    setApproving(shiftId)
    try {
      console.log(`✅ Approving shift close for: ${shiftId}`)

      const currentUser = AuthApiService.getCurrentUser()
      const adminId = currentUser?.id || currentUser?.user_id

      if (!adminId) {
        throw new Error("لا يمكن العثور على معرف المدير. يرجى تسجيل الدخول مرة أخرى.")
      }

      // Use PATCH method as per backend route definition
      const result = await AuthApiService.apiRequest<any>(`/shifts/${shiftId}/approve-close`, {
        method: "PATCH",
        body: JSON.stringify({
          shift_id: shiftId,
          approved_by_admin_id: adminId,
        }),
      })

      console.log("📊 Approve response:", result)

      // Check for successful response (handle different formats)
      const isSuccess =
        !result?.error &&
        (result?.success === true ||
          result?.status === "success" ||
          result?.message?.includes("success") ||
          result?.message?.includes("approved") ||
          Object.keys(result || {}).length > 0) // Non-empty response usually means success

      if (isSuccess) {
        console.log("✅ Shift approved successfully")
        
        // 🆕 Dispatch event to notify cashier that shift was approved
        window.dispatchEvent(new CustomEvent('shiftApproved', { 
          detail: { shiftId, adminId } 
        }))
        
        // Remove from pending requests
        setCloseRequests((prev) => prev.filter((req) => req.shift_id !== shiftId))
        // Show success message
        alert("تم الموافقة على إغلاق الوردية بنجاح")
        // Refresh the list to get updated data
        await fetchCloseRequests()
      } else {
        console.warn("❌ Failed to approve shift:", result)
        const errorMessage = result?.message || result?.error || "فشل في الموافقة على إغلاق الوردية"
        alert(errorMessage)
      }
    } catch (err) {
      console.error("❌ Error approving shift:", err)
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ في الموافقة على الوردية"

      // Handle specific server errors
      if (errorMessage.includes("Internal server error")) {
        alert("خطأ في الخادم. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.")
      } else if (errorMessage.includes("500")) {
        alert("خطأ في الخادم (500). يرجى التحقق من صلاحيات المستخدم ومحاولة مرة أخرى.")
      } else if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
        alert("ليس لديك صلاحية للموافقة على إغلاق الورديات. يرجى التواصل مع المدير.")
      } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        alert("يرجى تسجيل الدخول مرة أخرى للمتابعة.")
      } else if (errorMessage.includes("Failed to fetch")) {
        alert("لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.")
      } else {
        alert(errorMessage)
      }
    } finally {
      setApproving(null)
    }
  }

  // Format time
  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return timeString
    }
  }

  // Calculate shift duration
  const calculateDuration = (startTime: string, endTime: string) => {
    try {
      const start = new Date(startTime)
      const end = new Date(endTime)
      const diffMs = end.getTime() - start.getTime()

      if (diffMs < 0) {
        return "غير محدد"
      }

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      if (diffHours === 0 && diffMinutes === 0) {
        return "أقل من دقيقة"
      } else if (diffHours === 0) {
        return `${diffMinutes} دقيقة`
      } else if (diffMinutes === 0) {
        return `${diffHours} ساعة`
      } else {
        return `${diffHours} ساعة و ${diffMinutes} دقيقة`
      }
    } catch {
      return "غير محدد"
    }
  }

  // Get shift type badge
  const getShiftTypeBadge = (type: string) => {
    switch (type) {
      case SHIFT_TYPES.MORNING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            صباحي
          </Badge>
        )
      case SHIFT_TYPES.NIGHT:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            مسائي
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case SHIFT_STATUS.OPENED:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            مفتوح
          </Badge>
        )
      case SHIFT_STATUS.CLOSED:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            مغلق
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  useEffect(() => {
    setIsMounted(true)
    fetchCloseRequests()

    const interval = setInterval(() => {
      if (isMounted) {
        fetchCloseRequests()
      }
    }, 60000) // Refresh every 60 seconds instead of 30

    return () => {
      setIsMounted(false)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    return () => {
      setIsMounted(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">جاري تحميل طلبات إنهاء الوردية...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">طلبات إنهاء الوردية</h1>
          <p className="text-muted-foreground">مراجعة وموافقة على طلبات إنهاء الورديات من الكاشيرين</p>
        </div>
        <Button onClick={fetchCloseRequests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      {closeRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد طلبات معلقة</h3>
            <p className="text-muted-foreground">جميع الورديات تعمل بشكل طبيعي</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {closeRequests.map((request) => (
            <Card key={request.shift_id} className="border-l-4 border-l-amber-400">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">طلب إنهاء وردية</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getShiftTypeBadge(request.shift_type)}
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => approveShiftClose(request.shift_id)}
                    disabled={approving === request.shift_id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approving === request.shift_id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        جاري الإغلاق...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        موافقة وإغلاق
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Cashier Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">الكاشير</p>
                      <p className="text-muted-foreground">
                        {request.cashier_info?.name ||
                          (typeof request.opened_by === "object"
                            ? request.opened_by.fullName || request.opened_by.username
                            : request.opened_by) ||
                          "غير محدد"}
                      </p>
                      {request.cashier_info?.email && (
                        <p className="text-xs text-muted-foreground">{request.cashier_info.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">مدة الوردية</p>
                      <p className="text-muted-foreground">{calculateDuration(request.start_time, request.end_time)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Time Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">وقت بداية الوردية</p>
                    <p className="font-medium">{formatTime(request.start_time)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">وقت نهاية الوردية</p>
                    <p className="font-medium">{formatTime(request.end_time)}</p>
                  </div>
                </div>

                <Separator />

                {/* Shift Details */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <DollarSign className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-sm text-muted-foreground">الرصيد الأولي</p>
                    <p className="text-lg font-bold text-blue-600">
                      {request.initial_balance || request.intial_balance || "0.00"} ر.س
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
                    <p className="text-sm text-muted-foreground">حالة الوردية</p>
                    <p className="text-lg font-bold text-green-600">{request.status}</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                    <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="text-lg font-bold text-purple-600">{formatTime(request.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
