"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Phone, User, Trash2, Loader2, RefreshCw } from "lucide-react"
import { useReactToPrint } from "react-to-print"

// Constants
const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

// GLOBAL SINGLETON TO PREVENT MULTIPLE FETCHES
let globalFetchInProgress = false
let globalFetchPromise: Promise<any> | null = null

// Types
interface OrderItem {
  order_item_id: string
  quantity: number
  unit_price: string | number
  notes?: string
  product?: {
    product_id: string
    name: string
    category: {
      category_id: string
      name: string
    }
  }
  productSize?: {
    product_size_id: string
    price: string
    size: {
      size_id: string
      size_name: string
    }
  }
  product_size?: {
    product_name: string
    size_name: string
    price: string | number
    size?: {
      size_name: string
    }
  }
  extras?: Array<{
    extra_id?: string
    name?: string
    price?: string | number
    quantity?: number
  }>
  product_name?: string
  size_name?: string
  price?: number
  total_price?: number
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
  }
  shift?: {
    shift_id: string
    shift_name?: string
  }
  items: OrderItem[]
  cashier_name?: string
}

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  ordersByType: {
    "dine-in": number
    takeaway: number
    delivery: number
  }
  ordersByStatus: {
    completed: number
    cancelled: number
  }
}

interface CategorySales {
  categoryName: string
  products: {
    [productName: string]: {
      quantity: number
      totalAmount: number
      unitPrice: number
    }
  }
  categoryTotal: number
}

// Helper Functions
const normalizePrice = (price: string | number): number => {
  if (typeof price === "string") {
    return Number.parseFloat(price) || 0
  }
  return Number(price) || 0
}

const formatPrice = (price: string | number): string => {
  return `ج.م${normalizePrice(price).toFixed(2)}`
}

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// FIXED: Enhanced normalizeOrderItem with better error handling
const normalizeOrderItem = (item: any): OrderItem => {
  let productName = "منتج غير محدد"
  let sizeName = "عادي"
  let unitPrice = "0"

  try {
    // Strategy 1: Check product_size (API response structure) - PRIORITY
    if (item.product_size) {
      productName = item.product_size.product_name || productName

      // FIXED: Safe access to size_name
      if (item.product_size.size && item.product_size.size.size_name) {
        sizeName = item.product_size.size.size_name
      } else if (item.product_size.size_name) {
        sizeName = item.product_size.size_name
      }

      unitPrice = String(item.product_size.price || item.unit_price || 0)
      console.log(`✅ Found product_size data: ${productName} (${sizeName}) - ${unitPrice}`)
    }
    // Strategy 2: Check product object with productSize
    else if (item.product && item.product.name) {
      productName = item.product.name
      if (item.productSize?.size?.size_name) {
        sizeName = item.productSize.size.size_name
        unitPrice = String(item.productSize.price || item.unit_price || 0)
      } else {
        unitPrice = String(item.unit_price || 0)
      }
      console.log(`✅ Found product object: ${productName} (${sizeName}) - ${unitPrice}`)
    }
    // Strategy 3: Direct fields (from localStorage or other sources)
    else if (item.product_name) {
      productName = item.product_name
      sizeName = item.size_name || sizeName
      unitPrice = String(item.unit_price || item.price || 0)
      console.log(`✅ Found direct fields: ${productName} (${sizeName}) - ${unitPrice}`)
    }
    // Strategy 4: Try to extract from any available data
    else {
      const possibleNames = [item.name, item.product?.name, item.productName].filter(Boolean)
      if (possibleNames.length > 0) {
        productName = possibleNames[0]
        console.log(`✅ Found alternative name: ${productName}`)
      } else {
        console.warn(`❌ No product name found for item:`, item)
      }
      unitPrice = String(item.unit_price || item.price || 0)
    }
  } catch (error) {
    console.error(`❌ Error normalizing order item:`, error, item)
    // Use fallback values
    productName = item.product_name || item.name || "منتج غير محدد"
    sizeName = item.size_name || "عادي"
    unitPrice = String(item.unit_price || item.price || 0)
  }

  // FIXED: Better extras handling with multiple fallback strategies
  let processedExtras = []
  if (Array.isArray(item.extras) && item.extras.length > 0) {
    processedExtras = item.extras.map((extra) => {
      // Strategy 1: Check for direct name field
      let extraName = extra.name || extra.extra_name || extra.extraName

      // Strategy 2: Check if there's a nested extra object
      if (!extraName && extra.extra) {
        extraName = extra.extra.name || extra.extra.extra_name
      }

      // Strategy 3: Check for category-based extra lookup
      if (!extraName && extra.extra_id) {
        // This would require a lookup table, but for now use fallback
        extraName = `إضافة ${extra.extra_id.slice(-4)}`
      }

      // Final fallback
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
  } else if (item.extras && typeof item.extras === "object") {
    // Handle single extra object
    const extra = item.extras
    let extraName = extra.name || extra.extra_name || extra.extraName

    if (!extraName && extra.extra) {
      extraName = extra.extra.name || extra.extra.extra_name
    }

    if (!extraName && extra.extra_id) {
      extraName = `إضافة ${extra.extra_id.slice(-4)}`
    }

    if (!extraName) {
      extraName = "[إضافة غير معروفة]"
    }

    processedExtras = [
      {
        extra_id: extra.extra_id || extra.id || `extra_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: extraName,
        price: typeof extra.price === "string" ? Number.parseFloat(extra.price) : extra.price || 0,
        quantity: extra.quantity || 1,
      },
    ]
  }

  return {
    ...item,
    order_item_id: item.order_item_id || `item_${generateId()}`,
    product_name: productName,
    size_name: sizeName,
    unit_price: unitPrice,
    quantity: item.quantity || 0,
    extras: processedExtras,
  }
}

const normalizeOrder = (order: any): Order => {
  return {
    ...order,
    order_id: order.order_id || `order_${generateId()}`,
    total_price: typeof order.total_price === "string" ? order.total_price : String(order.total_price || 0),
    cashier_name: order.cashier?.fullName || order.cashier?.full_name || order.cashier_name || "مستخدم غير معروف",
    customer_name: order.customer_name || "عميل عابر",
    // FIXED: Better phone number handling
    phone_number: order.phone_number || order.customer_phone || null,
    order_type: order.order_type || "dine-in",
    status: "completed", // Force all orders to show as completed
    payment_method: order.payment_method || "cash",
    created_at: order.created_at || new Date().toISOString(),
    items: Array.isArray(order.items) ? order.items.map(normalizeOrderItem) : [],
  }
}

// FIXED: Enhanced fetchOrderItems with better error handling
const fetchOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  try {
    console.log(`🔍 Fetching items for order ${orderId}`)
    const response = await fetch(`${API_BASE_URL}/order-items/order/${orderId}`)

    if (response.ok) {
      const result = await response.json()
      console.log(`📦 Items response for order ${orderId}:`, result)

      if (result.success && result.data) {
        let items = []

        if (Array.isArray(result.data.order_items)) {
          items = result.data.order_items
        } else if (Array.isArray(result.data)) {
          items = result.data
        }

        console.log(`✅ Found ${items.length} items for order ${orderId}`)
        // TEMPORARY DEBUG: Log extras structure
        items.forEach((item, index) => {
          if (item.extras && item.extras.length > 0) {
            console.log(
              `🔍 DEBUG - Item ${index} extras for ${item.product_size?.product_name}:`,
              JSON.stringify(item.extras, null, 2),
            )
          }
        })
        return items.map(normalizeOrderItem)
      }
    } else {
      console.warn(`❌ Failed to fetch items for order ${orderId}, status:`, response.status)
    }
  } catch (error) {
    console.error(`❌ Error fetching items for order ${orderId}:`, error)
  }

  return []
}

// FIXED: SINGLETON FETCH FUNCTION TO PREVENT DUPLICATES
const fetchFromAPI = async (): Promise<Order[]> => {
  // If already fetching, return the existing promise
  if (globalFetchInProgress && globalFetchPromise) {
    console.log("🔄 Reusing existing fetch promise...")
    return await globalFetchPromise
  }

  // Set global flag and create new promise
  globalFetchInProgress = true

  globalFetchPromise = (async () => {
    try {
      const endpoints = [
        `${API_BASE_URL}/orders/status/active`,
        `${API_BASE_URL}/orders/status/completed`,
        `${API_BASE_URL}/orders/status/cancelled`,
      ]

      console.log(`🌐 Starting SINGLETON API fetch from ${endpoints.length} endpoints`)

      const promises = endpoints.map(async (endpoint) => {
        try {
          console.log(`🌐 Fetching from: ${endpoint}`)
          const response = await fetch(endpoint)
          if (response.ok) {
            const result = await response.json()
            console.log(`📊 Response from ${endpoint}:`, result)

            if (result.success && result.data) {
              const orders = Array.isArray(result.data.orders)
                ? result.data.orders
                : Array.isArray(result.data)
                  ? result.data
                  : []

              console.log(`✅ Found ${orders.length} orders from ${endpoint}`)
              return orders
            }
          } else {
            console.warn(`❌ Endpoint ${endpoint} failed with status:`, response.status)
          }
          return []
        } catch (error) {
          console.warn(`❌ Failed to fetch from ${endpoint}:`, error)
          return []
        }
      })

      const results = await Promise.all(promises)
      let combinedOrders = results.flat()

      // Fallback to general endpoint if no orders found
      if (combinedOrders.length === 0) {
        console.log("🔄 No orders from status endpoints, trying general endpoint...")
        try {
          const response = await fetch(`${API_BASE_URL}/orders?page=1&limit=100`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              const orders = Array.isArray(result.data.orders)
                ? result.data.orders
                : Array.isArray(result.data)
                  ? result.data
                  : []
              combinedOrders = orders
            }
          }
        } catch (error) {
          console.warn("❌ General endpoint also failed:", error)
        }
      }

      console.log(`📈 Total orders before processing: ${combinedOrders.length}`)

      // FIXED: Better error handling for fetching items
      const ordersWithItems = await Promise.all(
        combinedOrders.map(async (order: any) => {
          const orderId = order.order_id || order.id
          console.log(`🔍 Fetching items for order ${orderId} (${order.status})`)

          try {
            const orderItems = await fetchOrderItems(orderId)
            return {
              ...order,
              items: orderItems,
            }
          } catch (error) {
            console.error(`❌ Failed to fetch items for order ${orderId}:`, error)
            return {
              ...order,
              items: [], // Return empty items array on error
            }
          }
        }),
      )

      const finalOrders = ordersWithItems.filter((order) => order && order.order_id).map(normalizeOrder)

      console.log(`🎯 Final processed orders: ${finalOrders.length}`)
      return finalOrders
    } catch (error) {
      console.error("❌ API fetch failed:", error)
      return []
    } finally {
      // Reset global flags
      globalFetchInProgress = false
      globalFetchPromise = null
    }
  })()

  return await globalFetchPromise
}

const fetchFromLocalStorage = (): Order[] => {
  try {
    const localOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]")
    return localOrders.filter((order: any) => order && order.order_id).map(normalizeOrder)
  } catch (error) {
    console.error("Failed to fetch from localStorage:", error)
    return []
  }
}

const deleteOrderFromAPI = async (orderId: string, reason: string, cashier: string): Promise<boolean> => {
  try {
    console.log(`🗑️ Attempting to delete order ${orderId}`)
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deletion_reason: reason,
        deleted_by: cashier,
      }),
    })

    console.log(`🗑️ Delete response status: ${response.status}`)

    if (response.ok) {
      console.log(`✅ Order ${orderId} deleted successfully`)
      return true
    } else {
      const errorText = await response.text()
      console.error(`❌ Delete failed: ${response.status} - ${errorText}`)
      return false
    }
  } catch (error) {
    console.error("❌ API delete failed:", error)
    return false
  }
}

const deleteOrderFromLocalStorage = (orderId: string): void => {
  try {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]")
    const updatedOrders = savedOrders.filter((order: Order) => order.order_id !== orderId)
    localStorage.setItem("savedOrders", JSON.stringify(updatedOrders))
  } catch (error) {
    console.error("Failed to update localStorage:", error)
  }
}

// Main Component
export default function OrdersPageFinalFix() {
  // State
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [currentCashier, setCurrentCashier] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const printAllRef = useRef<HTMLDivElement>(null)

  // FIXED: Use component-level ref for additional protection
  const componentFetchInProgress = useRef(false)
  const lastFetchTime = useRef(0)

  // FIXED: ULTIMATE FETCH FUNCTION WITH MULTIPLE PROTECTIONS
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    const now = Date.now()

    // Debounce: Don't fetch if last fetch was less than 2 seconds ago (unless forced)
    if (!forceRefresh && now - lastFetchTime.current < 2000) {
      console.log("⏰ Debounced: Too soon since last fetch, skipping...")
      return
    }

    // Component-level protection
    if (componentFetchInProgress.current) {
      console.log("⚠️ Component fetch already in progress, skipping...")
      return
    }

    // Global protection (handled in fetchFromAPI)
    if (globalFetchInProgress && !forceRefresh) {
      console.log("🌍 Global fetch in progress, skipping...")
      return
    }

    try {
      componentFetchInProgress.current = true
      lastFetchTime.current = now
      setLoading(true)
      setError(null)
      console.log("🚀 Starting PROTECTED fetchOrders...")

      // Fetch from both API and localStorage
      const [apiOrders, localOrders] = await Promise.all([fetchFromAPI(), Promise.resolve(fetchFromLocalStorage())])

      // FIXED: Better duplicate removal using Set for order IDs
      const seenOrderIds = new Set<string>()
      const uniqueOrders: Order[] = []

      // Add API orders first (they have priority)
      apiOrders.forEach((order) => {
        if (order.order_id && !seenOrderIds.has(order.order_id)) {
          seenOrderIds.add(order.order_id)
          uniqueOrders.push(order)
        }
      })

      // Add localStorage orders that don't exist in API
      localOrders.forEach((order) => {
        if (order.order_id && !seenOrderIds.has(order.order_id)) {
          seenOrderIds.add(order.order_id)
          uniqueOrders.push(order)
        }
      })

      // Sort by creation date (newest first)
      const finalOrders = uniqueOrders.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })

      console.log(`🎯 FINAL UNIQUE orders: ${finalOrders.length}`)
      console.log(`📋 Order IDs: ${finalOrders.map((o) => o.order_id.slice(-6)).join(", ")}`)

      setOrders(finalOrders)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch orders")
      setOrders([])
    } finally {
      setLoading(false)
      componentFetchInProgress.current = false
    }
  }, [])

  // Calculate Stats
  const calculateStats = (orders: Order[]): OrderStats => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + normalizePrice(order.total_price), 0)

    const ordersByType = {
      "dine-in": orders.filter((o) => o.order_type === "dine-in").length,
      takeaway: orders.filter((o) => o.order_type === "takeaway").length,
      delivery: orders.filter((o) => o.order_type === "delivery").length,
    }

    const ordersByStatus = {
      completed: orders.length, // All orders show as completed
      cancelled: 0,
    }

    return {
      totalOrders,
      totalRevenue,
      ordersByType,
      ordersByStatus,
    }
  }

  const calculateCategorySales = (): CategorySales[] => {
    const categoryMap = new Map<string, CategorySales>()

    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (!item) return

          const categoryName = item.product?.category?.name || "فئة غير محددة"
          const productName = item.product_name || "[اسم المنتج غير متوفر]"
          const quantity = item.quantity || 0
          const unitPrice = normalizePrice(item.unit_price)
          const totalAmount = unitPrice * quantity

          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, {
              categoryName,
              products: {},
              categoryTotal: 0,
            })
          }

          const category = categoryMap.get(categoryName)!

          if (!category.products[productName]) {
            category.products[productName] = {
              quantity: 0,
              totalAmount: 0,
              unitPrice: unitPrice,
            }
          }

          category.products[productName].quantity += quantity
          category.products[productName].totalAmount += totalAmount
          category.categoryTotal += totalAmount
        })
      }
    })

    return Array.from(categoryMap.values()).sort((a, b) => b.categoryTotal - a.categoryTotal)
  }

  // Delete Order Handler
  const handleDeleteOrder = async (orderId: string, reason: string) => {
    try {
      setIsDeleting(true)
      console.log(`🗑️ Starting delete process for order ${orderId}`)

      // Try API delete first
      const apiSuccess = await deleteOrderFromAPI(orderId, reason, currentCashier)

      // Always update localStorage regardless of API result
      deleteOrderFromLocalStorage(orderId)
      console.log(`🗑️ Removed order ${orderId} from localStorage`)

      // Refresh orders to update the UI (force refresh)
      await fetchOrders(true)

      // Show appropriate success message
      if (apiSuccess) {
        alert("✅ تم حذف الطلب بنجاح من النظام والتخزين المحلي!")
      } else {
        alert("⚠️ تم حذف الطلب من التخزين المحلي. قد يحتاج إلى حذف يدوي من الخادم.")
      }
    } catch (error: any) {
      console.error("❌ Error deleting order:", error)
      alert(`❌ فشل في حذف الطلب: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // UI Helper Functions
  const getStatusBadge = (status: string) => {
    return <Badge className="bg-green-500">مكتمل</Badge>
  }

  const getOrderTypeBadge = (type: string) => {
    switch (type) {
      case "dine-in":
        return <Badge variant="outline">تناول في المطعم</Badge>
      case "takeaway":
        return <Badge variant="outline">تيك اواي</Badge>
      case "delivery":
        return <Badge variant="outline">توصيل</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // Event Handlers
  const handleDeleteClick = (orderId: string) => {
    setDeleteOrderId(orderId)
    setDeleteReason("")
    setShowDialog(true)
  }

  const handleDialogSubmit = () => {
    if (!deleteOrderId || !deleteReason.trim()) return

    handleDeleteOrder(deleteOrderId, deleteReason)
    setShowDialog(false)
    setDeleteOrderId(null)
    setDeleteReason("")
  }

  const handlePrintAllOrders = useReactToPrint({
    contentRef: printAllRef,
    documentTitle: `تقرير إجمالي الحسابات - ${new Date().toLocaleDateString()}`,
  })

  // FIXED: Simplified and protected effect management
  useEffect(() => {
    // Load current cashier
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
    setCurrentCashier(user?.full_name || user?.name || user?.username || "")

    // Initial fetch
    fetchOrders()

    // FIXED: HEAVILY DEBOUNCED event listener
    let timeoutId: NodeJS.Timeout
    const handleOrderAdded = () => {
      console.log("📢 Order added event received - will refetch in 3 seconds...")
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        console.log("🔄 Executing delayed refetch...")
        fetchOrders(true) // Force refresh
      }, 3000) // 3 second delay to ensure order is fully saved
    }

    window.addEventListener("orderAdded", handleOrderAdded)

    return () => {
      window.removeEventListener("orderAdded", handleOrderAdded)
      clearTimeout(timeoutId)
    }
  }, []) // NO dependencies to prevent infinite loops

  useEffect(() => {
    if (orders.length > 0) {
      setStats(calculateStats(orders))
    }
  }, [orders])

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل الطلبات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">الطلبات والمبيعات</h1>
          <p className="text-gray-600">جميع الطلبات - تم إصلاح مشكلة التكرار نهائياً</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => fetchOrders(true)}
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "جاري التحديث..." : "تحديث"}
          </Button>
          <Button
            onClick={() => handlePrintAllOrders()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={orders.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            طباعة الكل
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
              <div className="text-sm text-gray-600">إجمالي الطلبات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</div>
              <div className="text-sm text-gray-600">إجمالي المبيعات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.ordersByStatus.cancelled}</div>
              <div className="text-sm text-gray-600">طلبات ملغية</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.ordersByStatus.completed}</div>
              <div className="text-sm text-gray-600">طلبات مكتملة</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>جميع الطلبات ({orders.length}) - لا مزيد من التكرار!</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات محفوظة</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <div className="space-y-4 pr-4">
                {orders.map((order) => {
                  const cardClassName = "transition-all duration-200 border-l-4 border-l-green-500"

                  return (
                    <Card key={order.order_id} className={cardClassName}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">طلب #{order.order_id.slice(-6)}</h3>
                            {getStatusBadge(order.status)}
                            {getOrderTypeBadge(order.order_type)}
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">{formatPrice(order.total_price)}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()} -{" "}
                              {new Date(order.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{order.customer_name}</span>
                          </div>
                          {order.phone_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{order.phone_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2 mb-3">
                          <h4 className="font-medium text-sm text-gray-700">
                            عناصر الطلب ({order.items?.length || 0}):
                          </h4>
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                              <div
                                key={`${order.order_id}-${item.order_item_id || index}`}
                                className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                              >
                                <div className="flex-1">
                                  <span className="font-medium">{item.product_name}</span>
                                  {item.size_name && item.size_name !== "عادي" && (
                                    <span className="text-gray-500 ml-2">({item.size_name})</span>
                                  )}
                                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                                  {item.extras && item.extras.length > 0 && (
                                    <div className="text-blue-500 text-xs mt-1">
                                      +{" "}
                                      {item.extras
                                        .map((extra) => {
                                          const extraName = extra?.name || extra?.extra_name || "[إضافة غير معروفة]"
                                          const extraPrice = extra?.price
                                            ? ` (ج.م${normalizePrice(extra.price).toFixed(2)})`
                                            : ""
                                          return `${extraName}${extraPrice}`
                                        })
                                        .join(", ")}
                                    </div>
                                  )}
                                </div>

                                <span className="font-medium">
                                  {formatPrice(normalizePrice(item.unit_price) * item.quantity)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-500 text-sm bg-yellow-50 p-2 rounded">
                              لا توجد عناصر في هذا الطلب - الطلب #{order.order_id.slice(-6)}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center pt-3 border-t text-sm text-gray-600">
                          <span>الكاشير: {order.cashier_name}</span>
                          <span>الدفع: {order.payment_method === "cash" ? "نقدي" : "كارت"}</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(order.order_id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            حذف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سبب حذف الطلب</DialogTitle>
          </DialogHeader>
          <Textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="يرجى كتابة سبب حذف الطلب..."
            rows={4}
          />
          <DialogFooter>
            <Button onClick={handleDialogSubmit} disabled={!deleteReason.trim() || isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "تأكيد الحذف"
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isDeleting}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Content */}
      <div ref={printAllRef} className="hidden print:block">
        <div className="advanced-print-report">
          <div className="report-header">
            <div className="header-content">
              <div className="company-info">
                <h1 className="company-name">Dawar Juha</h1>
                <p className="company-subtitle">Restaurant & Café</p>
              </div>
            </div>
            <div className="report-title-section">
              <h2 className="report-title">تقرير المبيعات التفصيلي حسب الفئات</h2>
              <div className="report-date">
                <p>تاريخ التقرير: {new Date().toLocaleDateString()}</p>
                <p>وقت الإنشاء: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          {stats && (
            <div className="summary-section">
              <h3 className="section-title">ملخص عام</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">إجمالي الطلبات:</span>
                  <span className="summary-value">{stats.totalOrders}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">إجمالي المبيعات:</span>
                  <span className="summary-value">{formatPrice(stats.totalRevenue)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">طلبات مكتملة:</span>
                  <span className="summary-value">{stats.ordersByStatus.completed}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">طلبات ملغية:</span>
                  <span className="summary-value">{stats.ordersByStatus.cancelled}</span>
                </div>
              </div>
            </div>
          )}

          <div className="categories-section">
            <h3 className="section-title">تفصيل المبيعات حسب الفئات</h3>
            {calculateCategorySales().length === 0 ? (
              <div className="no-data">لا توجد مبيعات للعرض</div>
            ) : (
              calculateCategorySales().map((category) => (
                <div key={category.categoryName} className="category-block">
                  <div className="category-header">
                    <h4 className="category-name">{category.categoryName}</h4>
                    <div className="category-total">{formatPrice(category.categoryTotal)}</div>
                  </div>
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>سعر الوحدة</th>
                        <th>الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(category.products).map(([productName, productData]) => (
                        <tr key={productName}>
                          <td className="product-name">{productName}</td>
                          <td className="quantity">{productData.quantity}</td>
                          <td className="unit-price">{formatPrice(productData.unitPrice)}</td>
                          <td className="total-amount">{formatPrice(productData.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>

          <div className="grand-total-section">
            <div className="grand-total-line">
              <span className="grand-total-label">الإجمالي العام:</span>
              <span className="grand-total-amount">
                {formatPrice(calculateCategorySales().reduce((sum, cat) => sum + cat.categoryTotal, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          .advanced-print-report {
            width: 100%;
            font-family: 'Arial', 'Tahoma', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          .report-header {
            border-bottom: 3px solid #333;
            margin-bottom: 20px;
            padding-bottom: 15px;
          }
          .header-content {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          .company-info {
            flex: 1;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 5px 0;
            color: #333;
          }
          .company-subtitle {
            font-size: 16px;
            margin: 0 0 3px 0;
            color: #666;
          }
          .report-title-section {
            text-align: center;
          }
          .report-title {
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #333;
          }
          .report-date p {
            font-size: 11px;
            margin: 0 0 2px 0;
            color: #666;
          }
          .summary-section {
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 12px 0;
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
          }
          .summary-label {
            font-weight: 500;
            color: #555;
          }
          .summary-value {
            font-weight: bold;
            color: #333;
          }
          .categories-section {
            margin-bottom: 25px;
          }
          .category-block {
            margin-bottom: 20px;
            border: 1px solid #333;
            border-radius: 5px;
            overflow: hidden;
          }
          .category-header {
            background-color: #333;
            color: white;
            padding: 10px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .category-name {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
          }
          .category-total {
            font-size: 16px;
            font-weight: bold;
          }
          .products-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
          }
          .products-table th {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
          }
          .products-table td {
            border: 1px solid #ddd;
            padding: 6px 8px;
            font-size: 11px;
          }
          .product-name {
            text-align: right;
            font-weight: 500;
          }
          .quantity {
            text-align: center;
            font-weight: bold;
          }
          .unit-price,
          .total-amount {
            text-align: right;
            font-weight: 500;
          }
          .products-table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .grand-total-section {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 3px double #333;
          }
          .grand-total-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 18px;
            font-weight: bold;
            padding: 10px 0;
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
          }
          .grand-total-label {
            color: #333;
          }
          .grand-total-amount {
            color: #2563eb;
            font-size: 20px;
          }
          .no-data {
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
          }
        }
      `}</style>
    </div>
  )
}
