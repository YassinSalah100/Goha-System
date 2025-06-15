"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Clock, DollarSign, Utensils } from "lucide-react"
import { orders } from "@/mock-data/orders"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function CashierDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [todayOrders, setTodayOrders] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)

      // Filter orders for today and current cashier
      const today = new Date().toDateString()
      const filteredOrders = orders.filter(
        (order) => new Date(order.date).toDateString() === today && order.cashier === user.username,
      )

      setTodayOrders(filteredOrders)

      // Calculate stats
      const total = filteredOrders.reduce((sum, order) => sum + order.total, 0)
      const pending = filteredOrders.filter((order) => order.status === "pending").length

      setStats({
        totalOrders: filteredOrders.length,
        totalSales: total,
        avgOrderValue: filteredOrders.length ? total / filteredOrders.length : 0,
        pendingOrders: pending,
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, {currentUser.name}</h2>
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

      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 10)}% from yesterday</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 15)}% from yesterday</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.avgOrderValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {Math.random() > 0.5 ? "+" : "-"}
                {Math.floor(Math.random() * 8)}% from yesterday
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders > 0 ? "Needs attention" : "All clear"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayOrders.length > 0 ? (
                todayOrders.slice(0, 5).map((order, i) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-orange-100 p-2">
                        <ShoppingCart className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">${order.total.toFixed(2)}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No orders yet today</p>
              )}
            </div>
            {todayOrders.length > 5 && (
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

        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Shift Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Shift Type</p>
                  <p className="text-lg font-medium capitalize">{currentUser.shift}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Started At</p>
                  <p className="text-lg font-medium">
                    {new Date(currentUser.loginTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected End</p>
                  <p className="text-lg font-medium">
                    {new Date(new Date(currentUser.loginTime).getTime() + 8 * 60 * 60 * 1000).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-medium">8 hours</p>
                </div>
              </div>
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => router.push("/cashier/end-shift")}
              >
                Request End Shift
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
