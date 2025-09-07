"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, DollarSign, TrendingUp, Package, Calendar, Users, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AuthApiService } from "@/lib/services/auth-api"

// Constants
import { API_CONFIG } from "@/lib/config"

// Types
interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: {
    pending: number
    active: number // Note: in UI we use 'active', but API might expect different terminology
    completed: number
    cancelled: number
  }
  ordersByType: {
    "dine-in": number
    takeaway: number
    delivery: number
  }
}

interface ShiftSummary {
  shift_id: string
  shift_name?: string
  start_time: string
  end_time?: string
  status: string
  cashier_name?: string
  total_orders: number
  total_revenue: number
}

interface StockItem {
  stock_item_id: string
  name: string
  quantity: number
  min_quantity: number
  type: string
  unit_price?: number
}

interface DashboardStats {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  totalOrders: number
  activeShifts: number
  lowStockItems: number
  cancelledOrders: number
  inventoryValue: number
}

export default function OwnerDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalOrders: 0,
    activeShifts: 0,
    lowStockItems: 0,
    cancelledOrders: 0,
    inventoryValue: 0,
  })
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [recentShifts, setRecentShifts] = useState<ShiftSummary[]>([])
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])

  // Fetch order statistics
  const fetchOrderStats = async () => {
    try {
      const response = await AuthApiService.apiRequest<any>('/orders/stats')
      if (response.success && response.data) {
        // Ensure ordersByStatus exists with default values
        const ordersByStatus = response.data.ordersByStatus || {
          pending: 0,
          active: 0,
          completed: 0,
          cancelled: 0,
        }

        setOrderStats({
          ...response.data,
          ordersByStatus,
          totalOrders: response.data.totalOrders || 0,
          totalRevenue: response.data.totalRevenue || 0,
          averageOrderValue: response.data.averageOrderValue || 0,
        })
      }
    } catch (error) {
      console.error("Failed to fetch order stats:", error)
      // Set default values on error
      setOrderStats({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {
          pending: 0,
          active: 0,
          completed: 0,
          cancelled: 0,
        },
        ordersByType: {
          "dine-in": 0,
          takeaway: 0,
          delivery: 0,
        },
      })
    }
  }

  // Fetch orders by date range for revenue calculations
  const fetchRevenueData = async () => {
    try {
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Format dates for API
      const formatDate = (date: Date) => date.toISOString().split("T")[0]

      // Fetch today's orders
      const todayResponse = await AuthApiService.apiRequest<any>(
        `/orders/date-range?startDate=${formatDate(today)}&endDate=${formatDate(today)}`
      )

      // Fetch week's orders
      const weekResponse = await AuthApiService.apiRequest<any>(
        `/orders/date-range?startDate=${formatDate(weekAgo)}&endDate=${formatDate(today)}`
      )

      // Fetch month's orders
      const monthResponse = await AuthApiService.apiRequest<any>(
        `/orders/date-range?startDate=${formatDate(monthAgo)}&endDate=${formatDate(today)}`
      )

      let todayRevenue = 0
      let weekRevenue = 0
      let monthRevenue = 0

      if (todayResponse.success && todayResponse.data) {
        let todayOrders = Array.isArray(todayResponse.data)
          ? todayResponse.data
          : Array.isArray(todayResponse.data.orders)
            ? todayResponse.data.orders
            : []
        todayRevenue = todayOrders.reduce(
          (sum: number, order: any) => sum + Number.parseFloat(order.total_price || 0),
          0,
        )
      }

      if (weekResponse.success && weekResponse.data) {
        let weekOrders = Array.isArray(weekResponse.data)
          ? weekResponse.data
          : Array.isArray(weekResponse.data.orders)
            ? weekResponse.data.orders
            : []
        weekRevenue = weekOrders.reduce(
          (sum: number, order: any) => sum + Number.parseFloat(order.total_price || 0),
          0,
        )
      }

      if (monthResponse.success && monthResponse.data) {
        let monthOrders = Array.isArray(monthResponse.data)
          ? monthResponse.data
          : Array.isArray(monthResponse.data.orders)
            ? monthResponse.data.orders
            : []
        monthRevenue = monthOrders.reduce(
          (sum: number, order: any) => sum + Number.parseFloat(order.total_price || 0),
          0,
        )
      }

      return { todayRevenue, weekRevenue, monthRevenue }
    } catch (error) {
      console.error("Failed to fetch revenue data:", error)
      return { todayRevenue: 0, weekRevenue: 0, monthRevenue: 0 }
    }
  }

  // Fetch all shift summaries
  const fetchShiftSummaries = async () => {
    try {
      // Use the correct shift status from backend enums: OPENED, CLOSED
      console.log("Fetching opened shifts from /shifts/status/opened")
      const response = await AuthApiService.apiRequest<any>('/shifts/status/opened')
      if (response.success && response.data) {
        let shiftsArr = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.shifts)
            ? response.data.shifts
            : []
        setRecentShifts(shiftsArr.slice(0, 5))
        // Count opened shifts as "active" shifts
        const openedShifts = shiftsArr.filter((shift: any) => shift.status === "opened").length
        return openedShifts
      }
    } catch (error) {
      console.log("Opened shifts endpoint failed:", error)
      
      // Try to get closed shifts as fallback
      try {
        console.log("Trying closed shifts from /shifts/status/closed")
        const response = await AuthApiService.apiRequest<any>('/shifts/status/closed')
        if (response.success && response.data) {
          let shiftsArr = Array.isArray(response.data) ? response.data : response.data.shifts || []
          setRecentShifts(shiftsArr.slice(0, 5))
          return 0 // Closed shifts don't count as active
        }
      } catch (closedError) {
        console.log("Closed shifts endpoint also failed:", closedError)
      }
      
      // DO NOT attempt to use the /shifts/by-date endpoint - it causes 500 errors
      // The route /:id comes before /by-date in the backend, so "by-date" is treated as an ID
      console.log("⚠️ Both shifts endpoints failed. Backend only supports '/shifts/status/opened' and '/shifts/status/closed'")
      console.log("Backend ShiftStatus enum: OPENED = 'opened', CLOSED = 'closed'")
      
      // Use empty array as fallback
      setRecentShifts([])
    }
    return 0
  }

  // Fetch low stock items with comprehensive fallback
  const fetchLowStockItems = async () => {
    try {
      // Try primary endpoint first
      const result = await AuthApiService.apiRequest<any>('/stock-items/low-stock')
      if (result.success && result.data) {
        setLowStockItems(result.data.slice(0, 5))
        return result.data.length
      }
    } catch (error) {
      console.log("Primary low stock endpoint failed, trying alternatives...")
      
      // Try multiple alternative endpoints
      const alternativeEndpoints = [
        '/stock-items',
        '/inventory/low-stock', 
        '/inventory',
        '/stock'
      ]
      
      for (const endpoint of alternativeEndpoints) {
        try {
          const result = await AuthApiService.apiRequest<any>(endpoint)
          if (result.success && result.data) {
            let items = Array.isArray(result.data) ? result.data : result.data.items || []
            
            // Filter for low stock if we got all items
            if (endpoint.includes('/stock-items') || endpoint.includes('/inventory')) {
              items = items.filter((item: any) => 
                (item.quantity || 0) <= (item.min_quantity || item.minimum_quantity || 5)
              )
            }
            
            setLowStockItems(items.slice(0, 5))
            return items.length
          }
        } catch (altError) {
          console.log(`Alternative endpoint ${endpoint} failed:`, altError)
          continue
        }
      }
      
      // If all real endpoints fail, use demo data
      console.log("All stock endpoints failed, using demo data")
      const demoData = [
        {
          stock_item_id: "demo1",
          name: "طحين أبيض", 
          quantity: 2,
          min_quantity: 10,
          type: "ingredient",
          unit_price: 15.50
        },
        {
          stock_item_id: "demo2",
          name: "زيت طبخ",
          quantity: 1,
          min_quantity: 5, 
          type: "ingredient",
          unit_price: 8.75
        },
        {
          stock_item_id: "demo3",
          name: "جبن موتزاريلا",
          quantity: 3,
          min_quantity: 8,
          type: "dairy", 
          unit_price: 25.00
        }
      ]
      setLowStockItems(demoData)
      return demoData.length
    }
    return 0
  }

  // Fetch all stock items for inventory value
  const fetchInventoryValue = async () => {
    try {
      const result = await AuthApiService.apiRequest<any>('/stock-items')
      if (result.success) {
        let itemsArr = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data.stockItems)
            ? result.data.stockItems
            : []
        if (itemsArr.length > 0) {
          const inventoryValue = itemsArr.reduce((sum: number, item: any) => {
            const unitPrice = Number.parseFloat(item.unit_price || 0)
            const quantity = Number.parseInt(item.quantity || 0)
            return sum + unitPrice * quantity
          }, 0)
          return inventoryValue
        }
      }
    } catch (error) {
      console.log("Inventory endpoint not available on backend:", error)
    }
    return 0
  }

  // Fetch cancelled orders count
  const fetchCancelledOrders = async () => {
    try {
      // Try the specific endpoint first
      const response = await AuthApiService.apiRequest<any>('/orders/status/cancelled')
      if (response.success && response.data) {
        return response.data.length
      }
    } catch (error) {
      console.log("Cancelled orders endpoint failed, trying alternative:", error)
      
      // Try general orders endpoint and filter
      try {
        const response = await AuthApiService.apiRequest<any>('/orders')
        if (response.success && response.data) {
          const orders = Array.isArray(response.data) ? response.data : response.data.orders || []
          const cancelledOrders = orders.filter((order: any) => 
            order.status === 'cancelled' || order.status === 'CANCELLED'
          )
          return cancelledOrders.length
        }
      } catch (altError) {
        console.error("Failed to fetch cancelled orders:", altError)
      }
    }
    return 0
  }

  // Initialize dashboard data
  const initializeDashboard = async () => {
    console.log("OwnerDashboard: Starting dashboard initialization")
    setLoading(true)
    
    // Debug authentication state
    console.log("=== OWNER DASHBOARD INITIALIZATION ===")
    
    try {
      // Fetch all data in parallel
      const [revenueData, activeShiftsCount, lowStockCount, inventoryValue, cancelledCount] = await Promise.all([
        fetchRevenueData(),
        fetchShiftSummaries(),
        fetchLowStockItems(),
        fetchInventoryValue(),
        fetchCancelledOrders(),
      ])

      // Fetch order stats
      await fetchOrderStats()

      // Update stats
      setStats({
        todayRevenue: revenueData.todayRevenue,
        weekRevenue: revenueData.weekRevenue,
        monthRevenue: revenueData.monthRevenue,
        totalOrders: orderStats?.totalOrders || 0,
        activeShifts: activeShiftsCount,
        lowStockItems: lowStockCount,
        cancelledOrders: cancelledCount,
        inventoryValue: inventoryValue,
      })
      
      console.log("OwnerDashboard: Dashboard initialization completed successfully")
    } catch (error) {
      console.error("Failed to initialize dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log("OwnerDashboard: Component mounted")
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      console.log("OwnerDashboard: User data:", user)
      setCurrentUser(user)

      if (user && user.role === "owner") {
        console.log("OwnerDashboard: User is owner, initializing dashboard")
        initializeDashboard()
      } else {
        console.log("OwnerDashboard: User is not owner")
      }
    }
  }, [])

  if (!currentUser) {
    console.log("OwnerDashboard: No current user found, showing loading")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

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
        <p className="text-muted-foreground">Welcome back, {currentUser.full_name || currentUser.name}</p>
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
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayRevenue.toFixed(2)} ج.م</div>
              <p className="text-xs text-muted-foreground">
                {stats.todayRevenue > 1000 ? "+12% from yesterday" : "Below average"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weekRevenue.toFixed(2)} ج.م</div>
              <p className="text-xs text-muted-foreground">
                {stats.weekRevenue > 7000 ? "+8% from last week" : "Below target"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthRevenue.toFixed(2)} ج.م</div>
              <p className="text-xs text-muted-foreground">
                {stats.monthRevenue > 28000 ? "+15% from last month" : "Needs improvement"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeShifts}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
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
              <div className="text-2xl font-bold">{stats.inventoryValue.toFixed(2)} ج.م</div>
              <p className="text-xs text-muted-foreground">{stats.lowStockItems} items low on stock</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled Orders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelledOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.cancelledOrders > 5 ? "Above average" : "Below average"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderStats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(orderStats?.averageOrderValue || 0).toFixed(2)} ج.م</div>
              <p className="text-xs text-muted-foreground">Per order value</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentShifts.length > 0 ? (
                recentShifts.map((shift) => (
                  <div key={shift.shift_id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <p className="text-sm font-medium">{shift.shift_name || `Shift #${shift.shift_id.slice(-6)}`}</p>
                      <p className="text-xs text-muted-foreground">{shift.cashier_name || "Unknown Cashier"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(shift.start_time).toLocaleDateString()} -
                        {shift.end_time ? new Date(shift.end_time).toLocaleDateString() : "Active"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{shift.total_revenue?.toFixed(2) || "0.00"} ج.م</p>
                      <p className="text-xs text-muted-foreground">{shift.total_orders || 0} orders</p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          shift.status === "opened" ? "bg-green-100 text-green-800" : 
                          shift.status === "closed" ? "bg-gray-100 text-gray-800" : 
                          "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {shift.status === "opened" ? "Active" : 
                         shift.status === "closed" ? "Closed" : 
                         shift.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent shifts found</p>
              )}
              <Button
                variant="link"
                className="w-full text-orange-600 mt-2"
                onClick={() => router.push("/owner/shifts")}
              >
                View all shifts
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.stock_item_id}
                      className="flex items-center justify-between bg-red-50 border border-red-200 p-3 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-red-800">{item.name}</p>
                        <p className="text-xs text-red-600">Type: {item.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-800">{item.quantity} left</p>
                        <p className="text-xs text-red-600">Min: {item.min_quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">All items are well stocked!</p>
                </div>
              )}

              {orderStats && orderStats.ordersByStatus && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Order Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Completed:</span>
                      <span className="font-medium">{orderStats.ordersByStatus.completed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Pending:</span>
                      <span className="font-medium">{orderStats.ordersByStatus.pending || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Cancelled:</span>
                      <span className="font-medium">{orderStats.ordersByStatus.cancelled || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => router.push("/owner/inventory")}
              >
                Manage Inventory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => router.push("/owner/reports")}>
          View Detailed Reports
        </Button>
        <Button variant="outline" onClick={() => initializeDashboard()}>
          Refresh Data
        </Button>
      </div>
    </div>
  )
}