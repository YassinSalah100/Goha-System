"use client"

import { Button } from "@/components/ui/button"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, DollarSign, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CashierDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [cancelRequests, setCancelRequests] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
  })
  const [savedOrders, setSavedOrders] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)

      // Load cancel requests
      const storedRequests = JSON.parse(localStorage.getItem("cancelRequests") || "[]")
      setCancelRequests(storedRequests)

      // Load only real saved orders (filter out mock data)
      const loadRealOrders = () => {
        const allSaved = JSON.parse(localStorage.getItem("savedOrders") || "[]")

        // Filter out mock data completely
        const mockIds = ["0001", "0002", "0003", "1", "2", "3"]
        const realOrders = allSaved.filter((order: any) => {
          const isMockId = mockIds.includes(String(order.id))
          const isMockDate = order.date && order.date.includes("2023-06-12")
          const isMockCashier = order.cashier === "cashier"
          const isMockCustomer = order.customerName === "أحمد محمد" && order.total === 85.5

          return !isMockId && !isMockDate && !isMockCashier && !isMockCustomer
        })

        // Filter by current cashier if needed
        const filtered = realOrders.filter(
          (order: any) => order.cashier === user.name || order.cashier === user.username,
        )

        setSavedOrders(filtered)

        // Set recent orders (last 5, sorted by date)
        const recent = filtered
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
        setRecentOrders(recent)

        // Calculate stats from real orders only
        const total = filtered.reduce((sum: number, order: any) => sum + order.total, 0)
        setStats({
          totalOrders: filtered.length,
          totalSales: total,
          avgOrderValue: filtered.length ? total / filtered.length : 0,
          pendingOrders: filtered.filter((order: any) => order.status === "pending").length,
        })
      }

      loadRealOrders()

      // Listen for order updates
      const handleOrderUpdate = () => {
        loadRealOrders()
      }

      window.addEventListener("storage", handleOrderUpdate)
      window.addEventListener("orderAdded", handleOrderUpdate)

      return () => {
        window.removeEventListener("storage", handleOrderUpdate)
        window.removeEventListener("orderAdded", handleOrderUpdate)
      }
    }
  }, [])

  if (!currentUser) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Welcome, {currentUser.name}</h2>
          <p className="text-muted-foreground">Here's an overview of your {currentUser.shift} shift today</p>
        </div>
        <Button
          className="mt-4 md:mt-0 bg-orange-600 hover:bg-orange-700"
          onClick={() => router.push("/cashier/sales")}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">إجمالي الطلبات</CardTitle>
            <ShoppingCart className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1"></p>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">اجمالي المبيعات</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">ج.م{stats.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">من الطلبات الحقيقية</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Recent Orders Section - Updated to show real orders */}
        <section>
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-orange-600" /> Recent Orders
          </h3>
          <Card className="h-full">
            <CardContent className="pt-4">
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-orange-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-orange-100 p-2">
                          <ShoppingCart className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-xs text-gray-500">{order.customerName || "Walk-in Customer"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">ج.م{order.total.toFixed(2)}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {order.status === "completed" ? "مكتمل" : order.status === "pending" ? "معلق" : "ملغي"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد طلبات حديثة</p>
                    <p className="text-sm">ابدأ بإنشاء طلب جديد</p>
                  </div>
                )}
              </div>
              {recentOrders.length > 0 && (
                <Button
                  variant="link"
                  className="mt-4 w-full text-orange-600"
                  onClick={() => router.push("/cashier/orders")}
                >
                  View all orders
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Cancel Requests Section */}
        <section>
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" /> Cancel Requests
          </h3>
          <Card className="h-full">
            <CardContent className="pt-4">
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {cancelRequests.length > 0 ? (
                  cancelRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-red-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-red-100 p-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Order #{request.orderId}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {request.status === "approved"
                            ? "تمت الموافقة"
                            : request.status === "rejected"
                              ? "مرفوض"
                              : "في الانتظار"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">لا توجد طلبات إلغاء</p>
                )}
              </div>
              <Button
                variant="link"
                className="mt-4 w-full text-red-600"
                onClick={() => router.push("/cashier/cancel-requests")}
              >
                عرض جميع طلبات الإلغاء
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
