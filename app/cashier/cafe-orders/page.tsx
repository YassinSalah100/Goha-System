"use client"
import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AuthApiService } from "@/lib/services/auth-api"
import {
  Plus,
  Minus,
  Printer,
  Save,
  X,
  Trash2,
  Loader2,
  Package,
  Coffee,
  Clock,
  DollarSign,
  Users,
  RefreshCw,
  CheckCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { SavedOrdersTab } from "@/components/cafe-orders/SavedOrdersTab"

// Enums for Cafe Orders
enum CafeOrderStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled', 
  ACTIVE = 'active',
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  DELIVERED = 'delivered'
}

enum CafeOrderType {
  CAFE = 'cafe'
}

enum CafeOrderPaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  WALLET = 'wallet',
}

const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

interface Category {
  category_id: string
  name: string
  description?: string
}

interface Size {
  size_id: string
  size_name: string
  category: Category
}

interface Extra {
  extra_id: string
  name: string
  price: string
  category: Category
}

interface SizePrice {
  product_size_id: string
  price: string
  size: {
    size_id: string
    size_name: string
  }
}

interface Product {
  product_id: string
  name: string
  description?: string
  is_active: boolean
  image_url?: string
  category: Category
  sizePrices: SizePrice[]
}

interface CartItem {
  id: string
  name: string
  price: number
  basePrice: number
  quantity: number
  size: string
  sizeId: string
  notes: string
  category: string
  categoryId: string
  productId: string
  productSizeId: string
  image_url?: string
  extras: Array<{
    id: string
    name: string
    price: number
  }>
}

// Define OrderStatus based on backend DTO
type OrderStatus = "pending" | "completed" | "cancelled" | "processing" | "ready" | "delivered"

interface CafeOrder {
  orderId: string
  staffName: string
  cashier_id?: string // Add cashier_id for filtering
  shift_id: string // Use shift_id consistently
  items: CartItem[]
  total: number
  orderDate: string
  orderTime: string
  isPaid: boolean // Derived from status
  status: OrderStatus // Add status from backend
  paymentTime?: string
  tableNumber?: string
  source: "localStorage" | "api" // To track origin
  api_saved?: boolean // To track if it's saved to API
}

// Enhanced Image Component with better error handling
const ProductImage = ({
  product,
  className = "object-cover w-full h-full",
}: {
  product: Product
  className?: string
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`Image failed to load for product: ${product.name}`, {
      imageUrl: product.image_url,
      error: e,
    })
    setImageError(true)
    setImageLoading(false)
  }

  // Check if we have a valid image URL
  const hasValidImageUrl =
    product.image_url &&
    product.image_url.trim() !== "" &&
    product.image_url !== "undefined" &&
    product.image_url !== "null"

  if (!hasValidImageUrl || imageError) {
    return (
      <div
        className={`bg-gray-200 flex flex-col items-center justify-center ${className.includes("w-full h-full") ? "w-full h-full" : "w-12 h-12"}`}
      >
        <Package className="w-6 h-6 text-gray-400 mb-1" />
      </div>
    )
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div
          className={`absolute inset-0 bg-gray-200 flex items-center justify-center ${className.includes("w-full h-full") ? "w-full h-full" : "w-12 h-12"}`}
        >
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={product.image_url || "/placeholder.svg"}
        alt={product.name}
        className={className}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: imageLoading ? "none" : "block" }}
      />
    </div>
  )
}

// New helper function for normalizing cafe order items
const normalizeCafeOrderItem = (item: any): CartItem => {
  let productName = "منتج غير معروف"
  let sizeName = "عادي"
  let basePrice = 0

  try {
    // Strategy 1: Check direct size field (from localStorage cart items)
    if (item.size) {
      sizeName = item.size
    }
    
    // Strategy 2: Check product_size (from API response structure)
    if (item.product_size) {
      productName = item.product_size.product_name || productName
      if (item.product_size.size && item.product_size.size.size_name) {
        sizeName = item.product_size.size.size_name
      } else if (item.product_size.size_name) {
        sizeName = item.product_size.size_name
      }
      basePrice = Number(item.product_size.price || item.unit_price || 0)
    }
    // Strategy 3: Check product object with productSize
    else if (item.product && item.product.name) {
      productName = item.product.name
      if (item.productSize?.size?.size_name) {
        sizeName = item.productSize.size.size_name
        basePrice = Number(item.productSize.price || item.unit_price || 0)
      } else {
        basePrice = Number(item.unit_price || 0)
      }
    }
    // Strategy 4: Direct fields (from localStorage or other sources)
    else if (item.product_name) {
      productName = item.product_name
      sizeName = item.size_name || item.size || sizeName
      basePrice = Number(item.unit_price || item.price || 0)
    }
    // Strategy 5: Try to extract from any available data
    else {
      const possibleNames = [item.name, item.product?.name, item.productName].filter(Boolean)
      if (possibleNames.length > 0) {
        productName = possibleNames[0]
      }
      // Also check for direct size field here
      if (item.size) {
        sizeName = item.size
      }
      basePrice = Number(item.unit_price || item.price || 0)
    }
  } catch (error) {
    console.error(`❌ Error normalizing cafe order item:`, error, item)
    productName = item.product_name || item.name || "منتج غير معروف"
    sizeName = item.size_name || item.size || "عادي"
    basePrice = Number(item.unit_price || item.price || 0)
  }

  // Robust extras handling
  let processedExtras: Array<{ id: string; name: string; price: number }> = []
  if (Array.isArray(item.extras) && item.extras.length > 0) {
    processedExtras = item.extras.map((extra: any) => {
      const extraName = extra.name || extra.extra_name || (extra.extra && extra.extra.name) || "[إضافة غير معروفة]"
      const extraPrice = Number(extra.price || (extra.extra && extra.extra.price) || 0)

      return {
        id:
          extra.extra_id ||
          extra.id ||
          (extra.extra && extra.extra_id) ||
          `extra_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: extraName,
        price: extraPrice,
      }
    })
  }

  // Calculate item price including extras
  const extrasTotal = processedExtras.reduce((sum, extra) => sum + extra.price, 0)
  const itemTotalPrice = basePrice + extrasTotal

  return {
    id: item.order_item_id || `${item.product_id}-${Date.now()}`, // Ensure unique local ID
    name: productName,
    price: itemTotalPrice, // Total price including extras
    basePrice: basePrice, // Base price of the product/size
    quantity: item.quantity || 1,
    size: sizeName,
    sizeId: item.productSize?.size?.size_id || item.sizeId || "",
    notes: item.notes || item.special_instructions || "",
    category: item.product?.category?.name || item.category || "",
    categoryId: item.product?.category?.category_id || item.categoryId || "",
    productId: item.product?.product_id || item.productId || "",
    productSizeId: item.productSize?.product_size_id || item.productSizeId || "",
    image_url: item.image_url || item.product?.image_url || "",
    extras: processedExtras,
  }
}

// Add this helper function to fetch and normalize items for an order
async function fetchCafeOrderItems(orderId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/order-items/order/${orderId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
    })
    if (response.ok) {
      const result = await response.json()
      let items = []
      if (result.success && result.data) {
        if (Array.isArray(result.data.order_items)) {
          items = result.data.order_items
        } else if (Array.isArray(result.data)) {
          items = result.data
        }
        return items.map(normalizeCafeOrderItem)
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching cafe order items for order ${orderId}:`, error)
  }
  return []
}

export default function CafeOrdersPage() {
  const [activeCategory, setActiveCategory] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentItem, setCurrentItem] = useState<Product | null>(null)
  const [itemNotes, setItemNotes] = useState("")
  const [itemSize, setItemSize] = useState("")
  const [itemSizeId, setItemSizeId] = useState("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [showItemModal, setShowItemModal] = useState(false)
  const [orderId, setOrderId] = useState(Math.floor(Math.random() * 10000) + 1)
  const [selectedExtras, setSelectedExtras] = useState<{ id: string; name: string; price: number }[]>([])
  const [cashierName, setCashierName] = useState("")
  const [staffName, setStaffName] = useState("")
  const [currentUserShift, setCurrentUserShift] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [tableNumber, setTableNumber] = useState("1")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isMarkingPaid, setIsMarkingPaid] = useState<string | null>(null) // New state for paid status loading

  // API Data
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cafe Orders
  const [cafeOrders, setCafeOrders] = useState<CafeOrder[]>([])
  const [activeTab, setActiveTab] = useState("new-order")

  // State for confirming all orders
  const [isConfirmingAll, setIsConfirmingAll] = useState(false)

  // Add state for expanded orders
  const [expandedOrders, setExpandedOrders] = useState<{ [orderId: string]: boolean }>({})
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const receiptRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // --- Saved Orders Search and Filtering ---
  const [searchQuery, setSearchQuery] = useState("")
  // Helper to filter orders by search query
  const filterOrders = (orders: CafeOrder[]) => {
    if (!searchQuery.trim()) return orders
    const q = searchQuery.trim().toLowerCase()
    return orders.filter((order) => {
      return (
        (order.tableNumber && order.tableNumber.toLowerCase().includes(q)) ||
        (order.staffName && order.staffName.toLowerCase().includes(q)) ||
        (typeof order.orderId === "string" && order.orderId.toLowerCase().includes(q))
      )
    })
  }
  const filteredSavedOrders = filterOrders(cafeOrders)
  const filteredUnpaidOrders = filterOrders(
    cafeOrders.filter((order) => !order.isPaid && order.items && order.items.length > 0),
  )
  const filteredPaidOrders = filterOrders(
    cafeOrders.filter((order) => order.isPaid && order.items && order.items.length > 0),
  )

  // Helper to merge and deduplicate orders
  const mergeAndDeduplicateOrders = (local: CafeOrder[], api: any[]): CafeOrder[] => {
    const allOrdersMap = new Map<string, CafeOrder>()

    // Add API orders first, as they are the source of truth
    api.forEach((order) => {
      const normalizedItems = (order.items || []).map(normalizeCafeOrderItem)
      const calculatedTotal = normalizedItems.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)

      const processedOrder: CafeOrder = {
        orderId: String(order.order_id || `api_unknown_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`), // Ensure orderId is always a string
        staffName: order.customer_name || "موظف غير معروف",
        cashier_id: order.cashier_id || order.created_by || order.user_id, // Add cashier_id from API
        shift_id: order.shift_id || order.shift?.shift_id || order.shift || "",
        items: normalizedItems,
        total: calculatedTotal, // Recalculate total based on normalized items
        orderDate: order.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        orderTime: order.created_at ? new Date(order.created_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
        status: order.status || "pending",
        isPaid: order.status === "completed",
        paymentTime: order.paymentTime,
        tableNumber: order.table_number || "1",
        source: "api",
        api_saved: true,
      }
      console.log(
        `DEBUG: Processing API order ${processedOrder.orderId}: items.length = ${processedOrder.items.length}, calculatedTotal = ${processedOrder.total}`,
      )
      if (processedOrder.items && processedOrder.items.length > 0) {
        allOrdersMap.set(processedOrder.orderId, processedOrder)
      } else {
        console.warn(`⚠️ API Order ${processedOrder.orderId} skipped due to no items after normalization.`)
      }
    })

    // Add local orders, but only if they don't already exist (i.e., not yet synced to API)
    const savedLocalOrders: CafeOrder[] = JSON.parse(localStorage.getItem("cafeOrders") || "[]")
    savedLocalOrders.forEach((order) => {
      const localOrderId = String(
        order.orderId || `local_unknown_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      )
      console.log(
        `DEBUG: Processing Local order ${localOrderId}: items.length = ${order.items?.length}, total = ${order.total}`,
      )
      // For local orders, we trust their items and total as they were saved from the UI
      if (!allOrdersMap.has(localOrderId) && order.items && order.items.length > 0) {
        allOrdersMap.set(localOrderId, { ...order, orderId: localOrderId, source: "localStorage", api_saved: false })
      } else if (allOrdersMap.has(localOrderId)) {
        console.log(`DEBUG: Local order ${localOrderId} skipped (already in map from API).`)
      } else {
        console.warn(`⚠️ Local Order ${localOrderId} skipped due to no items.`)
      }
    })

    const cleanedOrders = Array.from(allOrdersMap.values())
    localStorage.setItem("cafeOrders", JSON.stringify(cleanedOrders)) // Ensure local storage is always cleaned
    return cleanedOrders
  }

  const saveCafeOrdersToLocalStorage = (orders: CafeOrder[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cafeOrders", JSON.stringify(orders))
    }
  }

  const loadAndSyncCafeOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Load local orders and filter by current cashier
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const currentCashierId = storedUser.user_id || storedUser.worker_id || storedUser.id
      let savedLocalOrders: CafeOrder[] = JSON.parse(localStorage.getItem("cafeOrders") || "[]")
      if (currentCashierId) {
        savedLocalOrders = savedLocalOrders.filter(order => order.cashier_id === currentCashierId)
      }
      console.log("DEBUG: LocalStorage 'cafeOrders' on load (filtered):", savedLocalOrders)

      // 2. Fetch API orders using shift-based endpoint
      let apiOrdersList: any[] = []
      if (storedUser.user_id) {
        try {
          // Get current shift ID
          const currentShift = JSON.parse(localStorage.getItem("currentShift") || "{}")
          const shiftId = currentShift?.shift_id
          
          if (shiftId) {
            console.log(`🔍 Fetching cafe orders for shift: ${shiftId}`)
            const response = await fetch(`${API_BASE_URL}/orders/shift-cafe/${shiftId}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
              },
            })

            if (response.ok) {
              const data = await response.json()
              if (data.success && data.data) {
                // Ensure data.data is an array or contains an 'orders' array
                const rawApiOrders = Array.isArray(data.data) ? data.data : data.data.orders || []

                // All orders from shift-cafe endpoint are already cafe orders, but filter by cashier
                apiOrdersList = rawApiOrders.filter(
                  (order: any) => order.cashier_id === currentCashierId || order.created_by === currentCashierId
                )
                
                // Fetch items for each order
                apiOrdersList = await Promise.all(
                  apiOrdersList.map(async (order: any) => {
                    const items = await fetchCafeOrderItems(order.order_id)
                    return { ...order, items }
                  }),
                )
                console.log(`DEBUG: API fetched cafe orders for shift ${shiftId} (filtered by cashier):`, apiOrdersList)
              }
            } else {
              console.warn("Failed to fetch cafe orders from API:", response.status, await response.text())
            }
          } else {
            console.warn("No shift ID available, skipping API fetch")
          }
        } catch (apiErr) {
          console.error("Error fetching cafe orders from API:", apiErr)
        }
      }

      // 3. Merge and deduplicate
      const mergedOrders = mergeAndDeduplicateOrders(savedLocalOrders, apiOrdersList)
      console.log("DEBUG: Merged and deduplicated orders (final):", mergedOrders)

      // 4. Update state and local storage
      setCafeOrders(mergedOrders)
      saveCafeOrdersToLocalStorage(mergedOrders)
      console.log(`📊 Loaded and synced ${mergedOrders.length} cafe orders.`)
    } catch (err) {
      console.error("Error in loadAndSyncCafeOrders:", err)
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تحميل الطلبات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
    loadAndSyncCafeOrders() // Initial load and sync

    // Set cashier and shift from localStorage with better error handling
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const userName = user.full_name || user.fullName || user.name || user.username || "مستخدم غير معروف"
      setCashierName(userName)
      setStaffName(userName)

      // Get shift information
      if (user.shift?.shift_id) {
        setCurrentUserShift(user.shift.shift_id)
      } else if (user.shift?.shift_type) {
        setCurrentUserShift(user.shift.shift_type)
      } else if (user.shift?.type) {
        setCurrentUserShift(user.shift.type)
      } else {
        setCurrentUserShift("morning") // Default to morning shift if no shift info
      }
    }

    // Listen for custom events to re-sync orders
    const handleOrderUpdate = () => {
      console.log("Custom event received, re-syncing cafe orders...")
      loadAndSyncCafeOrders()
    }
    window.addEventListener("orderAdded", handleOrderUpdate)
    window.addEventListener("cafeOrderAdded", handleOrderUpdate)
    window.addEventListener("cafeOrderDeleted", handleOrderUpdate)
    window.addEventListener("cafeOrderPaid", handleOrderUpdate)

    return () => {
      window.removeEventListener("orderAdded", handleOrderUpdate)
      window.removeEventListener("cafeOrderAdded", handleOrderUpdate)
      window.removeEventListener("cafeOrderDeleted", handleOrderUpdate)
      window.removeEventListener("cafeOrderPaid", handleOrderUpdate)
    }
  }, [])

  // Effect to expand all orders by default when cafeOrders state changes
  useEffect(() => {
    const initialExpandedState: { [orderId: string]: boolean } = {}
    cafeOrders.forEach((order) => {
      initialExpandedState[order.orderId] = true
    })
    setExpandedOrders(initialExpandedState)
  }, [cafeOrders])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch categories, sizes, and extras in parallel
      const [categoriesData, sizesData, extrasData] = await Promise.all([
        AuthApiService.apiRequest<any>('/categories'),
        AuthApiService.apiRequest<any>('/category-sizes'),
        AuthApiService.apiRequest<any>('/category-extras'),
      ])

      // Fetch all products with pagination
      let allProducts: any[] = []
      let page = 1
      const limit = 100

      while (true) {
        const productsData = await AuthApiService.apiRequest<any>(`/products?page=${page}&limit=${limit}`)
        
        if (productsData.success && productsData.data?.products?.length > 0) {
          allProducts = [...allProducts, ...productsData.data.products]
          if (productsData.data.products.length < limit) {
            break // No more products to fetch
          }
          page++
        } else {
          break // No more products or error
        }
      }

      const categoriesList = categoriesData.success ? categoriesData.data.categories || categoriesData.data : []
      setCategories(categoriesList)
      if (categoriesList.length > 0 && !activeCategory) {
        setActiveCategory(categoriesList[0].category_id)
      }

      setProducts(allProducts)

      const sizesList = sizesData.success ? sizesData.data.sizes || sizesData.data : []
      setSizes(sizesList)

      const extrasList = extrasData.success ? extrasData.data.extras || extrasData.data : []
      setExtras(extrasList)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!currentItem) return

    const selectedSizePrice = currentItem.sizePrices.find((sp) => sp.product_size_id === itemSizeId)
    if (!selectedSizePrice) return

    // Calculate total price including extras
    const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0)
    const itemTotalPrice = Number.parseFloat(selectedSizePrice.price) + extrasTotal

    const newItem: CartItem = {
      id: `${currentItem.product_id}-${itemSizeId}-${Date.now()}`,
      name: currentItem.name,
      price: itemTotalPrice, // Updated to include extras
      basePrice: Number.parseFloat(selectedSizePrice.price),
      quantity: itemQuantity,
      size: itemSize,
      sizeId: itemSizeId,
      notes: itemNotes,
      category: currentItem.category.name,
      categoryId: currentItem.category.category_id,
      productId: currentItem.product_id,
      productSizeId: itemSizeId,
      image_url: currentItem.image_url,
      extras: selectedExtras,
    }

    setCart((prev) => [...prev, newItem])
    resetItemForm()
    setShowItemModal(false)
  }

  const resetItemForm = () => {
    setCurrentItem(null)
    setItemNotes("")
    setItemSize("")
    setItemSizeId("")
    setItemQuantity(1)
    setSelectedExtras([])
  }

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSelectItem = (item: Product) => {
    setCurrentItem(item)
    if (item.sizePrices.length === 1) {
      setItemSize(item.sizePrices[0].size.size_name)
      setItemSizeId(item.sizePrices[0].product_size_id)
    }
    setShowItemModal(true)
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const saveCafeOrder = async () => {
    if (cart.length === 0) {
      alert("لا يمكن حفظ طلب فارغ")
      return
    }

    if (isSaving) {
      console.log("⚠️ Save already in progress, preventing duplicate")
      return
    }

    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    if (!storedUser || !storedUser.user_id) {
      alert("يرجى تسجيل الدخول مجدداً")
      router.push("/")
      return
    }

    try {
      setIsSaving(true)
      setLoading(true)

      const uniqueOrderId = `cafe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log(`💾 Starting save process for cafe order: ${uniqueOrderId}`)

      // STEP 1: Save to API first (this is the source of truth)
      let apiSuccess = false
      let apiOrderId = uniqueOrderId
      let apiResponseData: any = null

      try {
        console.log("🌐 Step 1: Saving cafe order to API...")
        const apiPayload = {
          cashier_id: storedUser.user_id,
          shift_id: currentUserShift, // Use the actual current user's shift ID
          table_number: tableNumber || "1",
          order_type: "cafe", // Change this from "dine-in" to "cafe"
          customer_name: staffName || "موظف الكافية",
          items: cart.map((item) => ({
            product_id: item.productId,
            product_size_id: item.productSizeId || null,
            quantity: item.quantity,
            unit_price: item.basePrice,
            special_instructions: item.notes || "",
            extras: item.extras.map((extra) => ({
              extra_id: extra.id,
              quantity: 1,
              price: extra.price,
            })),
          })),
        }

        console.log("🚀 Sending cafe order API request...", apiPayload)
        const apiResponse = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
          body: JSON.stringify(apiPayload),
        })

        const responseText = await apiResponse.text()
        console.log("📡 API Response received:", responseText.substring(0, 200) + "...")

        if (apiResponse.ok) {
          apiResponseData = JSON.parse(responseText)
          if (apiResponseData.success && apiResponseData.data?.order_id) {
            apiOrderId = apiResponseData.data.order_id
            apiSuccess = true
            console.log(`✅ API save successful! Server order ID: ${apiOrderId}`)
          }
        } else {
          console.warn("❌ API save failed:", responseText)
        }
      } catch (apiError) {
        console.error("❌ API save error:", apiError)
      }

      // STEP 2: Update local state and localStorage
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const currentCashierId = currentUser.user_id || currentUser.worker_id || currentUser.id
      
      const newCafeOrder: CafeOrder = {
        orderId: apiOrderId,
        staffName: staffName || "موظف الكافية",
        cashier_id: currentCashierId, // Add cashier_id for filtering
        shift_id: currentUserShift,
        items: cart,
        total: calculateTotal(),
        orderDate: new Date().toLocaleDateString(),
        orderTime: new Date().toLocaleTimeString(),
        isPaid: false, // New orders are always unpaid initially
        status: "pending", // New orders are always pending initially
        tableNumber: tableNumber,
        source: apiSuccess ? "api" : "localStorage",
        api_saved: apiSuccess,
      }

      setCafeOrders((prevOrders) => {
        const updatedOrders = [...prevOrders, newCafeOrder]
        saveCafeOrdersToLocalStorage(updatedOrders)
        return updatedOrders
      })

      // STEP 3: Clear form and show success
      setCart([])
      setOrderId(Math.floor(Math.random() * 10000) + 1)

      if (apiSuccess) {
        alert("✅ تم حفظ طلب الكافية بنجاح في النظام!")
      } else {
        alert("⚠️ تم حفظ الطلب محلياً. سيتم رفعه للنظام لاحقاً.")
      }

      // STEP 4: Dispatch event for other components to re-sync
      window.dispatchEvent(
        new CustomEvent("cafeOrderAdded", {
          detail: {
            orderId: apiOrderId,
            orderType: "dine-in",
            staffName: staffName,
            apiSuccess: apiSuccess,
          },
        }),
      )
    } catch (error) {
      console.error("❌ Complete save process failed:", error)
      alert(`فشل حفظ الطلب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`)
    } finally {
      setLoading(false)
      setIsSaving(false)
    }
  }

  const handleMarkOrderPaid = async (orderId: string) => {
    if (!orderId) {
      alert("❌ معرف الطلب غير صحيح")
      return
    }
    if (isMarkingPaid === orderId) return // Prevent double click

    setIsMarkingPaid(orderId)
    console.log(`💰 Attempting to mark order ${orderId} as paid...`)

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/completed`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
        body: JSON.stringify({ status: "completed" }), // Ensure status is 'completed'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log(`✅ Order ${orderId} marked as paid on API.`)
          setCafeOrders((prevOrders) => {
            const updatedOrders = prevOrders.map((order) =>
              order.orderId === orderId
                ? {
                    ...order,
                    isPaid: true,
                    status: "completed" as OrderStatus,
                    paymentTime: new Date().toLocaleTimeString(),
                  }
                : order,
            )
            saveCafeOrdersToLocalStorage(updatedOrders)
            return updatedOrders
          })
          alert(`✅ تم تأكيد دفع الطلب #${orderId.substring(0, 8)} بنجاح!`)
          window.dispatchEvent(new CustomEvent("cafeOrderPaid", { detail: { orderId } }))
        } else {
          alert(`❌ فشل تأكيد دفع الطلب #${orderId.substring(0, 8)}: ${data.message || "خطأ غير معروف"}`)
          console.error("API response not successful:", data)
        }
      } else {
        const errorText = await response.text()
        alert(`❌ فشل تأكيد دفع الطلب #${orderId.substring(0, 8)}: ${response.statusText || "خطأ في الشبكة"}`)
        console.error("Failed to update order status on API:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error marking order as paid:", error)
      alert(`❌ فشل تأكيد دفع الطلب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`)
    } finally {
      setIsMarkingPaid(null)
    }
  }

  const handleDeleteCafeOrder = async (orderId: string) => {
    if (!orderId) {
      alert("❌ معرف الطلب غير صحيح")
      return
    }

    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
      return
    }

    try {
      setIsDeleting(orderId)
      console.log(`🗑️ Starting delete process for order: ${orderId}`)

      let apiDeleteSuccess = false

      // Try to delete from API if it's a valid API order ID (not a temporary local one)
      if (orderId && !orderId.startsWith("cafe_")) {
        try {
          console.log("🌐 Attempting API delete...")
          const deleteResponse = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
              "Content-Type": "application/json",
            },
          })

          if (deleteResponse.ok) {
            const deleteData = await deleteResponse.json()
            if (deleteData.success) {
              apiDeleteSuccess = true
              console.log("✅ API delete successful")
            }
          } else {
            console.warn("⚠️ API delete failed, continuing with local delete")
          }
        } catch (apiError) {
          console.error("❌ API delete error:", apiError)
        }
      }

      // Remove from local state and localStorage
      setCafeOrders((prevOrders) => {
        const updatedOrders = prevOrders.filter((order) => order.orderId !== orderId)
        saveCafeOrdersToLocalStorage(updatedOrders)
        return updatedOrders
      })

      if (apiDeleteSuccess) {
        alert("✅ تم حذف الطلب بنجاح من النظام والتخزين المحلي!")
      } else {
        alert("✅ تم حذف الطلب من التخزين المحلي!")
      }

      window.dispatchEvent(
        new CustomEvent("cafeOrderDeleted", {
          detail: { orderId, apiSuccess: apiDeleteSuccess },
        }),
      )

      console.log(`✅ Delete process completed for order: ${orderId}`)
    } catch (error) {
      console.error("❌ Error deleting cafe order:", error)
      alert("❌ فشل في حذف الطلب: " + (error instanceof Error ? error.message : "خطأ غير معروف"))
    } finally {
      setIsDeleting(null)
    }
  }

  const getExtrasForCategory = (categoryId: string) => {
    return (extras || []).filter((extra) => extra.category.category_id === categoryId)
  }

  const getMinPrice = (product: Product) => {
    if (product.sizePrices.length === 0) return 0
    return Math.min(...product.sizePrices.map((sp) => Number.parseFloat(sp.price)))
  }

  const getShiftDisplayName = (shiftId: string) => {
    if (shiftId && shiftId.length > 20) {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const shiftType = user.shift?.shift_type || user.shift?.type || "morning"
      return shiftType === "morning" || shiftType === "MORNING" ? "صباحية" : "مسائية"
    }
    if (shiftId === "morning" || shiftId === "MORNING") return "صباحية"
    if (shiftId === "evening" || shiftId === "EVENING") return "مسائية"
    return "صباحية"
  }

  const safeProducts = Array.isArray(products) ? products : []

  const filteredProducts = activeCategory
    ? safeProducts.filter((product) => product.category.category_id === activeCategory && product.is_active)
    : safeProducts.filter((product) => product.is_active)

  const currentShiftOrders = cafeOrders.filter((order) => order.shift_id === currentUserShift)
  const unpaidOrders = cafeOrders.filter((order) => !order.isPaid)
  const paidOrders = cafeOrders.filter((order) => order.isPaid)
  const totalUnpaid = unpaidOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalPaid = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0)

  const confirmAllCafeOrders = async () => {
    const unpaidCurrentShiftOrders = currentShiftOrders.filter((order) => !order.isPaid)

    if (unpaidCurrentShiftOrders.length === 0) {
      alert("لا توجد طلبات غير مدفوعة لتأكيدها في الوردية الحالية.")
      return
    }
    if (isConfirmingAll) return
    setIsConfirmingAll(true)

    let successCount = 0
    let failCount = 0

    for (const order of unpaidCurrentShiftOrders) {
      try {
        await handleMarkOrderPaid(order.orderId) // Use the new mark as paid function
        successCount++
      } catch (err) {
        failCount++
        console.error(`Failed to confirm order ${order.orderId}:`, err)
      }
    }

    setIsConfirmingAll(false)
    if (successCount > 0) {
      alert(`✅ تم تأكيد دفع ${successCount} طلب بنجاح!${failCount > 0 ? `\n❌ فشل في تأكيد ${failCount} طلب.` : ""}`)
    } else {
      alert("❌ فشل في تأكيد دفع أي طلب. حاول مرة أخرى.")
    }
    window.dispatchEvent(new CustomEvent("cafeOrderPaid", { detail: { count: successCount } }))
  }

  // Failsafe: Remove empty orders from state and localStorage after loading or updating cafeOrders
  useEffect(() => {
    if (Array.isArray(cafeOrders)) {
      const nonEmptyOrders = cafeOrders.filter((order) => order.items && order.items.length > 0)
      if (nonEmptyOrders.length !== cafeOrders.length) {
        setCafeOrders(nonEmptyOrders)
        localStorage.setItem("cafeOrders", JSON.stringify(nonEmptyOrders))
      }
    }
  }, [cafeOrders])

  // Function to handle printing a single saved order
  const handlePrintSingleSavedOrder = (order: CafeOrder) => {
    setTimeout(() => {
      window.print()
    }, 100) // Small delay to ensure component renders
  }

  // Function to handle printing all saved orders
  const handlePrintAllSavedOrders = () => {
    setTimeout(() => {
      window.print()
    }, 100) // Small delay to ensure component renders
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-600" />
          <p>جاري تحميل بيانات القائمة...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">خطأ: {error}</p>
          <Button onClick={fetchAllData}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header with Tabs */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-amber-600" />
                  طلبات الكافية
                </CardTitle>
                <Badge variant="outline" className="text-lg">
                  طلب #{orderId}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="new-order" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    طلب جديد
                  </TabsTrigger>
                  <TabsTrigger value="saved-orders" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    الطلبات المحفوظة
                  </TabsTrigger>
                  <TabsTrigger value="shift-summary" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    ملخص الوردية
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Menu Section */}
        <div className="w-full lg:w-2/3 space-y-6">
          {activeTab === "new-order" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>قائمة الطعام</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <ScrollArea className="w-full">
                    <TabsList className="w-full justify-start mb-4">
                      <TabsTrigger value="" className="text-sm">
                        جميع الطلبات
                      </TabsTrigger>
                      {categories.map((category) => (
                        <TabsTrigger key={category.category_id} value={category.category_id} className="text-sm">
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </ScrollArea>

                  <TabsContent value="" className="m-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredProducts.map((item) => (
                        <motion.div key={item.product_id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Card className="cursor-pointer overflow-hidden" onClick={() => handleSelectItem(item)}>
                            <div className="aspect-square relative">
                              <ProductImage product={item} className="object-cover w-full h-full" />
                            </div>
                            <CardContent className="p-3">
                              <h3 className="font-medium text-sm">{item.name}</h3>
                              <div className="text-sm text-muted-foreground">
                                {item.sizePrices.length > 0 ? `من ${getMinPrice(item)} ج.م` : "السعر غير محدد"}
                              </div>
                              {item.sizePrices.length > 1 && (
                                <div className="mt-2">
                                  <div className="text-xs text-gray-500 mb-1">الأحجام المتاحة:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {item.sizePrices.slice(0, 3).map((sizePrice) => (
                                      <span
                                        key={sizePrice.product_size_id}
                                        className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded"
                                      >
                                        {sizePrice.size.size_name}
                                      </span>
                                    ))}
                                    {item.sizePrices.length > 3 && (
                                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                                        +{item.sizePrices.length - 3} أكثر
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>

                  {categories.map((category) => (
                    <TabsContent key={category.category_id} value={category.category_id} className="m-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map((item) => (
                          <motion.div key={item.product_id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Card className="cursor-pointer overflow-hidden" onClick={() => handleSelectItem(item)}>
                              <div className="aspect-square relative">
                                <ProductImage product={item} className="object-cover w-full h-full" />
                              </div>
                              <CardContent className="p-3">
                                <h3 className="font-medium text-sm">{item.name}</h3>
                                <div className="text-sm text-muted-foreground">
                                  {item.sizePrices.length > 0 ? `من ${getMinPrice(item)} ج.م` : "السعر غير محدد"}
                                </div>
                                {item.sizePrices.length > 1 && (
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-500 mb-1">الأحجام المتاحة:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {item.sizePrices.slice(0, 3).map((sizePrice) => (
                                        <span
                                          key={sizePrice.product_size_id}
                                          className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded"
                                        >
                                          {sizePrice.size.size_name}
                                        </span>
                                      ))}
                                      {item.sizePrices.length > 3 && (
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                                          +{item.sizePrices.length - 3} أكثر
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {activeTab === "saved-orders" && (
            <SavedOrdersTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredUnpaidOrders={filteredUnpaidOrders}
              filteredPaidOrders={filteredPaidOrders}
              filteredSavedOrders={filteredSavedOrders}
              expandedOrders={expandedOrders}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              isMarkingPaid={isMarkingPaid}
              isConfirmingAll={isConfirmingAll}
              totalUnpaid={totalUnpaid}
              totalPaid={totalPaid}
              toggleOrderExpand={toggleOrderExpand}
              loadAndSyncCafeOrders={loadAndSyncCafeOrders}
              handlePrintAllSavedOrders={handlePrintAllSavedOrders}
              confirmAllCafeOrders={confirmAllCafeOrders}
              handleMarkOrderPaid={handleMarkOrderPaid}
              handleDeleteCafeOrder={handleDeleteCafeOrder}
              handlePrintSingleSavedOrder={handlePrintSingleSavedOrder}
            />
          )}
          {activeTab === "shift-summary" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  ملخص الوردية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="border-l-4 border-amber-500">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                          <Package className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">إجمالي الطلبات</h3>
                          <p className="text-sm text-gray-600">جميع الطلبات</p>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-amber-600">{cafeOrders.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-red-500">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <Clock className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">غير مدفوع</h3>
                          <p className="text-sm text-gray-600">في انتظار الدفع</p>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-red-600">{unpaidOrders.length}</p>
                      <p className="text-sm text-gray-600 mt-1">إجمالي: {totalUnpaid.toFixed(2)} ج.م</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-green-500">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">مدفوع</h3>
                          <p className="text-sm text-gray-600">تم الدفع</p>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-green-600">{paidOrders.length}</p>
                      <p className="text-sm text-gray-600 mt-1">إجمالي: {totalPaid.toFixed(2)} ج.م</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                    <h3 className="font-semibold text-lg">تفاصيل الطلبات</h3>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
                      {cafeOrders.length} طلب
                    </Badge>
                  </div>
                  {cafeOrders.length === 0 ? (
                    <Card className="border-dashed border-amber-200 bg-amber-50">
                      <CardContent className="p-8 text-center">
                        <Coffee className="h-12 w-12 mx-auto mb-3 text-amber-400" />
                        <p className="text-amber-600 font-medium">لا توجد طلبات كافية</p>
                        <p className="text-sm text-amber-500 mt-1">ابدأ بإنشاء طلب جديد</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {cafeOrders.map((order) => (
                        <Card key={`summary-${order.orderId}`} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">
                                    طلب #
                                    {order.orderId.startsWith("cafe_")
                                      ? order.orderId.substring(5, 13) // Show part of local ID
                                      : order.orderId.substring(order.orderId.length - 8)}
                                  </h4>
                                  <Badge variant={order.isPaid ? "default" : "secondary"} className="text-xs">
                                    {order.isPaid ? "مدفوع" : "غير مدفوع"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {order.orderDate} - {order.orderTime}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>
                                    <Users className="h-3 w-3 inline mr-1" />
                                    {order.staffName}
                                  </span>
                                  <span>
                                    <Coffee className="h-3 w-3 inline mr-1" />
                                    {getShiftDisplayName(order.shift_id)}
                                  </span>
                                  {order.tableNumber && (
                                    <span>
                                      <Package className="h-3 w-3 inline mr-1" />
                                      طاولة {order.tableNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{(order.total || 0).toFixed(2)} ج.م</p>
                                <p className="text-xs text-gray-500">{order.items?.length || 0} عنصر</p>
                              </div>
                            </div>
                            {order.items && order.items.length > 0 && (
                              <div className="space-y-1">
                                {order.items.slice(0, 3).map((item: any, index: number) => (
                                  <div
                                    key={`${order.orderId}-summary-item-${index}`}
                                    className="bg-gray-50 p-2 rounded mb-1"
                                  >
                                    <div className="flex justify-between items-center text-xs text-gray-600">
                                      <div className="flex-1">
                                        <span className="truncate flex-1">
                                          {item.name}
                                          {item.size && item.size !== "عادي" && ` (${item.size})`}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                                        <span className="font-medium">
                                          {((item.price || item.unit_price || 0) * (item.quantity || 1)).toFixed(2)} ج.م
                                        </span>
                                      </div>
                                    </div>
                                    {item.extras && item.extras.length > 0 && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        إضافات:{" "}
                                        {item.extras
                                          .map((extra: any) => `${extra.name} (+${Number(extra.price).toFixed(2)} ج.م)`)
                                          .join(", ")}
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="text-xs text-gray-500 mt-1">ملاحظات: {item.notes}</div>
                                    )}
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <p className="text-xs text-gray-500 text-center">
                                    +{order.items.length - 3} عناصر أخرى
                                  </p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        {/* Receipt Section */}
        <div className="w-full lg:w-1/3 flex flex-col items-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mt-4">
            <div className="flex flex-col items-center mb-4">
              <img src="/images/logo.png" alt="Logo" width={80} height={80} className="rounded-full mb-2" />
              <h1 className="text-2xl font-bold">Dawar Juha</h1>
              <p className="text-sm text-gray-600">Restaurant & Café</p>
              <p className="text-sm text-gray-600">123 Main Street, City</p>
              <p className="text-sm text-gray-600">Tel: +123 456 7890</p>
            </div>
            <div className="w-full mb-2">
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">طلب #:</span>
                <span>{orderId}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">رقم الطاولة:</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="text-right bg-white border border-gray-300 rounded px-2 py-1 w-16 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="1"
                />
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">التاريخ:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">الوقت:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">الموظف:</span>
                <span>{staffName || "موظف الكافية"}</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">الوردية:</span>
                <span>{getShiftDisplayName(currentUserShift)}</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">النوع:</span>
                <span>طلب كافية</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">الكاشير:</span>
                <span>{cashierName}</span>
              </div>
            </div>
            <div className="w-full mt-2 mb-2">
              <div className="flex font-semibold border-b pb-1 text-sm">
                <div className="w-2/5">الصنف</div>
                <div className="w-1/5 text-center">العدد</div>
                <div className="w-1/5 text-right">السعر</div>
                <div className="w-1/5 text-right">الإجمالي</div>
              </div>
              {(cart || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد عناصر في الطلب</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="text-sm border-b pb-1">
                      <div className="flex items-center">
                        <div className="w-2/5 font-medium truncate">
                          {item.name}
                          {item.size && item.size !== "عادي" && (
                            <span className="text-[10px] text-gray-500 ml-1">({item.size})</span>
                          )}
                        </div>
                        <div className="w-1/5 text-center text-gray-600">x{item.quantity}</div>
                        <div className="w-1/5 text-right text-gray-600">{item.basePrice.toFixed(2)} ج.م</div>
                        <div className="w-1/5 text-right font-medium">
                          {(item.basePrice * item.quantity).toFixed(2)} ج.م
                        </div>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <div className="w-full text-[10px] text-gray-500 pl-2 mb-1">
                          {item.extras.map((extra) => (
                            <div key={extra.id} className="flex">
                              <div className="w-2/5 truncate italic">+ {extra.name}</div>
                              <div className="w-1/5 text-center">{item.quantity}</div>
                              <div className="w-1/5 text-right">{extra.price.toFixed(2)} ج.م</div>
                              <div className="w-1/5 text-right">{(extra.price * item.quantity).toFixed(2)} ج.م</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <div className="w-full text-[10px] italic text-gray-500 pl-2">ملاحظة: {item.notes}</div>
                      )}
                      <div className="flex justify-end mt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-red-500 hover:text-red-700 mt-1"
                          onClick={() => handleRemoveFromCart(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full mt-4 pt-2 border-t">
              <div className="flex justify-between font-bold text-lg">
                <span>الإجمالي:</span>
                <span>{calculateTotal().toFixed(2)} ج.م</span>
              </div>
            </div>
            <div className="w-full mt-4 space-y-2">
              <Button
                onClick={saveCafeOrder}
                disabled={cart.length === 0 || isSaving}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    حفظ الطلب
                  </>
                )}
              </Button>
              <Button
                onClick={() =>
                  handlePrintSingleSavedOrder({
                    orderId: String(orderId),
                    staffName: staffName,
                    shift_id: currentUserShift,
                    items: cart,
                    total: calculateTotal(),
                    orderDate: new Date().toLocaleDateString(),
                    orderTime: new Date().toLocaleTimeString(),
                    isPaid: false,
                    status: "pending",
                    tableNumber: tableNumber,
                    source: "localStorage",
                    api_saved: false,
                  })
                }
                disabled={cart.length === 0}
                variant="outline"
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                طباعة
              </Button>
            </div>
            <div className="text-center text-xs text-gray-600 mt-4">
              <p>شكراً لطلبكم!</p>
              <p>نتطلع لرؤيتكم مرة أخرى</p>
              <div className="flex flex-col items-center mt-3">
                <div className="w-12 h-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-700 mb-1" />
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src="/images/eathrel.png"
                    alt="Eathrel Logo"
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-[11px] text-amber-700 font-semibold tracking-wide uppercase">
                    Powered by Ethereal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Item Selection Modal */}
      <AnimatePresence>
        {showItemModal && currentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowItemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{currentItem.name}</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowItemModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {/* Size Selection */}
                {currentItem.sizePrices.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">اختر الحجم:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {currentItem.sizePrices.map((sizePrice) => (
                        <Button
                          key={sizePrice.product_size_id}
                          variant={itemSizeId === sizePrice.product_size_id ? "default" : "outline"}
                          onClick={() => {
                            setItemSize(sizePrice.size.size_name)
                            setItemSizeId(sizePrice.product_size_id)
                          }}
                          className="justify-start"
                        >
                          <div className="text-left">
                            <div className="font-medium">{sizePrice.size.size_name}</div>
                            <div className="text-sm">{sizePrice.price} ج.م</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium mb-2">الكمية:</label>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{itemQuantity}</span>
                    <Button size="sm" onClick={() => setItemQuantity(itemQuantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Extras */}
                {getExtrasForCategory(currentItem.category.category_id).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">الإضافات:</label>
                    <div className="space-y-2">
                      {getExtrasForCategory(currentItem.category.category_id).map((extra) => (
                        <label key={extra.extra_id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedExtras.some((e) => e.id === extra.extra_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExtras([
                                  ...selectedExtras,
                                  { id: extra.extra_id, name: extra.name, price: Number.parseFloat(extra.price) },
                                ])
                              } else {
                                setSelectedExtras(selectedExtras.filter((e) => e.id !== extra.extra_id))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{extra.name}</span>
                          <span className="text-sm text-gray-600">+{extra.price} ج.م</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">ملاحظات:</label>
                  <Textarea
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="أضف ملاحظات خاصة..."
                    rows={3}
                  />
                </div>
                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!itemSizeId}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة إلى الطلب
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
