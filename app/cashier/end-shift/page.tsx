"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle2, Printer, RefreshCw, Users, Clock, DollarSign } from "lucide-react"
import { motion } from "framer-motion"
import { useReactToPrint } from "react-to-print"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

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
  const [notes, setNotes] = useState("")
  const [requestSent, setRequestSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shiftReportRef = useRef<HTMLDivElement>(null)

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
    try {
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
    }
    return null
  }

  const loadShiftData = async () => {
    if (typeof window !== "undefined") {
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
        }
      }

      const savedOrdersString = localStorage.getItem("savedOrders")
      let allOrders: any[] = []

      if (savedOrdersString) {
        try {
          allOrders = JSON.parse(savedOrdersString)
        } catch (error) {
          console.error("Error parsing saved orders:", error)
          allOrders = []
        }
      }

      const currentShiftOrders = allOrders.filter((order: any) => {
        if (!order || !order.order_id) return false

        const orderCashierName = order.cashier_name || order.cashier?.full_name || "[اسم الكاشير غير متوفر]"
        const matchesCashier = orderCashierName === currentCashierName

        const orderShiftId = order.shift?.shift_id || order.shift_id || ""
        const currentShiftId = getShiftId(user.shift)
        const matchesShift = orderShiftId === currentShiftId

        return matchesCashier && matchesShift
      })

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
    }
  }

  useEffect(() => {
    loadShiftData()

    const handleOrderAdded = () => {
      loadShiftData()
    }

    const handleStorageChange = () => {
      loadShiftData()
    }

    window.addEventListener("orderAdded", handleOrderAdded)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("orderAdded", handleOrderAdded)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

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
      let shiftSummary = null

      // Step 1: Get shift summary first
      try {
        console.log(`🔍 Getting shift summary for shift ${shiftId}`)
        const summaryResponse = await fetch(`${API_BASE_URL}/shifts/${shiftId}/summary`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (summaryResponse.ok) {
          const summaryResult = await summaryResponse.json()
          if (summaryResult.success) {
            shiftSummary = summaryResult.data
            console.log("✅ Shift summary retrieved:", shiftSummary)
          }
        }
      } catch (summaryError) {
        console.warn("⚠️ Failed to get shift summary:", summaryError)
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

      if (apiSuccess) {
        setRequestSent(true)
        setTimeout(() => {
          localStorage.removeItem("currentUser")
          router.push("/")
        }, 3000)
      } else {
        // If API failed, still allow local save but show warning
        setRequestSent(true)
        setTimeout(() => {
          localStorage.removeItem("currentUser")
          router.push("/")
        }, 5000) // Longer delay to show the error
      }
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

          {requestSent ? (
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

              <div className="mt-6">
                <Button onClick={handleEndShiftRequest} className="bg-red-600 hover:bg-red-700" disabled={loading}>
                  {loading ? "جاري إرسال الطلب..." : "إنهاء الوردية"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
