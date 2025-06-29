"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Phone, User, Trash2 } from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Image from 'next/image'

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

// Enhanced Print All Styles - Advanced styling for saved orders
const printAllStyles = `
  @media print {
    @page {
      size: A4;
      margin: 5mm;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
    }
    
    .print\\:hidden {
      display: none !important;
    }
    
    .print-all-summary {
      display: block !important;
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
      color: #000;
      background: white;
      transform: scale(0.85);
      transform-origin: top left;
      page-break-inside: avoid;
    }
    
    .print-all-summary * {
      color: #000 !important;
      background: white !important;
    }
    
    .advanced-receipt {
      font-family: 'Arial', sans-serif !important;
      background: white !important;
      color: #000 !important;
      padding: 3mm !important;
      margin: 0 !important;
      page-break-inside: avoid !important;
    }
    
    .advanced-receipt .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 3mm;
      margin-bottom: 3mm;
    }
    
    .advanced-receipt .header h1 {
      font-size: 20px !important;
      margin: 2mm 0;
      font-weight: bold;
    }
    
    .advanced-receipt .header p {
      font-size: 10px !important;
      margin: 1mm 0;
    }
    
    .advanced-receipt .order-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2mm;
      margin-bottom: 3mm;
      padding: 2mm;
      border: 1px solid #000;
      background: #f9f9f9 !important;
    }
    
    .advanced-receipt .order-details div {
      font-size: 9px !important;
      margin: 0.5mm 0;
    }
    
    .advanced-receipt .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 3mm;
      font-size: 8px !important;
    }
    
    .advanced-receipt .items-table th,
    .advanced-receipt .items-table td {
      border: 1px solid #000;
      padding: 1mm;
      text-align: left;
      vertical-align: top;
    }
    
    .advanced-receipt .items-table th {
      background: #e0e0e0 !important;
      font-weight: bold;
      font-size: 9px !important;
    }
    
    .advanced-receipt .category-section {
      margin: 2mm 0;
      page-break-inside: avoid;
    }
    
    .advanced-receipt .category-header {
      background: #d0d0d0 !important;
      padding: 1mm;
      font-weight: bold;
      font-size: 10px !important;
      border: 1px solid #000;
      text-align: center;
    }
    
    .advanced-receipt .total-section {
      border: 2px solid #000;
      padding: 2mm;
      text-align: center;
      font-size: 12px !important;
      font-weight: bold;
      background: #f0f0f0 !important;
      margin-top: 3mm;
    }
    
    .advanced-receipt .footer {
      text-align: center;
      margin-top: 3mm;
      padding-top: 2mm;
      border-top: 1px solid #000;
      font-size: 8px !important;
    }
    
    .advanced-receipt .summary-stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 2mm;
      margin-bottom: 3mm;
    }
    
    .advanced-receipt .stat-box {
      border: 1px solid #000;
      padding: 2mm;
      text-align: center;
      background: #f5f5f5 !important;
    }
    
    .advanced-receipt .stat-box .stat-value {
      font-size: 12px !important;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    
    .advanced-receipt .stat-box .stat-label {
      font-size: 8px !important;
    }
  }
`

// Add the style tag to the document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style")
  styleElement.textContent = printAllStyles
  document.head.appendChild(styleElement)
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [cancelRequests, setCancelRequests] = useState<any[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [currentCashier, setCurrentCashier] = useState("")
  const printAllRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load real orders only (filter out mock data)
    const savedOrdersString = localStorage.getItem("savedOrders")
    if (savedOrdersString) {
      const savedOrders = JSON.parse(savedOrdersString)

      // Filter out mock data
      const mockIds = ["0001", "0002", "0003", "1", "2", "3"]
      const realOrders = savedOrders.filter((order: any) => {
        const isMockId = mockIds.includes(String(order.id))
        const isMockDate = order.date && order.date.includes("2023-06-12")
        const isMockCashier = order.cashier === "cashier"

        return !isMockId && !isMockDate && !isMockCashier
      })

      setOrders(realOrders)
    }
    // Load cancel requests
    const storedRequests = JSON.parse(localStorage.getItem("cancelRequests") || "[]")
    setCancelRequests(storedRequests)
    // Load current cashier
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
    setCurrentCashier(user?.name || "")
  }, [])

  // Add this useEffect after the existing one
  useEffect(() => {
    // Listen for cancel request updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cancelRequests") {
        const updatedRequests = JSON.parse(e.newValue || "[]")
        setCancelRequests(updatedRequests)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Get only real orders (filter out mock data)
  const getRealOrders = () => {
    const savedOrdersString = localStorage.getItem("savedOrders")
    let allOrders = []
    if (savedOrdersString) {
      allOrders = JSON.parse(savedOrdersString)
    }
    const mockIds = ["0001", "0002", "0003", "1", "2", "3"]
    const realOrders = allOrders.filter((order: any) => {
      const isMockId = mockIds.includes(String(order.id))
      const isMockDate = order.date && order.date.includes("2023-06-12")
      const isMockCashier = order.cashier === "cashier"
      return !isMockId && !isMockDate && !isMockCashier
    })
    return realOrders
  }

  // Group items by category for print all
  const groupItemsByCategory = (orders: any[]) => {
    const grouped: { [key: string]: { items: any[]; total: number } } = {}

    orders.forEach((order) => {
      order.items.forEach((item: any) => {
        const category = item.category
        if (!grouped[category]) {
          grouped[category] = { items: [], total: 0 }
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
      })
    })

    return grouped
  }

  const handlePrintAllOrders = useReactToPrint({
    contentRef: printAllRef,
    documentTitle: `تقرير إجمالي الحسابات - ${new Date().toLocaleDateString()}`,
    onAfterPrint: () => {
      console.log("Print all orders completed")
    },
    onPrintError: (error) => {
      console.error("Print all error:", error)
    },
  })

  const onPrintAllClick = () => {
    if (!printAllRef.current) {
      console.error("Print all content not ready")
      return
    }
    handlePrintAllOrders()
  }

  const realOrders = getRealOrders()
  const groupedItems = groupItemsByCategory(realOrders)
  const grandTotal = realOrders.reduce((sum: number, order: any) => sum + order.total, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">مكتمل</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">قيد الانتظار</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">ملغي</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getOrderTypeBadge = (type: string) => {
    switch (type) {
      case "dine-in":
        return <Badge variant="outline">تناول في المطعم</Badge>
      case "takeaway":
        return <Badge variant="outline">استلام</Badge>
      case "delivery":
        return <Badge variant="outline">توصيل</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // Check if an order has a pending delete request
  const isOrderPendingDelete = (orderId: number) => {
    const hasPendingRequest = cancelRequests.some((req) => {
      const match = Number(req.orderId) === Number(orderId) && req.status === "pending"
      return match
    })
    return hasPendingRequest
  }

  // Handle delete button click
  const handleDeleteClick = (orderId: number) => {
    setDeleteOrderId(orderId)
    setDeleteReason("")
    setShowDialog(true)
  }

  // Handle dialog submit
  const handleDialogSubmit = () => {
    if (!deleteOrderId || !deleteReason.trim()) return

    // Add cancel request to localStorage
    const newRequest = {
      id: `req-${Date.now()}`,
      orderId: Number(deleteOrderId), // Ensure it's stored as number
      cashier: currentCashier,
      reason: deleteReason,
      timestamp: new Date().toISOString(),
      status: "pending",
    }

    const updatedRequests = [...cancelRequests, newRequest]
    setCancelRequests(updatedRequests)
    localStorage.setItem("cancelRequests", JSON.stringify(updatedRequests))

    // Force re-render to update the specific order
    setOrders((prevOrders) => [...prevOrders])

    setShowDialog(false)
    setDeleteOrderId(null)
    setDeleteReason("")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Print All Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">الطلبات والمبيعات</h1>
          <p className="text-gray-600">إدارة جميع الطلبات والمبيعات</p>
        </div>

        {/* Print All Button - Top Right */}
        <Button
          onClick={onPrintAllClick}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={realOrders.length === 0}
        >
          <FileText className="w-4 h-4 mr-2" />
          طباعة الكل
        </Button>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>الطلبات المحفوظة</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات محفوظة</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full" style={{ overflowY: "auto", overflowX: "hidden" }}>
              <div className="space-y-4 pr-4">
                {" "}
                {/* Add right padding for scrollbar space */}
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className={`transition-all duration-200 ${
                      isOrderPendingDelete(order.id)
                        ? "border-l-4 border-l-yellow-500 bg-yellow-50 shadow-md"
                        : "border-l-4 border-l-blue-500"
                    }`}
                    style={{
                      minHeight: "auto",
                      isolation: "isolate", // Prevent CSS bleeding to other elements
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">طلب #{order.id}</h3>
                          {order.status !== "pending" && getStatusBadge(order.status)}
                          {getOrderTypeBadge(order.orderType)}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">ج.م{order.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.date).toLocaleDateString()} - {new Date(order.date).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info - Only show if exists */}
                      {(order.customerName || order.phoneNumber) && (
                        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                          {order.customerName && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{order.customerName}</span>
                            </div>
                          )}
                          {order.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{order.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={`${order.id}-${item.id}-${index}`}
                            className="flex justify-between items-center text-sm"
                          >
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.size !== "regular" && <span className="text-gray-500 ml-2">({item.size})</span>}
                              <span className="text-gray-500 ml-2">x{item.quantity}</span>
                            </div>
                            <span className="font-medium">ج.م{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer + Delete Button */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm text-gray-600">
                        <span>الكاشير: {order.cashier}</span>
                        <span>الدفع: {order.paymentMethod === "cash" ? "نقدي" : "كارت"}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="ml-2"
                          onClick={() => handleDeleteClick(order.id)}
                          disabled={isOrderPendingDelete(order.id) || order.status === "cancelled"}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> حذف
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

      {/* Delete Reason Dialog */}
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
            className="mb-4"
          />
          <DialogFooter>
            <Button onClick={handleDialogSubmit} disabled={!deleteReason.trim()}>
              إرسال طلب الحذف
            </Button>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Print All Summary - Hidden from normal view */}
      <div ref={printAllRef} className="hidden print:block print-all-summary" style={{ display: "none" }}>
        <div className="advanced-receipt">
          <div className="header">
            <Image src="/images/logo.png" alt="Logo" width={60} height={60} style={{ margin: "0 auto 5px" }} />
            <h1>دوار جحا</h1>
            <p>Restaurant & Café</p>
            <p>123 Main Street, City</p>
            <p>Tel: +123 456 7890</p>
            <p style={{ fontWeight: "bold", marginTop: "3mm" }}>تقرير إجمالي الحسابات</p>
          </div>

          <div className="order-details">
            <div>
              <strong>تاريخ التقرير:</strong> {new Date().toLocaleDateString()}
            </div>
            <div>
              <strong>وقت الطباعة:</strong> {new Date().toLocaleTimeString()}
            </div>
            <div>
              <strong>عدد الطلبات:</strong> {realOrders.length}
            </div>
            <div>
              <strong>الإجمالي الكلي:</strong> ج.م{grandTotal.toFixed(2)}
            </div>
            <div>
              <strong>متوسط قيمة الطلب:</strong> ج.م
              {realOrders.length > 0 ? (grandTotal / realOrders.length).toFixed(2) : "0.00"}
            </div>
            <div>
              <strong>نوع التقرير:</strong> تفصيلي
            </div>
          </div>

          <div className="summary-stats">
            <div className="stat-box">
              <div className="stat-value">{realOrders.filter((o: any) => o.orderType === "dine-in").length}</div>
              <div className="stat-label">تناول في المطعم</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{realOrders.filter((o: any) => o.orderType === "takeaway").length}</div>
              <div className="stat-label">استلام</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{realOrders.filter((o: any) => o.orderType === "delivery").length}</div>
              <div className="stat-label">توصيل</div>
            </div>
          </div>

          {Object.entries(groupedItems).length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", fontSize: "12px" }}>لا توجد طلبات محفوظة</div>
          ) : (
            Object.entries(groupedItems).map(([category, data]) => (
              <div key={category} className="category-section">
                <div className="category-header">
                  {category === "pizza"
                    ? "البيتزا"
                    : category === "feteer"
                      ? "فطائر الحدائق"
                      : category === "sandwiches"
                        ? "ساندويتشات"
                        : category === "crepes"
                          ? "الكريبات"
                          : category === "grilled"
                            ? "فطائر الحلو"
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
                                      : category}
                </div>

                <table className="items-table">
                  <thead>
                    <tr>
                      <th>اسم الصنف</th>
                      <th>الحجم</th>
                      <th>العدد</th>
                      <th>السعر الوحدة</th>
                      <th>الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.size !== "regular" ? item.size : "-"}</td>
                        <td style={{ textAlign: "center" }}>{item.quantity}</td>
                        <td style={{ textAlign: "right" }}>ج.م{item.price.toFixed(2)}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>ج.م{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2mm" }}>
                        <div>إجمالي الفئة</div>
                        <div style={{ fontSize: "12px", marginTop: "1mm" }}>ج.م{data.total.toFixed(2)}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          )}

          <div className="total-section">
            <div style={{ fontSize: "14px", marginBottom: "1mm" }}>الإجمالي الكلي</div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>ج.م{grandTotal.toFixed(2)}</div>
          </div>

          <div className="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام نقاط البيع</p>
            <p>تاريخ الطباعة: {new Date().toLocaleString()}</p>
            <div
              style={{ marginTop: "2mm", display: "flex", alignItems: "center", justifyContent: "center", gap: "2mm" }}
            >
              <Image src="/images/eathrel.png" alt="Eathrel Logo" width={15} height={15} />
              <span style={{ fontSize: "8px", fontWeight: "bold" }}>POWERED BY ETHEREAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
