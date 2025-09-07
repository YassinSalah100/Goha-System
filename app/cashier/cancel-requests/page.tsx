"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Loader2 } from "lucide-react"
import { AuthApiService } from "@/lib/services/auth-api"
import { motion } from "framer-motion"
import { API_CONFIG } from "@/lib/config"

interface CancelRequest {
  cancelled_order_id: string
  order: {
    order_id: string
    customer_name: string
    order_type: string
    total_price: number
    created_at: string
    items: any[]
    cashier?: {
      fullName: string
    }
  }
  cancelled_by: {
    fullName: string
  }
  shift: {
    shift_id: string
    shift_type: string
  }
  reason: string
  cancelled_at: string
  status?: "pending" | "approved" | "rejected"
}

export default function CashierCancelRequestsPage() {
  const [requests, setRequests] = useState<CancelRequest[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
      if (user?.user_id || user?.worker_id) {
        fetchCancelRequests(user)
      }
    }
  }, [])

  const fetchCancelRequests = async (user: any) => {
    try {
      setLoading(true)
      setError(null)
      
      const userId = user?.user_id || user?.worker_id
      console.log(`🔍 Fetching cancel requests for user: ${userId}`)
      
      // Add pagination parameters to satisfy validator requirements
      const result = await AuthApiService.apiRequest<any>(`/cancelled-orders/user/${userId}?page=1&limit=100`)
      
      if (result.success && result.data) {
        const cancelRequests = result.data.cancelled_orders || []
        console.log(`✅ Found ${cancelRequests.length} cancel requests`)
        setRequests(cancelRequests)
      } else {
        setRequests([])
      }
    } catch (error: any) {
      console.error("❌ Error fetching cancel requests:", error)
      setError("فشل في تحميل طلبات الإلغاء")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (currentUser) {
      fetchCancelRequests(currentUser)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "pending":
      default:
        return <Clock className="h-5 w-5 text-orange-600" />
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case "approved":
        return "تمت الموافقة"
      case "rejected":
        return "مرفوض"
      case "pending":
      default:
        return "في الانتظار"
    }
  }

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "pending":
      default:
        return "secondary"
    }
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} ج.م`
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">طلبات الإلغاء</h2>
          <p className="text-muted-foreground">عرض وتتبع طلبات إلغاء الطلبات التي قمت بإرسالها</p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>طلبات الإلغاء ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>جاري تحميل طلبات الإلغاء...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                إعادة المحاولة
              </Button>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات إلغاء</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <motion.div
                  key={request.cancelled_order_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-lg p-4 ${
                    request.status === "approved"
                      ? "bg-green-50 border-green-200"
                      : request.status === "rejected"
                        ? "bg-red-50 border-red-200"
                        : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">
                          طلب إلغاء #{request.cancelled_order_id.slice(-6)} - طلب #{request.order.order_id.slice(-6)}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(request.status)}>{getStatusText(request.status)}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-2">
                        <span>العميل: {request.order.customer_name}</span>
                        <span>النوع: {request.order.order_type === "dine-in" ? "تناول في المطعم" : request.order.order_type === "takeaway" ? "تيك اواي" : "توصيل"}</span>
                        <span>المجموع: {formatPrice(request.order.total_price)}</span>
                        <span>التاريخ: {new Date(request.cancelled_at).toLocaleDateString()}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <p className="text-sm font-medium mb-1">سبب الإلغاء:</p>
                        <p className="text-sm">{request.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="text-sm font-medium">{getStatusText(request.status)}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h4 className="font-medium mb-2">تفاصيل الطلب:</h4>
                    <div className="bg-white rounded-lg border p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">رقم الطلب:</span>
                          <div>#{request.order.order_id.slice(-6)}</div>
                        </div>
                        <div>
                          <span className="font-medium">العميل:</span>
                          <div>{request.order.customer_name}</div>
                        </div>
                        <div>
                          <span className="font-medium">النوع:</span>
                          <div>{request.order.order_type === "dine-in" ? "تناول في المطعم" : request.order.order_type === "takeaway" ? "تيك اواي" : "توصيل"}</div>
                        </div>
                        <div>
                          <span className="font-medium">الكاشير:</span>
                          <div>{request.order.cashier?.fullName || "غير محدد"}</div>
                        </div>
                      </div>
                      
                      {request.order.items && request.order.items.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">عناصر الطلب:</h5>
                          <div className="space-y-2">
                            {request.order.items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                <span>{item.product_name || item.name || "منتج غير محدد"}</span>
                                <div className="flex items-center gap-2">
                                  <span>الكمية: {item.quantity}</span>
                                  <span className="font-medium">{formatPrice(item.unit_price * item.quantity)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t font-bold">
                            <span>الإجمالي:</span>
                            <span className="text-lg text-green-600">{formatPrice(request.order.total_price)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إحصائيات طلبات الإلغاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {requests.filter((r) => !r.status || r.status === "pending").length}
              </div>
              <div className="text-sm text-blue-600">في الانتظار</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {requests.filter((r) => r.status === "approved").length}
              </div>
              <div className="text-sm text-green-600">تمت الموافقة</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {requests.filter((r) => r.status === "rejected").length}
              </div>
              <div className="text-sm text-red-600">مرفوض</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
