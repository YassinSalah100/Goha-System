"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Users,
  AlertCircle,
  TrendingUp,
  Package
} from "lucide-react"
import { AuthApiService } from "@/lib/services/auth-api"
import { ShiftStatus, ShiftType } from "@/lib/types/monitoring"

// Interfaces
interface CloseRequestDetails {
  shift_id: string
  shift_type: ShiftType
  cashier: {
    worker_id: string
    full_name: string
    username?: string
  }
  start_time: string
  requested_close_time: string
  total_orders: number
  total_sales: number
  cash_sales: number
  card_sales: number
  orders_by_type: {
    "dine-in": number
    takeaway: number
    delivery: number
    cafe: number
  }
  workers_count: number
  total_expenses: number
  status: ShiftStatus
}

interface ShiftSummary {
  shift_id: string
  total_hours: number
  summary: string
}

export default function ShiftRequestsPage() {
  const [closeRequests, setCloseRequests] = useState<CloseRequestDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState<string | null>(null)

  // Fetch close requests
  const fetchCloseRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("🔍 Fetching shift close requests...")
      const result = await AuthApiService.apiRequest<any>('/shifts/close-requested')
      
      if (result.success && result.data) {
        const requests = Array.isArray(result.data.shifts) 
          ? result.data.shifts 
          : Array.isArray(result.data) 
            ? result.data 
            : []
        
        console.log("✅ Close requests fetched:", requests)
        setCloseRequests(requests)
      } else {
        console.warn("❌ Failed to fetch close requests:", result.message)
        setError(result.message || "فشل في تحميل طلبات إنهاء الوردية")
      }
    } catch (err) {
      console.error("❌ Error fetching close requests:", err)
      setError(err instanceof Error ? err.message : "حدث خطأ في تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  // Approve shift close
  const approveShiftClose = async (shiftId: string) => {
    setApproving(shiftId)
    try {
      console.log(`✅ Approving shift close for: ${shiftId}`)
      const result = await AuthApiService.apiRequest<any>(`/shifts/${shiftId}/approve-close`, {
        method: "PATCH",
        body: JSON.stringify({
          approved_by: "owner",
          close_reason: "موافق على إنهاء الوردية"
        })
      })
      
      if (result.success) {
        console.log("✅ Shift closed successfully")
        // Remove from pending requests
        setCloseRequests(prev => prev.filter(req => req.shift_id !== shiftId))
        // Show success message
        alert("تم إغلاق الوردية بنجاح")
      } else {
        throw new Error(result.message || "فشل في إغلاق الوردية")
      }
    } catch (err) {
      console.error("❌ Error closing shift:", err)
      alert(err instanceof Error ? err.message : "حدث خطأ في إغلاق الوردية")
    } finally {
      setApproving(null)
    }
  }

  // Format time
  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timeString
    }
  }

  // Calculate shift duration
  const calculateDuration = (startTime: string, requestedCloseTime: string) => {
    try {
      const start = new Date(startTime)
      const end = new Date(requestedCloseTime)
      const diffMs = end.getTime() - start.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${diffHours} ساعة و ${diffMinutes} دقيقة`
    } catch {
      return "غير محدد"
    }
  }

  // Get shift type badge
  const getShiftTypeBadge = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">صباحي</Badge>
      case ShiftType.NIGHT:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">مسائي</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  useEffect(() => {
    fetchCloseRequests()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCloseRequests, 30000)
    return () => clearInterval(interval)
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
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                        <Badge variant="secondary">معلق</Badge>
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
                      <p className="font-medium">اسم الكاشير</p>
                      <p className="text-muted-foreground">{request.cashier.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">مدة الوردية</p>
                      <p className="text-muted-foreground">
                        {calculateDuration(request.start_time, request.requested_close_time)}
                      </p>
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
                    <p className="font-medium text-sm text-muted-foreground mb-1">وقت طلب الإنهاء</p>
                    <p className="font-medium">{formatTime(request.requested_close_time)}</p>
                  </div>
                </div>

                <Separator />

                {/* Financial Summary */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-2" />
                    <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                    <p className="text-lg font-bold text-green-600">{request.total_sales.toFixed(2)} ر.س</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <ShoppingCart className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-sm text-muted-foreground">عدد الطلبات</p>
                    <p className="text-lg font-bold text-blue-600">{request.total_orders}</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Users className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                    <p className="text-sm text-muted-foreground">عدد العمال</p>
                    <p className="text-lg font-bold text-purple-600">{request.workers_count}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 mx-auto text-red-600 mb-2" />
                    <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                    <p className="text-lg font-bold text-red-600">{request.total_expenses.toFixed(2)} ر.س</p>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">المبيعات النقدية</p>
                    <p className="text-lg font-semibold">{request.cash_sales.toFixed(2)} ر.س</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">مبيعات البطاقة</p>
                    <p className="text-lg font-semibold">{request.card_sales.toFixed(2)} ر.س</p>
                  </div>
                </div>

                {/* Order Types */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <Package className="h-4 w-4 mx-auto text-yellow-600 mb-1" />
                    <p className="text-xs text-muted-foreground">داخل المطعم</p>
                    <p className="font-semibold">{request.orders_by_type["dine-in"]}</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <Package className="h-4 w-4 mx-auto text-green-600 mb-1" />
                    <p className="text-xs text-muted-foreground">تيك أواي</p>
                    <p className="font-semibold">{request.orders_by_type.takeaway}</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <Package className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                    <p className="text-xs text-muted-foreground">توصيل</p>
                    <p className="font-semibold">{request.orders_by_type.delivery}</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <Package className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                    <p className="text-xs text-muted-foreground">كافية</p>
                    <p className="font-semibold">{request.orders_by_type.cafe}</p>
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
