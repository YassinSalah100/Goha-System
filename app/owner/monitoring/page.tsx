"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { User, Package } from "lucide-react"
import { orders } from "@/mock-data/orders"
import { inventory } from "@/mock-data/inventory"
import { workers } from "@/mock-data/workers"
import { motion } from "framer-motion"

export default function MonitoringPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("live")
  const [liveOrders, setLiveOrders] = useState<any[]>([])
  const [canceledOrders, setCanceledOrders] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
    }

    // Simulate live orders
    const today = new Date().toDateString()
    const todayOrders = orders.filter((order) => new Date(order.date).toDateString() === today)
    setLiveOrders(todayOrders)

    // Simulate canceled orders
    setCanceledOrders(
      orders
        .filter((order) => order.status === "canceled")
        .map((order) => ({
          ...order,
          cancelReason: "Customer changed their mind",
          cancelRequestedBy: "Ahmed Cashier",
          cancelApprovedBy: "Mohamed Admin",
        })),
    )

    // Simulate live updates
    const interval = setInterval(() => {
      setLiveOrders((current) => {
        // Randomly update an order status
        if (current.length > 0) {
          const randomIndex = Math.floor(Math.random() * current.length)
          const updatedOrders = [...current]

          if (updatedOrders[randomIndex].status === "pending") {
            updatedOrders[randomIndex] = {
              ...updatedOrders[randomIndex],
              status: "completed",
            }
          }

          return updatedOrders
        }
        return current
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const lowStockItems = inventory.filter((item) => item.quantity <= item.minQuantity)
  const activeWorkers = workers.filter((worker) => worker.attendance.length > 0)

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">المراقبة المباشرة</h2>
        <p className="text-muted-foreground">Monitor real-time activities and operations</p>
      </div>

      <Tabs defaultValue="live" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="live">المراقبة المباشرة</TabsTrigger>
          <TabsTrigger value="canceled">الطلبات الملغاة</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="m-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">الطلبات اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveOrders.length}</div>
                <p className="text-xs text-muted-foreground">
                  {liveOrders.filter((order) => order.status === "completed").length} مكتملة,{" "}
                  {liveOrders.filter((order) => order.status === "pending").length} قيد التنفيذ
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المبيعات اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${liveOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  متوسط الطلب: $
                  {liveOrders.length > 0
                    ? (liveOrders.reduce((sum, order) => sum + order.total, 0) / liveOrders.length).toFixed(2)
                    : "0.00"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">العاملين النشطين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeWorkers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {workers.filter((worker) => worker.position === "Cashier").length} كاشير,{" "}
                  {workers.filter((worker) => worker.position === "Chef").length} طباخ
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">عناصر المخزون المنخفضة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockItems.length}</div>
                <p className="text-xs text-muted-foreground">
                  {lowStockItems.length > 0 ? "تحتاج إلى اهتمام" : "المخزون بحالة جيدة"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>الطلبات الحالية</CardTitle>
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
                          لا توجد طلبات اليوم
                        </td>
                      </tr>
                    ) : (
                      liveOrders.map((order) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="p-4 align-middle">#{order.id}</td>
                          <td className="p-4 align-middle">
                            {new Date(order.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-4 align-middle">{order.customerName}</td>
                          <td className="p-4 align-middle text-center">{order.cashier}</td>
                          <td className="p-4 align-middle text-center capitalize">{order.orderType}</td>
                          <td className="p-4 align-middle text-center">
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : order.status === "pending"
                                    ? "outline"
                                    : "destructive"
                              }
                              className={
                                order.status === "completed"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : order.status === "pending"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    : "bg-red-100 text-red-800 hover:bg-red-100"
                              }
                            >
                              {order.status === "completed"
                                ? "مكتمل"
                                : order.status === "pending"
                                  ? "قيد التنفيذ"
                                  : "ملغي"}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-right font-medium">${order.total.toFixed(2)}</td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الكاشير النشطين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workers
                    .filter((worker) => worker.position === "Cashier")
                    .map((worker) => (
                      <div key={worker.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">{worker.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {worker.attendance.length > 0 ? "نشط منذ " + worker.attendance[0].checkIn : "غير نشط"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            نشط
                          </Badge>
                          <span className="text-sm">
                            {liveOrders.filter((order) => order.cashier === worker.username).length} طلبات
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>عناصر المخزون المنخفضة</CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">لا توجد عناصر منخفضة المخزون</div>
                ) : (
                  <div className="space-y-4">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.category} • آخر تحديث: {new Date(item.lastUpdated).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity} / {item.minQuantity} {item.unit}
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
          </div>
        </TabsContent>

        <TabsContent value="canceled" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الطلبات الملغاة</CardTitle>
            </CardHeader>
            <CardContent>
              {canceledOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">لا توجد طلبات ملغاة</div>
              ) : (
                <div className="space-y-6">
                  {canceledOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">
                              طلب #{order.id} - {order.customerName}
                            </h3>
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              ملغي
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.date).toLocaleString()} • {order.orderType}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.total.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} عناصر • {order.paymentMethod}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-md mb-3">
                        <p className="text-sm font-medium mb-1">سبب الإلغاء:</p>
                        <p className="text-sm">{order.cancelReason}</p>
                      </div>

                      <Separator className="my-3" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">طلب الإلغاء بواسطة:</p>
                          <p className="font-medium">{order.cancelRequestedBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">تمت الموافقة بواسطة:</p>
                          <p className="font-medium">{order.cancelApprovedBy}</p>
                        </div>
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
              <CardTitle>حالة المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle font-medium">العنصر</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">الفئة</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">الكمية</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">الحد الأدنى</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">الحالة</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">آخر تحديث</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const isLow = item.quantity <= item.minQuantity
                      const isOut = item.quantity === 0

                      return (
                        <tr key={item.id} className="border-t hover:bg-muted/50">
                          <td className="p-4 align-middle">{item.name}</td>
                          <td className="p-4 align-middle">{item.category}</td>
                          <td className="p-4 align-middle text-center">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-4 align-middle text-center">
                            {item.minQuantity} {item.unit}
                          </td>
                          <td className="p-4 align-middle text-center">
                            <Badge
                              variant={isOut ? "destructive" : isLow ? "outline" : "default"}
                              className={
                                isOut
                                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                                  : isLow
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    : "bg-green-100 text-green-800 hover:bg-green-100"
                              }
                            >
                              {isOut ? "نفذ" : isLow ? "منخفض" : "متوفر"}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-right">
                            {new Date(item.lastUpdated).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
