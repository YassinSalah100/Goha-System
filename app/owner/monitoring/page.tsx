"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { User, Package, RefreshCw, Eye, DollarSign, Users, AlertTriangle, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

interface OrderItem {
  order_item_id: string
  quantity: number
  unit_price: string | number
  notes?: string
  product_size?: {
    product_name: string
    size_name: string
    price: string | number
  }
  extras?: Array<{
    name?: string
    price?: string | number
  }>
}

interface Order {
  order_id: string
  customer_name: string
  order_type: "dine-in" | "takeaway" | "delivery"
  phone_number?: string
  total_price: string | number
  status: "pending" | "active" | "completed" | "cancelled"
  payment_method: "cash" | "card"
  created_at: string
  updated_at?: string
  cashier?: {
    user_id: string
    full_name: string
    fullName?: string
  }
  shift?: {
    shift_id: string
    shift_name?: string
  }
  items?: OrderItem[]
  cashier_name?: string
  user?: {
    full_name?: string
    name?: string
    username?: string
    user_id?: string
    id?: string
  }
  created_by?: string
  employee_name?: string
  staff_name?: string
}

interface CancelledOrder {
  cancelled_order_id: string
  original_order_id: string
  cancellation_reason: string
  cancelled_by: string
  cancelled_at: string
  order?: Order
}

interface CashierActivity {
  cashierName: string
  cashierId: string
  ordersToday: number
  totalSales: number
  lastOrderTime: string
  isActive: boolean
  orderTypes: {
    "dine-in": number
    takeaway: number
    delivery: number
  }
}

interface StockItem {
  stock_item_id: string
  name: string
  quantity: number
  min_quantity: number
  unit: string
  type: string
  last_updated: string
}

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByType: {
    "dine-in": number
    takeaway: number
    delivery: number
  }
  ordersByStatus: {
    pending: number
    completed: number
    cancelled: number
  }
  ordersByPayment: {
    cash: number
    card: number
  }
}

export default function MonitoringPageAPIFixed() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("live")
  const [liveOrders, setLiveOrders] = useState<Order[]>([])
  const [cancelledOrders, setCancelledOrders] = useState<CancelledOrder[]>([])
  const [cashierActivities, setCashierActivities] = useState<CashierActivity[]>([])
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [todayStats, setTodayStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    completedOrders: 0,
    pendingOrders: 0,
    activeCashiers: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizePrice = (price: string | number): number => {
    if (typeof price === "string") {
      return Number.parseFloat(price) || 0
    }
    return Number(price) || 0
  }

  const formatPrice = (price: string | number): string => {
    return `ج.م${normalizePrice(price).toFixed(2)}`
  }

  // Fetch orders from API
  const fetchOrders = async (): Promise<Order[]> => {
    try {
      console.log("🔍 Fetching orders from API...")

      // Get today's date range
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

      // Try to get orders by date range first
      let orders: Order[] = []

      try {
        const dateRangeResponse = await fetch(
          `${API_BASE_URL}/orders/date-range?startDate=${startDate}&endDate=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            },
          },
        )

        if (dateRangeResponse.ok) {
          const result = await dateRangeResponse.json()
          if (result.success && result.data) {
            orders = Array.isArray(result.data.orders) ? result.data.orders : result.data
            console.log(`✅ Found ${orders.length} orders from date range`)
          }
        }
      } catch (error) {
        console.warn("⚠️ Date range endpoint failed, trying general orders endpoint")
      }

      // Fallback to general orders endpoint if date range fails
      if (orders.length === 0) {
        const generalResponse = await fetch(`${API_BASE_URL}/orders?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
        })

        if (generalResponse.ok) {
          const result = await generalResponse.json()
          if (result.success && result.data) {
            const allOrders = Array.isArray(result.data.orders) ? result.data.orders : result.data

            // Filter for today's orders manually
            orders = allOrders.filter((order: Order) => {
              const orderDate = new Date(order.created_at)
              return orderDate >= new Date(startDate) && orderDate < new Date(endDate)
            })
            console.log(`✅ Found ${orders.length} orders from general endpoint (filtered for today)`)
          }
        }
      }

      return orders
    } catch (error) {
      console.error("❌ Error fetching orders:", error)
      return []
    }
  }

  // Fetch order statistics
  const fetchOrderStats = async (): Promise<OrderStats | null> => {
    try {
      console.log("📊 Fetching order statistics...")
      const response = await fetch(`${API_BASE_URL}/orders/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          console.log("✅ Order stats retrieved:", result.data)

          // Ensure all required properties exist with defaults
          const stats: OrderStats = {
            totalOrders: result.data.totalOrders || 0,
            totalRevenue: result.data.totalRevenue || 0,
            averageOrderValue: result.data.averageOrderValue || 0,
            ordersByType: {
              "dine-in": result.data.ordersByType?.["dine-in"] || 0,
              takeaway: result.data.ordersByType?.takeaway || 0,
              delivery: result.data.ordersByType?.delivery || 0,
            },
            ordersByStatus: {
              pending: result.data.ordersByStatus?.pending || 0,
              completed: result.data.ordersByStatus?.completed || 0,
              cancelled: result.data.ordersByStatus?.cancelled || 0,
            },
            ordersByPayment: {
              cash: result.data.ordersByPayment?.cash || 0,
              card: result.data.ordersByPayment?.card || 0,
            },
          }

          return stats
        }
      }
    } catch (error) {
      console.error("❌ Error fetching order stats:", error)
    }
    return null
  }

  // Fetch cancelled orders
  const fetchCancelledOrders = async (): Promise<CancelledOrder[]> => {
    try {
      console.log("🚫 Fetching cancelled orders...")
      const response = await fetch(`${API_BASE_URL}/cancelled-orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          let cancelled = []

          // Handle different possible response structures
          if (Array.isArray(result.data.cancelledOrders)) {
            cancelled = result.data.cancelledOrders
          } else if (Array.isArray(result.data)) {
            cancelled = result.data
          } else if (result.data.cancelledOrders) {
            // If it's a single object, wrap it in an array
            cancelled = [result.data.cancelledOrders]
          } else if (result.data) {
            // If result.data is a single object, wrap it in an array
            cancelled = [result.data]
          }

          console.log(`✅ Found ${cancelled.length} cancelled orders`)
          return Array.isArray(cancelled) ? cancelled : []
        }
      }
    } catch (error) {
      console.error("❌ Error fetching cancelled orders:", error)
    }
    return []
  }

  // Fetch low stock items
  const fetchLowStockItems = async (): Promise<StockItem[]> => {
    try {
      console.log("📦 Fetching low stock items...")
      const response = await fetch(`${API_BASE_URL}/stock-items/low-stock`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const lowStock = Array.isArray(result.data.stockItems) ? result.data.stockItems : result.data
          console.log(`✅ Found ${lowStock.length} low stock items`)
          return lowStock
        }
      }
    } catch (error) {
      console.error("❌ Error fetching low stock items:", error)
    }
    return []
  }

  // Calculate cashier activities from orders
  const calculateCashierActivities = (orders: Order[]): CashierActivity[] => {
    const cashierMap = new Map<string, CashierActivity>()

    orders.forEach((order) => {
      // Enhanced cashier name extraction with multiple fallback strategies
      let cashierName = "مستخدم غير معروف"
      let cashierId = "unknown"

      // Strategy 1: Check order.cashier object
      if (order.cashier) {
        cashierName = order.cashier.full_name || order.cashier.fullName || cashierName
        cashierId = order.cashier.user_id || cashierId
      }

      // Strategy 2: Check direct cashier_name field
      if (!cashierName || cashierName === "مستخدم غير معروف") {
        if (order.cashier_name) {
          cashierName = order.cashier_name
          // Generate a consistent ID from the name if no ID is available
          cashierId = `cashier_${order.cashier_name.replace(/\s+/g, "_").toLowerCase()}`
        }
      }

      // Strategy 3: Check if there's a nested user object
      if (order.user) {
        cashierName = order.user.full_name || order.user.name || order.user.username || cashierName
        cashierId = order.user.user_id || order.user.id || cashierId
      }

      // Strategy 4: Check for any other possible cashier fields
      if (!cashierName || cashierName === "مستخدم غير معروف") {
        cashierName = order.created_by || order.employee_name || order.staff_name || cashierName
        if (cashierName !== "مستخدم غير معروف") {
          cashierId = `cashier_${cashierName.replace(/\s+/g, "_").toLowerCase()}`
        }
      }

      // Final fallback: if we have a name but no ID, generate one from the name
      if (cashierName !== "مستخدم غير معروف" && cashierId === "unknown") {
        cashierId = `cashier_${cashierName.replace(/\s+/g, "_").toLowerCase()}`
      }

      console.log(`🔍 Order ${order.order_id}: Cashier = ${cashierName} (ID: ${cashierId})`)

      if (!cashierMap.has(cashierId)) {
        cashierMap.set(cashierId, {
          cashierName,
          cashierId,
          ordersToday: 0,
          totalSales: 0,
          lastOrderTime: order.created_at,
          isActive: true,
          orderTypes: {
            "dine-in": 0,
            takeaway: 0,
            delivery: 0,
          },
        })
      }

      const activity = cashierMap.get(cashierId)!
      activity.ordersToday += 1
      activity.totalSales += normalizePrice(order.total_price)
      activity.orderTypes[order.order_type] += 1

      // Update last order time if this order is more recent
      if (new Date(order.created_at) > new Date(activity.lastOrderTime)) {
        activity.lastOrderTime = order.created_at
      }
    })

    const activities = Array.from(cashierMap.values()).sort((a, b) => b.ordersToday - a.ordersToday)
    console.log(
      `👥 Found ${activities.length} cashiers:`,
      activities.map((a) => `${a.cashierName} (${a.cashierId})`),
    )

    return activities
  }

  // Main data loading function
  const loadAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🚀 Loading all monitoring data from API...")

      // Fetch all data in parallel
      const [orders, stats, cancelled, lowStock] = await Promise.all([
        fetchOrders(),
        fetchOrderStats(),
        fetchCancelledOrders(),
        fetchLowStockItems(),
      ])

      // Set orders
      setLiveOrders(orders)

      // Set order statistics
      setOrderStats(stats)

      // Set cancelled orders with safety check
      const safeCancelledOrders = Array.isArray(cancelled) ? cancelled : []
      setCancelledOrders(safeCancelledOrders)

      // Set low stock items
      setLowStockItems(lowStock)

      // Calculate cashier activities
      const activities = calculateCashierActivities(orders)
      setCashierActivities(activities)

      // Calculate today's stats
      const totalSales = orders.reduce((sum, order) => sum + normalizePrice(order.total_price), 0)
      const completedOrders = orders.filter((order) => order.status === "completed").length
      const pendingOrders = orders.filter((order) => order.status === "pending").length

      setTodayStats({
        totalOrders: orders.length,
        totalSales,
        completedOrders,
        pendingOrders,
        activeCashiers: activities.length,
      })

      console.log("✅ All monitoring data loaded successfully")
    } catch (error: any) {
      console.error("❌ Error loading monitoring data:", error)
      setError(error.message || "فشل في تحميل بيانات المراقبة")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
    }

    // Load initial data
    loadAllData()

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAllData()
    }, 30000)

    // Listen for order updates
    const handleOrderAdded = () => {
      console.log("📢 Order added event received in monitoring")
      setTimeout(() => {
        loadAllData()
      }, 2000)
    }

    window.addEventListener("orderAdded", handleOrderAdded)

    return () => {
      clearInterval(interval)
      window.removeEventListener("orderAdded", handleOrderAdded)
    }
  }, [])

  const getOrderTypeBadge = (type: string) => {
    switch (type) {
      case "dine-in":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            تناول في المطعم
          </Badge>
        )
      case "takeaway":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            تيك اواي
          </Badge>
        )
      case "delivery":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            توصيل
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">مكتمل</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            قيد التنفيذ
          </Badge>
        )
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            نشط
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
            ملغي
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">المراقبة المباشرة</h2>
          <p className="text-muted-foreground">مراقبة الأنشطة والعمليات في الوقت الفعلي من API</p>
        </div>
        <Button onClick={loadAllData} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "جاري التحديث..." : "تحديث"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">خطأ في تحميل البيانات</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="live" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="live">المراقبة المباشرة</TabsTrigger>
          <TabsTrigger value="cashiers">نشاط الكاشيرز</TabsTrigger>
          <TabsTrigger value="cancelled">الطلبات الملغاة</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="m-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  الطلبات اليوم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {todayStats.completedOrders} مكتملة, {todayStats.pendingOrders} قيد التنفيذ
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  إجمالي المبيعات اليوم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(todayStats.totalSales)}</div>
                <p className="text-xs text-muted-foreground">من {todayStats.totalOrders} طلب</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  الكاشيرز النشطين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.activeCashiers}</div>
                <p className="text-xs text-muted-foreground">
                  {cashierActivities.filter((c) => c.ordersToday > 0).length} يعملون اليوم
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  تنبيهات المخزون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
                <p className="text-xs text-muted-foreground">
                  {lowStockItems.length > 0 ? "عناصر تحتاج اهتمام" : "المخزون بحالة جيدة"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Statistics Card */}
          {orderStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  إحصائيات الطلبات العامة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div key="total-orders-stat" className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{orderStats.totalOrders || 0}</div>
                    <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  </div>
                  <div key="total-revenue-stat" className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatPrice(orderStats.totalRevenue || 0)}</div>
                    <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                  </div>
                  <div key="avg-order-value-stat" className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPrice(orderStats.averageOrderValue || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">متوسط قيمة الطلب</p>
                  </div>
                  <div key="completed-orders-stat" className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {orderStats.ordersByStatus?.completed || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">طلبات مكتملة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                الطلبات اليوم ({liveOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle font-medium">رقم الطلب</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">الوقت</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">العميل</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">الكاشير</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">نوع الطلب</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">الحالة</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          {loading ? "جاري تحميل الطلبات..." : "لا توجد طلبات اليوم"}
                        </td>
                      </tr>
                    ) : (
                      liveOrders
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((order) => (
                          <motion.tr
                            key={order.order_id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="p-4 align-middle font-mono">#{order.order_id.slice(-6)}</td>
                            <td className="p-4 align-middle">
                              {new Date(order.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-4 align-middle">{order.customer_name}</td>
                            <td className="p-4 align-middle text-center">
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                {(() => {
                                  // Enhanced cashier name extraction for display
                                  let displayName = "غير محدد"

                                  if (order.cashier?.full_name) {
                                    displayName = order.cashier.full_name
                                  } else if (order.cashier?.fullName) {
                                    displayName = order.cashier.fullName
                                  } else if (order.cashier_name) {
                                    displayName = order.cashier_name
                                  } else if (order.user?.full_name) {
                                    displayName = order.user.full_name
                                  } else if (order.user?.name) {
                                    displayName = order.user.name
                                  } else if (order.user?.username) {
                                    displayName = order.user.username
                                  } else if (order.created_by) {
                                    displayName = order.created_by
                                  } else if (order.employee_name) {
                                    displayName = order.employee_name
                                  } else if (order.staff_name) {
                                    displayName = order.staff_name
                                  }

                                  return displayName
                                })()}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle text-center">{getOrderTypeBadge(order.order_type)}</td>
                            <td className="p-4 align-middle text-center">{getStatusBadge(order.status)}</td>
                            <td className="p-4 align-middle text-right font-medium">
                              {formatPrice(order.total_price)}
                            </td>
                          </motion.tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashiers" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>نشاط الكاشيرز اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              {cashierActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {loading ? "جاري تحميل بيانات الكاشيرز..." : "لا يوجد نشاط للكاشيرز اليوم"}
                </div>
              ) : (
                <div className="space-y-4">
                  {cashierActivities.map((activity, index) => (
                    <motion.div
                      key={activity.cashierId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">{activity.cashierName}</h3>
                            <p className="text-sm text-muted-foreground">
                              آخر طلب:{" "}
                              {new Date(activity.lastOrderTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{formatPrice(activity.totalSales)}</div>
                          <p className="text-sm text-muted-foreground">{activity.ordersToday} طلب</p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div key="dine-in">
                          <div className="text-lg font-semibold text-blue-600">{activity.orderTypes["dine-in"]}</div>
                          <p className="text-xs text-muted-foreground">تناول في المطعم</p>
                        </div>
                        <div key="takeaway">
                          <div className="text-lg font-semibold text-green-600">{activity.orderTypes.takeaway}</div>
                          <p className="text-xs text-muted-foreground">تيك اواي</p>
                        </div>
                        <div key="delivery">
                          <div className="text-lg font-semibold text-purple-600">{activity.orderTypes.delivery}</div>
                          <p className="text-xs text-muted-foreground">توصيل</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelled" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الطلبات الملغاة</CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(cancelledOrders) || cancelledOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{loading ? "جاري تحميل الطلبات الملغاة..." : "لا توجد طلبات ملغاة"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cancelledOrders.map((cancelledOrder) => (
                    <div
                      key={cancelledOrder.cancelled_order_id}
                      className="border rounded-lg p-4 bg-red-50 border-red-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">طلب #{cancelledOrder.original_order_id}</h3>
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              ملغي
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            تم الإلغاء: {new Date(cancelledOrder.cancelled_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-md mb-3">
                        <p className="text-sm font-medium mb-1">سبب الإلغاء:</p>
                        <p className="text-sm">{cancelledOrder.cancellation_reason}</p>
                      </div>

                      <Separator className="my-3" />

                      <div className="text-sm">
                        <p className="text-muted-foreground">تم الإلغاء بواسطة:</p>
                        <p className="font-medium">{cancelledOrder.cancelled_by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>عناصر المخزون المنخفضة</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{loading ? "جاري تحميل بيانات المخزون..." : "لا توجد عناصر منخفضة المخزون"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockItems.map((item) => (
                    <div key={item.stock_item_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.type} • آخر تحديث: {new Date(item.last_updated).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity} / {item.min_quantity} {item.unit}
                        </p>
                        <p className="text-xs text-red-600">
                          {item.quantity === 0 ? "نفذ من المخزون" : "منخفض المخزون"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
