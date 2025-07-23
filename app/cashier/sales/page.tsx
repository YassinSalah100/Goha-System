"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, Printer, Save, X, Trash2, Loader2, Package, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useReactToPrint } from "react-to-print"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

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
    quantity: number
  }>
}

// Enhanced Image Component with better error handling and debugging
const ProductImage = ({
  product,
  className = "object-cover w-full h-full",
  showDebugInfo = false,
}: {
  product: Product
  className?: string
  showDebugInfo?: boolean
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    if (showDebugInfo) {
      const info = `
Product: ${product.name}
Image URL: ${product.image_url || "EMPTY"}
URL Length: ${product.image_url?.length || 0}
URL Type: ${product.image_url?.startsWith("data:") ? "Base64" : product.image_url?.startsWith("http") ? "HTTP URL" : "Unknown"}
      `.trim()
      setDebugInfo(info)
    }
  }, [product, showDebugInfo])

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
        {showDebugInfo && <div className="text-xs text-red-500 p-1 bg-white rounded">No Image</div>}
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
      {showDebugInfo && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded max-w-xs z-10">
          <pre className="whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
    </div>
  )
}

export default function SalesPage() {
  const [activeCategory, setActiveCategory] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in")
  const [currentItem, setCurrentItem] = useState<Product | null>(null)
  const [itemNotes, setItemNotes] = useState("")
  const [itemSize, setItemSize] = useState("")
  const [itemSizeId, setItemSizeId] = useState("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [showItemModal, setShowItemModal] = useState(false)
  const [orderId, setOrderId] = useState(Math.floor(Math.random() * 10000) + 1)
  const [selectedExtras, setSelectedExtras] = useState<{ id: string; name: string; price: number }[]>([])
  const [cashierName, setCashierName] = useState("")
  const [shift, setShift] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // API Data
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debug states
  const [showImageDebug, setShowImageDebug] = useState(false)
  const [imageStats, setImageStats] = useState({
    total: 0,
    withImages: 0,
    withValidImages: 0,
    base64Images: 0,
    httpImages: 0,
    emptyImages: 0,
  })

  // Add state for extra quantities
  const [extraQuantities, setExtraQuantities] = useState<{ [extraId: string]: number }>({})

  const combinedReceiptRef = useRef<HTMLDivElement>(null)
  const customerReceiptRef = useRef<HTMLDivElement>(null)
  const kitchenReceiptRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Enhanced user and shift data fetching
  useEffect(() => {
    fetchAllData()
    // Set cashier and shift from localStorage with better error handling
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const userName = user.full_name || user.fullName || user.name || user.username || "مستخدم غير معروف"
      setCashierName(userName)
      if (user.shift?.shift_id) {
        setShift(user.shift.shift_id)
      }
    }
  }, [])

  // Calculate image statistics
  useEffect(() => {
    const stats = {
      total: products.length,
      withImages: 0,
      withValidImages: 0,
      base64Images: 0,
      httpImages: 0,
      emptyImages: 0,
    }

    products.forEach((product) => {
      if (product.image_url) {
        stats.withImages++
        if (product.image_url.trim() !== "" && product.image_url !== "undefined" && product.image_url !== "null") {
          stats.withValidImages++
          if (product.image_url.startsWith("data:")) {
            stats.base64Images++
          } else if (product.image_url.startsWith("http")) {
            stats.httpImages++
          }
        } else {
          stats.emptyImages++
        }
      } else {
        stats.emptyImages++
      }
    })

    setImageStats(stats)
  }, [products])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch categories
      const categoriesResponse = await fetch(`${API_BASE_URL}/categories`)
      if (!categoriesResponse.ok) throw new Error("Failed to fetch categories")
      const categoriesData = await categoriesResponse.json()
      const categoriesList = categoriesData.success ? categoriesData.data.categories || categoriesData.data : []
      setCategories(categoriesList)
      if (categoriesList.length > 0 && !activeCategory) {
        setActiveCategory(categoriesList[0].category_id)
      }

      // Fetch products with enhanced debugging
      const productsResponse = await fetch(`${API_BASE_URL}/products`)
      if (!productsResponse.ok) throw new Error("Failed to fetch products")
      const productsData = await productsResponse.json()

      console.log("Raw products data:", productsData)

      const productsList = productsData.success ? productsData.data.products || productsData.data : []

      // Enhanced product processing with image debugging
      const processedProducts = productsList.map((product: any) => {
        console.log(`Processing product: ${product.name}`, {
          image_url: product.image_url,
          image_url_type: typeof product.image_url,
          image_url_length: product.image_url?.length,
        })

        return {
          ...product,
          image_url: product.image_url || "",
        }
      })

      setProducts(processedProducts)

      // Fetch sizes
      const sizesResponse = await fetch(`${API_BASE_URL}/category-sizes`)
      if (!sizesResponse.ok) throw new Error("Failed to fetch sizes")
      const sizesData = await sizesResponse.json()
      const sizesList = sizesData.success ? sizesData.data.sizes || sizesData.data : []
      setSizes(sizesList)

      // Fetch extras
      const extrasResponse = await fetch(`${API_BASE_URL}/category-extras`)
      if (!extrasResponse.ok) throw new Error("Failed to fetch extras")
      const extrasData = await extrasResponse.json()
      const extrasList = extrasData.success ? extrasData.data.extras || extrasData.data : []
      setExtras(extrasList)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  // Debug function to log all product images
  const debugProductImages = () => {
    console.log("=== PRODUCT IMAGES DEBUG ===")
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}:`, {
        image_url: product.image_url,
        has_image: !!product.image_url,
        is_valid: product.image_url && product.image_url.trim() !== "" && product.image_url !== "undefined",
        url_type: product.image_url?.startsWith("data:")
          ? "Base64"
          : product.image_url?.startsWith("http")
            ? "HTTP"
            : "Unknown",
        url_length: product.image_url?.length || 0,
      })
    })
    console.log("Image Statistics:", imageStats)
  }

  const handleAddToCart = () => {
    if (!currentItem) return
    if (currentItem.sizePrices.length > 1 && !itemSizeId) {
      alert("الرجاء اختيار الحجم")
      return
    }

    let basePrice = 0
    let selectedSizeName = "عادي"
    let productSizeId = ""

    if (currentItem.sizePrices && currentItem.sizePrices.length > 0) {
      const selectedSizePrice = currentItem.sizePrices.find((sp) => sp.size?.size_id === itemSizeId)
      const sizePrice = selectedSizePrice || currentItem.sizePrices[0]
      if (!sizePrice.product_size_id) {
        alert("خطأ: معرف حجم المنتج غير متوفر")
        return
      }
      basePrice = Number.parseFloat(sizePrice.price)
      selectedSizeName = sizePrice.size?.size_name || "عادي"
      productSizeId = sizePrice.product_size_id
      setItemSizeId(sizePrice.size?.size_id || "")
    }

    const validExtras = Object.entries(extraQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const extra = extras.find((e) => e.extra_id === id)
        return extra ? { id: extra.extra_id, name: extra.name, price: Number.parseFloat(extra.price), quantity: qty } : null
      })
      .filter(Boolean)
    const extrasPrice = validExtras.reduce((sum, extra) => sum + (extra!.price * extra!.quantity), 0)
    // FIX: Store only basePrice in item.price
    // const totalItemPrice = basePrice + extrasPrice

    const newItem: CartItem = {
      id: `${currentItem.product_id}-${Date.now()}`,
      name: currentItem.name,
      price: basePrice, // FIX: Only base price
      basePrice: basePrice,
      quantity: itemQuantity,
      size: selectedSizeName,
      sizeId: itemSizeId || currentItem.sizePrices[0]?.size?.size_id || "",
      notes: itemNotes,
      category: currentItem.category?.name || "",
      categoryId: currentItem.category?.category_id || "",
      productId: currentItem.product_id,
      productSizeId: productSizeId,
      image_url: currentItem.image_url || "",
      extras: validExtras as any[],
    }

    setCart([...cart, newItem])
    setShowItemModal(false)
    resetItemForm()
  }

  const resetItemForm = () => {
    setCurrentItem(null)
    setItemNotes("")
    setItemSize("")
    setItemSizeId("")
    setItemQuantity(1)
    setSelectedExtras([])
    setExtraQuantities({})
  }

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const handleSelectItem = (item: Product) => {
    setCurrentItem(item)
    if (item.sizePrices.length > 0) {
      setItemSizeId(item.sizePrices[0].size.size_id)
      setItemSize(item.sizePrices[0].size.size_name)
    } else {
      setItemSizeId("")
      setItemSize("عادي")
    }
    setShowItemModal(true)
  }

  const calculateTotal = () => {
    // FIX: Calculate total as (basePrice * quantity) + sum of all extras (price * quantity)
    return cart.reduce((sum, item) => {
      const extrasTotal = item.extras?.reduce((eSum, extra) => eSum + (extra.price * extra.quantity), 0) || 0;
      return sum + (item.basePrice * item.quantity) + extrasTotal;
    }, 0);
  }

  // Get current active shift ID for proper transaction tracking - use existing backend routes
  const getCurrentActiveShift = async (): Promise<string> => {
    try {
      // First, try to get stored user's shift data
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      
      if (storedUser?.shift?.shift_id) {
        console.log("📊 Using cashier's current shift ID:", storedUser.shift.shift_id)
        return storedUser.shift.shift_id
      }
      
      // If no shift in stored user, try to get active shift from backend using existing routes
      if (storedUser?.user_id || storedUser?.id) {
        const userId = storedUser.user_id || storedUser.id
        
        try {
          // Use existing route: GET /shifts/cashier/:cashierId
          const response = await fetch(`${API_BASE_URL}/shifts/cashier/${userId}`)
          if (response.ok) {
            const result = await response.json()
            const shifts = Array.isArray(result) ? result : result.data || []
            
            // Find the most recent open/active shift
            const activeShift = shifts.find((shift: any) => 
              shift.status === 'OPEN' || shift.status === 'open' || shift.status === 'ACTIVE'
            )
            
            if (activeShift?.shift_id) {
              console.log("📊 Found active shift from backend:", activeShift.shift_id)
              return activeShift.shift_id
            }
          }
        } catch (apiError) {
          console.warn("⚠️ Could not fetch shifts from backend:", apiError)
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not fetch active shift:", error)
    }
    
    // Fallback to stored user's shift_id or default
    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    const fallbackShiftId = storedUser?.shift?.shift_id || `cashier_shift_${Date.now()}`
    console.log("📊 Using fallback shift ID:", fallbackShiftId)
    return fallbackShiftId
  }

  // FIXED: Complete rewrite of saveOrderToAPI with proper event timing
  const saveOrderToAPI = async () => {
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
      // Generate a unique order ID
      const uniqueOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log(`💾 Starting save process for order: ${uniqueOrderId}`)

      // Get current active shift ID for proper tracking
      const currentShiftId = await getCurrentActiveShift()

      // Create order data structure
      const orderData = {
        order_id: uniqueOrderId,
        customer_name: customerName || "عميل عابر",
        order_type: orderType,
        // FIXED: Proper phone number handling
        phone_number: orderType === "delivery" ? phoneNumber || null : null,
        customer_phone: orderType === "delivery" ? phoneNumber || null : null, // Add both fields
        total_price: calculateTotal(),
        status: "pending",
        payment_method: "cash",
        created_at: new Date().toISOString(),
        cashier: {
          user_id: storedUser.user_id,
          full_name: storedUser.full_name || storedUser.name || storedUser.username || "مستخدم غير معروف",
        },
        cashier_name: storedUser.full_name || storedUser.name || storedUser.username || "مستخدم غير معروف",
        shift: { shift_id: currentShiftId, shift_name: "وردية نشطة" },
        shift_id: currentShiftId,
        items: cart.map((item) => ({
          order_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.basePrice.toString(),
          notes: item.notes || null,
          product_name: item.name,
          size_name: item.size,
          image_url: item.image_url || "",
          product: {
            product_id: item.productId,
            name: item.name,
            image_url: item.image_url || "",
            category: {
              category_id: item.categoryId,
              name: item.category,
            },
          },
          productSize: item.productSizeId
            ? {
                product_size_id: item.productSizeId,
                price: item.basePrice.toString(),
                size: {
                  size_id: item.sizeId,
                  size_name: item.size,
                },
              }
            : null,
          // FIXED: Better extras structure
          extras: item.extras.map((extra) => ({
            extra_id: extra.id,
            name: extra.name,
            price: extra.price.toString(),
            quantity: extra.quantity,
          })),
          total_price: item.price * item.quantity,
        })),
      }

      console.log(`📝 Order data prepared for: ${orderType} order`)

      // STEP 1: Save to API first (this is the source of truth)
      let apiSuccess = false
      let apiOrderId = uniqueOrderId

      try {
        console.log("🌐 Step 1: Saving to API...")
        const validOrderTypes = ["dine-in", "takeaway", "delivery"]
        if (!validOrderTypes.includes(orderType)) {
          throw new Error(`Invalid order type: ${orderType}`)
        }

        const apiPayloadBase = {
          cashier_id: storedUser.user_id,
          shift_id: currentShiftId,
          table_number: orderType === "dine-in" ? "1" : "TAKEAWAY",
          order_type: orderType,
          customer_name: customerName || "عميل عابر",
          items: cart.map((item) => ({
            product_id: item.productId,
            product_size_id: item.productSizeId || null,
            quantity: item.quantity,
            unit_price: item.basePrice,
            special_instructions: item.notes || "",
            extras: item.extras.map((extra) => ({
              extra_id: extra.id,
              quantity: extra.quantity,
              price: extra.price,
            })),
          })),
        }

        if (orderType === "delivery") {
          ;(apiPayloadBase as any).customer_phone = phoneNumber || null
          ;(apiPayloadBase as any).phone_number = phoneNumber || null // Add both fields
        }

        console.log("🚀 Sending API request...")
        const apiResponse = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
          body: JSON.stringify(apiPayloadBase),
        })

        const responseText = await apiResponse.text()
        console.log("📡 API Response received:", responseText.substring(0, 200) + "...")

        if (apiResponse.ok) {
          const responseData = JSON.parse(responseText)
          if (responseData.success && responseData.data?.order_id) {
            apiOrderId = responseData.data.order_id
            apiSuccess = true
            console.log(`✅ API save successful! Server order ID: ${apiOrderId}`)
          }
        } else {
          console.warn("❌ API save failed:", responseText)
        }
      } catch (apiError) {
        console.error("❌ API save error:", apiError)
      }

      // STEP 2: Save to localStorage (using API order ID if available)
      console.log("💾 Step 2: Saving to localStorage...")
      const finalOrderData = {
        ...orderData,
        order_id: apiOrderId, // Use API order ID if available
        api_saved: apiSuccess,
      }

      // Check for duplicates before saving
      const savedOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]")
      const existingOrder = savedOrders.find((order: any) => order.order_id === apiOrderId)

      if (!existingOrder) {
        const updatedOrders = [...savedOrders, finalOrderData]
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders))
        console.log(`💾 Order ${apiOrderId} saved to localStorage`)
      } else {
        console.log(`⚠️ Order ${apiOrderId} already exists in localStorage`)
      }

      // STEP 3: Clear form and show success
      setCart([])
      setCustomerName("")
      setPhoneNumber("")
      setOrderType("dine-in")
      setOrderId(Math.floor(Math.random() * 10000) + 1)

      if (apiSuccess) {
        alert("✅ تم حفظ الطلب بنجاح في النظام!")
      } else {
        alert("⚠️ تم حفظ الطلب محلياً. سيتم رفعه للنظام لاحقاً.")
      }

      // STEP 4: FIXED - Dispatch event ONLY after everything is complete
      console.log("📢 Step 4: Dispatching orderAdded event...")
      setTimeout(() => {
        console.log("🔔 Dispatching orderAdded event now...")
        window.dispatchEvent(
          new CustomEvent("orderAdded", {
            detail: {
              orderId: apiOrderId,
              orderType: orderType,
              apiSuccess: apiSuccess,
            },
          }),
        )
      }, 500) // Small delay to ensure everything is saved
    } catch (error) {
      console.error("❌ Complete save process failed:", error)
      alert(`فشل حفظ الطلب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`)
    } finally {
      setLoading(false)
      setIsSaving(false)
    }
  }

  // Add this function after the saveOrderToAPI function
  const debugSavedOrders = () => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]")
    console.log("All saved orders:", savedOrders)
    console.log("Total orders in localStorage:", savedOrders.length)
    console.log(
      "Order types in localStorage:",
      savedOrders.map((order: any) => ({
        id: order.order_id,
        type: order.order_type,
        customer: order.customer_name,
        created: order.created_at,
      })),
    )

    // Check for duplicates
    const orderIds = savedOrders.map((order: any) => order.order_id)
    const duplicates = orderIds.filter((id: string, index: number) => orderIds.indexOf(id) !== index)
    if (duplicates.length > 0) {
      console.warn("🚨 Found duplicate order IDs:", duplicates)
    } else {
      console.log("✅ No duplicates found")
    }
  }

  // FIXED: Add function to clean up duplicate orders
  const cleanupDuplicateOrders = () => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]")
    const uniqueOrders = savedOrders.filter(
      (order: any, index: number, self: any[]) => index === self.findIndex((o: any) => o.order_id === order.order_id),
    )

    if (uniqueOrders.length !== savedOrders.length) {
      localStorage.setItem("savedOrders", JSON.stringify(uniqueOrders))
      console.log(`🧹 Cleaned up ${savedOrders.length - uniqueOrders.length} duplicate orders`)
      alert(`تم حذف ${savedOrders.length - uniqueOrders.length} طلب مكرر`)
      window.dispatchEvent(new CustomEvent("orderAdded"))
    } else {
      console.log("✅ No duplicates to clean up")
      alert("لا توجد طلبات مكررة")
    }
  }

  // Function to get Arabic display text for order types
  const getOrderTypeDisplayText = (type: string) => {
    switch (type) {
      case "dine-in":
        return "تناول في المطعم"
      case "takeaway":
        return "تيك اواي"
      case "delivery":
        return "توصيل"
      default:
        return type
    }
  }

  const handlePrintCustomerReceipt = useReactToPrint({
    contentRef: customerReceiptRef,
    documentTitle: `Customer Receipt - Order #${orderId}`,
  })

  const handlePrintKitchenReceipt = useReactToPrint({
    contentRef: kitchenReceiptRef,
    documentTitle: `Kitchen Receipt - Order #${orderId}`,
  })

  const filteredProducts = products.filter(
    (product) => product.category.category_id === activeCategory && product.is_active,
  )

  const getExtrasForCategory = (categoryId: string) => {
    return extras.filter((extra) => extra.category.category_id === categoryId)
  }

  const getMinPrice = (product: Product) => {
    if (product.sizePrices.length === 0) return 0
    return Math.min(...product.sizePrices.map((sp) => Number.parseFloat(sp.price)))
  }

  // Add a single print ref for both receipts
  const bothReceiptsRef = useRef<HTMLDivElement>(null)
  const handlePrintBothReceipts = useReactToPrint({
    contentRef: bothReceiptsRef,
    documentTitle: `Receipts - Order #${orderId}`,
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
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

  // Simple Receipt Print Styles
  const simpleReceiptPrintStyles = `@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: 'Courier New', monospace;
  }
  
  .print\\:hidden {
    display: none !important;
  }
  
  .print\\:block {
    display: block !important;
  }
  
  .print-receipt {
    width: 80mm;
    max-width: 80mm;
    margin: 0 auto;
    padding: 2mm;
    font-size: 12px;
    line-height: 1.3;
    color: #000;
    background: white;
  }
  
  .receipt-header {
    text-align: center;
    margin-bottom: 3mm;
    border-bottom: 1px dashed #000;
    padding-bottom: 2mm;
  }
  
  .receipt-logo {
    width: 25mm;
    height: 25mm;
    margin: 0 auto 2mm;
  }
  
  .receipt-title {
    font-size: 16px;
    font-weight: bold;
    margin: 1mm 0;
  }
  
  .receipt-info {
    margin: 2mm 0;
    font-size: 11px;
  }
  
  .receipt-info-row {
    display: flex;
    justify-content: space-between;
    margin: 1mm 0;
  }
  
  .receipt-items {
    margin: 3mm 0;
  }
  
  .receipt-item {
    margin: 1mm 0;
    font-size: 11px;
    border-bottom: 1px dotted #ccc;
    padding-bottom: 1mm;
  }
  
  .receipt-item-main {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5mm;
  }
  
  .receipt-total {
    border-top: 2px solid #000;
    margin-top: 3mm;
    padding-top: 2mm;
    text-align: center;
  }
  
  .receipt-total-amount {
    font-size: 16px;
    font-weight: bold;
    margin: 1mm 0;
  }
  
  .receipt-footer {
    text-align: center;
    margin-top: 3mm;
    padding-top: 2mm;
    border-top: 1px dashed #000;
    font-size: 10px;
  }
}`

  // Replace the complex style injection with this simple one
  if (typeof document !== "undefined") {
    const styleElement = document.createElement("style")
    styleElement.textContent = simpleReceiptPrintStyles
    document.head.appendChild(styleElement)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Menu Section */}
      <div className="w-full lg:w-2/3 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>عناصر القائمة</CardTitle>
              <Badge variant="outline" className="text-lg">
                طلب #{orderId}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <ScrollArea className="w-full">
                <TabsList className="w-full justify-start mb-4">
                  {categories.map((category) => (
                    <TabsTrigger key={category.category_id} value={category.category_id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
              {categories.map((category) => (
                <TabsContent key={category.category_id} value={category.category_id} className="m-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((item) => (
                      <motion.div key={item.product_id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Card className="cursor-pointer overflow-hidden" onClick={() => handleSelectItem(item)}>
                          <div className="aspect-square relative">
                            <ProductImage
                              product={item}
                              className="object-cover w-full h-full"
                              showDebugInfo={showImageDebug}
                            />
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium">{item.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {item.sizePrices.length > 0 ? `من ${getMinPrice(item)} ج.م` : "السعر غير محدد"}
                            </div>
                            {showImageDebug && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                <div>صورة: {item.image_url ? "✅" : "❌"}</div>
                                {item.image_url && <div className="truncate">{item.image_url.substring(0, 50)}...</div>}
                              </div>
                            )}
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
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">التاريخ:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">الوقت:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">العميل:</span>
              <span>{customerName || "عميل عابر"}</span>
            </div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">النوع:</span>
              <span>{getOrderTypeDisplayText(orderType)}</span>
            </div>
            {orderType === "delivery" && phoneNumber && (
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">الهاتف:</span>
                <span>{phoneNumber}</span>
              </div>
            )}
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
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-4 text-xs">---</div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="border-b last:border-b-0 py-2 text-xs group">
                  <div className="flex items-center mb-1">
                    <div className="w-2/5 truncate">
                      {item.name}
                      {item.size && item.size !== "عادي" && (
                        <span className="text-[10px] text-gray-500 ml-1">({item.size})</span>
                      )}
                    </div>
                    <div className="w-1/5 text-center">{item.quantity}</div>
                    <div className="w-1/5 text-right">ج.م{item.basePrice.toFixed(2)}</div>
                    <div className="w-1/5 text-right">ج.م{(item.basePrice * item.quantity).toFixed(2)}</div>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="w-full text-[10px] text-gray-500 pl-2 mb-1">
                      {item.extras.map((extra) => (
                        <div key={extra.id} className="flex">
                          <div className="w-2/5 truncate italic">+ {extra.name}</div>
                          <div className="w-1/5 text-center">{extra.quantity}</div>
                          <div className="w-1/5 text-right">ج.م{extra.price.toFixed(2)}</div>
                          <div className="w-1/5 text-right">ج.م{(extra.price * extra.quantity).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <div className="w-full text-[10px] italic text-gray-500 pl-2">ملاحظة: {item.notes}</div>
                  )}
                  <div className="flex justify-end mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shadow-md rounded-full transition-opacity duration-200 print:hidden opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 sm:opacity-100"
                      onClick={() => handleRemoveFromCart(item.id)}
                      aria-label="حذف العنصر"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="w-full border-t pt-2 mt-2">
            <div className="flex justify-between text-lg font-bold">
              <span>الإجمالي</span>
              <span>ج.م{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
          {/* Customer Type Selection */}
          {cart.length > 0 && (
            <div className="w-full border-t pt-2 mt-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">نوع العميل:</label>
                  <select
                    value={orderType}
                    onChange={(e) => {
                      const newOrderType = e.target.value as "dine-in" | "takeaway" | "delivery"
                      console.log("Order type changed to:", newOrderType)
                      setOrderType(newOrderType)
                    }}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="dine-in">تناول في المطعم</option>
                    <option value="takeaway">تيك اواي</option>
                    <option value="delivery">توصيل</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">اسم العميل:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="عميل عابر"
                    className="text-sm border rounded px-2 py-1 flex-1"
                  />
                </div>
                {orderType === "delivery" && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">الهاتف:</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+123 456 7890"
                      className="text-sm border rounded px-2 py-1 flex-1"
                    />
                  </div>
                )}
                {/* Debug buttons */}
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={debugSavedOrders}
                    className="text-xs bg-transparent"
                  >
                    Debug Orders
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={cleanupDuplicateOrders}
                    className="text-xs bg-red-50 text-red-600"
                  >
                    Clean Duplicates
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="text-center text-xs text-gray-600 mt-4">
            <p>شكراً لطلبكم!</p>
            <p>نتطلع لرؤيتكم مرة أخرى</p>
            <div className="flex flex-col items-center mt-3">
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-700 mb-1" />
              <div className="flex items-center gap-2 mt-1">
                <img
                  src="/images/eathrel.png"
                  alt="Eathrel Logo"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                />
                <span className="text-[11px] text-blue-700 font-semibold tracking-wide uppercase">
                  Powered by Ethereal
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 print:hidden">
          <Button
            onClick={handlePrintBothReceipts}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={cart.length === 0}
          >
            <Printer className="w-4 h-4 mr-2" />
            طباعة الفاتورة
          </Button>
          <Button
            onClick={saveOrderToAPI}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={cart.length === 0 || isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "جاري الحفظ..." : "حفظ الطلب"}
          </Button>
        </div>
        {/* Both Receipts Print Content */}
        <div ref={bothReceiptsRef} className="hidden print:block">
          {/* Print styles and content remain the same as in your original code */}
          <style>{`
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: white;
              }
              .receipt-print-page {
                 page-break-after: always;
                 break-after: page;
                 width: 80mm;
                max-width: 80mm;
                margin: 0 auto;
                padding: 3mm;
                background: white;
                position: relative;
                overflow: hidden;
              }
              .receipt-print-page:last-child {
                 page-break-after: auto;
                 break-after: auto;
               }
              .receipt-print-page::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background:
                  radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.03) 0%, transparent 50%),
                  radial-gradient(circle at 40% 80%, rgba(245, 158, 11, 0.03) 0%, transparent 50%);
                pointer-events: none;
                z-index: -1;
              }
              .receipt-header {
                 text-align: center;
                margin-bottom: 4mm;
                position: relative;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 2mm;
                padding: 3mm;
                border: 1px solid #e2e8f0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .receipt-header::after {
                content: '';
                position: absolute;
                bottom: -2mm;
                left: 50%;
                transform: translateX(-50%);
                width: 30mm;
                height: 1px;
                background: linear-gradient(to right, transparent, #3b82f6, transparent);
              }
              .receipt-title {
                 font-size: 20px;
                 font-weight: 800;
                 margin: 2mm 0 1mm;
                color: #1e293b;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                letter-spacing: 0.5px;
              }
              .receipt-subtitle {
                font-size: 11px;
                color: #64748b;
                font-weight: 500;
                margin: 0.5mm 0;
                text-transform: uppercase;
                letter-spacing: 0.8px;
              }
              .receipt-contact {
                font-size: 10px;
                color: #64748b;
                margin: 0.5mm 0;
                font-weight: 400;
              }
              .receipt-info {
                 margin: 3mm 0;
                 background: #f8fafc;
                border-radius: 2mm;
                padding: 2mm;
                border-left: 3px solid #3b82f6;
              }
              .receipt-info-row {
                 display: flex;
                 justify-content: space-between;
                 margin: 1.5mm 0;
                 font-size: 11px;
                align-items: center;
              }
              .receipt-info-label {
                font-weight: 600;
                color: #374151;
                display: flex;
                align-items: center;
              }
              .receipt-info-label::before {
                content: '▪';
                color: #3b82f6;
                margin-left: 1mm;
                font-size: 8px;
              }
              .receipt-info-value {
                font-weight: 500;
                color: #1f2937;
                background: white;
                padding: 0.5mm 1mm;
                border-radius: 1mm;
                border: 1px solid #e5e7eb;
              }
              .receipt-items {
                 margin: 4mm 0;
                 background: white;
                border-radius: 2mm;
                overflow: hidden;
                border: 1px solid #e5e7eb;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              }
              .receipt-items-header {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 2mm;
                font-size: 11px;
                font-weight: 700;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
              }
              .receipt-item {
                 margin: 0;
                padding: 2mm;
                font-size: 11px;
                border-bottom: 1px solid #f1f5f9;
                position: relative;
                background: white;
                transition: all 0.2s ease;
              }
              .receipt-item:nth-child(even) {
                background: #f8fafc;
              }
              .receipt-item:last-child {
                border-bottom: none;
              }
              .receipt-item::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 2px;
                background: linear-gradient(to bottom, #3b82f6, #10b981);
              }
              .receipt-item-main {
                 display: flex;
                 justify-content: space-between;
                 margin-bottom: 1mm;
                font-weight: 600;
                color: #1f2937;
                align-items: center;
              }
              .receipt-item-name {
                flex: 1;
                margin-right: 2mm;
              }
              .receipt-item-price {
                font-weight: 700;
                color: #059669;
                background: #d1fae5;
                padding: 0.5mm 1mm;
                border-radius: 1mm;
                font-size: 10px;
              }
              .receipt-item-details {
                font-size: 9px;
                color: #6b7280;
                margin-left: 2mm;
                font-style: italic;
                background: #f9fafb;
                padding: 1mm;
                border-radius: 1mm;
                margin-top: 1mm;
                border-left: 2px solid #e5e7eb;
              }
              .receipt-extras {
                background: #fef3c7;
                border-left: 2px solid #f59e0b;
              }
              .receipt-notes {
                background: #fce7f3;
                border-left: 2px solid #ec4899;
              }
              .receipt-total {
                 margin-top: 4mm;
                padding: 3mm;
                text-align: center;
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                color: white;
                border-radius: 2mm;
                position: relative;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .receipt-total::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(to right, transparent, #fbbf24, transparent);
              }
              .receipt-total-label {
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 1mm;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #d1d5db;
              }
              .receipt-total-amount {
                font-size: 20px;
                font-weight: 900;
                color: #fbbf24;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                letter-spacing: 0.5px;
              }
              .receipt-footer {
                 text-align: center;
                 margin-top: 4mm;
                padding: 3mm;
                background: #f8fafc;
                border-radius: 2mm;
                border: 1px dashed #cbd5e1;
                position: relative;
              }
              .receipt-footer::before {
                content: '';
                position: absolute;
                top: -1px;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(to right, transparent, #3b82f6, transparent);
              }
              .receipt-thank-you {
                font-size: 12px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 2mm;
              }
              .receipt-visit-again {
                font-size: 10px;
                color: #64748b;
                margin-bottom: 3mm;
                font-style: italic;
              }
              .receipt-logo {
                 width: 20mm;
                height: 20mm;
                margin: 0 auto 2mm;
                display: block;
                border-radius: 50%;
                border: 2px solid #e2e8f0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                background: white;
                padding: 1mm;
              }
              .receipt-powered {
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 gap: 2mm;
                background: white;
                padding: 2mm;
                border-radius: 1mm;
                border: 1px solid #e2e8f0;
                margin-top: 2mm;
              }
              .receipt-powered img {
                 width: 4mm;
                height: 4mm;
                object-fit: contain;
                 display: inline-block;
              }
              .receipt-powered span {
                 font-size: 8px;
                 color: #2563eb;
                 font-weight: 700;
                 text-transform: uppercase;
                 letter-spacing: 0.5px;
              }
              .kitchen-receipt .receipt-header {
                background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                color: white;
              }
              .kitchen-receipt .receipt-title {
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
              }
              .kitchen-receipt .receipt-subtitle,
              .kitchen-receipt .receipt-contact {
                color: #fecaca;
              }
              .kitchen-receipt .receipt-info {
                background: #fef2f2;
                border-left-color: #dc2626;
              }
              .kitchen-receipt .receipt-info-label::before {
                color: #dc2626;
              }
              .kitchen-receipt .receipt-items-header {
                background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
              }
              .kitchen-receipt .receipt-item::before {
                background: linear-gradient(to bottom, #dc2626, #f97316);
              }
              .kitchen-receipt .receipt-total {
                background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
              }
              .receipt-ornament {
                width: 100%;
                height: 2mm;
                background: linear-gradient(to right, transparent, #3b82f6, transparent);
                margin: 2mm 0;
                border-radius: 1mm;
              }
              .kitchen-receipt .receipt-ornament {
                background: linear-gradient(to right, transparent, #dc2626, transparent);
              }
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}</style>
          {/* Customer Receipt */}
          <div className="receipt-print-page">
            <div className="receipt-header">
              <img src="/images/logo.png" alt="Logo" className="receipt-logo" />
              <div className="receipt-title">Dawar Juha</div>
              <div className="receipt-subtitle">Restaurant & Café</div>
              <div className="receipt-contact">123 Main Street, City</div>
              <div className="receipt-contact">Tel: +123 456 7890</div>
            </div>
            <div className="receipt-ornament"></div>
            <div className="receipt-info">
              <div className="receipt-info-row">
                <span className="receipt-info-label">طلب #</span>
                <span className="receipt-info-value">{orderId}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">التاريخ</span>
                <span className="receipt-info-value">{new Date().toLocaleDateString("ar-EG")}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">الوقت</span>
                <span className="receipt-info-value">{new Date().toLocaleTimeString("ar-EG", { hour12: false })}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">العميل</span>
                <span className="receipt-info-value">{customerName || "عميل عابر"}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">النوع</span>
                <span className="receipt-info-value">{getOrderTypeDisplayText(orderType)}</span>
              </div>
              {orderType === "delivery" && phoneNumber && (
                <div className="receipt-info-row">
                  <span className="receipt-info-label">الهاتف</span>
                  <span className="receipt-info-value">{phoneNumber}</span>
                </div>
              )}
              <div className="receipt-info-row">
                <span className="receipt-info-label">الكاشير</span>
                <span className="receipt-info-value">{cashierName}</span>
              </div>
            </div>
            <div className="receipt-items">
              <div className="receipt-items-header">تفاصيل الطلب</div>
              {cart.map((item, index) => (
                <div key={item.id} className="receipt-item">
                  <div className="receipt-item-main">
                    <span className="receipt-item-name">
                      {item.name} {item.size && item.size !== "عادي" && `(${item.size})`} × {item.quantity}
                    </span>
                    <span className="receipt-item-price">ج.م{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="receipt-item-details receipt-extras">
                      <strong>إضافات:</strong>{" "}
                      {item.extras.map((extra) => `${extra.name} (ج.م${extra.price.toFixed(2)})`).join(", ")}
                    </div>
                  )}
                  {item.notes && (
                    <div className="receipt-item-details receipt-notes">
                      <strong>ملاحظات:</strong> {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="receipt-total">
              <div className="receipt-total-label">إجمالي المبلغ</div>
              <div className="receipt-total-amount">ج.م {calculateTotal().toFixed(2)}</div>
            </div>
            <div className="receipt-footer">
              <div className="receipt-thank-you">شكراً لطلبكم!</div>
              <div className="receipt-visit-again">نتطلع لرؤيتكم مرة أخرى</div>
              <div className="receipt-powered">
                <img src="/images/eathrel.png" alt="Eathrel Logo" />
                <span>Powered by Ethereal</span>
              </div>
            </div>
          </div>
          {/* Kitchen Receipt */}
          <div className="receipt-print-page kitchen-receipt">
            <div className="receipt-header">
              <div className="receipt-title">🍳 فاتورة المطبخ</div>
              <div className="receipt-subtitle">Kitchen Order</div>
            </div>
            <div className="receipt-ornament"></div>
            <div className="receipt-info">
              <div className="receipt-info-row">
                <span className="receipt-info-label">طلب #</span>
                <span className="receipt-info-value">{orderId}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">الوقت</span>
                <span className="receipt-info-value">{new Date().toLocaleTimeString("ar-EG", { hour12: false })}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">النوع</span>
                <span className="receipt-info-value">{getOrderTypeDisplayText(orderType)}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">العميل</span>
                <span className="receipt-info-value">{customerName || "عميل عابر"}</span>
              </div>
            </div>
            <div className="receipt-items">
              <div className="receipt-items-header">🥘 قائمة الطبخ</div>
              {cart.map((item, index) => (
                <div key={item.id} className="receipt-item">
                  <div className="receipt-item-main">
                    <span className="receipt-item-name">
                      <strong>{item.quantity}×</strong> {item.name}
                      {item.size && item.size !== "عادي" && ` - ${item.size}`}
                    </span>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="receipt-item-details receipt-extras">
                      <strong>إضافات:</strong> {item.extras.map((extra) => extra.name).join(", ")}
                    </div>
                  )}
                  {item.notes && (
                    <div className="receipt-item-details receipt-notes">
                      <strong>⚠️ ملاحظات مهمة:</strong> {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="receipt-total">
              <div className="receipt-total-label">⏱️ وقت التحضير المتوقع</div>
              <div className="receipt-total-amount">{cart.length * 5} دقيقة</div>
            </div>
            <div className="receipt-footer">
              <div className="receipt-thank-you">🔥 طبخ سعيد!</div>
              <div className="receipt-visit-again">تأكد من جودة الطعام قبل التقديم</div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Modal with Enhanced Image Display */}
      <AnimatePresence>
        {showItemModal && currentItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-lg w-full max-w-md"
            >
              <div className="p-4 flex justify-between items-center border-b">
                <h3 className="text-lg font-medium">{currentItem?.name}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowItemModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Enhanced Product Image in Modal */}
              <div className="p-4 flex justify-center">
                <ProductImage
                  product={currentItem}
                  className="w-32 h-32 object-cover rounded-lg border"
                  showDebugInfo={showImageDebug}
                />
              </div>

              <div className="p-4 space-y-4">
                {currentItem && currentItem.sizePrices.length > 1 && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">الحجم</label>
                    <div className="grid grid-cols-1 gap-2">
                      {currentItem.sizePrices.map((sizePrice) => (
                        <Button
                          key={sizePrice.product_size_id}
                          variant={itemSizeId === sizePrice.size.size_id ? "default" : "outline"}
                          className={itemSizeId === sizePrice.size.size_id ? "bg-orange-600 hover:bg-orange-700" : ""}
                          onClick={() => {
                            setItemSizeId(sizePrice.size.size_id)
                            setItemSize(sizePrice.size.size_name)
                          }}
                        >
                          {sizePrice.size.size_name} - ج.م{Number.parseFloat(sizePrice.price).toFixed(2)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">الكمية</label>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => itemQuantity > 1 && setItemQuantity(itemQuantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center">{itemQuantity}</span>
                    <Button variant="outline" size="icon" onClick={() => setItemQuantity(itemQuantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">تعليمات خاصة</label>
                  <Textarea
                    placeholder="مثال: بدون بصل، جبنة إضافية، إلخ."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                  />
                </div>

                {currentItem && getExtrasForCategory(currentItem.category.category_id).length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">الإضافات</label>
                    <div className="flex flex-wrap gap-2">
                      {getExtrasForCategory(currentItem.category.category_id).map((extra) => {
                        const qty = extraQuantities[extra.extra_id] || 0
                        return (
                          <div key={extra.extra_id} className="flex items-center gap-1 border rounded px-2 py-1 bg-gray-50">
                            <span>{extra.name} - ج.م{Number.parseFloat(extra.price).toFixed(2)}</span>
                            <button type="button" className="px-1" onClick={() => setExtraQuantities((q) => ({ ...q, [extra.extra_id]: Math.max((q[extra.extra_id] || 0) - 1, 0) }))}>-</button>
                            <span className="w-6 text-center">{qty}</span>
                            <button type="button" className="px-1" onClick={() => setExtraQuantities((q) => ({ ...q, [extra.extra_id]: (q[extra.extra_id] || 0) + 1 }))}>+</button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t flex justify-end">
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={handleAddToCart}
                  disabled={currentItem && currentItem.sizePrices.length > 1 && !itemSizeId}
                >
                  إضافة للطلب
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
