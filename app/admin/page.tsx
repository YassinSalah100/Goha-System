"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Package, Users, DollarSign, Calendar, ChevronRight } from "lucide-react"
import { orders } from "@/mock-data/orders"
import { inventory } from "@/mock-data/inventory"
import { workers } from "@/mock-data/workers"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function AdminDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState({
    pendingCancelRequests: 0,
    pendingShiftRequests: 0,
    lowStockItems: 0,
    activeWorkers: 0,
    todaySales: 0,
  })
  const [cancelRequestsCount, setCancelRequestsCount] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)

      // Calculate stats
      const today = new Date().toDateString()
      const todayOrders = orders.filter((order) => new Date(order.date).toDateString() === today)
      const lowStockItems = inventory.filter((item) => item.quantity <= item.minQuantity).length
      const activeWorkers = workers.filter((worker) =>
        worker.attendance.some((a) => a.date === today.split("T")[0]),
      ).length
      const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0)

      // Get cancel requests from localStorage
      const cancelRequests = JSON.parse(localStorage.getItem("cancelRequests") || "[]")
      const pendingCancelRequests = cancelRequests.filter((req: any) => req.status === "pending").length
      setCancelRequestsCount(pendingCancelRequests)

      setStats({
        pendingCancelRequests,
        pendingShiftRequests: Math.floor(Math.random() * 3), // Mock data
        lowStockItems,
        activeWorkers,
        todaySales,
      })
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {currentUser.name}</p>
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات الإلغاء</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cancelRequestsCount}</div>
              <p className="text-xs text-muted-foreground">طلبات بحاجة للموافقة</p>
              {cancelRequestsCount > 0 && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-orange-600"
                  onClick={() => router.push("/admin/cancel-requests")}
                >
                  عرض الطلبات <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shift Requests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingShiftRequests}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
              {stats.pendingShiftRequests > 0 && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-orange-600"
                  onClick={() => router.push("/admin/shift-approvals")}
                >
                  View requests <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Items need attention</p>
              {stats.lowStockItems > 0 && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-orange-600"
                  onClick={() => router.push("/admin/inventory")}
                >
                  View inventory <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 md:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => router.push("/admin/daily-report")}
              >
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Create Daily Report</div>
                    <div className="text-xs text-muted-foreground">Record today's financial summary</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => router.push("/admin/workers")}
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Manage Workers</div>
                    <div className="text-xs text-muted-foreground">Record attendance and calculate wages</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => router.push("/admin/inventory")}
              >
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-3 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Update Inventory</div>
                    <div className="text-xs text-muted-foreground">Add or adjust stock levels</div>
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto py-4">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-3 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">View Reports</div>
                    <div className="text-xs text-muted-foreground">Access financial reports and analytics</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workers.slice(0, 3).map((worker) => (
                <div key={worker.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-orange-100 p-2">
                      <Users className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{worker.name}</p>
                      <p className="text-xs text-muted-foreground">{worker.position}</p>
                    </div>
                  </div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</div>
                </div>
              ))}
              <Button variant="link" className="w-full text-orange-600" onClick={() => router.push("/admin/workers")}>
                View all workers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
