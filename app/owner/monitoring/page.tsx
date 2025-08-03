"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User,
  Package,
  RefreshCw,
  Eye,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  Coffee,
  Clock,
  Receipt,
  UserCheck,
  Briefcase,
  BarChart3,
  CheckCircle,
  XCircle,
  FileText,
  Trash2,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const API_BASE_URL = "http://192.168.1.14:3000/api/v1"

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
  order_type: "dine-in" | "takeaway" | "delivery" | "cafe"
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
  table_number?: string
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
    cafe: number
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

interface ShiftSummary {
  shift_id: string
  shift_name: string
  cashier_name: string
  start_time: string
  end_time: string | null
  total_orders: number
  total_sales: number
  orders_by_type: {
    "dine-in": number
    takeaway: number
    delivery: number
    cafe: number
  }
  orders_by_status: {
    pending: number
    completed: number
    cancelled: number
  }
  orders_by_payment: {
    cash: number
    card: number
  }
  average_order_value: number
  is_active: boolean
  orders?: Order[] // Optional array of orders for this shift
  workers?: Array<{
    shift_worker_id: string
    worker: {
      worker_id: string
      full_name: string
      status: string
    }
    hourly_rate?: number
    start_time: string
    end_time?: string | null
    hours_worked?: number
    calculated_salary?: number
    is_active: boolean
  }>
  expenses?: Array<{
    expense_id: string
    title: string
    amount: number
    category: string
    created_at: string
    created_by?: {
      worker_id?: string
      full_name?: string
    }
  }>
  total_staff_cost?: number
  total_expenses?: number
}

interface DetailedShiftSummary {
  shift_id: string
  type: "MORNING" | "NIGHT"
  status: "opened" | "closed" | "REQUESTED_CLOSE"
  start_time: string
  end_time: string | null
  opened_by: {
    worker_id: string
    full_name: string
  }
  closed_by?: {
    worker_id: string
    full_name: string
  }
  // Orders summary
  total_orders: number
  total_sales: number
  orders_by_type: {
    "dine-in": number
    takeaway: number
    delivery: number
    cafe: number
  }
  orders_by_status: {
    pending: number
    completed: number
    cancelled: number
  }
  orders_by_payment: {
    cash: number
    card: number
  }
  average_order_value: number
  // Workers summary
  total_workers: number
  active_workers: number
  total_staff_cost: number
  workers: Array<{
    shift_worker_id: string
    worker: {
      worker_id: string
      full_name: string
      status: string
    }
    hourly_rate: number
    start_time: string
    end_time: string | null
    hours_worked: number
    calculated_salary: number
    is_active: boolean
  }>
  // Expenses summary
  total_expenses: number
  expenses_count: number
  expenses_by_category: {
    [key: string]: number
  }
  expenses: Array<{
    expense_id: string
    title: string
    amount: number
    category: string
    created_at: string
    created_by: {
      worker_id: string
      full_name: string
    }
  }>
}

export default function MonitoringPageAPIFixed() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("live")
  const [liveOrders, setLiveOrders] = useState<Order[]>([])
  const [cancelledOrders, setCancelledOrders] = useState<CancelledOrder[]>([])
  const [cashierActivities, setCashierActivities] = useState<CashierActivity[]>([])
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [shiftSummaries, setShiftSummaries] = useState<ShiftSummary[]>([])
  const [detailedShiftSummaries, setDetailedShiftSummaries] = useState<DetailedShiftSummary[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [selectedShiftType, setSelectedShiftType] = useState<string>("all")
  const [selectedShiftStatus, setSelectedShiftStatus] = useState<string>("all")
  const [loadingShifts, setLoadingShifts] = useState(false)
  const [todayStats, setTodayStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    completedOrders: 0,
    pendingOrders: 0,
    activeCashiers: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const loadingRef = useRef(false)

  const normalizePrice = (price: string | number): number => {
    if (typeof price === "string") {
      return Number.parseFloat(price) || 0
    }
    return Number(price) || 0
  }

  const formatPrice = (price: string | number): string => {
    return `ج.م${normalizePrice(price).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const normalizeOrderItem = (item: any) => {
    let productName = "منتج غير محدد"
    let sizeName = "عادي"
    let unitPrice = 0

    try {
      // 1. product_size (API response structure)
      if (item.product_size) {
        productName = item.product_size.product_name || productName
        if (item.product_size.size && item.product_size.size.size_name) {
          sizeName = item.product_size.size.size_name
        } else if (item.product_size.size_name) {
          sizeName = item.product_size.size_name
        }
        unitPrice = Number.parseFloat(item.product_size.price || item.unit_price || 0)
      }
      // 2. product object with productSize
      else if (item.product && item.product.name) {
        productName = item.product.name
        if (item.productSize?.size?.size_name) {
          sizeName = item.productSize.size.size_name
          unitPrice = Number.parseFloat(item.productSize.price || item.unit_price || 0)
        } else {
          unitPrice = Number.parseFloat(item.unit_price || 0)
        }
      }
      // 3. Direct fields
      else if (item.product_name) {
        productName = item.product_name
        sizeName = item.size_name || sizeName
        unitPrice = Number.parseFloat(item.unit_price || item.price || 0)
      }
      // 4. Try to extract from any available data
      else {
        const possibleNames = [item.name, item.product?.name, item.productName].filter(Boolean)
        if (possibleNames.length > 0) {
          productName = possibleNames[0]
        }
        unitPrice = Number.parseFloat(item.unit_price || item.price || 0)
      }
    } catch (error) {
      productName = item.product_name || item.name || "منتج غير محدد"
      sizeName = item.size_name || "عادي"
      unitPrice = Number.parseFloat(item.unit_price || item.price || 0)
    }

    // Extras normalization
    let processedExtras = []
    if (Array.isArray(item.extras) && item.extras.length > 0) {
      processedExtras = item.extras.map((extra: any) => {
        let extraName = extra.name || extra.extra_name || extra.extraName
        if (!extraName && extra.extra) {
          extraName =
            extra.extra.name ||
            (typeof extra.extra === "object" &&
            extra.extra !== null &&
            Object.prototype.hasOwnProperty.call(extra.extra, "extra_name")
              ? (extra.extra as any).extra_name
              : undefined)
        }
        if (!extraName && extra.extra_id) {
          extraName = `إضافة ${extra.extra_id.slice(-4)}`
        }
        if (!extraName) {
          extraName = "[إضافة غير معروفة]"
        }

        return {
          extra_id: extra.extra_id || extra.id || `extra_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: extraName,
          price: typeof extra.price === "string" ? Number.parseFloat(extra.price) : extra.price || 0,
          quantity: extra.quantity || 1,
        }
      })
    }

    return {
      ...item,
      order_item_id: item.order_item_id || item.id || `item_${Date.now()}`,
      productName,
      sizeName,
      unitPrice,
      quantity: item.quantity || 0,
      notes: item.notes || "",
      extras: processedExtras,
    }
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

  // Fetch shift workers
  const fetchShiftWorkers = async (shiftId: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/shift-workers/shift/${shiftId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      })
      if (response.ok) {
        const result = await response.json()
        return Array.isArray(result) ? result : result.data || []
      }
    } catch (error) {
      console.error(`❌ Error fetching workers for shift ${shiftId}:`, error)
    }
    return []
  }
  
  // Delete a shift by ID
  const deleteShift = async (shiftId: string): Promise<boolean> => {
    try {
      console.log(`🗑️ Attempting to delete shift ${shiftId}...`)
      const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      })
      
      if (response.ok) {
        console.log(`✅ Successfully deleted shift ${shiftId}`)
        // Update the shift summaries to remove the deleted shift
        setShiftSummaries(prevSummaries => 
          prevSummaries.filter(s => s.shift_id !== shiftId)
        )
        return true
      } else {
        const errorData = await response.json()
        console.error(`❌ Failed to delete shift ${shiftId}:`, errorData)
        return false
      }
    } catch (error) {
      console.error(`❌ Error deleting shift ${shiftId}:`, error)
      return false
    }
  }

  // Fetch expenses with optional shift filtering
  const fetchExpenses = async (shiftId?: string): Promise<any[]> => {
    try {
      // If shiftId is provided, use it to filter expenses
      const url = shiftId 
        ? `${API_BASE_URL}/expenses?shiftId=${shiftId}`
        : `${API_BASE_URL}/expenses`
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      })
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Fetched ${shiftId ? `expenses for shift ${shiftId}` : 'all expenses'}`)
        return Array.isArray(result) ? result : result.data || []
      }
    } catch (error) {
      console.error(`❌ Error fetching expenses${shiftId ? ` for shift ${shiftId}` : ""}:`, error)
    }
    return []
  }

  // Fetch detailed shift summaries with expenses and workers
  const fetchDetailedShiftSummaries = async (): Promise<DetailedShiftSummary[]> => {
    setLoadingShifts(true)
    try {
      console.log("📊 Fetching detailed shift summaries...")
      const authToken = localStorage.getItem("authToken") || ""

      // Since the summary endpoints don't exist, we'll build detailed summaries from basic shift data
      const allShifts: any[] = []

      // Get all shifts using the correct enum values (lowercase)
      try {
        const openShiftsResponse = await fetch(`${API_BASE_URL}/shifts/status/opened`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (openShiftsResponse.ok) {
          const openResult = await openShiftsResponse.json()
          const openShifts = Array.isArray(openResult) ? openResult : openResult.data || []
          allShifts.push(...openShifts)
        }
      } catch (e) {
        console.warn("Failed to get opened shifts for detailed view:", e)
      }

      try {
        const closedShiftsResponse = await fetch(`${API_BASE_URL}/shifts/status/closed`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (closedShiftsResponse.ok) {
          const closedResult = await closedShiftsResponse.json()
          const closedShifts = Array.isArray(closedResult) ? closedResult : closedResult.data || []
          allShifts.push(...closedShifts)
        }
      } catch (e) {
        console.warn("Failed to get closed shifts for detailed view:", e)
      }

      // Remove duplicates
      const uniqueShifts = allShifts.filter(
        (shift, index, self) => index === self.findIndex((s) => s.shift_id === shift.shift_id),
      )

      // Filter based on selected criteria
      const filteredShifts = uniqueShifts.filter((shift) => {
        // Filter by date
        const shiftDate = new Date(shift.start_time || shift.created_at)
        const selectedDateObj = new Date(selectedDate)
        const dateMatches = shiftDate.toDateString() === selectedDateObj.toDateString()

        // Filter by type
        const typeMatches =
          selectedShiftType === "all" ||
          (shift.shift_type || shift.type)?.toLowerCase() === selectedShiftType.toLowerCase()

        // Filter by status
        const statusMatches =
          selectedShiftStatus === "all" || shift.status?.toLowerCase() === selectedShiftStatus.toLowerCase()

        return dateMatches && typeMatches && statusMatches
      })

      console.log(`📊 Found ${filteredShifts.length} shifts matching filters`)

      // Build detailed summaries with real data
      const detailedSummaries: DetailedShiftSummary[] = []

      for (const shift of filteredShifts) {
        try {
          console.log(`📊 Processing detailed shift: ${shift.shift_id}`)

          // Fetch workers and expenses for this shift
          const [shiftWorkers, allExpenses] = await Promise.all([fetchShiftWorkers(shift.shift_id), fetchExpenses()])

          // Filter expenses by shift date (since you might not have shift_id in expenses)
          const shiftDate = new Date(shift.start_time || shift.created_at).toDateString()
          const shiftExpenses = allExpenses.filter((expense) => {
            const expenseDate = new Date(expense.created_at).toDateString()
            return expenseDate === shiftDate
          })

          // Get orders for this shift with better matching
          const shiftOrders = liveOrders.filter((order) => {
            // Direct shift ID match
            if (order.shift?.shift_id === shift.shift_id) return true

            // Date and cashier matching
            const orderDate = new Date(order.created_at).toDateString()
            const orderShiftDate = new Date(shift.start_time || shift.created_at).toDateString()

            if (orderDate === orderShiftDate) {
              const orderCashier = order.cashier?.full_name || order.cashier_name || order.user?.full_name
              const shiftCashier = getCashierName(shift)
              return orderCashier === shiftCashier && shiftCashier !== "غير محدد"
            }

            return false
          })

          const totalSales = shiftOrders.reduce((sum, order) => sum + normalizePrice(order.total_price), 0)
          const totalExpenses = shiftExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
          const totalStaffCost = shiftWorkers.reduce((sum, worker) => sum + (worker.calculated_salary || 0), 0)

          const detailedSummary: DetailedShiftSummary = {
            shift_id: shift.shift_id,
            type: (shift.shift_type || shift.type || "morning") === "morning" ? "MORNING" : "NIGHT",
            status: (shift.status || "opened") as "opened" | "closed" | "REQUESTED_CLOSE",
            start_time: shift.start_time || shift.created_at,
            end_time: shift.end_time,
            opened_by: {
              worker_id: shift.opened_by || shift.opened_by_user?.user_id || "unknown",
              full_name: getCashierName(shift),
            },
            closed_by: shift.closed_by_user
              ? {
                  worker_id: shift.closed_by_user.user_id,
                  full_name: shift.closed_by_user.full_name,
                }
              : undefined,

            // Orders data
            total_orders: shiftOrders.length,
            total_sales: totalSales,
            orders_by_type: {
              "dine-in": shiftOrders.filter((o) => o.order_type === "dine-in").length,
              takeaway: shiftOrders.filter((o) => o.order_type === "takeaway").length,
              delivery: shiftOrders.filter((o) => o.order_type === "delivery").length,
              cafe: shiftOrders.filter((o) => o.order_type === "cafe").length,
            },
            orders_by_status: {
              pending: shiftOrders.filter((o) => o.status === "pending").length,
              completed: shiftOrders.filter((o) => o.status === "completed").length,
              cancelled: shiftOrders.filter((o) => o.status === "cancelled").length,
            },
            orders_by_payment: {
              cash: shiftOrders.filter((o) => o.payment_method === "cash").length,
              card: shiftOrders.filter((o) => o.payment_method === "card").length,
            },
            average_order_value: shiftOrders.length > 0 ? totalSales / shiftOrders.length : 0,

            // Workers data (real data)
            total_workers: shiftWorkers.length,
            active_workers: shiftWorkers.filter((w) => w.is_active).length,
            total_staff_cost: totalStaffCost,
            workers: shiftWorkers.map((worker) => ({
              shift_worker_id: worker.shift_worker_id || worker.id,
              worker: {
                worker_id: worker.worker?.worker_id || worker.worker_id,
                full_name: worker.worker?.full_name || worker.full_name || "غير محدد",
                status: worker.worker?.status || worker.status || "نشط",
              },
              hourly_rate: worker.hourly_rate || 0,
              start_time: worker.start_time,
              end_time: worker.end_time,
              hours_worked: worker.hours_worked || 0,
              calculated_salary: worker.calculated_salary || 0,
              is_active: worker.is_active || false,
            })),

            // Expenses data (real data)
            total_expenses: totalExpenses,
            expenses_count: shiftExpenses.length,
            expenses_by_category: shiftExpenses.reduce(
              (acc, expense) => {
                acc[expense.category || "other"] = (acc[expense.category || "other"] || 0) + expense.amount
                return acc
              },
              {} as { [key: string]: number },
            ),
            expenses: shiftExpenses.map((expense) => ({
              expense_id: expense.expense_id || expense.id,
              title: expense.title || expense.name,
              amount: expense.amount || 0,
              category: expense.category || "other",
              created_at: expense.created_at,
              created_by: {
                worker_id: expense.created_by?.worker_id || expense.created_by_id || "unknown",
                full_name: expense.created_by?.full_name || expense.created_by_name || "غير محدد",
              },
            })),
          }

          detailedSummaries.push(detailedSummary)
          console.log(`✅ Created detailed summary for shift ${shift.shift_id}: ${detailedSummary.opened_by.full_name}`)
        } catch (error) {
          console.error(`Error processing detailed shift ${shift.shift_id}:`, error)
        }
      }

      console.log(`✅ Generated ${detailedSummaries.length} detailed shift summaries`)
      return detailedSummaries
    } catch (error) {
      console.error("❌ Error fetching detailed shift summaries:", error)
      return []
    } finally {
      setLoadingShifts(false)
    }
  }

  const fetchShiftSummaries = async (forceRefresh: boolean = false): Promise<ShiftSummary[]> => {
    try {
      // If we have data and no force refresh, return existing data
      if (!forceRefresh && shiftSummaries.length > 0) {
        return shiftSummaries;
      }

      console.log("📊 Fetching all shift summaries...")
      
      // Clear any previous loading state
      if (forceRefresh) {
        setShiftSummaries([])
      }
      
      const authToken = localStorage.getItem("authToken") || ""

      // Try multiple approaches to get all shifts using correct enum values
      const allShifts: any[] = []

      // Method 1: Try to get all shifts by status (using correct lowercase values)
      try {
        const openShiftsResponse = await fetch(`${API_BASE_URL}/shifts/status/opened`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (openShiftsResponse.ok) {
          const openResult = await openShiftsResponse.json()
          const openShifts = Array.isArray(openResult) ? openResult : openResult.data || []
          allShifts.push(...openShifts)
          console.log(`📊 Found ${openShifts.length} opened shifts`)
        }
      } catch (e) {
        console.warn("Failed to get opened shifts:", e)
      }

      // Method 2: Try to get closed shifts
      try {
        const closedShiftsResponse = await fetch(`${API_BASE_URL}/shifts/status/closed`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (closedShiftsResponse.ok) {
          const closedResult = await closedShiftsResponse.json()
          const closedShifts = Array.isArray(closedResult) ? closedResult : closedResult.data || []
          allShifts.push(...closedShifts)
          console.log(`📊 Found ${closedShifts.length} closed shifts`)
        }
      } catch (e) {
        console.warn("Failed to get closed shifts:", e)
      }

      // Method 3: Try to get shifts by date if status endpoints fail
      if (allShifts.length === 0) {
        try {
          const today = new Date().toISOString().split("T")[0]
          const dateShiftsResponse = await fetch(`${API_BASE_URL}/shifts/by-date?date=${today}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          })

          if (dateShiftsResponse.ok) {
            const dateResult = await dateShiftsResponse.json()
            const dateShifts = Array.isArray(dateResult) ? dateResult : dateResult.data || []
            allShifts.push(...dateShifts)
            console.log(`📊 Found ${dateShifts.length} shifts by date`)
          }
        } catch (e) {
          console.warn("Failed to get shifts by date:", e)
        }
      }

      // Method 4: Try to get all users and their shifts
      if (allShifts.length === 0) {
        try {
          const usersResponse = await fetch(`${API_BASE_URL}/users`, {
            headers: { Authorization: `Bearer ${authToken}` },
          })

          if (usersResponse.ok) {
            const usersResult = await usersResponse.json()
            const users = usersResult.success ? usersResult.data : Array.isArray(usersResult) ? usersResult : []

            for (const user of users) {
              if (user.role === "cashier" || user.role === "admin") {
                try {
                  const userShiftsResponse = await fetch(`${API_BASE_URL}/shifts/cashier/${user.user_id}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                  })

                  if (userShiftsResponse.ok) {
                    const userShiftsResult = await userShiftsResponse.json()
                    const userShifts = userShiftsResult.success ? userShiftsResult.data : []
                    allShifts.push(...userShifts)
                  }
                } catch (e) {
                  console.warn(`Failed to get shifts for user ${user.full_name}:`, e)
                }
              }
            }
            console.log(`📊 Found ${allShifts.length} shifts from all users`)
          }
        } catch (e) {
          console.warn("Failed to get users and their shifts:", e)
        }
      }

      // Remove duplicates based on shift_id
      const uniqueShifts = allShifts.filter(
        (shift, index, self) => index === self.findIndex((s) => s.shift_id === shift.shift_id),
      )

      console.log(`📊 Processing ${uniqueShifts.length} unique shifts`)

      // Process each shift to create summaries
      const summaries: ShiftSummary[] = []

      for (const shift of uniqueShifts) {
        try {
          // Get orders for this shift from the orders we already fetched
          const shiftOrders = liveOrders.filter((order) => {
            // Try to match by shift_id first
            if (order.shift?.shift_id === shift.shift_id) {
              return true
            }

            // Fallback: match by date and cashier
            const orderDate = new Date(order.created_at).toDateString()
            const shiftDate = new Date(shift.start_time || shift.created_at).toDateString()

            if (orderDate === shiftDate) {
              const orderCashier = order.cashier?.full_name || order.cashier_name || order.user?.full_name
              const shiftCashier = shift.opened_by_user?.full_name || shift.cashier?.full_name

              return orderCashier === shiftCashier
            }

            return false
          })

          // Calculate shift statistics from orders
          const totalSales = shiftOrders.reduce((sum, order) => sum + normalizePrice(order.total_price), 0)

          // Fetch shift workers and shift-specific expenses in parallel
          const [shiftWorkers, shiftExpenses] = await Promise.all([
            fetchShiftWorkers(shift.shift_id),
            fetchExpenses(shift.shift_id) // Get only expenses for this specific shift
          ]);
          
          // Log the shift-specific data
          console.log(`✅ Shift ${shift.shift_id} (${shift.shift_type || 'unknown type'}): Found ${shiftWorkers.length} workers and ${shiftExpenses.length} expenses`);
          
          // Calculate total expenses
          const totalExpenses = shiftExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
          
          // Process shift workers to calculate staff costs
          const processedWorkers = shiftWorkers.map(worker => {
            // Calculate hours worked
            const startTime = worker.start_time ? new Date(worker.start_time) : new Date(shift.start_time || shift.created_at);
            const endTime = worker.end_time 
              ? new Date(worker.end_time) 
              : (shift.end_time ? new Date(shift.end_time) : new Date());
            
            const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            const hourlyRate = worker.hourly_rate || 0;
            const calculatedSalary = hoursWorked * hourlyRate;
            
            return {
              ...worker,
              hours_worked: hoursWorked,
              calculated_salary: calculatedSalary,
              is_active: !worker.end_time
            };
          });
          
          const totalStaffCost = processedWorkers.reduce((sum, worker) => sum + (worker.calculated_salary || 0), 0);

          const summary: ShiftSummary = {
            shift_id: shift.shift_id,
            shift_name: getShiftTypeName(shift.shift_type || shift.type),
            cashier_name: getCashierName(shift),
            start_time: shift.start_time || shift.created_at,
            end_time: shift.end_time,
            is_active: shift.status === "opened" && !shift.is_closed,
            total_orders: shiftOrders.length,
            total_sales: totalSales,
            orders_by_type: {
              "dine-in": shiftOrders.filter((o) => o.order_type === "dine-in").length,
              takeaway: shiftOrders.filter((o) => o.order_type === "takeaway").length,
              delivery: shiftOrders.filter((o) => o.order_type === "delivery").length,
              cafe: shiftOrders.filter((o) => o.order_type === "cafe").length,
            },
            orders_by_status: {
              pending: shiftOrders.filter((o) => o.status === "pending").length,
              completed: shiftOrders.filter((o) => o.status === "completed").length,
              cancelled: shiftOrders.filter((o) => o.status === "cancelled").length,
            },
            orders_by_payment: {
              cash: shiftOrders.filter((o) => o.payment_method === "cash").length,
              card: shiftOrders.filter((o) => o.payment_method === "card").length,
            },
            average_order_value: shiftOrders.length > 0 ? totalSales / shiftOrders.length : 0,
            orders: shiftOrders, // Store the actual orders for display
            workers: processedWorkers,
            expenses: shiftExpenses,
            total_staff_cost: totalStaffCost,
            total_expenses: totalExpenses
          }

          summaries.push(summary)
          console.log(
            `✅ Created summary for shift ${shift.shift_id}: ${summary.cashier_name} - ${summary.total_orders} orders`,
          )
        } catch (error) {
          console.warn(`Failed to process shift ${shift.shift_id}:`, error)
        }
      }

      // Sort by start time (most recent first)
      summaries.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

      console.log(`✅ Generated ${summaries.length} shift summaries`)
      return summaries
    } catch (error) {
      console.error("❌ Error fetching shift summaries:", error)
      // Fallback: generate from orders if all API calls fail
      return generateShiftsFromOrders(liveOrders)
    }
  }

  // Generate shift summaries from orders when no shifts API is available
  const generateShiftsFromOrders = async (orders: Order[]): Promise<ShiftSummary[]> => {
    console.log("🔄 Generating shift summaries from orders...")
    console.log(`📊 Processing ${orders.length} orders for shift generation`)

    if (orders.length === 0) {
      console.log("📊 No orders found, cannot generate shifts")
      return []
    }

    // Debug: Log sample order structure
    if (orders.length > 0) {
      console.log("🔍 Sample order structure:", {
        order_id: orders[0].order_id,
        cashier: orders[0].cashier,
        cashier_name: orders[0].cashier_name,
        user: orders[0].user,
        created_by: orders[0].created_by,
        created_at: orders[0].created_at,
        total_price: orders[0].total_price,
        order_type: orders[0].order_type,
        status: orders[0].status,
        payment_method: orders[0].payment_method,
      })
    }

    // Group orders by cashier and time periods
    const cashierGroups = new Map<string, Order[]>()

    orders.forEach((order) => {
      let cashierKey = "مستخدم غير معروف"

      // Enhanced cashier identifier extraction with debugging
      if (order.cashier?.full_name) {
        cashierKey = order.cashier.full_name
        console.log(`✅ Found cashier from order.cashier.full_name: ${cashierKey}`)
      } else if (order.cashier?.fullName) {
        cashierKey = order.cashier.fullName
        console.log(`✅ Found cashier from order.cashier.fullName: ${cashierKey}`)
      } else if (order.cashier_name) {
        cashierKey = order.cashier_name
        console.log(`✅ Found cashier from order.cashier_name: ${cashierKey}`)
      } else if (order.user?.full_name) {
        cashierKey = order.user.full_name
        console.log(`✅ Found cashier from order.user.full_name: ${cashierKey}`)
      } else if (order.user?.name) {
        cashierKey = order.user.name
        console.log(`✅ Found cashier from order.user.name: ${cashierKey}`)
      } else if (order.user?.username) {
        cashierKey = order.user.username
        console.log(`✅ Found cashier from order.user.username: ${cashierKey}`)
      } else if (order.created_by) {
        cashierKey = order.created_by
        console.log(`✅ Found cashier from order.created_by: ${cashierKey}`)
      } else if (order.employee_name) {
        cashierKey = order.employee_name
        console.log(`✅ Found cashier from order.employee_name: ${cashierKey}`)
      } else {
        console.warn(`⚠️ No cashier found for order ${order.order_id}. Available fields:`, {
          cashier: order.cashier,
          cashier_name: order.cashier_name,
          user: order.user,
          created_by: order.created_by,
          employee_name: order.employee_name,
        })
      }

      if (!cashierGroups.has(cashierKey)) {
        cashierGroups.set(cashierKey, [])
      }
      cashierGroups.get(cashierKey)!.push(order)
    })

    // Debug: Log final cashier groups
    console.log(
      "👥 Final cashier groups:",
      Array.from(cashierGroups.entries()).map(([name, orders]) => ({
        cashierName: name,
        orderCount: orders.length,
        sampleOrder: orders[0]
          ? {
              order_id: orders[0].order_id,
              created_at: orders[0].created_at,
              total_price: orders[0].total_price,
            }
          : null,
      })),
    )

    const summaries: ShiftSummary[] = []
    let shiftCounter = 1

    // Create a shift summary for each cashier
    cashierGroups.forEach((cashierOrders, cashierName) => {
      if (cashierOrders.length === 0) return

      // Sort orders by time to get shift start/end
      const sortedOrders = cashierOrders.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )

      const firstOrder = sortedOrders[0]
      const lastOrder = sortedOrders[sortedOrders.length - 1]

      // Determine shift type based on time
      const startHour = new Date(firstOrder.created_at).getHours()
      let shiftType = "morning"
      if (startHour >= 14 && startHour < 22) {
        shiftType = "evening"
      } else if (startHour >= 22 || startHour < 6) {
        shiftType = "night"
      }

      const summary: ShiftSummary = {
        shift_id: `generated_${cashierName.replace(/\s+/g, "_")}_${Date.now()}`,
        shift_name: getShiftTypeName(shiftType),
        cashier_name: cashierName,
        start_time: firstOrder.created_at,
        end_time: lastOrder.created_at,
        total_orders: cashierOrders.length,
        total_sales: cashierOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0),
        orders_by_type: {
          "dine-in": cashierOrders.filter((o) => o.order_type === "dine-in").length,
          takeaway: cashierOrders.filter((o) => o.order_type === "takeaway").length,
          delivery: cashierOrders.filter((o) => o.order_type === "delivery").length,
          cafe: cashierOrders.filter((o) => o.order_type === "cafe").length,
        },
        orders_by_status: {
          pending: cashierOrders.filter((o) => o.status === "pending").length,
          completed: cashierOrders.filter((o) => o.status === "completed").length,
          cancelled: cashierOrders.filter((o) => o.status === "cancelled").length,
        },
        orders_by_payment: {
          cash: cashierOrders.filter((o) => o.payment_method === "cash").length,
          card: cashierOrders.filter((o) => o.payment_method === "card").length,
        },
        average_order_value:
          cashierOrders.length > 0
            ? cashierOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0) / cashierOrders.length
            : 0,
        is_active: true, // Assume all generated shifts are active for today
        orders: cashierOrders, // Store the actual orders for display
      }

      summaries.push(summary)
      shiftCounter++
    })

    console.log(`✅ Generated ${summaries.length} shift summaries from orders`)

    // Debug: Log generated summaries
    summaries.forEach((summary, index) => {
      console.log(`📊 Shift ${index + 1}:`, {
        shift_id: summary.shift_id,
        cashier_name: summary.cashier_name,
        total_orders: summary.total_orders,
        total_sales: summary.total_sales,
        orders_by_type: summary.orders_by_type,
        orders_by_status: summary.orders_by_status,
        orders_by_payment: summary.orders_by_payment,
      })
    })

    return summaries
  }

  // Helper function to process shifts into summaries
  const processShiftsToSummaries = async (shifts: any[]): Promise<ShiftSummary[]> => {
    const summaries: ShiftSummary[] = []

    for (const shift of shifts) {
      try {
        // Try to get detailed summary from backend first
        const summaryResponse = await fetch(`${API_BASE_URL}/shifts/summary/${shift.shift_id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
        })

        if (summaryResponse.ok) {
          const summaryResult = await summaryResponse.json()
          if (summaryResult.success && summaryResult.data) {
            // Map backend summary to frontend format
            const backendSummary = summaryResult.data
            const summary: ShiftSummary = {
              shift_id: backendSummary.shift_id,
              shift_name: getShiftTypeName(backendSummary.shift_type),
              cashier_name: backendSummary.cashiers?.map((c: any) => c.username).join(", ") || "غير محدد",
              start_time: backendSummary.start_time,
              end_time: backendSummary.end_time,
              total_orders: backendSummary.total_orders || 0,
              total_sales: backendSummary.total_revenue || 0,
              orders_by_type: {
                "dine-in": 0, // Will be calculated from orders if not provided
                takeaway: 0,
                delivery: 0,
                cafe: backendSummary.cafe_revenue
                  ? Math.round(
                      backendSummary.cafe_revenue / (backendSummary.total_revenue / backendSummary.total_orders || 1),
                    )
                  : 0,
              },
              orders_by_status: {
                pending: 0, // Will be calculated from orders if not provided
                completed: backendSummary.total_orders || 0,
                cancelled: 0,
              },
              orders_by_payment: {
                cash: 0, // Will be calculated from orders if not provided
                card: 0,
              },
              average_order_value:
                backendSummary.total_orders > 0 ? backendSummary.total_revenue / backendSummary.total_orders : 0,
              is_active: !backendSummary.end_time || !shift.is_closed,
            }
            summaries.push(summary)
            continue
          }
        }

        // Fallback: create summary from basic shift data and orders
        console.log(`📊 Creating manual summary for shift ${shift.shift_id}`)

        const orders = await fetchOrders()
        const shiftOrders = orders.filter(
          (order) =>
            order.shift?.shift_id === shift.shift_id ||
            (order.created_at &&
              new Date(order.created_at).toDateString() ===
                new Date(shift.start_time || shift.created_at).toDateString()),
        )

        const summary: ShiftSummary = {
          shift_id: shift.shift_id,
          shift_name: getShiftTypeName(shift.shift_type) || `وردية ${shift.shift_id.slice(-4)}`,
          cashier_name: getCashierName(shift) || "غير محدد",
          start_time: shift.start_time || shift.created_at,
          end_time: shift.end_time,
          total_orders: shiftOrders.length,
          total_sales: shiftOrders.reduce((sum, order) => sum + normalizePrice(order.total_price), 0),
          orders_by_type: {
            "dine-in": shiftOrders.filter((o) => o.order_type === "dine-in").length,
            takeaway: shiftOrders.filter((o) => o.order_type === "takeaway").length,
            delivery: shiftOrders.filter((o) => o.order_type === "delivery").length,
            cafe: shiftOrders.filter((o) => o.order_type === "cafe").length,
          },
          orders_by_status: {
            pending: shiftOrders.filter((o) => o.status === "pending").length,
            completed: shiftOrders.filter((o) => o.status === "completed").length,
            cancelled: shiftOrders.filter((o) => o.status === "cancelled").length,
          },
          orders_by_payment: {
            cash: shiftOrders.filter((o) => o.payment_method === "cash").length,
            card: shiftOrders.filter((o) => o.payment_method === "card").length,
          },
          average_order_value:
            shiftOrders.length > 0
              ? shiftOrders.reduce((sum, order) => sum + normalizePrice(order.total_price), 0) / shiftOrders.length
              : 0,
          is_active: !shift.end_time && !shift.is_closed,
        }

        summaries.push(summary)
      } catch (error) {
        console.warn(`⚠️ Failed to get summary for shift ${shift.shift_id}:`, error)
      }
    }

    console.log(`✅ Processed ${summaries.length} shift summaries`)
    return summaries
  }

  // Helper function to get shift type name in Arabic
  const getShiftTypeName = (shiftType: string): string => {
    switch (shiftType?.toLowerCase()) {
      case "morning":
        return "وردية صباحية"
      case "evening":
      case "night":
        return "وردية مسائية"
      case "full_day":
        return "وردية كاملة"
      default:
        return shiftType || "وردية غير محددة"
    }
  }

  // Helper function to get cashier name from shift with better extraction
  const getCashierName = (shift: any): string => {
    console.log("🔍 Extracting cashier name from shift:", shift)

    // Try multiple possible paths for cashier name
    if (shift.opened_by_user?.full_name) return shift.opened_by_user.full_name
    if (shift.opened_by_user?.username) return shift.opened_by_user.username
    if (shift.cashier?.full_name) return shift.cashier.full_name
    if (shift.cashier?.username) return shift.cashier.username
    if (shift.opened_by?.full_name) return shift.opened_by.full_name
    if (shift.opened_by?.username) return shift.opened_by.username
    if (shift.user?.full_name) return shift.user.full_name
    if (shift.user?.username) return shift.user.username
    if (shift.workers?.length > 0) {
      const workerNames = shift.workers
        .map((w: any) => w.worker?.full_name || w.full_name || w.username || w.name)
        .filter(Boolean)
      if (workerNames.length > 0) return workerNames.join(", ")
    }

    console.warn("⚠️ Could not extract cashier name from shift:", shift)
    return "غير محدد"
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
            cafe: 0,
          },
        })
      }

      const activity = cashierMap.get(cashierId)!
      activity.ordersToday += 1
      activity.totalSales += normalizePrice(order.total_price)

      // Safely handle order type assignment
      if (
        order.order_type === "dine-in" ||
        order.order_type === "takeaway" ||
        order.order_type === "delivery" ||
        order.order_type === "cafe"
      ) {
        activity.orderTypes[order.order_type] += 1
      }

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
      const [orders, stats, cancelled, lowStock, shifts] = await Promise.all([
        fetchOrders(),
        fetchOrderStats(),
        fetchCancelledOrders(),
        fetchLowStockItems(),
        fetchShiftSummaries(true), // Force refresh
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

      // Set shift summaries
      setShiftSummaries(shifts)

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
    if (typeof window !== "undefined" && isInitialLoad) {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
      setIsInitialLoad(false)

      // Load initial data only once
      if (!loadingRef.current) {
        loadingRef.current = true
        loadAllData().finally(() => {
          loadingRef.current = false
        })
      }
    }

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!loadingRef.current) {
        loadingRef.current = true
        loadAllData().finally(() => {
          loadingRef.current = false
        })
      }
    }, 30000)

    // Listen for order updates
    const handleOrderAdded = () => {
      console.log("📢 Order added event received in monitoring")
      if (!loadingRef.current) {
        loadingRef.current = true
        loadAllData().finally(() => {
          loadingRef.current = false
        })
      }
    }

    window.addEventListener("orderAdded", handleOrderAdded)

    return () => {
      clearInterval(interval)
      window.removeEventListener("orderAdded", handleOrderAdded)
    }
  }, [isInitialLoad])

  // Effect for shift monitoring filters
  useEffect(() => {
    if (activeTab === "shifts") {
      fetchDetailedShiftSummaries().then(setDetailedShiftSummaries)
    }
  }, [selectedDate, selectedShiftType, selectedShiftStatus, activeTab])

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
        <Button 
          onClick={() => {
            // Clear existing data before refresh to avoid duplicates
            setShiftSummaries([]);
            setDetailedShiftSummaries([]);
            // Then load fresh data
            loadAllData();
          }} 
          variant="outline" 
          disabled={loading}
        >
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
          <TabsTrigger value="shifts">مراقبة الورديات</TabsTrigger>
          <TabsTrigger value="shift-summary">ملخص الورديات</TabsTrigger>
          <TabsTrigger value="cancelled">الطلبات الملغاة</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
          <TabsTrigger value="cafe-orders">طلبات الكافية</TabsTrigger>
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
                        .map((order, index) => (
                          <motion.tr
                            key={`order-${order.order_id}-${index}`}
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
                      key={`cashier-${activity.cashierId}-${index}`}
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
                      <div className="grid grid-cols-4 gap-4 text-center">
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
                        <div key="cafe">
                          <div className="text-lg font-semibold text-orange-600">{activity.orderTypes.cafe}</div>
                          <p className="text-xs text-muted-foreground">كافية</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shift-summary" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-6 h-6" />
                ملخص الورديات اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
                  <p>جاري تحميل ملخصات الورديات...</p>
                </div>
              ) : shiftSummaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Coffee className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد ورديات نشطة اليوم</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {shiftSummaries.map((shift, index) => (
                    <motion.div
                      key={`shift-summary-${shift.shift_id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-lg p-6 ${
                        shift.is_active
                          ? "bg-gradient-to-r from-green-50 to-blue-50 border-green-200"
                          : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
                      }`}
                    >
                      {/* Shift Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              shift.is_active ? "bg-green-100" : "bg-gray-100"
                            }`}
                          >
                            <Coffee className={`h-6 w-6 ${shift.is_active ? "text-green-600" : "text-gray-600"}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{shift.shift_name}</h3>
                            <p className="text-sm text-muted-foreground">الكاشير: {shift.cashier_name}</p>
                            <p className="text-xs text-muted-foreground">
                              بدأت:{" "}
                              {new Date(shift.start_time).toLocaleTimeString("ar-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {shift.end_time && (
                                <>
                                  {" "}
                                  - انتهت:{" "}
                                  {new Date(shift.end_time).toLocaleTimeString("ar-EG", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{formatPrice(shift.total_sales)}</div>
                          <p className="text-sm text-muted-foreground">{shift.total_orders} طلب</p>
                          <Badge variant={shift.is_active ? "default" : "secondary"} className="mt-1">
                            {shift.is_active ? "نشطة" : "منتهية"}
                          </Badge>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      {/* Statistics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{shift.orders_by_type["dine-in"]}</div>
                          <p className="text-xs text-muted-foreground">تناول في المطعم</p>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{shift.orders_by_type.takeaway}</div>
                          <p className="text-xs text-muted-foreground">تيك اواي</p>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{shift.orders_by_type.delivery}</div>
                          <p className="text-xs text-muted-foreground">توصيل</p>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{shift.orders_by_type.cafe}</div>
                          <p className="text-xs text-muted-foreground">كافية</p>
                        </div>
                      </div>
                      {/* Payment & Status Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg border">
                          <h4 className="font-medium text-sm mb-2">طرق الدفع</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">نقدي:</span>
                              <span className="text-xs font-medium">{shift.orders_by_payment.cash}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">كارت:</span>
                              <span className="text-xs font-medium">{shift.orders_by_payment.card}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <h4 className="font-medium text-sm mb-2">حالة الطلبات</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">مكتملة:</span>
                              <span className="text-xs font-medium text-green-600">
                                {shift.orders_by_status.completed}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">قيد التنفيذ:</span>
                              <span className="text-xs font-medium text-yellow-600">
                                {shift.orders_by_status.pending}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">ملغاة:</span>
                              <span className="text-xs font-medium text-red-600">
                                {shift.orders_by_status.cancelled}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <h4 className="font-medium text-sm mb-2">الأداء</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">متوسط الطلب:</span>
                              <span className="text-xs font-medium">{formatPrice(shift.average_order_value)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">معدل الإكمال:</span>
                              <span className="text-xs font-medium">
                                {shift.total_orders > 0
                                  ? Math.round((shift.orders_by_status.completed / shift.total_orders) * 100)
                                  : 0}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Orders Summary */}
                      {(() => {
                        // Get orders for this shift - use stored orders if available, otherwise filter liveOrders
                        let shiftOrders: Order[] = []

                        if (shift.orders && shift.orders.length > 0) {
                          // Use stored orders from generated shift
                          shiftOrders = shift.orders
                        } else {
                          // Fallback to filtering liveOrders by cashier name and time range
                          shiftOrders = liveOrders.filter((order) => {
                            const orderCashier =
                              order.cashier?.full_name ||
                              order.cashier_name ||
                              order.user?.full_name ||
                              "مستخدم غير معروف"
                            const orderTime = new Date(order.created_at)
                            const shiftStart = new Date(shift.start_time)
                            const shiftEnd = shift.end_time ? new Date(shift.end_time) : new Date()

                            return (
                              orderCashier === shift.cashier_name && orderTime >= shiftStart && orderTime <= shiftEnd
                            )
                          })
                        }

                        // Calculate item summaries
                        const itemSummary = new Map<
                          string,
                          {
                            name: string
                            quantity: number
                            totalPrice: number
                            orders: number
                          }
                        >()

                        shiftOrders.forEach((order) => {
                          if (order.items && Array.isArray(order.items)) {
                            order.items.forEach((item) => {
                              const normalizedItem = normalizeOrderItem(item)
                              const itemKey = `${normalizedItem.productName}-${normalizedItem.sizeName}`

                              if (!itemSummary.has(itemKey)) {
                                itemSummary.set(itemKey, {
                                  name: `${normalizedItem.productName} (${normalizedItem.sizeName})`,
                                  quantity: 0,
                                  totalPrice: 0,
                                  orders: 0,
                                })
                              }

                              const summary = itemSummary.get(itemKey)!
                              summary.quantity += normalizedItem.quantity
                              summary.totalPrice += normalizedItem.quantity * normalizedItem.unitPrice
                              summary.orders += 1
                            })
                          }
                        })

                        const topItems = Array.from(itemSummary.values())
                          .sort((a, b) => b.quantity - a.quantity)
                          .slice(0, 5) // Top 5 items

                        return (
                          <div className="space-y-4">
                            {/* Items Summary */}
                            {topItems.length > 0 && (
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  أكثر الأصناف طلباً
                                </h4>
                                <div className="space-y-2">
                                  {topItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {item.quantity} قطعة في {item.orders} طلب
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">
                                          {formatPrice(item.totalPrice)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Recent Orders */}
                            {shiftOrders.length > 0 && (
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                                  <Eye className="w-4 h-4" />
                                  طلبات الوردية ({shiftOrders.length})
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {shiftOrders
                                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                    .map((order) => (
                                      <div
                                        key={order.order_id}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs">#{order.order_id.slice(-6)}</span>
                                            {getOrderTypeBadge(order.order_type)}
                                            {getStatusBadge(order.status)}
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {order.customer_name} •{" "}
                                            {new Date(order.created_at).toLocaleTimeString("ar-EG", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-green-600">{formatPrice(order.total_price)}</p>
                                          {order.items && (
                                            <p className="text-xs text-muted-foreground">{order.items.length} صنف</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                      
                      {/* Workers & Expenses Sections */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {/* Workers Section */}
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="font-medium flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4" />
                            الموظفين ({shift.workers?.length || 0})
                          </h4>
                          <div className="max-h-40 overflow-y-auto">
                            {!shift.workers || shift.workers.length === 0 ? (
                              <div className="text-center text-gray-500 text-sm p-2">لا يوجد موظفين مسجلين</div>
                            ) : (
                              <div className="space-y-2">
                                {shift.workers.map((worker, i) => (
                                  <div key={worker.shift_worker_id || `worker-${i}`} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <div>
                                      <div className="font-medium">{worker.worker?.full_name || "غير محدد"}</div>
                                      <div className="text-xs text-gray-500">
                                        {worker.is_active ? "نشط" : "منتهي"} • {worker.hours_worked?.toFixed(1) || "0.0"} ساعة
                                      </div>
                                    </div>
                                    <div className="font-medium text-right">{formatPrice(worker.calculated_salary || 0)}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expenses Section */}
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="font-medium flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4" />
                            المصروفات ({shift.expenses?.length || 0})
                          </h4>
                          <div className="max-h-40 overflow-y-auto">
                            {!shift.expenses || shift.expenses.length === 0 ? (
                              <div className="text-center text-gray-500 text-sm p-2">لا توجد مصروفات مسجلة</div>
                            ) : (
                              <div className="space-y-2">
                                {shift.expenses.map((expense, i) => (
                                  <div key={expense.expense_id || `expense-${i}`} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <div>
                                      <div className="font-medium">{expense.title}</div>
                                      <div className="text-xs text-gray-500">
                                        {expense.category} • بواسطة: {expense.created_by?.full_name || "غير محدد"}
                                      </div>
                                    </div>
                                    <div className="font-medium text-red-600 text-right">{formatPrice(expense.amount || 0)}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Net Profit Section */}
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            صافي الربح بعد المصاريف
                          </h4>
                          <div className="text-lg font-bold text-green-700">
                            {formatPrice((shift.total_sales || 0) - (shift.total_expenses || 0) - (shift.total_staff_cost || 0))}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div className="text-center">
                            <div className="font-semibold">إجمالي المبيعات</div>
                            <div className="text-green-600">{formatPrice(shift.total_sales || 0)}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">مصاريف</div>
                            <div className="text-red-600">-{formatPrice(shift.total_expenses || 0)}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">رواتب</div>
                            <div className="text-red-600">-{formatPrice(shift.total_staff_cost || 0)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions for Shifts */}
                      <div className="flex gap-2 mt-4">
                        {shift.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to cashier dashboard or shift details
                              console.log("View shift details:", shift.shift_id)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            عرض التفاصيل
                          </Button>
                        )}
                          
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`هل أنت متأكد من حذف هذه الوردية؟ (${shift.shift_name} - ${shift.cashier_name})`)) {
                              try {
                                const success = await deleteShift(shift.shift_id)
                                if (success) {
                                  // Success message
                                  alert("تم حذف الوردية بنجاح")
                                  // Refresh data after successful delete
                                  setShiftSummaries([])
                                  fetchShiftSummaries(true).then(setShiftSummaries)
                                } else {
                                  // Error message
                                  alert("لا يمكن حذف الوردية لأنها مرتبطة بطلبات. قم بحذف الطلبات المرتبطة أولاً.")
                                }
                              } catch (error) {
                                console.error("Delete error:", error)
                                alert("فشل في حذف الوردية - هناك طلبات مرتبطة بهذه الوردية")
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          حذف
                        </Button>
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
                      key={cancelledOrder.cancelled_order_id || cancelledOrder.original_order_id || `cancelled-order-${Math.random()}`}
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

        <TabsContent value="shifts" className="m-0 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5" />
                مراقبة الورديات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="date-filter">التاريخ</Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type-filter">نوع الوردية</Label>
                  <Select value={selectedShiftType} onValueChange={setSelectedShiftType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="كل الأنواع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأنواع</SelectItem>
                      <SelectItem value="morning">صباحية</SelectItem>
                      <SelectItem value="night">مسائية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter">حالة الوردية</Label>
                  <Select value={selectedShiftStatus} onValueChange={setSelectedShiftStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="كل الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="opened">مفتوحة</SelectItem>
                      <SelectItem value="closed">مغلقة</SelectItem>
                      <SelectItem value="requested_close">طلب إغلاق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      // Force refresh to clear any stale data
                      setShiftSummaries([]); 
                      setDetailedShiftSummaries([]);
                      setLoadingShifts(true);
                      
                      // Reset all data to force a clean refresh
                      fetchShiftSummaries(true)
                        .then((data) => {
                          setShiftSummaries(data);
                          setLoadingShifts(false);
                        })
                        .catch((error) => {
                          console.error("Failed to refresh shifts:", error);
                          setLoadingShifts(false);
                        });
                    }}
                    disabled={loadingShifts}
                    className="w-full"
                  >
                    {loadingShifts ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        جاري التحديث...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        تحديث
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shift Summaries */}
          {loadingShifts ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>جاري تحميل الورديات...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : detailedShiftSummaries.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد ورديات للفترة المحددة</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {detailedShiftSummaries.map((shift, index) => (
                <Card key={`detailed-shift-${shift.shift_id}-${index}`} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{getShiftTypeName(shift.type)}</CardTitle>
                          <p className="text-blue-100 text-sm">بواسطة: {shift.opened_by.full_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={shift.status === "opened" ? "default" : "secondary"} className="mb-2">
                          {shift.status === "opened" ? "مفتوحة" : "مغلقة"}
                        </Badge>
                        <div className="text-sm text-blue-100">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(shift.start_time).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {shift.end_time && (
                              <>
                                {" - "}
                                {new Date(shift.end_time).toLocaleTimeString("ar-EG", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">إجمالي المبيعات</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{formatPrice(shift.total_sales)}</p>
                        <p className="text-sm text-green-600">
                          {shift.total_orders} طلب | معدل {formatPrice(shift.average_order_value || 0)}
                        </p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-800">طلبات حسب النوع</span>
                        </div>
                        <p className="text-lg font-bold text-blue-900">
                          داخلي: {shift.orders_by_type?.["dine-in"] || 0}
                        </p>
                        <p className="text-sm text-blue-600">
                          خارجي: {shift.orders_by_type?.takeaway || 0} | توصيل: {shift.orders_by_type?.delivery || 0}
                        </p>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt className="w-5 h-5 text-orange-600" />
                          <span className="font-medium text-orange-800">حالة الطلبات</span>
                        </div>
                        <p className="text-lg font-bold text-orange-900">
                          مكتمل: {shift.orders_by_status?.completed || 0}
                        </p>
                        <p className="text-sm text-orange-600">
                          قيد التنفيذ: {shift.orders_by_status?.pending || 0} | ملغي:{" "}
                          {shift.orders_by_status?.cancelled || 0}
                        </p>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-purple-800">صافي الربح</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                          {formatPrice(shift.total_sales - shift.total_staff_cost - shift.total_expenses)}
                        </p>
                        <p className="text-sm text-purple-600">بعد المصاريف</p>
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Orders Breakdown */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          تفصيل الطلبات
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">تناول في المطعم</span>
                            <Badge variant="outline">{shift.orders_by_type["dine-in"]}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">تيك أواي</span>
                            <Badge variant="outline">{shift.orders_by_type.takeaway}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">توصيل</span>
                            <Badge variant="outline">{shift.orders_by_type.delivery}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">كافية</span>
                            <Badge variant="outline">{shift.orders_by_type.cafe}</Badge>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-sm">مكتملة</span>
                            <Badge className="bg-green-100 text-green-800">{shift.orders_by_status.completed}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                            <span className="text-sm">قيد التنفيذ</span>
                            <Badge className="bg-yellow-100 text-yellow-800">{shift.orders_by_status.pending}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                            <span className="text-sm">ملغاة</span>
                            <Badge className="bg-red-100 text-red-800">{shift.orders_by_status.cancelled}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Workers */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          الموظفين ({shift.workers.length})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {shift.workers.map((worker) => (
                            <div key={worker.shift_worker_id} className="p-3 bg-gray-50 rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{worker.worker.full_name}</p>
                                  <p className="text-xs text-gray-600">{worker.worker.status}</p>
                                </div>
                                <div className="text-right text-xs">
                                  {worker.is_active ? (
                                    <Badge className="bg-green-100 text-green-800 mb-1">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      نشط
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="mb-1">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      منتهي
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 flex justify-between text-xs text-gray-600">
                                <span>{worker.hours_worked.toFixed(1)} ساعة</span>
                                <span>{formatPrice(worker.calculated_salary)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expenses */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          المصروفات ({shift.expenses.length})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {shift.expenses.map((expense) => (
                            <div key={expense.expense_id} className="p-3 bg-gray-50 rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{expense.title}</p>
                                  <p className="text-xs text-gray-600">{expense.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-sm text-red-600">{formatPrice(expense.amount)}</p>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">بواسطة: {expense.created_by.full_name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cafe-orders" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-600" />
                طلبات الكافية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Filter cafe orders: order_type === 'cafe' or has table_number
                const cafeOrders = liveOrders.filter(
                  (order) =>
                    order.order_type === "cafe" ||
                    (order.table_number && order.table_number !== "" && order.table_number !== null),
                )

                if (cafeOrders.length === 0) {
                  return <div className="text-center py-6 text-muted-foreground">لا توجد طلبات كافية اليوم</div>
                }

                // Group by shift
                const grouped = { morning: [], night: [] } as { morning: Order[]; night: Order[] }
                cafeOrders.forEach((order) => {
                  let shiftType = "morning"
                  const shiftName = order.shift?.shift_name || order.shift?.shift_id || ""
                  if (
                    shiftName.includes("night") ||
                    shiftName.includes("مسائية") ||
                    shiftName.toLowerCase().includes("evening")
                  ) {
                    shiftType = "night"
                  }
                  grouped[shiftType].push(order)
                })

                const shiftLabels = { morning: "وردية صباحية", night: "وردية مسائية" }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(["morning", "night"] as const).map((shiftKey) => (
                      <div key={`cafe-shift-${shiftKey}`}>
                        <div className="font-bold text-lg mb-2 text-amber-700 flex items-center gap-2">
                          <span className="w-2 h-5 bg-amber-500 rounded-full inline-block"></span>
                          {shiftLabels[shiftKey]} ({grouped[shiftKey].length} طلب)
                        </div>
                        {grouped[shiftKey].length === 0 ? (
                          <div className="text-center text-muted-foreground py-4">لا توجد طلبات في هذه الوردية</div>
                        ) : (
                          <div className="space-y-4">
                            {grouped[shiftKey]
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .map((order, orderIndex) => (
                                <Card
                                  key={`cafe-order-${shiftKey}-${order.order_id}-${orderIndex}`}
                                  className="border-l-4 border-l-amber-500"
                                >
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-lg font-mono">#{order.order_id.slice(-6)}</h3>
                                        {getStatusBadge(order.status)}
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-lg text-amber-700">
                                          {formatPrice(order.total_price)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {new Date(order.created_at).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                      <User className="w-4 h-4" />
                                      <span>{order.customer_name || order.staff_name || "-"}</span>
                                    </div>
                                    <div className="space-y-2 mb-2">
                                      <h4 className="font-medium text-sm text-gray-700">
                                        عناصر الطلب ({order.items?.length || 0}):
                                      </h4>
                                      {order.items && order.items.length > 0 ? (
                                        order.items.map((itemRaw, idx) => {
                                          const item = normalizeOrderItem(itemRaw)
                                          return (
                                            <div
                                              key={`cafe-item-${shiftKey}-${order.order_id}-${item.order_item_id || idx}`}
                                              className="flex flex-col md:flex-row md:items-center md:justify-between bg-amber-50 p-2 rounded border mb-1"
                                            >
                                              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                                                <span className="font-medium">{item.productName}</span>
                                                {item.sizeName && item.sizeName !== "عادي" && (
                                                  <span className="text-gray-500 text-xs">({item.sizeName})</span>
                                                )}
                                                <span className="text-gray-500 text-xs">x{item.quantity}</span>
                                                {item.notes && (
                                                  <span className="text-xs italic text-gray-500">
                                                    ملاحظة: {item.notes}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex flex-col items-end min-w-[100px]">
                                                <span className="font-bold text-amber-700">
                                                  {formatPrice(item.unitPrice)}
                                                </span>
                                                {item.extras && item.extras.length > 0 && (
                                                  <div className="text-xs text-blue-600 mt-1 text-right">
                                                    إضافات:{" "}
                                                    {item.extras
                                                      .map((extra, extraIndex) => (
                                                        <span
                                                          key={`extra-${extraIndex}-${extra.extra_id || extraIndex}`}
                                                        >
                                                          {extra.name || "[إضافة]"}
                                                          {extra.price ? ` (${formatPrice(extra.price)})` : ""}
                                                        </span>
                                                      ))
                                                      .reduce((prev, curr, index) => [
                                                        prev,
                                                        index > 0 ? ", " : "",
                                                        curr,
                                                      ])}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })
                                      ) : (
                                        <div className="text-muted-foreground">لا توجد أصناف في هذا الطلب</div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        )}
                        <div className="text-right font-bold text-amber-800 mt-2">
                          إجمالي الوردية:{" "}
                          {formatPrice(grouped[shiftKey].reduce((sum, o) => sum + normalizePrice(o.total_price), 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
