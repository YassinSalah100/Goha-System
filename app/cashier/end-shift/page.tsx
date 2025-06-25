"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle2, Printer, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useReactToPrint } from "react-to-print"

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

// Advanced Print Styles for Shift Report
const shiftReportPrintStyles = `
  @media print {
    @page {
      size: A4;
      margin: 10mm;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
    }
    
    .print\\:hidden {
      display: none !important;
    }
    
    .shift-report-print {
      display: block !important;
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: white;
      page-break-inside: avoid;
    }
    
    .shift-report-print * {
      color: #000 !important;
      background: white !important;
    }
    
    .shift-report {
      font-family: 'Arial', sans-serif !important;
      background: white !important;
      color: #000 !important;
      padding: 5mm !important;
      margin: 0 !important;
    }
    
    .shift-report .header {
      text-align: center;
      border-bottom: 3px solid #000;
      padding-bottom: 5mm;
      margin-bottom: 5mm;
    }
    
    .shift-report .header h1 {
      font-size: 24px !important;
      margin: 3mm 0;
      font-weight: bold;
    }
    
    .shift-report .header p {
      font-size: 12px !important;
      margin: 1mm 0;
    }
    
    .shift-report .shift-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5mm;
      margin-bottom: 5mm;
      padding: 3mm;
      border: 2px solid #000;
      background: #f9f9f9 !important;
    }
    
    .shift-report .shift-info div {
      font-size: 11px !important;
      margin: 1mm 0;
    }
    
    .shift-report .shift-info .info-label {
      font-weight: bold;
      margin-bottom: 0.5mm;
    }
    
    .shift-report .summary-stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 3mm;
      margin-bottom: 5mm;
    }
    
    .shift-report .stat-box {
      border: 2px solid #000;
      padding: 3mm;
      text-align: center;
      background: #f5f5f5 !important;
    }
    
    .shift-report .stat-box .stat-value {
      font-size: 16px !important;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    
    .shift-report .stat-box .stat-label {
      font-size: 10px !important;
      font-weight: bold;
    }
    
    .shift-report .orders-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5mm;
      font-size: 10px !important;
    }
    
    .shift-report .orders-table th,
    .shift-report .orders-table td {
      border: 1px solid #000;
      padding: 2mm;
      text-align: left;
      vertical-align: top;
    }
    
    .shift-report .orders-table th {
      background: #e0e0e0 !important;
      font-weight: bold;
      font-size: 11px !important;
    }
    
    .shift-report .category-breakdown {
      margin: 3mm 0;
      page-break-inside: avoid;
    }
    
    .shift-report .category-header {
      background: #d0d0d0 !important;
      padding: 2mm;
      font-weight: bold;
      font-size: 12px !important;
      border: 1px solid #000;
      text-align: center;
    }
    
    .shift-report .category-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 3mm;
      font-size: 9px !important;
    }
    
    .shift-report .category-table th,
    .shift-report .category-table td {
      border: 1px solid #000;
      padding: 1mm;
      text-align: left;
    }
    
    .shift-report .category-table th {
      background: #f0f0f0 !important;
      font-weight: bold;
    }
    
    .shift-report .total-section {
      border: 3px solid #000;
      padding: 3mm;
      text-align: center;
      font-size: 16px !important;
      font-weight: bold;
      background: #f0f0f0 !important;
      margin-top: 5mm;
    }
    
    .shift-report .notes-section {
      margin-top: 5mm;
      padding: 3mm;
      border: 1px solid #000;
      background: #fff3cd !important;
    }
    
    .shift-report .footer {
      text-align: center;
      margin-top: 5mm;
      padding-top: 3mm;
      border-top: 2px solid #000;
      font-size: 10px !important;
    }
    
    .shift-report .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10mm;
      margin-top: 10mm;
      padding-top: 5mm;
      border-top: 1px solid #000;
    }
    
    .shift-report .signature-box {
      text-align: center;
      padding: 5mm;
      border: 1px solid #000;
    }
    
    .shift-report .signature-line {
      border-bottom: 1px solid #000;
      height: 10mm;
      margin-bottom: 2mm;
    }
  }
`

// Add the style tag to the document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style")
  styleElement.textContent = shiftReportPrintStyles
  document.head.appendChild(styleElement)
}

export default function EndShiftPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [savedOrders, setSavedOrders] = useState<Order[]>([]) // الطلبات المحفوظة
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
  const shiftReportRef = useRef<HTMLDivElement>(null)

  // Function to load and filter saved orders
  const loadSavedOrders = () => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")

      // Get all saved orders from localStorage
      const savedOrdersString = localStorage.getItem("savedOrders")
      let allOrders: Order[] = []
      if (savedOrdersString) {
        try {
          allOrders = JSON.parse(savedOrdersString)
        } catch (error) {
          console.error("Error parsing saved orders:", error)
          allOrders = []
        }
      }

      console.log("All orders from localStorage:", allOrders.length)

      // Filter out mock data completely
      const mockIds = ["0001", "0002", "0003", "1", "2", "3"]
      const realOrders = allOrders.filter((order: any) => {
        const isMockId = mockIds.includes(String(order.id))
        const isMockDate = order.date && order.date.includes("2023-06-12")
        const isMockCashier = order.cashier === "cashier"
        const isMockCustomer = order.customerName === "أحمد محمد" && order.total === 85.5

        return !isMockId && !isMockDate && !isMockCashier && !isMockCustomer
      })

      console.log("Real orders after filtering mock data:", realOrders.length)

      // Filter orders for current cashier and shift
      // Don't filter by login time - get ALL orders from this cashier and shift
      const currentShiftOrders = realOrders.filter((order) => {
        const matchesCashier = order.cashier === user.name || order.cashier === user.username
        const matchesShift = order.shift === user.shift

        console.log(
          `Order ${order.id}: cashier=${order.cashier}, shift=${order.shift}, matches=${matchesCashier && matchesShift}`,
        )

        return matchesCashier && matchesShift
      })

      console.log("Orders for current shift:", currentShiftOrders.length)
      console.log("Current user:", user.name, user.shift)

      setSavedOrders(currentShiftOrders)

      // Calculate comprehensive stats
      const total = currentShiftOrders.reduce((sum, order) => sum + order.total, 0)
      const cashTotal = currentShiftOrders
        .filter((order) => order.paymentMethod === "cash")
        .reduce((sum, order) => sum + order.total, 0)
      const cardTotal = currentShiftOrders
        .filter((order) => order.paymentMethod === "card")
        .reduce((sum, order) => sum + order.total, 0)

      // Calculate orders per hour based on shift duration
      const loginTime = new Date(user.loginTime)
      const shiftDurationHours = (new Date().getTime() - loginTime.getTime()) / (1000 * 60 * 60)
      const ordersPerHour = shiftDurationHours > 0 ? currentShiftOrders.length / shiftDurationHours : 0

      setShiftStats({
        totalOrders: currentShiftOrders.length,
        totalSales: total,
        cashSales: cashTotal,
        cardSales: cardTotal,
        avgOrderValue: currentShiftOrders.length > 0 ? total / currentShiftOrders.length : 0,
        ordersPerHour: ordersPerHour,
      })

      setCurrentUser(user)
    }
  }

  useEffect(() => {
    loadSavedOrders()

    // Listen for new orders added from sales page
    const handleOrderAdded = () => {
      loadSavedOrders() // Reload orders when new order is added
    }

    const handleStorageChange = () => {
      loadSavedOrders() // Reload orders when localStorage changes
    }

    // Add event listeners for real-time updates
    window.addEventListener("orderAdded", handleOrderAdded)
    window.addEventListener("storage", handleStorageChange)

    // Cleanup event listeners
    return () => {
      window.removeEventListener("orderAdded", handleOrderAdded)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Add this after the existing useEffect
  useEffect(() => {
    // Debug: Log localStorage contents
    const savedOrdersString = localStorage.getItem("savedOrders")
    if (savedOrdersString) {
      const allOrders = JSON.parse(savedOrdersString)
      console.log("Debug - All saved orders:", allOrders)
      console.log("Debug - Total saved orders:", allOrders.length)
    }

    const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
    console.log("Debug - Current user:", user)
  }, [])

  const handleEndShiftRequest = () => {
    // Create comprehensive end shift request
    const endShiftRequest = {
      id: `shift-end-${Date.now()}`,
      cashier: currentUser.name,
      shift: currentUser.shift,
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
      status: "pending",
      timestamp: new Date().toISOString(),
      orders: savedOrders, // Include all saved orders in the request
    }

    // Store in localStorage for admin review
    const existingRequests = JSON.parse(localStorage.getItem("endShiftRequests") || "[]")
    existingRequests.push(endShiftRequest)
    localStorage.setItem("endShiftRequests", JSON.stringify(existingRequests))

    setRequestSent(true)

    // After 3 seconds, redirect to login page (simulating approval)
    setTimeout(() => {
      localStorage.removeItem("currentUser")
      router.push("/")
    }, 3000)
  }

  // Group items by category for detailed breakdown
  const groupItemsByCategory = (orders: Order[]) => {
    const grouped: { [key: string]: { items: any[]; total: number; count: number } } = {}

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const category = item.category
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
    onAfterPrint: () => {
      console.log("Shift report printed successfully")
    },
    onPrintError: (error) => {
      console.error("Print shift report error:", error)
    },
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

  const shiftOrders = savedOrders

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">طلب إنهاء الوردية</CardTitle>
            <div className="flex gap-2">
              <Button onClick={loadSavedOrders} variant="outline" className="bg-gray-100 hover:bg-gray-200">
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
                    أنت على وشك إنهاء وردية {currentUser.shift}. هذا الإجراء يتطلب موافقة المدير. يرجى مراجعة ملخص
                    الوردية أدناه.
                  </p>
                </div>
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
                      <span className="font-medium capitalize">{currentUser.shift}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">بدأت في:</span>
                      <span className="font-medium">
                        {new Date(currentUser.loginTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">التاريخ:</span>
                      <span className="font-medium">{new Date(currentUser.loginTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المدة:</span>
                      <span className="font-medium">{shiftDuration} ساعات</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">ملخص المبيعات</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">عدد الطلبات:</span>
                      <span className="font-medium">{shiftStats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">إجمالي الطلبات:</span>
                      <span className="font-medium text-green-600 text-lg">ج.م{shiftStats.totalSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">متوسط قيمة الطلب:</span>
                      <span className="font-medium">ج.م{shiftStats.avgOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">طلبات في الساعة:</span>
                      <span className="font-medium">{shiftStats.ordersPerHour.toFixed(1)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">مبيعات نقدية:</span>
                      <span className="font-medium">ج.م{shiftStats.cashSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">مبيعات بالكارت:</span>
                      <span className="font-medium">ج.م{shiftStats.cardSales.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">الطلبات المحفوظة ({savedOrders.length} طلب)</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          رقم الطلب
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الوقت
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          العميل
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          النوع
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          عدد الأصناف
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الإجمالي
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الحالة
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {savedOrders.length > 0 ? (
                        savedOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">#{order.id}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {new Date(order.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {order.customerName || "Walk-in Customer"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {order.orderType === "dine-in"
                                ? "تناول في المطعم"
                                : order.orderType === "takeaway"
                                  ? "استلام"
                                  : "توصيل"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                              {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                              ج.م{order.total.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {order.status === "completed" ? "مكتمل" : order.status === "pending" ? "معلق" : "ملغي"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-center text-sm text-gray-500">
                            لا توجد طلبات محفوظة في هذه الوردية
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">ملاحظات إضافية</h3>
                <Textarea
                  placeholder="أضف أي ملاحظات حول الوردية (اختياري)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-24"
                />
              </div>
            </>
          )}
        </CardContent>
        {!requestSent && (
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              إلغاء
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleEndShiftRequest}>
              إرسال طلب إنهاء الوردية
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Advanced Shift Report for Printing - Hidden from normal view */}
      <div ref={shiftReportRef} className="hidden print:block shift-report-print" style={{ display: "none" }}>
        <div className="shift-report">
          <div className="header">
            <img src="/images/logo.png" alt="Logo" style={{ width: 80, height: 80, margin: "0 auto 5px" }} />
            <h1>دوار جحا</h1>
            <p>Restaurant & Café</p>
            <p>123 Main Street, City</p>
            <p>Tel: +123 456 7890</p>
            <p style={{ fontWeight: "bold", marginTop: "5mm", fontSize: "18px" }}>تقرير نهاية الوردية</p>
          </div>

          <div className="shift-info">
            <div>
              <div className="info-label">معلومات الكاشير</div>
              <div>
                <strong>الاسم:</strong> {currentUser?.name}
              </div>
              <div>
                <strong>اسم المستخدم:</strong> {currentUser?.username}
              </div>
              <div>
                <strong>نوع الوردية:</strong> {currentUser?.shift}
              </div>
            </div>
            <div>
              <div className="info-label">معلومات الوقت</div>
              <div>
                <strong>تاريخ التقرير:</strong> {new Date().toLocaleDateString()}
              </div>
              <div>
                <strong>وقت الطباعة:</strong> {new Date().toLocaleTimeString()}
              </div>
              <div>
                <strong>بداية الوردية:</strong> {new Date(currentUser?.loginTime).toLocaleTimeString()}
              </div>
              <div>
                <strong>مدة الوردية:</strong> {shiftDuration} ساعات
              </div>
            </div>
          </div>

          <div className="summary-stats">
            <div className="stat-box">
              <div className="stat-value">{shiftStats.totalOrders}</div>
              <div className="stat-label">إجمالي الطلبات</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">ج.م{shiftStats.totalSales.toFixed(2)}</div>
              <div className="stat-label">إجمالي المبيعات</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">ج.م{shiftStats.cashSales.toFixed(2)}</div>
              <div className="stat-label">مبيعات نقدية</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">ج.م{shiftStats.cardSales.toFixed(2)}</div>
              <div className="stat-label">مبيعات بالكارت</div>
            </div>
          </div>

          {shiftOrders.length > 0 && (
            <>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "3mm" }}>تفاصيل الطلبات</h3>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>الوقت</th>
                    <th>العميل</th>
                    <th>النوع</th>
                    <th>طريقة الدفع</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{new Date(order.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td>{order.customerName || "Walk-in Customer"}</td>
                      <td>
                        {order.orderType === "dine-in"
                          ? "تناول في المطعم"
                          : order.orderType === "takeaway"
                            ? "استلام"
                            : "توصيل"}
                      </td>
                      <td>{order.paymentMethod === "cash" ? "نقدي" : "كارت"}</td>
                      <td style={{ fontWeight: "bold" }}>ج.م{order.total.toFixed(2)}</td>
                      <td>{order.status === "completed" ? "مكتمل" : order.status === "pending" ? "معلق" : "ملغي"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {Object.entries(groupedItems).length > 0 && (
                <>
                  <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "3mm", marginTop: "5mm" }}>
                    تفصيل المنتجات حسب الفئة
                  </h3>
                  {Object.entries(groupedItems).map(([category, data]) => (
                    <div key={category} className="category-breakdown">
                      <div className="category-header">
                        {category === "pizza"
                          ? "البيتزا"
                          : category === "feteer"
                            ? "الفطائر"
                            : category === "sandwiches"
                              ? "الساندويتشات"
                              : category === "crepes"
                                ? "الكريبات"
                                : category === "grilled"
                                  ? "المشويات"
                                  : category === "drinks"
                                    ? "المشروبات"
                                    : category === "pasta"
                                      ? "المكرونة"
                                      : category === "rice"
                                        ? "الأرز"
                                        : category === "desserts"
                                          ? "الحلويات"
                                          : category === "extras"
                                            ? "الإضافات"
                                            : category}{" "}
                        - {data.count} قطعة - ج.م{data.total.toFixed(2)}
                      </div>
                      <table className="category-table">
                        <thead>
                          <tr>
                            <th>اسم المنتج</th>
                            <th>الحجم</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.name}</td>
                              <td>{item.size !== "regular" ? item.size : "-"}</td>
                              <td style={{ textAlign: "center" }}>{item.quantity}</td>
                              <td>ج.م{item.price.toFixed(2)}</td>
                              <td style={{ fontWeight: "bold" }}>ج.م{item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          <div className="total-section">
            <div style={{ fontSize: "18px", marginBottom: "2mm" }}>إجمالي مبيعات الوردية</div>
            <div style={{ fontSize: "24px" }}>ج.م{shiftStats.totalSales.toFixed(2)}</div>
          </div>

          {notes && (
            <div className="notes-section">
              <h4 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "2mm" }}>ملاحظات الكاشير:</h4>
              <p style={{ fontSize: "11px" }}>{notes}</p>
            </div>
          )}

          <div className="signature-section">
            <div className="signature-box">
              <div className="signature-line"></div>
              <div style={{ fontSize: "10px", fontWeight: "bold" }}>توقيع الكاشير</div>
              <div style={{ fontSize: "9px" }}>{currentUser?.name}</div>
            </div>
            <div className="signature-box">
              <div className="signature-line"></div>
              <div style={{ fontSize: "10px", fontWeight: "bold" }}>توقيع المدير</div>
              <div style={{ fontSize: "9px" }}>التاريخ: ___________</div>
            </div>
          </div>

          <div className="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام نقاط البيع</p>
            <p>تاريخ ووقت الطباعة: {new Date().toLocaleString()}</p>
            <div
              style={{ marginTop: "3mm", display: "flex", alignItems: "center", justifyContent: "center", gap: "2mm" }}
            >
              <img src="/images/eathrel.png" alt="Eathrel Logo" style={{ width: 20, height: 20 }} />
              <span style={{ fontSize: "10px", fontWeight: "bold" }}>POWERED BY ETHEREAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
