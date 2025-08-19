"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  AlertCircle, 
  CheckCircle2, 
  Printer, 
  RefreshCw, 
  Users, 
  Clock, 
  DollarSign, 
  Coffee, 
  FileText,
  TrendingUp,
  Package
} from "lucide-react"
import { motion } from "framer-motion"
import { useReactToPrint } from "react-to-print"

const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

interface CartItem {
  id: string
  name: string
  price: number
  basePrice: number
  quantity: number
  size: string
  notes: string
  category: string
  extras: {
    name: string
    price: number
  }[]
}

interface Order {
  id: number
  customerName: string
  orderType: "dine-in" | "takeaway" | "delivery"
  phoneNumber?: string
  items: CartItem[]
  total: number
  date: string
  status: "pending" | "completed" | "cancelled"
  paymentMethod: "cash" | "card"
  cancelReason?: string
  cashier: string
  shift: string
}

// Very Simple Shift Report Styles
const simpleShiftPrintStyles = `
@media print {
  @page {
    size: A4;
    margin: 10mm;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
  }
  
  .print\\:hidden {
    display: none !important;
  }
  
  .advanced-shift-report {
    display: block !important;
    width: 100%;
    margin: 0;
    padding: 0;
    font-size: 12px;
    line-height: 1.4;
    color: #000;
    background: white;
  }
  
  /* Simple Header */
  .report-header {
    text-align: center;
    padding: 5mm 0;
    border-bottom: 2px solid #000;
    margin-bottom: 5mm;
  }
  
  .company-logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 3mm;
  }
  
  .company-logo {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-left: 8px;
    object-fit: cover;
    border: 2px solid #333;
  }
  
  .company-info h1 {
    font-size: 20px;
    font-weight: bold;
    margin: 0 0 2px 0;
  }
  
  .company-info p {
    font-size: 10px;
    margin: 1px 0;
  }
  
  .report-title {
    font-size: 18px;
    font-weight: bold;
    margin: 3mm 0;
    text-transform: uppercase;
  }
  
  .report-subtitle {
    font-size: 12px;
    font-style: italic;
  }
  
  /* Simple Stats Grid - Updated to 3 columns */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3mm;
    margin: 4mm 0;
  }
  
  .stat-card {
    border: 1px solid #000;
    padding: 3mm;
    text-align: center;
  }
  
  .stat-value {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 1mm;
  }
  
  .stat-label {
    font-size: 9px;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  /* Simple Section Titles */
  .section-title {
    font-size: 14px;
    font-weight: bold;
    margin: 4mm 0 2mm 0;
    padding-bottom: 1mm;
    border-bottom: 1px solid #000;
  }
  
  /* Simple Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
    margin-bottom: 3mm;
  }
  
  .info-card {
    border: 1px solid #000;
    padding: 2mm;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    margin: 1mm 0;
    font-size: 10px;
  }
  
  .info-label {
    font-weight: bold;
  }
  
  .info-value {
    font-weight: normal;
  }
  
  /* Simple Tables */
  .orders-table {
    width: 100%;
    border-collapse: collapse;
    margin: 2mm 0;
    font-size: 9px;
    border: 1px solid #000;
  }
  
  .orders-table th {
    background: #f0f0f0;
    border: 1px solid #000;
    padding: 1.5mm;
    text-align: center;
    font-weight: bold;
    font-size: 9px;
  }
  
  .orders-table td {
    border: 1px solid #000;
    padding: 1.5mm;
    text-align: center;
  }
  
  .orders-table tbody tr:nth-child(even) {
    background: #f9f9f9;
  }
  
  /* Simple Category Sections */
  .category-section {
    margin: 3mm 0;
    border: 1px solid #000;
  }
  
  .category-header {
    background: #e0e0e0;
    padding: 2mm;
    font-weight: bold;
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #000;
  }
  
  .category-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }
  
  .category-table th {
    background: #f5f5f5;
    border: 1px solid #000;
    padding: 1.5mm;
    text-align: center;
    font-weight: bold;
    font-size: 9px;
  }
  
  .category-table td {
    border: 1px solid #000;
    padding: 1.5mm;
    text-align: center;
  }
  
  .category-table tbody tr:nth-child(even) {
    background: #f9f9f9;
  }
  
  /* Simple Total Section */
  .total-section {
    border: 2px solid #000;
    padding: 4mm;
    text-align: center;
    margin: 4mm 0;
  }
  
  .total-amount {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 1mm;
  }
  
  .total-label {
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  /* Simple Notes Section */
  .notes-section {
    border: 1px solid #000;
    padding: 2mm;
    margin: 3mm 0;
  }
  
  .notes-title {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 2mm;
  }
  
  .notes-content {
    font-size: 10px;
    line-height: 1.4;
  }
  
  /* Simple Signature Section */
  .signature-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5mm;
    margin-top: 5mm;
  }
  
  .signature-box {
    border: 1px solid #000;
    padding: 3mm;
    text-align: center;
  }
  
  .signature-line {
    border-bottom: 1px solid #000;
    height: 8mm;
    margin-bottom: 2mm;
  }
  
  .signature-title {
    font-size: 10px;
    font-weight: bold;
    margin-bottom: 1mm;
  }
  
  .signature-name {
    font-size: 9px;
  }
  
  /* Simple Footer */
  .footer-section {
    text-align: center;
    margin-top: 5mm;
    padding-top: 2mm;
    border-top: 1px solid #000;
  }
  
  .footer-content {
    font-size: 9px;
    margin-bottom: 2mm;
  }
  
  .powered-by {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2mm;
    margin-top: 2mm;
  }
  
  .footer-logo {
    width: 12px;
    height: 12px;
  }
  
  .powered-text {
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
  }
}
`

// Replace the style injection
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style")
  styleElement.textContent = simpleShiftPrintStyles
  document.head.appendChild(styleElement)
}

export default function EndShiftPageFixed() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentShift, setCurrentShift] = useState<any>(null)
  const [savedOrders, setSavedOrders] = useState<Order[]>([])
  const [shiftStats, setShiftStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    cashSales: 0,
    cardSales: 0,
    avgOrderValue: 0,
    ordersPerHour: 0,
  })
  const [shiftSummary, setShiftSummary] = useState<any>(null)
  const [notes, setNotes] = useState("")
  const [requestSent, setRequestSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingShiftDetails, setIsLoadingShiftDetails] = useState(false)
  const [isLoadingShiftData, setIsLoadingShiftData] = useState(false)
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false)
  const [approvalCheckInterval, setApprovalCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const shiftReportRef = useRef<HTMLDivElement>(null)

  // Check shift approval status
  const checkShiftApprovalStatus = async () => {
    if (!currentShift) return false
    
    try {
      const shiftId = getShiftId(currentShift)
      const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Shift status check:", result)
        
        // Check if shift is approved/closed
        if (result.data && (result.data.is_closed || result.data.status === 'closed' || result.data.approved_by_admin_id)) {
          console.log("✅ Shift has been approved/closed")
          return true
        }
      }
    } catch (error) {
      console.error("❌ Error checking shift status:", error)
    }
    
    return false
  }

  // Prevent navigation until approval
  useEffect(() => {
    if (!isWaitingForApproval) return

    // Block browser back/forward navigation
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      window.history.pushState(null, "", window.location.href)
      alert("لا يمكنك الخروج حتى يتم الموافقة على إغلاق الوردية من قبل المدير")
    }

    // Block page refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "لا يمكنك الخروج حتى يتم الموافقة على إغلاق الوردية من قبل المدير"
      return e.returnValue
    }

    // Start approval checking interval
    const interval = setInterval(async () => {
      console.log("🔄 Checking shift approval status...")
      const isApproved = await checkShiftApprovalStatus()
      
      if (isApproved) {
        console.log("✅ Shift approved! Allowing logout...")
        setIsWaitingForApproval(false)
        clearInterval(interval)
        
        // Clear user data and redirect
        localStorage.removeItem("currentUser")
        router.push("/")
      }
    }, 10000) // Check every 10 seconds

    setApprovalCheckInterval(interval)

    // Add event listeners
    window.addEventListener("popstate", handlePopState)
    window.addEventListener("beforeunload", handleBeforeUnload)
    
    // Push initial state to prevent back navigation
    window.history.pushState(null, "", window.location.href)

    return () => {
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isWaitingForApproval, currentShift, router])

  // Helper function to get shift display name
  const getShiftDisplayName = (shift: any) => {
    if (typeof shift === "string") return shift
    if (typeof shift === "object" && shift !== null) {
      return shift.shift_name || shift.type || shift.shift_type || shift.shift_id || "وردية غير محددة"
    }
    return "وردية غير محددة"
  }

  // Helper function to get shift ID for comparison
  const getShiftId = (shift: any) => {
    if (typeof shift === "string") return shift
    if (typeof shift === "object" && shift !== null) {
      return shift.shift_id || shift.id || shift.type || shift.shift_name || shift
    }
    return shift
  }

  
  const fetchShiftDetails = async (shiftId: string) => {
    if (isLoadingShiftDetails) return null
    
    try {
      setIsLoadingShiftDetails(true)
      console.log(`🔍 Fetching shift details for ${shiftId}`)
      const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          console.log("✅ Shift details retrieved:", result.data)
          return result.data
        }
      } else {
        console.warn("❌ Failed to fetch shift details:", response.status)
      }
    } catch (error) {
      console.error("❌ Error fetching shift details:", error)
    } finally {
      setIsLoadingShiftDetails(false)
    }
    return null
  }
  
  const fetchShiftSummary = async (shiftId: string) => {
    if (loadingSummary) return null
    
    try {
      setLoadingSummary(true)
      console.log(`🔍 Fetching shift summary with details for ${shiftId}`)
      
      // Try the updated endpoint with detailed information first
      let response;
      
      try {
        // First try the detailed summary endpoint which includes expenses, workers, etc.
        console.log(`Trying URL: ${API_BASE_URL}/shifts/summary/${shiftId}/details`)
        response = await fetch(`${API_BASE_URL}/shifts/summary/${shiftId}/details`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          console.log(`Detailed summary failed with status ${response.status}, trying basic summary...`);
          
          // Fall back to basic summary endpoint
          console.log(`Trying URL: ${API_BASE_URL}/shifts/summary/${shiftId}`)
          response = await fetch(`${API_BASE_URL}/shifts/summary/${shiftId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
              "Content-Type": "application/json",
            },
          });
        }
      } catch (error) {
        console.error("Error trying detailed summary:", error);
        
        // Fallback to the basic URL format
        console.log(`Trying URL: ${API_BASE_URL}/shifts/summary/${shiftId}`)
        response = await fetch(`${API_BASE_URL}/shifts/summary/${shiftId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            "Content-Type": "application/json",
          },
        });
      }

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Shift summary retrieved:", result)
        console.log("API Response Keys:", Object.keys(result))
        
        // Log specific fields for debugging
        if (result.final_number !== undefined) {
          console.log("Found final_number in response:", result.final_number)
        }
        if (result.cafe_revenue !== undefined) {
          console.log("Found cafe_revenue in response:", result.cafe_revenue)
        }
        if (result.expenses) {
          console.log("Found expenses array with", result.expenses.length, "items")
        }
        if (result.workers) {
          console.log("Found workers array with", result.workers.length, "items")
        }
        
        // Normalize the API response to ensure consistent structure
        const normalizedResult = {
          shift_id: result.shift_id,
          shift_type: result.shift_type,
          start_time: result.start_time,
          end_time: result.end_time,
          total_orders: result.total_orders || 0,
          total_revenue: result.total_revenue || result.total_sales || 0,
          cafe_revenue: result.cafe_revenue || 0,
          total_expenses: result.total_expenses || 0,
          total_salaries: result.total_salaries || result.total_staff_cost || 0,
          final_number: result.final_number !== undefined ? result.final_number : 
                       (result.total_revenue || result.total_sales || 0) - 
                       (result.total_expenses || 0) - 
                       (result.total_salaries || result.total_staff_cost || 0),
          
          // Keep the cashiers array if it exists
          cashiers: result.cashiers || [],
          
          // Detailed breakdowns - only include if present
          expenses: result.expenses || [],
          workers: result.workers || [],
          
          // Order analysis - only include if present
          orders_by_type: result.orders_by_type || null,
          orders_by_payment: result.orders_by_payment || null,
          orders_by_status: result.orders_by_status || null,
          
          // Additional useful fields
          top_selling_items: result.top_selling_items || [],
          average_order_value: result.total_orders > 0 ? 
            (result.total_revenue || result.total_sales || 0) / result.total_orders : 0
        }
        
        console.log("✅ Normalized shift summary:", normalizedResult)
        setShiftSummary(normalizedResult)
        return normalizedResult
      } else {
        const errorText = await response.text();
        console.warn("❌ Failed to fetch shift summary:", response.status, errorText)
      }
    } catch (error) {
      console.error("❌ Error fetching shift summary:", error)
    } finally {
      setLoadingSummary(false)
    }
    return null
  }

  const loadShiftData = async () => {
    if (isLoadingShiftData) return
    
    if (typeof window !== "undefined") {
      setIsLoadingShiftData(true)
      try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
        setCurrentUser(user)
        const currentCashierName = user.full_name || user.name || user.username || ""

        if (user.shift) {
          setCurrentShift(user.shift)

          // Try to fetch additional shift details from API
          const shiftId = getShiftId(user.shift)
          if (shiftId) {
            const shiftDetails = await fetchShiftDetails(shiftId)
            if (shiftDetails) {
              // Merge API shift details with local shift data
              setCurrentShift({
                ...user.shift,
                ...shiftDetails,
              })
            }
            
            // Fetch the shift summary
            await fetchShiftSummary(shiftId)
          }
        }

      const savedOrdersString = localStorage.getItem("savedOrders")
      let allOrders: any[] = []

      if (savedOrdersString) {
        try {
          allOrders = JSON.parse(savedOrdersString)
          console.log("📋 Found saved orders:", allOrders.length)
        } catch (error) {
          console.error("Error parsing saved orders:", error)
          allOrders = []
        }
      }

      console.log(`🔍 Looking for orders for shift: ${getShiftId(user.shift)} and cashier: ${currentCashierName}`)
      
      // Debug flag - set to false to reduce console noise
      const DEBUG_ORDER_MATCHING = false
      
      const currentShiftOrders = allOrders.filter((order: any) => {
        if (!order || !order.order_id) {
          if (DEBUG_ORDER_MATCHING) console.log("❌ Skipping invalid order without ID:", order)
          return false
        }

        const orderCashierName = order.cashier_name || order.cashier?.full_name || "[اسم الكاشير غير متوفر]"
        const matchesCashier = orderCashierName === currentCashierName

        const orderShiftId = order.shift?.shift_id || order.shift_id || ""
        const currentShiftId = getShiftId(user.shift)
        const matchesShift = orderShiftId === currentShiftId
        
        if (matchesCashier && matchesShift) {
          console.log(`✅ Found matching order: ${order.order_id}, total: ${order.total_price || order.total || 0}`)
        } else if (DEBUG_ORDER_MATCHING) {
          console.log(`❌ Order ${order.order_id} doesn't match: cashier match=${matchesCashier}, shift match=${matchesShift}`)
          console.log(`   Order info: cashier=${orderCashierName}, shift=${orderShiftId}`)
          console.log(`   Expected: cashier=${currentCashierName}, shift=${currentShiftId}`)
        }

        return matchesCashier && matchesShift
      })
      
      console.log(`📊 Found ${currentShiftOrders.length} orders for current shift/cashier`)

      const convertedOrders = currentShiftOrders.map((order: any) => ({
        id: order.order_id || `order_${Date.now()}`,
        customerName: order.customer_name || "عميل عابر",
        orderType: order.order_type || "dine-in",
        phoneNumber: order.phone_number || "",
        total: typeof order.total_price === "string" ? Number.parseFloat(order.total_price) : order.total_price || 0,
        date: order.created_at || new Date().toISOString(),
        status: order.status || "pending",
        paymentMethod: order.payment_method || "cash",
        cashier: order.cashier_name || order.cashier?.full_name || "[اسم الكاشير غير متوفر]",
        shift: order.shift?.shift_id || order.shift_id || "",
        items: (order.items || []).map((item: any) => ({
          id: item.order_item_id || item.id || `item_${Date.now()}`,
          name: item.product_name || item.name || "[اسم المنتج غير معروفة]",
          price:
            typeof item.unit_price === "string"
              ? Number.parseFloat(item.unit_price)
              : item.unit_price || item.price || 0,
          basePrice:
            typeof item.unit_price === "string"
              ? Number.parseFloat(item.unit_price)
              : item.unit_price || item.price || 0,
          quantity: item.quantity || 0,
          size: item.size_name || item.size || "عادي",
          notes: item.notes || "",
          category: item.product?.category?.name || item.category || "غير محدد",
          extras: (item.extras || []).map((extra: any) => ({
            name: extra.name || "[إضافة غير معروفة]",
            price: typeof extra.price === "string" ? Number.parseFloat(extra.price) : extra.price || 0,
          })),
        })),
      }))

      setSavedOrders(convertedOrders)

      const total = convertedOrders.reduce((sum: number, order: any) => sum + order.total, 0)
      const cashTotal = convertedOrders
        .filter((order: any) => order.paymentMethod === "cash")
        .reduce((sum: number, order: any) => sum + order.total, 0)
      const cardTotal = convertedOrders
        .filter((order: any) => order.paymentMethod === "card")
        .reduce((sum: number, order: any) => sum + order.total, 0)

      const loginTime = new Date(user.loginTime)
      const shiftDurationHours = (new Date().getTime() - loginTime.getTime()) / (1000 * 60 * 60)
      const ordersPerHour = shiftDurationHours > 0 ? convertedOrders.length / shiftDurationHours : 0

      setShiftStats({
        totalOrders: convertedOrders.length,
        totalSales: total,
        cashSales: cashTotal,
        cardSales: cardTotal,
        avgOrderValue: convertedOrders.length > 0 ? total / convertedOrders.length : 0,
        ordersPerHour: ordersPerHour,
      })
      } catch (error) {
        console.error("Error loading shift data:", error)
      } finally {
        setIsLoadingShiftData(false)
      }
    }
  }

  useEffect(() => {
    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      loadShiftData()
    }, 100)

    const handleOrderAdded = () => {
      // Debounce the loadShiftData call
      clearTimeout(timeoutId)
      setTimeout(() => {
        loadShiftData()
      }, 500)
    }

    const handleStorageChange = () => {
      // Debounce the loadShiftData call
      clearTimeout(timeoutId)
      setTimeout(() => {
        loadShiftData()
      }, 500)
    }

    window.addEventListener("orderAdded", handleOrderAdded)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("orderAdded", handleOrderAdded)
      window.removeEventListener("storage", handleStorageChange)
      
      // Clean up approval checking interval
      if (approvalCheckInterval) {
        clearInterval(approvalCheckInterval)
      }
    }
  }, [])

  // New function to show shift summary before ending the shift
  const handleShowSummary = async () => {
    if (!currentUser || !currentShift) {
      setError("معلومات المستخدم أو الوردية غير متوفرة")
      return
    }

    const shiftId = getShiftId(currentShift)
    console.log("🔍 Fetching summary for shift:", shiftId)
    console.log("📊 Current local orders count:", savedOrders.length)
    console.log("📊 Current local shift stats:", shiftStats)
    
    // Always refresh summary data when showing it
    setLoadingSummary(true)
    const summaryData = await fetchShiftSummary(shiftId)
    setLoadingSummary(false)
    
    if (!summaryData) {
      console.log("❌ Failed to get summary from server, using local data")
      
      // If we failed to get summary from server, create a summary from local data
      const localSummary = {
        shift_id: shiftId,
        shift_type: getShiftDisplayName(currentShift),
        start_time: currentUser.loginTime,
        end_time: new Date().toISOString(),
        total_orders: shiftStats.totalOrders,
        total_sales: shiftStats.totalSales,
        total_revenue: shiftStats.totalSales, // For compatibility
        total_expenses: 0, // We don't have this locally
        cafe_revenue: 0, // We don't have this locally
        
        // Group orders by type from local data
        orders_by_type: {
          "dine-in": savedOrders.filter(o => o.orderType === "dine-in").length,
          "takeaway": savedOrders.filter(o => o.orderType === "takeaway").length,
          "delivery": savedOrders.filter(o => o.orderType === "delivery").length,
          "cafe": 0, // We don't track this separately in local data
        },
        
        // Group orders by payment method from local data
        orders_by_payment: {
          "cash": savedOrders.filter(o => o.paymentMethod === "cash").length,
          "card": savedOrders.filter(o => o.paymentMethod === "card").length,
        },
        
        // Group orders by status from local data
        orders_by_status: {
          "completed": savedOrders.filter(o => o.status === "completed").length,
          "pending": savedOrders.filter(o => o.status === "pending").length,
          "cancelled": savedOrders.filter(o => o.status === "cancelled").length,
        },
        
        // Calculate average order value from local data
        average_order_value: shiftStats.avgOrderValue,
      }
      
      console.log("📊 Generated local summary:", localSummary)
      setShiftSummary(localSummary)
    }
    
    // Show summary view
    setShowSummary(true)
  }
  
  const handleEndShiftRequest = async () => {
    if (!currentUser || !currentShift) {
      setError("معلومات المستخدم أو الوردية غير متوفرة")
      return
    }

    try {
      setError(null)
      setLoading(true)

      const shiftId = getShiftId(currentShift)
      const userId = currentUser.user_id || currentUser.id

      let apiSuccess = false
      let summaryData = shiftSummary

      // Step 1: Ensure we have shift summary
      if (!summaryData) {
        try {
          console.log(`🔍 Getting shift summary for shift ${shiftId}`)
          const summaryResult = await fetchShiftSummary(shiftId)
          if (summaryResult) {
            summaryData = summaryResult
            console.log("✅ Shift summary retrieved:", summaryData)
          }
        } catch (summaryError) {
          console.warn("⚠️ Failed to get shift summary:", summaryError)
        }
      }

      // Step 2: Request shift close using the correct endpoint
      try {
        console.log(`🔒 Requesting shift close for shift ${shiftId}`)
        const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}/request-close`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            closed_by: userId,
            notes: notes || null,
            cash_drawer_amount: summaryData?.cash_drawer_amount || shiftStats.cashSales,
            local_stats: {
              totalOrders: shiftStats.totalOrders,
              totalSales: shiftStats.totalSales,
              cashSales: shiftStats.cashSales,
              cardSales: shiftStats.cardSales,
              avgOrderValue: shiftStats.avgOrderValue,
              ordersPerHour: shiftStats.ordersPerHour,
            },
          }),
        })

        const result = await response.json()
        console.log("📡 Shift close request response:", result)

        if (response.ok && result.success) {
          apiSuccess = true
          console.log("✅ Shift close request sent successfully")
          
          // Set waiting for approval state
          setIsWaitingForApproval(true)
          setRequestSent(true)
        } else {
          console.warn("❌ Shift close request failed:", result.message || "Unknown error")
          setError(result.message || "فشل في إرسال طلب إنهاء الوردية")
        }
      } catch (apiError) {
        console.error("❌ API request failed:", apiError)
        setError("فشل في الاتصال بالخادم")
      }

      // Step 3: Save to local storage regardless of API result
      const endShiftRequest = {
        id: `shift-end-${Date.now()}`,
        cashier: currentUser.full_name || currentUser.name || currentUser.username,
        cashier_id: userId,
        shift: shiftId,
        shiftName: getShiftDisplayName(currentShift),
        startTime: currentUser.loginTime,
        endTime: new Date().toISOString(),
        totalOrders: shiftStats.totalOrders,
        totalSales: shiftStats.totalSales,
        cashSales: shiftStats.cashSales,
        cardSales: shiftStats.cardSales,
        avgOrderValue: shiftStats.avgOrderValue,
        ordersPerHour: shiftStats.ordersPerHour,
        savedOrdersCount: savedOrders.length,
        notes: notes,
        status: apiSuccess ? "api_requested" : "local_pending",
        timestamp: new Date().toISOString(),
        orders: savedOrders,
        apiSuccess: apiSuccess,
        shiftSummary: shiftSummary,
      }

      const existingRequests = JSON.parse(localStorage.getItem("endShiftRequests") || "[]")
      existingRequests.push(endShiftRequest)
      localStorage.setItem("endShiftRequests", JSON.stringify(existingRequests))

      // Don't automatically redirect - wait for approval
      if (!apiSuccess) {
        // If API failed, show error but don't redirect
        setRequestSent(true)
        setTimeout(() => {
          setRequestSent(false)
          setError("فشل في إرسال الطلب للخادم. يرجى المحاولة مرة أخرى.")
        }, 3000)
      }
      // If API succeeded, isWaitingForApproval is already set and will handle the flow
    } catch (error: any) {
      setError(error.message || "فشل في إرسال طلب إنهاء الوردية")
      console.error("Error ending shift:", error)
    } finally {
      setLoading(false)
    }
  }

  const groupItemsByCategory = (orders: Order[]) => {
    const grouped: { [key: string]: { items: any[]; total: number; count: number } } = {}

    orders.forEach((order) => {
      order.items.forEach((item) => {
        // Get category name and ensure it's not empty or undefined
        let category = item.category
        if (!category || category.trim() === "" || category === "غير محدد") {
          category = "منتجات أخرى"
        }

        if (!grouped[category]) {
          grouped[category] = { items: [], total: 0, count: 0 }
        }

        const existingItem = grouped[category].items.find(
          (existing) => existing.name === item.name && existing.size === item.size,
        )

        if (existingItem) {
          existingItem.quantity += item.quantity
          existingItem.total += item.price * item.quantity
        } else {
          grouped[category].items.push({
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })
        }

        grouped[category].total += item.price * item.quantity
        grouped[category].count += item.quantity
      })
    })

    return grouped
  }

  const handlePrintShiftReport = useReactToPrint({
    contentRef: shiftReportRef,
    documentTitle: `تقرير نهاية الوردية - ${currentUser?.name} - ${new Date().toLocaleDateString()}`,
  })

  const onPrintShiftReport = () => {
    if (!shiftReportRef.current) {
      console.error("Shift report content not ready")
      return
    }
    handlePrintShiftReport()
  }

  const groupedItems = groupItemsByCategory(savedOrders)
  const shiftDuration = currentUser
    ? Math.round((new Date().getTime() - new Date(currentUser.loginTime).getTime()) / (1000 * 60 * 60))
    : 0

  if (!currentUser) return null

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">طلب إنهاء الوردية</CardTitle>
            <div className="flex gap-2">
              <Button onClick={loadShiftData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث
              </Button>
              <Button
                onClick={onPrintShiftReport}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={savedOrders.length === 0}
              >
                <Printer className="w-4 h-4 mr-2" />
                طباعة التقرير
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">خطأ</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {requestSent && isWaitingForApproval ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="h-16 w-16 mb-4 relative">
                <div className="absolute inset-0 border-4 border-amber-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-xl font-medium mb-2 text-amber-700">في انتظار موافقة المدير</h3>
              <p className="text-muted-foreground mb-4">
                تم إرسال طلب إنهاء الوردية بنجاح. يرجى الانتظار حتى يوافق المدير على الطلب.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium text-sm">تنبيه هام</span>
                </div>
                <p className="text-amber-600 text-sm">
                  لا يمكنك تسجيل الخروج أو مغادرة هذه الصفحة حتى تتم الموافقة على إنهاء الوردية.
                  سيتم توجيهك تلقائياً عند الموافقة.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>جاري التحقق من حالة الموافقة...</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkShiftApprovalStatus}
                className="mt-4"
              >
                تحقق الآن من حالة الموافقة
              </Button>
            </motion.div>
          ) : requestSent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">تم إرسال طلب إنهاء الوردية</h3>
              <p className="text-muted-foreground mb-4">تم إرسال طلبك للمدير للموافقة عليه. يرجى الانتظار...</p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mt-4">
                <motion.div
                  className="bg-green-500 h-2.5 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                ></motion.div>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">تأكيد إنهاء الوردية</h4>
                  <p className="text-amber-700 text-sm">
                    أنت على وشك إنهاء وردية {getShiftDisplayName(currentShift)}. هذا الإجراء يتطلب موافقة المدير.
                  </p>
                </div>
              </div>

              {/* Stats Cards - REMOVED Average Order Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">إجمالي الطلبات</p>
                        <p className="text-2xl font-bold">{shiftStats.totalOrders}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">إجمالي المبيعات</p>
                        <p className="text-2xl font-bold">ج.م{shiftStats.totalSales.toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">مدة الوردية</p>
                        <p className="text-2xl font-bold">{shiftDuration}س</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">معلومات الوردية</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الكاشير:</span>
                      <span className="font-medium">{currentUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">نوع الوردية:</span>
                      <span className="font-medium">{getShiftDisplayName(currentShift)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">وقت البدء:</span>
                      <span className="font-medium">{new Date(currentUser.loginTime).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">وقت النهاية:</span>
                      <span className="font-medium">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">ملاحظات الوردية</h3>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أدخل أي ملاحظات هنا..."
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                {showSummary ? (
                  <Button onClick={handleEndShiftRequest} className="bg-red-600 hover:bg-red-700" disabled={loading}>
                    {loading ? "جاري إرسال الطلب..." : "تأكيد إنهاء الوردية"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleShowSummary} 
                    className="bg-blue-600 hover:bg-blue-700" 
                    disabled={loadingSummary}
                  >
                    {loadingSummary ? "جاري تحميل ملخص الوردية..." : "عرض ملخص الوردية"}
                  </Button>
                )}
                {showSummary && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSummary(false)}
                    disabled={loading}
                  >
                    رجوع
                  </Button>
                )}
              </div>
              
              {/* Enhanced Shift Summary Section */}
              {showSummary && shiftSummary && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 border rounded-lg p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200"
                >
                  {/* Shift Header with Enhanced Info */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center bg-green-100">
                        <Coffee className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{getShiftDisplayName(currentShift)}</h3>
                        <p className="text-sm text-muted-foreground">
                          الكاشير: {shiftSummary?.cashiers?.length > 0 ? 
                            shiftSummary.cashiers.map(c => c.username).join(", ") : 
                            currentUser?.name || currentUser?.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {shiftSummary?.start_time ? 
                            `بدأت: ${new Date(shiftSummary.start_time).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}` :
                            `بدأت: ${new Date(currentUser?.loginTime).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          }
                          {shiftSummary?.end_time && 
                            ` - انتهت: ${new Date(shiftSummary.end_time).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ج.م {parseFloat(shiftSummary?.total_revenue?.toString() || "0").toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {shiftSummary?.total_orders || 0} طلب إجمالي
                      </p>
                      {shiftSummary?.cafe_revenue > 0 && (
                        <p className="text-xs text-orange-600 font-medium">
                          كافيه: ج.م {parseFloat(shiftSummary.cafe_revenue.toString()).toFixed(2)}
                        </p>
                      )}
                      <Badge variant="default" className="mt-1">
                        {shiftSummary?.end_time ? "مكتملة" : "نشطة"}
                      </Badge>
                    </div>
                  </div>

                  {/* Enhanced Revenue Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          ج.م {parseFloat(shiftSummary?.total_revenue?.toString() || "0").toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                      </div>
                    </div>
                    {shiftSummary?.cafe_revenue > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-orange-200">
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            ج.م {parseFloat(shiftSummary.cafe_revenue.toString()).toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground">إيرادات الكافيه</p>
                        </div>
                      </div>
                    )}
                    <div className="bg-white p-4 rounded-lg border border-red-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          ج.م {parseFloat(shiftSummary?.total_expenses?.toString() || "0").toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">إجمالي المصاريف</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          ج.م {parseFloat(shiftSummary?.total_salaries?.toString() || "0").toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">رواتب الموظفين</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Types Analysis - Enhanced */}
                  {shiftSummary?.orders_by_type ? (
                    <div className="mb-6">
                      <h4 className="font-semibold text-sm mb-3">تحليل الطلبات حسب النوع</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg border text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {shiftSummary.orders_by_type["dine-in"] || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">تناول في المطعم</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border text-center">
                          <div className="text-lg font-bold text-green-600">
                            {shiftSummary.orders_by_type.takeaway || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">تيك اواي</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {shiftSummary.orders_by_type.delivery || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">توصيل</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {shiftSummary.orders_by_type.cafe || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">كافيه</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Payment Methods and Order Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {shiftSummary?.orders_by_payment ? (
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-sm mb-3">طرق الدفع</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">نقدي:</span>
                            <span className="text-sm font-medium">
                              {shiftSummary.orders_by_payment.cash || 0} طلب
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">كارت:</span>
                            <span className="text-sm font-medium">
                              {shiftSummary.orders_by_payment.card || 0} طلب
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    
                    {shiftSummary?.orders_by_status ? (
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-sm mb-3">حالة الطلبات</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">مكتملة:</span>
                            <span className="text-sm font-medium text-green-600">
                              {shiftSummary.orders_by_status.completed || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">قيد التنفيذ:</span>
                            <span className="text-sm font-medium text-yellow-600">
                              {shiftSummary.orders_by_status.pending || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">ملغاة:</span>
                            <span className="text-sm font-medium text-red-600">
                              {shiftSummary.orders_by_status.cancelled || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-sm mb-3">مؤشرات الأداء</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">متوسط الطلب:</span>
                          <span className="text-sm font-medium">
                            ج.م {shiftSummary?.average_order_value?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">إجمالي الطلبات:</span>
                          <span className="text-sm font-medium">
                            {shiftSummary?.total_orders || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Selling Items */}
                  {shiftSummary?.top_selling_items && shiftSummary.top_selling_items.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border mb-6">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        أكثر الأصناف مبيعاً
                      </h4>
                      <div className="space-y-2">
                        {shiftSummary.top_selling_items.slice(0, 5).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.name || item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} قطعة في {item.orders_count || item.orders} طلب
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">
                                ج.م {parseFloat(item.total_sales || item.total_price || "0").toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Detailed Expenses Section */}
                  {shiftSummary?.expenses && shiftSummary.expenses.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border mb-6">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4" />
                        تفاصيل المصروفات ({shiftSummary.expenses.length})
                      </h4>
                      <div className="max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {shiftSummary.expenses.map((expense: any, i: number) => (
                            <div key={expense.expense_id || `expense-${i}`} className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-100">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{expense.title}</div>
                                {expense.description && (
                                  <div className="text-xs text-gray-600 mt-1">{expense.description}</div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  {expense.category && `${expense.category} • `}
                                  بواسطة: {expense.created_by?.full_name || "غير محدد"} • 
                                  {expense.created_at && 
                                    ` ${new Date(expense.created_at).toLocaleString("ar-EG", {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}`
                                  }
                                </div>
                              </div>
                              <div className="font-bold text-red-600 text-right">
                                ج.م {parseFloat(expense.amount?.toString() || "0").toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-red-200 flex justify-between items-center">
                          <span className="text-sm font-medium">إجمالي المصروفات:</span>
                          <span className="text-lg font-bold text-red-600">
                            ج.م {parseFloat(shiftSummary.total_expenses?.toString() || "0").toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Worker Details Section */}
                  {shiftSummary?.workers && shiftSummary.workers.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border mb-6">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4" />
                        تفاصيل الموظفين ({shiftSummary.workers.length})
                      </h4>
                      <div className="space-y-2">
                        {shiftSummary.workers.map((worker: any, i: number) => (
                          <div key={worker.shift_worker_id || `worker-${i}`} className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-100">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{worker.worker_name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {worker.start_time && 
                                  `بداية: ${new Date(worker.start_time).toLocaleTimeString("ar-EG", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}`
                                }
                                {worker.end_time && 
                                  ` - نهاية: ${new Date(worker.end_time).toLocaleTimeString("ar-EG", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}`
                                }
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                أجر الساعة: ج.م {parseFloat(worker.hourly_rate?.toString() || "0").toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-blue-600">
                                ج.م {parseFloat(worker.calculated_salary?.toString() || "0").toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(((new Date(worker.end_time || new Date()).getTime() - new Date(worker.start_time).getTime()) / (1000 * 60 * 60)).toFixed(1))} ساعة
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                        <span className="text-sm font-medium">إجمالي الرواتب:</span>
                        <span className="text-lg font-bold text-blue-600">
                          ج.م {parseFloat(shiftSummary.total_salaries?.toString() || "0").toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Final Net Profit Section - Enhanced */}
                  <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
                    <div className="text-center">
                      <h4 className="font-bold text-lg flex items-center justify-center gap-2 mb-4">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                        صافي الربح النهائي
                      </h4>
                      <div className="text-4xl font-bold text-green-700 mb-4">
                        ج.م {parseFloat(shiftSummary?.final_number?.toString() || "0").toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-sm font-semibold text-gray-600">الإيرادات</div>
                        <div className="text-lg font-bold text-green-600">
                          +ج.م {parseFloat(shiftSummary?.total_revenue?.toString() || "0").toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-sm font-semibold text-gray-600">المصاريف</div>
                        <div className="text-lg font-bold text-red-600">
                          -ج.م {parseFloat(shiftSummary?.total_expenses?.toString() || "0").toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-sm font-semibold text-gray-600">الرواتب</div>
                        <div className="text-lg font-bold text-red-600">
                          -ج.م {parseFloat(shiftSummary?.total_salaries?.toString() || "0").toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
