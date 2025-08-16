"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Phone, User, Trash2, Loader2, RefreshCw, Clock, Users } from "lucide-react"
import { AuthApiService } from "@/lib/services/auth-api"

// Constants
const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

// GLOBAL SINGLETON TO PREVENT MULTIPLE FETCHES
let globalFetchInProgress = false
let globalFetchPromise: Promise<any> | null = null

// Types
interface OrderItem {
  order_item_id: string
  quantity: number
  unit_price: string | number
  notes?: string
  special_instructions?: string
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
  shift_id?: string
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

interface Shift {
  shift_id: string
  shift_name?: string
  start_time: string
  end_time?: string
  status: "active" | "closed" | "pending_close"
  cashier_id: string
  created_at: string
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
  return `${normalizePrice(price).toFixed(2)} ج.م`
}

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Enhanced normalizeOrderItem with better error handling
const normalizeOrderItem = (item: any): OrderItem => {
  let productName = "منتج غير محدد"
  let sizeName = "عادي"
  let unitPrice = "0"

  try {
    // Strategy 1: Check product_size (API response structure) - PRIORITY
    if (item.product_size) {
      productName = item.product_size.product_name || productName
      if (item.product_size.size && item.product_size.size.size_name) {
        sizeName = item.product_size.size.size_name
      } else if (item.product_size.size_name) {
        sizeName = item.product_size.size_name
      }
      unitPrice = String(item.product_size.price || item.unit_price || 0)
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
    }
    // Strategy 3: Direct fields (from localStorage or other sources)
    else if (item.product_name) {
      productName = item.product_name
      sizeName = item.size_name || sizeName
      unitPrice = String(item.unit_price || item.price || 0)
    }
    // Strategy 4: Try to extract from any available data
    else {
      const possibleNames = [item.name, item.product?.name, item.productName].filter(Boolean)
      if (possibleNames.length > 0) {
        productName = possibleNames[0]
      }
      unitPrice = String(item.unit_price || item.price || 0)
    }
  } catch (error) {
    console.error(`❌ Error normalizing order item:`, error, item)
    productName = item.product_name || item.name || "منتج غير محدد"
    sizeName = item.size_name || "عادي"
    unitPrice = String(item.unit_price || item.price || 0)
  }

  // Robust extras handling for both flat and nested structures
  let processedExtras = []
  if (Array.isArray(item.extras) && item.extras.length > 0) {
    processedExtras = item.extras.map((extra: any) => {
      // Support both flat and nested (extra.extra) structures
      const extraObj = extra.extra || extra
      let extraName = extraObj.name || extraObj.extra_name || extraObj.extraName
      if (!extraName && extraObj.extra_id) {
        extraName = `إضافة ${extraObj.extra_id.slice(-4)}`
      }
      if (!extraName) {
        extraName = "[إضافة غير معروفة]"
      }
      return {
        extra_id: extraObj.extra_id || extraObj.id || `extra_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: extraName,
        price: typeof extraObj.price === "string" ? Number.parseFloat(extraObj.price) : extraObj.price || 0,
        quantity: extraObj.quantity ?? 1,
      }
    })
  }

  return {
    ...item,
    order_item_id: item.order_item_id || `item_${generateId()}`,
    product_name: productName,
    size_name: sizeName,
    unit_price: unitPrice,
    quantity: item.quantity || 0,
    extras: processedExtras,
    extrasCount: processedExtras.length,
  }
}

const normalizeOrder = (order: any): Order => {
  // Enhanced cashier name extraction
  let cashierName = "غير محدد"
  // Try multiple sources for cashier name
  if (order.cashier?.full_name) {
    cashierName = order.cashier.full_name
  } else if (order.cashier?.fullName) {
    cashierName = order.cashier.fullName
  } else if (order.cashier?.name) {
    cashierName = order.cashier.name
  } else if (order.cashier_name) {
    cashierName = order.cashier_name
  } else if (order.created_by_name) {
    cashierName = order.created_by_name
  } else if (order.user?.full_name) {
    cashierName = order.user.full_name
  } else if (order.user?.name) {
    cashierName = order.user.name
  }

  return {
    ...order,
    order_id: order.order_id || `order_${generateId()}`,
    total_price: typeof order.total_price === "string" ? order.total_price : String(order.total_price || 0),
    cashier_name: cashierName,
    customer_name: order.customer_name || "عميل عابر",
    phone_number: order.phone_number || order.customer_phone || null,
    order_type: order.order_type || "dine-in",
    status: "completed",
    payment_method: order.payment_method || "cash",
    created_at: order.created_at || new Date().toISOString(),
    shift_id: order.shift_id,
    items: Array.isArray(order.items) ? order.items.map(normalizeOrderItem) : [],
  }
}

// Fetch current user's active shift
const fetchCurrentShift = async (cashierId: string): Promise<Shift | null> => {
  try {
    console.log(`🔍 Fetching shifts for cashier ${cashierId}`)
    const result = await AuthApiService.apiRequest<any>(`/shifts/cashier/${cashierId}`)
    console.log(`📊 Shifts response:`, result)
    if (result.success && result.data) {
      const shifts = Array.isArray(result.data.shifts)
        ? result.data.shifts
        : Array.isArray(result.data)
          ? result.data
          : []

      // Find active shift first
      const activeShift = shifts.find((shift: Shift) => shift.status === "active")
      if (activeShift) {
        console.log(`✅ Found active shift: ${activeShift.shift_id}`)
        return activeShift
      }

      // If no active shift, get the most recent one
      if (shifts.length > 0) {
        const mostRecentShift = shifts.sort(
          (a: Shift, b: Shift) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
        console.log(`✅ Using most recent shift: ${mostRecentShift.shift_id}`)
        return mostRecentShift
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching shifts:`, error)
  }
  return null
}

// Enhanced fetchOrderItems with better error handling
const fetchOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  try {
    console.log(`🔍 Fetching items for order ${orderId}`)
    const result = await AuthApiService.apiRequest<any>(`/order-items/order/${orderId}`)
    console.log(`📦 Items response for order ${orderId}:`, result)
    if (result.success && result.data) {
      let items = []
        if (Array.isArray(result.data.order_items)) {
          items = result.data.order_items
        } else if (Array.isArray(result.data)) {
          items = result.data
        }
        console.log(`✅ Found ${items.length} items for order ${orderId}`)
        return items.map(normalizeOrderItem)
      }
  } catch (error) {
    console.error(`❌ Error fetching items for order ${orderId}:`, error)
  }
  return []
}

// SHIFT-AWARE FETCH FUNCTION (now uses except-cafe endpoint)
const fetchFromAPI = async (shiftId: string): Promise<Order[]> => {
  if (globalFetchInProgress && globalFetchPromise) {
    console.log("🔄 Reusing existing fetch promise...")
    return await globalFetchPromise
  }
  globalFetchInProgress = true
  globalFetchPromise = (async () => {
    try {
      console.log(`🌐 Fetching all non-cafe orders from except-cafe endpoint`)
      // Use the new endpoint with AuthApiService
      const result = await AuthApiService.apiRequest<any>('/orders/except-cafe')
      let orders = []
      console.log(`📊 except-cafe orders response:`, result)
      if (result.success && result.data) {
        orders = Array.isArray(result.data.orders)
          ? result.data.orders
          : Array.isArray(result.data)
            ? result.data
            : []
        console.log(`✅ Found ${orders.length} non-cafe orders`)
      }
      // Filter by shiftId on the frontend
      const filteredOrders = orders.filter((order: any) => order.shift?.shift_id === shiftId || order.shift_id === shiftId)
      // Fetch items for each order (if needed)
      const ordersWithItems = await Promise.all(
        filteredOrders.map(async (order: any) => {
          const orderId = order.order_id || order.id
          try {
            const orderItems = await fetchOrderItems(orderId)
            return {
              ...order,
              items: orderItems,
            }
          } catch (error) {
            return {
              ...order,
              items: [],
            }
          }
        })
      )
      const finalOrders = ordersWithItems.filter((order) => order && order.order_id).map(normalizeOrder)
      return finalOrders
    } catch (error) {
      console.error("❌ API fetch failed:", error)
      return []
    } finally {
      globalFetchInProgress = false
      globalFetchPromise = null
    }
  })()
  return await globalFetchPromise
}

const fetchFromLocalStorage = (shiftId?: string): Order[] => {
  try {
    const localOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]")
    const normalizedOrders = localOrders.filter((order: any) => order && order.order_id).map(normalizeOrder)
    // Filter by shift if shiftId is provided
    if (shiftId) {
      return normalizedOrders.filter((order: Order) => order.shift_id === shiftId)
    }
    return normalizedOrders
  } catch (error) {
    console.error("Failed to fetch from localStorage:", error)
    return []
  }
}

const deleteOrderFromAPI = async (orderId: string, reason: string, cashier: string): Promise<boolean> => {
  try {
    console.log(`🗑️ Attempting to delete order ${orderId}`)
    const result = await AuthApiService.apiRequest<any>(`/orders/${orderId}`, {
      method: "DELETE",
      body: JSON.stringify({
        deletion_reason: reason,
        deleted_by: cashier,
      }),
    })
    console.log(`✅ Order ${orderId} deleted successfully`)
    return true
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

// Enhanced category detection function for specific restaurant categories
const getCategoryName = (item: OrderItem): string => {
  // Method 1: Check product.category.name
  if (item.product?.category?.name) {
    return item.product.category.name
  }

  // Method 2: Check product_size.category.name
  if (
    item.product_size &&
    typeof item.product_size === "object" &&
    "category" in item.product_size &&
    (item.product_size as any).category &&
    typeof (item.product_size as any).category === "object" &&
    "name" in (item.product_size as any).category
  ) {
    return (item.product_size as any).category.name
  }

  // Method 3: Enhanced product name analysis with specific restaurant categories
  const productName = (item.product_name || item.product?.name || "").toLowerCase()

  if (productName) {
    // بيتزا - Pizza category
    if (productName.includes("بيتزا") || productName.includes("pizza") || productName.includes("بيزا")) {
      return "🍕 بيتزا"
    }

    // مكرونات - Pasta category
    if (
      productName.includes("مكرونة") ||
      productName.includes("مكرونات") ||
      productName.includes("باستا") ||
      productName.includes("pasta") ||
      productName.includes("سباجيتي") ||
      productName.includes("spaghetti") ||
      productName.includes("بيني") ||
      productName.includes("penne") ||
      productName.includes("فوتوتشيني") ||
      productName.includes("فيتوتشيني")
    ) {
      return "🍝 مكرونات"
    }

    // كريبات - Crepes category
    if (
      productName.includes("كريب") ||
      productName.includes("كريبة") ||
      productName.includes("كريبات") ||
      productName.includes("crepe") ||
      productName.includes("crepes")
    ) {
      return "🥞 كريبات"
    }

    // كشري - Koshari category
    if (
      productName.includes("كشري") ||
      productName.includes("كشرى") ||
      productName.includes("koshari") ||
      productName.includes("koshary")
    ) {
      return "🍚 كشري"
    }

    // فطاير - Pies/Pastries category
    if (
      productName.includes("فطيرة") ||
      productName.includes("فطاير") ||
      productName.includes("فطائر") ||
      productName.includes("pie") ||
      productName.includes("معجنات") ||
      productName.includes("عجينة") ||
      productName.includes("جبنة وزعتر") ||
      productName.includes("سبانخ") ||
      productName.includes("لحمة مفرومة")
    ) {
      return "🥧 فطاير"
    }

    // سندوشتات - Sandwiches category
    if (
      productName.includes("ساندويتش") ||
      productName.includes("سندوتش") ||
      productName.includes("سندوش") ||
      productName.includes("سندوشة") ||
      productName.includes("سندوشتات") ||
      productName.includes("sandwich") ||
      productName.includes("برجر") ||
      productName.includes("burger") ||
      productName.includes("هوت دوج") ||
      productName.includes("hot dog") ||
      productName.includes("شاورما") ||
      productName.includes("فاهيتا") ||
      productName.includes("كباب") ||
      productName.includes("كفتة") ||
      productName.includes("فراخ مشوية") ||
      productName.includes("تونة") ||
      productName.includes("جبنة رومي") ||
      productName.includes("بسطرمة")
    ) {
      return "🥪 سندوشتات"
    }

    // Additional beverages detection (in case you have drinks)
    if (
      productName.includes("مشروب") ||
      productName.includes("عصير") ||
      productName.includes("قهوة") ||
      productName.includes("شاي") ||
      productName.includes("كولا") ||
      productName.includes("ماء") ||
      productName.includes("كوكا") ||
      productName.includes("بيبسي") ||
      productName.includes("فانتا") ||
      productName.includes("سبرايت") ||
      productName.includes("نسكافيه") ||
      productName.includes("كابتشينو") ||
      productName.includes("لاتيه") ||
      productName.includes("موكا")
    ) {
      return "🥤 مشروبات"
    }

    // Additional desserts detection (in case you have desserts)
    if (
      productName.includes("حلويات") ||
      productName.includes("كيك") ||
      productName.includes("حلوى") ||
      productName.includes("آيس كريم") ||
      productName.includes("تورتة") ||
      productName.includes("جاتوه") ||
      productName.includes("بسكويت") ||
      productName.includes("شوكولاتة")
    ) {
      return "🍰 حلويات"
    }
  }

  // Default category for unmatched items
  return "📦 منتجات أخرى"
}

// Main Component
export default function ShiftAwareOrdersPage() {
  // State
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [shiftLoading, setShiftLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [currentCashier, setCurrentCashier] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Component-level ref for additional protection
  const componentFetchInProgress = useRef(false)
  const lastFetchTime = useRef(0)

  // SHIFT-AWARE FETCH FUNCTION WITH MULTIPLE PROTECTIONS
  const fetchOrders = useCallback(
    async (forceRefresh = false) => {
      if (!currentShift) {
        console.log("⚠️ No current shift available, skipping order fetch")
        return
      }

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

        console.log(`🚀 Starting SHIFT-AWARE fetchOrders for shift: ${currentShift.shift_id}`)

        // Fetch from both API and localStorage for the specific shift
        const [apiOrders, localOrders] = await Promise.all([
          fetchFromAPI(currentShift.shift_id),
          Promise.resolve(fetchFromLocalStorage(currentShift.shift_id)),
        ])

        // Better duplicate removal using Set for order IDs
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

        console.log(`🎯 FINAL UNIQUE orders for shift ${currentShift.shift_id}: ${finalOrders.length}`)
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
    },
    [currentShift],
  )

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
      order.items.forEach((item) => {
        const categoryName = getCategoryName(item)
        const productName = item.product_name || item.product?.name || "منتج غير محدد"
        const unitPrice = normalizePrice(item.unit_price)
        const quantity = item.quantity
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
            unitPrice,
          }
        }

        category.products[productName].quantity += quantity
        category.products[productName].totalAmount += totalAmount
        category.categoryTotal += totalAmount
      })
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

  // Initialize user and shift
  useEffect(() => {
    const initializeUserAndShift = async () => {
      try {
        setShiftLoading(true)
        // Load current user
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
        setCurrentUser(user)
        setCurrentCashier(user?.full_name || user?.name || user?.username || "")

        if (user?.user_id) {
          // Fetch current shift
          const shift = await fetchCurrentShift(user.user_id)
          setCurrentShift(shift)
          if (!shift) {
            setError("لا توجد وردية نشطة. يرجى بدء وردية جديدة.")
          }
        } else {
          setError("لم يتم العثور على بيانات المستخدم. يرجى تسجيل الدخول مرة أخرى.")
        }
      } catch (error) {
        console.error("Error initializing user and shift:", error)
        setError("فشل في تحميل بيانات الوردية")
      } finally {
        setShiftLoading(false)
      }
    }

    initializeUserAndShift()
  }, [])

  // Fetch orders when shift is available
  useEffect(() => {
    if (currentShift && !shiftLoading) {
      fetchOrders()
    }
  }, [currentShift, shiftLoading, fetchOrders])

  // Calculate stats when orders change
  useEffect(() => {
    if (orders.length > 0) {
      setStats(calculateStats(orders))
    }
  }, [orders])

  // Event listener for order updates
  useEffect(() => {
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
  }, [fetchOrders])

  // Loading State
  if (shiftLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل بيانات الوردية...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">طلبات الوردية</h1>
          <div className="flex items-center gap-4 mt-2">
            {currentShift && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  <Clock className="w-3 h-3 mr-1" />
                  {currentShift.shift_name || currentShift.shift_id.slice(-6)}
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  <Users className="w-3 h-3 mr-1" />
                  {currentCashier}
                </Badge>
              </div>
            )}
          </div>
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
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="text-2xl font-bold text-purple-600">{calculateCategorySales().length}</div>
              <div className="text-sm text-gray-600">فئات المنتجات</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            طلبات الوردية ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>جاري تحميل الطلبات...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات في هذه الوردية</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <div className="space-y-4 pr-4">
                {orders.map((order) => (
                  <Card key={order.order_id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">#{order.order_id.slice(-6)}</h3>
                          {getOrderTypeBadge(order.order_type)}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">
                            {formatPrice(
                              order.items.reduce(
                                (sum, item) =>
                                  sum +
                                  ((normalizePrice(item.unit_price) +
                                    (item.extras?.reduce((eSum, extra) => eSum + normalizePrice(extra.price ?? 0), 0) || 0)) *
                                    item.quantity),
                                0
                              )
                            )}
                          </p>
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

                      {/* Order Details Section */}
                      <div className="mb-3 border rounded-lg bg-gray-50 p-3">
                        <h4 className="font-bold text-base text-blue-900 mb-2 border-b pb-1">تفاصيل الطلب</h4>
                        <div className="w-full overflow-x-auto">
                          <table className="min-w-full text-sm text-right">
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="py-1 px-2 font-semibold">المنتج</th>
                                <th className="py-1 px-2 font-semibold">الحجم</th>
                                <th className="py-1 px-2 font-semibold">الكمية</th>
                                <th className="py-1 px-2 font-semibold">سعر الوحدة</th>
                                <th className="py-1 px-2 font-semibold">إجمالي العناصر</th>
                                <th className="py-1 px-2 font-semibold">الإضافات</th>
                                <th className="py-1 px-2 font-semibold">ملاحظات خاصة</th>
                              </tr>
                            </thead>
                            <tbody>
                        {order.items && order.items.length > 0 ? (
                                order.items.map((item, index) => {
                                  const itemBaseTotal = normalizePrice(item.unit_price) * item.quantity;
                                  const extrasTotal = (item.extras?.reduce((sum, extra) => sum + normalizePrice(extra.price ?? 0), 0) || 0) * item.quantity;
                                  return (
                                    <tr key={`${order.order_id}-${item.order_item_id || index}`} className="border-b last:border-b-0">
                                      <td className="py-1 px-2 font-medium">{item.product_name}</td>
                                      <td className="py-1 px-2">{item.size_name && item.size_name !== "عادي" ? item.size_name : "-"}</td>
                                      <td className="py-1 px-2">{item.quantity}</td>
                                      <td className="py-1 px-2">{formatPrice(item.unit_price)}</td>
                                      <td className="py-1 px-2 text-blue-700 font-semibold">{formatPrice(itemBaseTotal)}</td>
                                      <td className="py-1 px-2">
                                        {item.extras && item.extras.length > 0 ? (
                                          <div>
                                            <table className="min-w-[120px] w-full text-xs border border-blue-100 rounded">
                                              <thead>
                                                <tr className="bg-blue-50">
                                                  <th className="px-1 py-0.5">الإضافة</th>
                                                  <th className="px-1 py-0.5">سعر الوحدة</th>
                                                  <th className="px-1 py-0.5">الكمية</th>
                                                  <th className="px-1 py-0.5">الإجمالي</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {item.extras.map((extra, i) => (
                                                  <tr key={i}>
                                                    <td className="px-1 py-0.5">{extra.name}</td>
                                                    <td className="px-1 py-0.5">{formatPrice(extra.price ?? 0)}</td>
                                                    <td className="px-1 py-0.5">{extra.quantity ?? 1}</td>
                                                    <td className="px-1 py-0.5 text-blue-700 font-semibold">{formatPrice(normalizePrice(extra.price ?? 0) * (extra.quantity ?? 1))}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                            <div className="text-xs text-blue-700 font-semibold mt-1">المجموع: {formatPrice(item.extras.reduce((sum, extra) => sum + (normalizePrice(extra.price ?? 0) * (extra.quantity ?? 1)), 0))}</div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">لا يوجد</span>
                                        )}
                                      </td>
                                      <td className="py-1 px-2">
                                        <div className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1 border border-yellow-200 min-w-[80px]">
                                          {(item.notes && item.notes.trim() !== "") ? (
                                            <span>{item.notes}</span>
                                          ) : (item.special_instructions && item.special_instructions.trim() !== "") ? (
                                            <span>{item.special_instructions}</span>
                                          ) : (
                                            <span className="text-gray-400">لا يوجد</span>
                                          )}
                                  </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={7} className="text-center text-gray-500 py-2">لا توجد عناصر في هذا الطلب</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                              </div>
                      </div>

                      {/* Summary Section */}
                      <div className="mt-4 border-t pt-3 grid grid-cols-1 gap-1 text-sm bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between">
                          <span className="font-semibold">إجمالي العناصر (بدون الإضافات):</span>
                          <span>
                            {formatPrice(order.items.reduce((sum, item) => sum + normalizePrice(item.unit_price) * item.quantity, 0))}
                              </span>
                            </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">إجمالي الإضافات:</span>
                          <span>
                            {formatPrice(order.items.reduce((sum, item) => sum + (item.extras?.reduce((eSum, extra) => eSum + normalizePrice(extra.price ?? 0) * (extra.quantity ?? 1), 0) || 0), 0))}
                          </span>
                          </div>
                        <div className="flex justify-between text-base border-t pt-2 mt-2">
                          <span className="font-bold text-green-700">الإجمالي الكلي:</span>
                          <span className="font-bold text-green-700">
                            {formatPrice(
                              order.items.reduce(
                                (sum, item) =>
                                  sum +
                                  ((normalizePrice(item.unit_price) +
                                    (item.extras?.reduce((eSum, extra) => eSum + normalizePrice(extra.price ?? 0), 0) || 0)) *
                                    item.quantity),
                                0
                              )
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">طريقة الدفع:</span>
                          <span>{order.payment_method === "cash" ? "نقدي" : "كارت"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">الكاشير:</span>
                          <span>{order.cashier_name || currentCashier}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">تاريخ الطلب:</span>
                          <span>{new Date(order.created_at).toLocaleDateString()} - {new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center pt-3 border-t text-sm text-gray-600">
                        <span>الكاشير: {order.cashier_name || currentCashier}</span>
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
                ))}
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
    </div>
  )
}
