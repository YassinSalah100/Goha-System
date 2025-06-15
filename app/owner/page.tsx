"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, DollarSign, TrendingUp, Package, Calendar } from "lucide-react"
import { orders } from "@/mock-data/orders"
import { inventory } from "@/mock-data/inventory"
import { dailyReports } from "@/mock-data/daily-reports"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function OwnerDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalSalesToday: 0,
    totalSalesWeek: 0,
    totalSalesMonth: 0,
    inventoryValue: 0,
    canceledOrders: 0,
    netRevenue: 0,
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)

      // Calculate stats
      const today = new Date().toDateString()
      const todayOrders = orders.filter((order) => new Date(order.date).toDateString() === today)
      const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0)

      // Mock data for other stats
      const weekSales = todaySales * 7 * (0.8 + Math.random() * 0.4) // Simulate week data
      const monthSales = weekSales * 4 * (0.8 + Math.random() * 0.4) // Simulate month data

      const inventoryValue = inventory.reduce((sum, item) => {
        // Mock price per unit
        const pricePerUnit = Math.floor(Math.random() * 10) + 1
        return sum + item.quantity * pricePerUnit
      }, 0)

      const canceledOrders = orders.filter((order) => order.status === "canceled").length

      const netRevenue = dailyReports.reduce((sum, report) => sum + report.netRevenue, 0)

      setStats({
        totalSalesToday: todaySales,
        totalSalesWeek: weekSales,
        totalSalesMonth: monthSales,
        inventoryValue,
        canceledOrders,
        netRevenue,
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
        <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {currentUser.name}</p>
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSalesToday.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSalesToday > 1000 ? "+12% from yesterday" : "-8% from yesterday"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSalesWeek.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSalesWeek > 7000 ? "+8% from last week" : "-5% from last week"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSalesMonth.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSalesMonth > 28000 ? "+15% from last month" : "-3% from last month"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.inventoryValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {inventory.filter((item) => item.quantity <= item.minQuantity).length} items low on stock
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canceled Orders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.canceledOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.canceledOrders > 5 ? "Above average" : "Below average"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.netRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">After expenses and wages</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Live Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-medium text-orange-800 mb-2">Current Active Cashiers</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-green-500 h-2 w-2"></div>
                      <span>Ahmed Cashier</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Morning Shift</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-green-500 h-2 w-2"></div>
                      <span>Sara Cashier</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Evening Shift</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Recent Orders</h3>
                <div className="space-y-2">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <p className="text-sm font-medium">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${order.total.toFixed(2)}</p>
                        <p className="text-xs capitalize">{order.orderType}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="link"
                  className="w-full text-orange-600 mt-2"
                  onClick={() => router.push("/owner/monitoring")}
                >
                  View all activity
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Sales by Cashier</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="w-24 text-sm">Ahmed</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: "65%" }}></div>
                    </div>
                    <span className="w-16 text-right text-sm">65%</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-sm">Sara</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: "35%" }}></div>
                    </div>
                    <span className="w-16 text-right text-sm">35%</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Popular Categories</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="w-24 text-sm">Pizza</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: "40%" }}></div>
                    </div>
                    <span className="w-16 text-right text-sm">40%</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-sm">Feteer</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: "25%" }}></div>
                    </div>
                    <span className="w-16 text-right text-sm">25%</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-sm">Grilled</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: "20%" }}></div>
                    </div>
                    <span className="w-16 text-right text-sm">20%</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-sm">Other</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: "15%" }}></div>
                    </div>
                    <span className="w-16 text-right text-sm">15%</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => router.push("/owner/reports")}
              >
                View Detailed Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
