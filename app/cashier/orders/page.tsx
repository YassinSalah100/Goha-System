"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Phone, User, Trash2, Loader2, RefreshCw, Clock, Users, X } from "lucide-react"
import { AuthApiService } from "@/lib/services/auth-api"
import { OrderStatus, OrderType, PaymentMethod } from "@/lib/types/enums"
import { ShiftStatus, ShiftType } from "@/lib/types/monitoring"

// GLOBAL SINGLETON TO PREVENT MULTIPLE FETCHES
let globalFetchInProgress = false
let globalFetchPromise: Promise<any> | null = null
// Minimum time between auto-refreshes (in milliseconds) - set to 60 seconds
const AUTO_REFRESH_INTERVAL = 60000
// Debug flag to control all verbose logging
const DEBUG_MODE = false

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
  order_type: OrderType
  phone_number?: string
  total_price: string | number
  status: OrderStatus
  payment_method: PaymentMethod
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
  isApprovedCancellation?: boolean
  cancellation_reason?: string
  cancelled_at?: string
  cancelled_by?: any
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

  // Check if this order has a pending cancellation request
  let orderStatus = order.status || OrderStatus.COMPLETED
  let isApprovedCancellation = false

  // Handle backend status mapping without excessive logging
  if (order.status === "cancelled_approved" || order.status === "canceled_approved") {
    // Order was fully cancelled and approved
    orderStatus = OrderStatus.CANCELLED_APPROVED
    isApprovedCancellation = true
  } else if (order.status === "cancelled" || order.status === "canceled") {
    // Order was cancelled but not yet approved - should show as pending
    orderStatus = OrderStatus.PENDING_CANCELLATION
  } else if (order.status === "pending_cancellation" || order.status === "pending-cancellation") {
    // Order has a pending cancellation request but is still active
    orderStatus = OrderStatus.PENDING_CANCELLATION  
  } else if (order.status === "active" || order.status === "completed") {
    // Order is active/completed (normal state)
    orderStatus = OrderStatus.COMPLETED
  } else if (order.status === "pending") {
    // IMPORTANT: Map "pending" status to COMPLETED - these are not pending cancellations, just regular orders
    orderStatus = OrderStatus.COMPLETED
  } else {
    // Default to completed for any other status
    orderStatus = OrderStatus.COMPLETED
  }

  return {
    ...order,
    order_id: order.order_id || `order_${generateId()}`,
    total_price: typeof order.total_price === "string" ? order.total_price : String(order.total_price || 0),
    cashier_name: cashierName,
    customer_name: order.customer_name || "عميل عابر",
    phone_number: order.phone_number || order.customer_phone || null,
    order_type: order.order_type || OrderType.DINE_IN,
    status: orderStatus, // Use the determined status
    isApprovedCancellation: isApprovedCancellation, // Add cancellation flag
    payment_method: order.payment_method || "cash",
    created_at: order.created_at || new Date().toISOString(),
    shift_id: order.shift_id,
    items: Array.isArray(order.items) ? order.items.map(normalizeOrderItem) : [],
  }
}

// Fetch current user's active shift
const fetchCurrentShift = async (cashierId: string): Promise<Shift | null> => {
  try {
    debugLog(`🔍 Fetching shifts for cashier ${cashierId}`)
    const result = await AuthApiService.apiRequest<any>(`/shifts/cashier/${cashierId}`)
    debugLog(`📊 Shifts response:`, result)
    if (result.success && result.data) {
      const shifts = Array.isArray(result.data.shifts)
        ? result.data.shifts
        : Array.isArray(result.data)
          ? result.data
          : []

      // Find active shift first
      const activeShift = shifts.find((shift: Shift) => shift.status === "active")
      if (activeShift) {
        debugLog(`✅ Found active shift: ${activeShift.shift_id}`)
        return activeShift
      }

      // If no active shift, get the most recent one
      if (shifts.length > 0) {
        const mostRecentShift = shifts.sort(
          (a: Shift, b: Shift) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
        debugLog(`✅ Using most recent shift: ${mostRecentShift.shift_id}`)
        return mostRecentShift
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching shifts:`, error)
  }
  return null
}

// Fetch cancelled orders for current shift with reduced logging
const fetchCancelledOrdersFromAPI = async (shiftId: string): Promise<Order[]> => {
  try {
    // Skip excessive permission logging to reduce console noise
    
    const result = await AuthApiService.apiRequest<any>(`/cancelled-orders/shift/${shiftId}`)
    
    if (result.success && result.data) {
      const cancelledOrdersData = Array.isArray(result.data.cancelled_orders) 
        ? result.data.cancelled_orders 
        : Array.isArray(result.data) 
          ? result.data 
          : []
      
      if (cancelledOrdersData.length > 0) {
        debugLog(`✅ Found ${cancelledOrdersData.length} cancelled orders for shift`)
      }
      
      // Convert cancelled order data to Order format
      const cancelledOrders = await Promise.all(
        cancelledOrdersData.map(async (cancelledData: any) => {
          const originalOrder = cancelledData.order || {}
          
          // Fetch items for the original order
          const orderItems = await fetchOrderItems(originalOrder.order_id || "")
          
          // Determine the correct status based on the cancellation request status
          let orderStatus = OrderStatus.COMPLETED
          let isApprovedCancellation = false
          
          // Check the actual status of the cancellation request
          const cancelStatus = cancelledData.status || 'pending'
          
          if (cancelStatus === 'approved' || cancelStatus === 'cancelled') {
            // Cancellation was approved - order is truly cancelled
            orderStatus = OrderStatus.CANCELLED_APPROVED
            isApprovedCancellation = true
          } else if (cancelStatus === 'pending') {
            // Cancellation is still pending - order should show as pending cancellation
            orderStatus = OrderStatus.PENDING_CANCELLATION
            isApprovedCancellation = false
          } else {
            // Unknown status, default to pending
            orderStatus = OrderStatus.PENDING_CANCELLATION
            isApprovedCancellation = false
          }
          
          return {
            ...normalizeOrder(originalOrder),
            status: orderStatus, // Use the determined status
            isApprovedCancellation: isApprovedCancellation,
            items: orderItems,
            cancellation_reason: cancelledData.reason || cancelledData.cancellation_reason,
            cancelled_at: cancelledData.cancelled_at,
            cancelled_by: cancelledData.cancelled_by
          }
        })
      )
      
      return cancelledOrders.filter((order) => order && order.order_id)
    }
  } catch (error) {
    console.error("❌ Failed to fetch cancelled orders:", error)
  }
  return []
}

// Enhanced fetchOrderItems with reduced logging
const fetchOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  try {
    const result = await AuthApiService.apiRequest<any>(`/order-items/order/${orderId}`)
    
    if (result.success && result.data) {
      let items = []
      if (Array.isArray(result.data.order_items)) {
        items = result.data.order_items
      } else if (Array.isArray(result.data)) {
        items = result.data
      }
      
      // Minimized logging
      if (items.length > 0) {
        debugLog(`✅ Found ${items.length} items for order ${orderId}`)
      }
      
      return items.map(normalizeOrderItem)
    }
  } catch (error) {
    console.error(`❌ Error fetching items for order ${orderId}:`, error)
  }
  return []
}

// Helper function for conditional logging
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG_MODE) {
    console.log(message, ...args)
  }
}

// Fetch from API with reduced logging
const fetchFromAPI = async (shiftId: string): Promise<Order[]> => {
  if (globalFetchInProgress && globalFetchPromise) {
    debugLog("🔄 Reusing existing fetch promise...")
    return await globalFetchPromise
  }
  globalFetchInProgress = true
  globalFetchPromise = (async () => {
    try {
      // First try the shift-specific endpoint (similar to cafe orders pattern)
      let orders = []
      let useShiftEndpoint = false
      
      try {
        // Try /orders/shift/{shiftId} endpoint first
        const shiftResult = await AuthApiService.apiRequest<any>(`/orders/shift/${shiftId}`)
        
        if (shiftResult.success && shiftResult.data) {
          orders = Array.isArray(shiftResult.data.orders)
            ? shiftResult.data.orders
            : Array.isArray(shiftResult.data)
              ? shiftResult.data
              : []
          useShiftEndpoint = true
          debugLog(`✅ Found ${orders.length} orders for shift ${shiftId}`)
        }
      } catch (shiftError) {
        debugLog(`⚠️ Shift-specific endpoint not available, using fallback`)
        
        // Fallback to except-cafe endpoint with frontend filtering
        const result = await AuthApiService.apiRequest<any>('/orders/except-cafe')
        
        if (result.success && result.data) {
          const allOrders = Array.isArray(result.data.orders)
            ? result.data.orders
            : Array.isArray(result.data)
              ? result.data
              : []
          
          // Filter by shiftId on the frontend
          orders = allOrders.filter((order: any) => 
            order.shift?.shift_id === shiftId || order.shift_id === shiftId
          )
          debugLog(`✅ Filtered to ${orders.length} orders for shift ${shiftId}`)
        }
      }
      
      const filteredOrders = orders
      
      // Fetch items and check cancel requests for each order
      const ordersWithItemsAndStatus = await Promise.all(
        filteredOrders.map(async (order: any) => {
          const orderId = order.order_id || order.id
          try {
            // Fetch order items
            const orderItems = await fetchOrderItems(orderId)
            
            // Check if there's a pending cancel request for this order
            let orderStatus = order.status || OrderStatus.COMPLETED
            let isApprovedCancellation = false
            
          // Check order status and handle different cancellation states
          if (order.status === OrderStatus.PENDING_CANCELLATION || order.status === "pending_cancellation") {
            orderStatus = OrderStatus.PENDING_CANCELLATION
          } else if (order.status === OrderStatus.CANCELLED_APPROVED || order.status === "cancelled_approved") {
            orderStatus = OrderStatus.CANCELLED_APPROVED
            isApprovedCancellation = true
          } else if (order.status === OrderStatus.CANCELLED || order.status === "cancelled") {
            // CANCELLED without APPROVED means it's still pending approval
            orderStatus = OrderStatus.PENDING_CANCELLATION
          } else if (order.status === OrderStatus.PENDING || order.status === "pending") {
            orderStatus = OrderStatus.COMPLETED // Map pending to COMPLETED
          } else {
            // For cashiers, we'll rely on the order status and local tracking
            
            // Check if this order was marked as pending cancellation locally
            const localOrders = JSON.parse(localStorage.getItem("pendingCancellations") || "[]")
            const isPendingLocally = localOrders.includes(orderId)
            
            if (isPendingLocally && !order.status.includes("cancel")) {
              orderStatus = OrderStatus.PENDING_CANCELLATION
            }
            
            // Also check if this order was approved as cancelled locally
            const approvedCancellations = JSON.parse(localStorage.getItem("approvedCancellations") || "[]")
            if (approvedCancellations.includes(orderId)) {
              orderStatus = OrderStatus.CANCELLED_APPROVED
              isApprovedCancellation = true
            }
          }            return {
              ...order,
              status: orderStatus,
              isApprovedCancellation: isApprovedCancellation,
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
      
      const finalOrders = ordersWithItemsAndStatus.filter((order) => order && order.order_id).map(normalizeOrder)
      
      // Also fetch cancelled orders for this shift and include them in the total
      debugLog(`🗑️ Fetching cancelled orders for shift ${shiftId}`)
      let cancelledOrders: Order[] = []
      
      try {
        // Try to fetch cancelled orders (may fail for cashiers due to permissions)
        cancelledOrders = await fetchCancelledOrdersFromAPI(shiftId)
      } catch (cancelError) {
        console.error(`❌ Could not fetch cancelled orders:`, cancelError)
        // For now, we'll rely on the order status from the main API
        // Cancelled orders should already be included with status "cancelled" in the main orders response
      }
      
      // Combine regular orders and cancelled orders, removing duplicates
      const combinedOrderIds = new Set<string>()
      const allOrders: Order[] = []
      
      // Add regular orders first
      finalOrders.forEach(order => {
        combinedOrderIds.add(order.order_id)
        allOrders.push(order)
      })
      
      // Add cancelled orders only if they're not already included
      cancelledOrders.forEach(cancelledOrder => {
        if (!combinedOrderIds.has(cancelledOrder.order_id)) {
          combinedOrderIds.add(cancelledOrder.order_id)
          allOrders.push(cancelledOrder)
        } else {
          // Update existing order to reflect the correct cancellation status
          const existingIndex = allOrders.findIndex(o => o.order_id === cancelledOrder.order_id)
          if (existingIndex >= 0) {
            allOrders[existingIndex] = {
              ...allOrders[existingIndex],
              status: cancelledOrder.status, // Use the status determined above
              isApprovedCancellation: cancelledOrder.isApprovedCancellation,
              cancellation_reason: cancelledOrder.cancellation_reason,
              cancelled_at: cancelledOrder.cancelled_at,
              cancelled_by: cancelledOrder.cancelled_by
            }
            debugLog(`🔄 Updated order ${cancelledOrder.order_id} to status: ${cancelledOrder.status}`)
          }
        }
      })
      
      debugLog(`📊 Total orders (including cancelled): ${allOrders.length}`)
      
      return allOrders
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
    debugLog(`🗑️ Requesting cancellation for order ${orderId}`)
    
    // Get current user and shift for the cancel request
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    const currentShift = JSON.parse(localStorage.getItem("currentShift") || "{}")
    
    // Validate required fields
    const userId = currentUser?.user_id || currentUser?.worker_id || currentUser?.id
    const shiftId = currentShift?.shift_id
    
    if (!userId) {
      throw new Error("User ID not found. Please log in again.")
    }
    
    if (!shiftId) {
      throw new Error("Shift ID not found. Please start a shift first.")
    }
    
    const cancelRequestData = {
      order_id: orderId,
      cancelled_by: userId,
      shift_id: shiftId,
      reason: reason || "طلب إلغاء من الكاشير"
      // Remove the status field as it's not in the CreateCancelledOrderDto
    }

    debugLog(`📤 Cancel request data:`, cancelRequestData)

    // Try the request-cancel endpoint first
    try {
      const result = await AuthApiService.apiRequest<any>(`/orders/${orderId}/request-cancel`, {
        method: "POST",
        body: JSON.stringify(cancelRequestData),
      })
      
      if (result.success) {
        debugLog(`✅ Cancel request submitted successfully for order ${orderId}`)
        return true
      } else {
        console.log(`❌ Request-cancel failed:`, result.message)
        throw new Error(result.message || "Request-cancel endpoint failed")
      }
    } catch (error) {
      console.error(`❌ Cancel request failed for order ${orderId}:`, error)
      throw error
    }
  } catch (error: any) {
    console.error("❌ Failed to request cancellation:", error)
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

  // SHIFT-AWARE FETCH FUNCTION WITH SMART ENDPOINT DETECTION
  const fetchOrders = useCallback(
    async (forceRefresh = false) => {
      if (!currentShift) {
        debugLog("⚠️ No current shift available, skipping order fetch")
        return
      }

      const now = Date.now()
      // Increased debounce time from 5s to 10s to reduce frequent fetches
      if (!forceRefresh && now - lastFetchTime.current < 10000) {
        debugLog("⏰ Debounced: Too soon since last fetch, skipping...")
        return
      }

      // Component-level protection
      if (componentFetchInProgress.current) {
        debugLog("⚠️ Component fetch already in progress, skipping...")
        return
      }

      // Global protection (handled in fetchFromAPI)
      if (globalFetchInProgress && !forceRefresh) {
        debugLog("🌍 Global fetch in progress, skipping...")
        return
      }

      try {
        componentFetchInProgress.current = true
        lastFetchTime.current = now
        setLoading(true)
        setError(null)

        // Reduced logging
        if (forceRefresh) {
          debugLog(`🚀 Refreshing orders for shift: ${currentShift.shift_id}`)
        }

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

        debugLog(`🎯 Fetched ${finalOrders.length} orders for shift ${currentShift.shift_id}`)
        
        // Removed excessive order ID logging to reduce console noise
        
        // Log only counts of cancel statuses instead of full details
        const cancelledOrders = finalOrders.filter(order => order.isApprovedCancellation || order.status === OrderStatus.CANCELLED_APPROVED)
        const pendingCancelOrders = finalOrders.filter(order => order.status === OrderStatus.PENDING_CANCELLATION)
        
        if (cancelledOrders.length > 0) {
          debugLog(`❌ Found ${cancelledOrders.length} cancelled orders`)
        }
        
        if (pendingCancelOrders.length > 0) {
          debugLog(`🟠 Found ${pendingCancelOrders.length} pending cancellation orders`)
        }

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

  // Calculate Stats (excluding approved cancelled orders)
  const calculateStats = (orders: Order[]): OrderStats => {
    // Include ALL orders in the total count (including cancelled)
    const totalOrders = orders.length
    
    // Only include non-cancelled orders in revenue calculation
    const activeOrders = orders.filter(order => 
      !order.isApprovedCancellation && 
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.CANCELLED_APPROVED
    )
    const totalRevenue = activeOrders.reduce((sum, order) => sum + normalizePrice(order.total_price), 0)

    const ordersByType = {
      "dine-in": orders.filter((o) => o.order_type === OrderType.DINE_IN).length,
      takeaway: orders.filter((o) => o.order_type === OrderType.TAKEAWAY).length,
      delivery: orders.filter((o) => o.order_type === OrderType.DELIVERY).length,
    }

    const ordersByStatus = {
      completed: activeOrders.length, // Active (non-cancelled) orders
      cancelled: orders.filter(order => 
        order.isApprovedCancellation || 
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.CANCELLED_APPROVED
      ).length, // Count all cancelled orders
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

    // Only include orders that are not approved cancellations
    const activeOrders = orders.filter(order => !order.isApprovedCancellation)

    activeOrders.forEach((order) => {
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

  // Create Cancel Request Handler
  const handleDeleteOrder = async (orderId: string, reason: string) => {
    try {
      setIsDeleting(true)
      debugLog(`🗑️ Starting cancel request process for order ${orderId}`)

      // Create cancel request through API
      const success = await deleteOrderFromAPI(orderId, reason, currentCashier)

      if (success) {
        // Track this order as pending cancellation locally
        const localPendingCancellations = JSON.parse(localStorage.getItem("pendingCancellations") || "[]")
        if (!localPendingCancellations.includes(orderId)) {
          localPendingCancellations.push(orderId)
          localStorage.setItem("pendingCancellations", JSON.stringify(localPendingCancellations))
        }
        
        // Update the local order status to pending_cancellation immediately for UI feedback
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.order_id === orderId 
              ? { ...order, status: OrderStatus.PENDING_CANCELLATION }
              : order
          )
        )
        
        alert("✅ تم إرسال طلب الإلغاء بنجاح! سيتم مراجعته من قبل المدير.")
        
        // Optionally refresh orders after a delay to get server state
        setTimeout(() => {
          fetchOrders(true)
        }, 1000)
      } else {
        alert("❌ فشل في إرسال طلب الإلغاء. يرجى المحاولة مرة أخرى.")
      }
    } catch (error: any) {
      console.error("❌ Error creating cancel request:", error)
      alert(`❌ فشل في إرسال طلب الإلغاء: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // UI Helper Functions
  const getOrderTypeBadge = (type: string) => {
    switch (type) {
      case OrderType.DINE_IN:
        return <Badge variant="outline">تناول في المطعم</Badge>
      case OrderType.TAKEAWAY:
        return <Badge variant="outline">تيك اواي</Badge>
      case OrderType.DELIVERY:
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
          if (shift) {
            // Save current shift to localStorage for cancel requests
            localStorage.setItem("currentShift", JSON.stringify(shift))
          } else {
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

  // Event listener for order updates and cancellation status changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let autoRefreshInterval: NodeJS.Timeout
    
    const handleOrderAdded = () => {
      debugLog("📢 Order added event received - will refetch in 3 seconds...")
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        debugLog("🔄 Executing delayed refetch...")
        fetchOrders(true) // Force refresh
      }, 3000) // 3 second delay to ensure order is fully saved
    }

    const handleCancellationApproved = (event: CustomEvent) => {
      debugLog("✅ Order cancellation approved event received")
      
      // Remove from local pending cancellations tracking
      const localPendingCancellations = JSON.parse(localStorage.getItem("pendingCancellations") || "[]")
      const updatedPending = localPendingCancellations.filter((id: string) => id !== event.detail.orderId)
      localStorage.setItem("pendingCancellations", JSON.stringify(updatedPending))
      
      // Add to approved cancellations tracking
      const approvedCancellations = JSON.parse(localStorage.getItem("approvedCancellations") || "[]")
      if (!approvedCancellations.includes(event.detail.orderId)) {
        approvedCancellations.push(event.detail.orderId)
        localStorage.setItem("approvedCancellations", JSON.stringify(approvedCancellations))
      }
      
      // Add a small delay to allow backend to process the cancellation
      setTimeout(() => {
        debugLog("🔄 Refreshing orders after cancellation approval...")
        fetchOrders(true) // Immediately refresh to show updated status
      }, 2000) // 2 second delay
    }

    const handleCancellationRejected = (event: CustomEvent) => {
      debugLog("❌ Order cancellation rejected event received")
      
      // Remove from local pending cancellations tracking
      const localPendingCancellations = JSON.parse(localStorage.getItem("pendingCancellations") || "[]")
      const updatedPending = localPendingCancellations.filter((id: string) => id !== event.detail.orderId)
      localStorage.setItem("pendingCancellations", JSON.stringify(updatedPending))
      
      // Add a small delay to allow backend to process the rejection
      setTimeout(() => {
        debugLog("🔄 Refreshing orders after cancellation rejection...")
        fetchOrders(true) // Immediately refresh to show updated status
      }, 1000) // 1 second delay
    }

    window.addEventListener("orderAdded", handleOrderAdded)
    window.addEventListener("orderCancellationApproved", handleCancellationApproved as EventListener)
    window.addEventListener("orderCancellationRejected", handleCancellationRejected as EventListener)
    
    // Set up an auto-refresh interval that's not too frequent (30 seconds)
    autoRefreshInterval = setInterval(() => {
      debugLog("⏱️ Auto-refresh interval triggered")
      fetchOrders() // Regular refresh (respects debounce)
    }, AUTO_REFRESH_INTERVAL)
    
    return () => {
      window.removeEventListener("orderAdded", handleOrderAdded)
      window.removeEventListener("orderCancellationApproved", handleCancellationApproved as EventListener)
      window.removeEventListener("orderCancellationRejected", handleCancellationRejected as EventListener)
      clearTimeout(timeoutId)
      clearInterval(autoRefreshInterval)
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
              <div className="text-sm text-gray-600">الطلبات النشطة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</div>
              <div className="text-sm text-gray-600">إجمالي المبيعات (بدون الملغية)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.ordersByStatus.cancelled}</div>
              <div className="text-sm text-gray-600">الطلبات الملغية</div>
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
                {orders.map((order) => {
                  // Check order status for visual styling
                  const isPendingCancellation = order.status === OrderStatus.PENDING_CANCELLATION
                  const isCancelledApproved = order.status === OrderStatus.CANCELLED_APPROVED || order.isApprovedCancellation
                  const isCancelled = isCancelledApproved
                  
                  // Enhanced card styling based on status
                  let cardClassName = "border-l-4"
                  if (isCancelledApproved) {
                    cardClassName += " border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 opacity-75 shadow-lg ring-2 ring-red-200"
                  } else if (isCancelled) {
                    cardClassName += " border-l-red-500 bg-red-50 opacity-70"
                  } else if (isPendingCancellation) {
                    cardClassName += " border-l-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg ring-2 ring-orange-200"
                  } else {
                    cardClassName += " border-l-blue-500 hover:shadow-md transition-shadow"
                  }
                    
                  return (
                    <Card key={order.order_id} className={cardClassName}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">#{order.order_id.slice(-6)}</h3>
                            {getOrderTypeBadge(order.order_type)}
                            {isCancelledApproved && (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                                <X className="w-3 h-3 mr-1" />
                                تم إلغاء الطلب ✓
                              </Badge>
                            )}
                            {isPendingCancellation && (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 animate-pulse">
                                <Clock className="w-3 h-3 mr-1" />
                                في انتظار موافقة الإلغاء
                              </Badge>
                            )}
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
                        {!isCancelledApproved && !isPendingCancellation && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(order.order_id)}
                            disabled={isDeleting || isPendingCancellation}
                            className={isPendingCancellation ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : isPendingCancellation ? (
                              <Clock className="w-4 h-4 mr-1" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            {isPendingCancellation ? "في انتظار الموافقة" : "طلب إلغاء"}
                          </Button>
                        )}
                        {isCancelledApproved && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            <X className="w-4 h-4 mr-1" />
                            تم إلغاء الطلب نهائياً
                          </Badge>
                        )}
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
            <DialogTitle>طلب إلغاء الطلب</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600 mb-4">
            سيتم إرسال طلب إلغاء إلى المدير للمراجعة والموافقة. لن يتم حذف الطلب فوراً.
          </div>
          <Textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="يرجى كتابة سبب طلب إلغاء الطلب..."
            rows={4}
          />
          <DialogFooter>
            <Button onClick={handleDialogSubmit} disabled={!deleteReason.trim() || isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال طلب الإلغاء"
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
