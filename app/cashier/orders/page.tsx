"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Phone, User, Trash2, Loader2, RefreshCw } from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

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
  extras?: Array<{
    extra_id?: string
    name?: string
    price?: string | number
    quantity?: number
  }>
  // Additional fields for localStorage compatibility
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
  status: "pending" | "completed" | "cancelled"
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
  // Additional fields for localStorage compatibility
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
    pending: number
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

export default function OrdersPageFixed() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [currentCashier, setCurrentCashier] = useState("")
  const printAllRef = useRef<HTMLDivElement>(null)

  // Enhanced fetchOrders function that combines API and localStorage data
  const fetchOrders = async () => {
    try {
      setLoading(true)
      let allOrders: Order[] = []

      // Try to fetch from API first
      try {
        const response = await fetch(`${API_BASE_URL}/orders?page=1&limit=100`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const apiOrders = Array.isArray(result.data.orders)
              ? result.data.orders
              : Array.isArray(result.data)
                ? result.data
                : []

            // Normalize API orders structure with better validation
            allOrders = apiOrders
              .filter((order: any) => order && order.order_id) // Filter out invalid orders
              .map((order: any) => ({
                ...order,
                order_id: order.order_id || `order_${Date.now()}_${Math.random()}`,
                total_price: typeof order.total_price === "string" ? order.total_price : String(order.total_price || 0),
                cashier_name: order.cashier?.full_name || order.cashier_name || "[اسم الكاشير غير متوفر]",
                customer_name: order.customer_name || "عميل عابر",
                order_type: order.order_type || "dine-in",
                status: order.status || "pending",
                payment_method: order.payment_method || "cash",
                created_at: order.created_at || new Date().toISOString(),
                items: Array.isArray(order.items)
                  ? order.items.map((item: any) => ({
                      ...item,
                      order_item_id: item.order_item_id || `item_${Date.now()}_${Math.random()}`,
                      product_name: item.product_name || item.product?.name || "[اسم المنتج غير متوفر]",
                      size_name: item.size_name || item.productSize?.size?.size_name || "عادي",
                      unit_price: typeof item.unit_price === "string" ? item.unit_price : String(item.unit_price || 0),
                      quantity: item.quantity || 0,
                      extras: Array.isArray(item.extras) ? item.extras : [],
                    }))
                  : [],
              }))
          }
        }
      } catch (apiError) {
        console.warn("API fetch failed, will use localStorage only:", apiError)
      }

      // Always fetch from localStorage and merge
      try {
        const localOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]")
        const normalizedLocalOrders = localOrders
          .filter((order: any) => order && order.order_id) // Filter out invalid orders
          .map((order: any) => ({
            ...order,
            order_id: order.order_id || `order_${Date.now()}_${Math.random()}`,
            total_price: typeof order.total_price === "string" ? order.total_price : String(order.total_price || 0),
            cashier_name: order.cashier_name || order.cashier?.full_name || "[اسم الكاشير غير متوفر]",
            customer_name: order.customer_name || "عميل عابر",
            order_type: order.order_type || "dine-in",
            status: order.status || "pending",
            payment_method: order.payment_method || "cash",
            created_at: order.created_at || new Date().toISOString(),
            items: Array.isArray(order.items)
              ? order.items.map((item: any) => ({
                  ...item,
                  order_item_id: item.order_item_id || item.id || `item_${Date.now()}_${Math.random()}`,
                  product_name: item.product_name || item.name || "[اسم المنتج غير متوفر]",
                  size_name: item.size_name || item.size || "عادي",
                  unit_price:
                    typeof item.unit_price === "string"
                      ? item.unit_price
                      : typeof item.price === "string"
                        ? item.price
                        : String(item.unit_price || item.price || 0),
                  quantity: item.quantity || 0,
                  extras: Array.isArray(item.extras) ? item.extras : [],
                }))
              : [],
          }))

        // Merge orders, avoiding duplicates
        const orderMap = new Map()

        // Add API orders first
        allOrders.forEach((order) => {
          if (order.order_id) {
            orderMap.set(order.order_id, order)
          }
        })

        // Add localStorage orders, but don't overwrite API orders
        normalizedLocalOrders.forEach((order: Order) => {
          if (order.order_id && !orderMap.has(order.order_id)) {
            orderMap.set(order.order_id, order)
          }
        })

        const finalOrders = Array.from(orderMap.values())
          .filter((order: any) => order && order.order_id) // Final safety check
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || 0).getTime()
            const dateB = new Date(b.created_at || 0).getTime()
            return dateB - dateA
          })

        setOrders(finalOrders)
      } catch (localError) {
        console.error("Failed to process localStorage orders:", localError)
        setOrders([]) // Set empty array as fallback
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch orders")
      setOrders([]) // Set empty array as fallback
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Calculate stats from current orders
      const totalOrders = orders.length
      const totalRevenue = orders.reduce(
        (sum, order) =>
          sum +
          (typeof order.total_price === "string"
            ? Number.parseFloat(order.total_price)
            : Number(order.total_price) || 0),
        0,
      )

      const ordersByType = {
        "dine-in": orders.filter((o) => o.order_type === "dine-in").length,
        takeaway: orders.filter((o) => o.order_type === "takeaway").length,
        delivery: orders.filter((o) => o.order_type === "delivery").length,
      }

      const ordersByStatus = {
        pending: orders.filter((o) => o.status === "pending").length,
        completed: orders.filter((o) => o.status === "completed").length,
        cancelled: orders.filter((o) => o.status === "cancelled").length,
      }

      setStats({
        totalOrders,
        totalRevenue,
        ordersByType,
        ordersByStatus,
      })
    } catch (err) {
      console.error("Error calculating stats:", err)
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        ordersByType: { "dine-in": 0, takeaway: 0, delivery: 0 },
        ordersByStatus: { pending: 0, completed: 0, cancelled: 0 },
      })
    }
  }

  // Function to calculate category sales
  const calculateCategorySales = (): CategorySales[] => {
    const categoryMap = new Map<string, CategorySales>()

    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (!item) return

          // Get category name from item
          const categoryName = item.product?.category?.name || "فئة غير محددة"
          const productName = item.product_name || "[اسم المنتج غير متوفر]"
          const quantity = item.quantity || 0
          const unitPrice =
            typeof item.unit_price === "string" ? Number.parseFloat(item.unit_price) || 0 : Number(item.unit_price) || 0
          const totalAmount = unitPrice * quantity

          // Initialize category if not exists
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, {
              categoryName,
              products: {},
              categoryTotal: 0,
            })
          }

          const category = categoryMap.get(categoryName)!

          // Initialize product if not exists
          if (!category.products[productName]) {
            category.products[productName] = {
              quantity: 0,
              totalAmount: 0,
              unitPrice: unitPrice,
            }
          }

          // Add to product totals
          category.products[productName].quantity += quantity
          category.products[productName].totalAmount += totalAmount
          category.categoryTotal += totalAmount
        })
      }
    })

    return Array.from(categoryMap.values()).sort((a, b) => b.categoryTotal - a.categoryTotal)
  }

  useEffect(() => {
    fetchOrders()
    // Load current cashier
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
    setCurrentCashier(user?.full_name || user?.name || user?.username || "")

    // Listen for order updates
    const handleOrderAdded = () => {
      fetchOrders()
    }
    window.addEventListener("orderAdded", handleOrderAdded)
    return () => window.removeEventListener("orderAdded", handleOrderAdded)
  }, [])

  // Update stats when orders change
  useEffect(() => {
    if (orders.length > 0) {
      fetchStats()
    }
  }, [orders])

  const handleRefresh = () => {
    fetchOrders()
  }

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      // Update in localStorage first
      const savedOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]")
      const updatedOrders = savedOrders.map((order: Order) =>
        order.order_id === orderId ? { ...order, status: "cancelled", cancelReason: reason } : order,
      )
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders))

      // Try to update via API if available
      try {
        const cancelResponse = await fetch(`${API_BASE_URL}/cancelled-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            cancelled_by: currentCashier,
            cancellation_reason: reason,
          }),
        })

        const statusResponse = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        })
      } catch (apiError) {
        console.warn("API update failed, but localStorage updated:", apiError)
      }

      // Refresh the orders list
      fetchOrders()
      alert("تم إلغاء الطلب بنجاح!")
    } catch (error: any) {
      console.error("Error cancelling order:", error)
      alert(`فشل في إلغاء الطلب: ${error.message}`)
    }
  }

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

  const handleDeleteClick = (orderId: string) => {
    setDeleteOrderId(orderId)
    setDeleteReason("")
    setShowDialog(true)
  }

  const handleDialogSubmit = () => {
    if (!deleteOrderId || !deleteReason.trim()) return
    handleCancelOrder(deleteOrderId, deleteReason)
    setShowDialog(false)
    setDeleteOrderId(null)
    setDeleteReason("")
  }

  const handlePrintAllOrders = useReactToPrint({
    contentRef: printAllRef,
    documentTitle: `تقرير إجمالي الحسابات - ${new Date().toLocaleDateString()}`,
  })

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
          <p className="text-gray-600">إدارة جميع الطلبات والمبيعات</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" className="bg-blue-50 hover:bg-blue-100">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
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
              <div className="text-2xl font-bold text-green-600">ج.م{stats.totalRevenue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">إجمالي المبيعات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.ordersByStatus.pending}</div>
              <div className="text-sm text-gray-600">طلبات قيد الانتظار</div>
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
          <CardTitle>الطلبات المحفوظة ({orders.length})</CardTitle>
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
                {orders
                  .map((order) => {
                    // Add safety checks for required fields
                    if (!order || !order.order_id) {
                      console.warn("Invalid order data:", order)
                      return null
                    }

                    return (
                      <Card key={order.order_id} className="transition-all duration-200 border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                طلب #{order.order_id ? order.order_id.slice(-6) : "غير محدد"}
                              </h3>
                              {getStatusBadge(order.status || "pending")}
                              {getOrderTypeBadge(order.order_type || "dine-in")}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-green-600">
                                ج.م
                                {(typeof order.total_price === "string"
                                  ? Number.parseFloat(order.total_price) || 0
                                  : Number(order.total_price) || 0
                                ).toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : "تاريخ غير محدد"}{" "}
                                - {order.created_at ? new Date(order.created_at).toLocaleTimeString() : "وقت غير محدد"}
                              </p>
                            </div>
                          </div>

                          {/* Customer Info */}
                          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{order.customer_name || "عميل عابر"}</span>
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
                            <h4 className="font-medium text-sm text-gray-700">عناصر الطلب:</h4>
                            {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                              order.items.map((item, index) => {
                                if (!item) return null

                                return (
                                  <div
                                    key={`${order.order_id}-${item.order_item_id || index}`}
                                    className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                                  >
                                    <div className="flex-1">
                                      <span className="font-medium">
                                        {item.product_name || "[اسم المنتج غير متوفر]"}
                                      </span>
                                      {item.size_name && item.size_name !== "عادي" && (
                                        <span className="text-gray-500 ml-2">({item.size_name})</span>
                                      )}
                                      <span className="text-gray-500 ml-2">x{item.quantity || 0}</span>
                                      {item.extras && Array.isArray(item.extras) && item.extras.length > 0 && (
                                        <div className="text-blue-500 text-xs mt-1">
                                          + {item.extras.map((extra) => extra?.name || "[إضافة غير معروفة]").join(", ")}
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-medium">
                                      ج.م
                                      {(
                                        (typeof item.unit_price === "string"
                                          ? Number.parseFloat(item.unit_price) || 0
                                          : Number(item.unit_price) || 0) * (item.quantity || 0)
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="text-gray-500 text-sm">لا توجد عناصر في هذا الطلب</div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex justify-between items-center pt-3 border-t text-sm text-gray-600">
                            <span>الكاشير: {order.cashier_name || "[اسم الكاشير غير متوفر]"}</span>
                            <span>الدفع: {order.payment_method === "cash" ? "نقدي" : "كارت"}</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(order.order_id)}
                              disabled={order.status === "cancelled"}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              حذف
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                  .filter(Boolean)}
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
            <Button onClick={handleDialogSubmit} disabled={!deleteReason.trim()}>
              إرسال طلب الحذف
            </Button>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Content - Advanced Category Report */}
      <div ref={printAllRef} className="hidden print:block">
        <div className="advanced-print-report">
          {/* Header with Logo */}
          <div className="report-header">
            <div className="header-content">
              <img src="/images/logo.png" alt="Logo" className="company-logo" />
              <div className="company-info">
                <h1 className="company-name">Dawar Juha</h1>
                <p className="company-subtitle">Restaurant & Café</p>
                <p className="company-address">123 Main Street, City</p>
                <p className="company-phone">Tel: +123 456 7890</p>
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

          {/* Summary Statistics */}
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
                  <span className="summary-value">ج.م{stats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">تناول في المطعم:</span>
                  <span className="summary-value">{stats.ordersByType["dine-in"]}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">استلام:</span>
                  <span className="summary-value">{stats.ordersByType.takeaway}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">توصيل:</span>
                  <span className="summary-value">{stats.ordersByType.delivery}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">طلبات مكتملة:</span>
                  <span className="summary-value">{stats.ordersByStatus.completed}</span>
                </div>
              </div>
            </div>
          )}

          {/* Category Sales Breakdown */}
          <div className="categories-section">
            <h3 className="section-title">تفصيل المبيعات حسب الفئات</h3>

            {calculateCategorySales().length === 0 ? (
              <div className="no-data">لا توجد مبيعات للعرض</div>
            ) : (
              calculateCategorySales().map((category, index) => (
                <div key={category.categoryName} className="category-block">
                  <div className="category-header">
                    <h4 className="category-name">{category.categoryName}</h4>
                    <div className="category-total">ج.م{category.categoryTotal.toFixed(2)}</div>
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
                          <td className="unit-price">ج.م{productData.unitPrice.toFixed(2)}</td>
                          <td className="total-amount">ج.م{productData.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>

          {/* Grand Total */}
          <div className="grand-total-section">
            <div className="grand-total-line">
              <span className="grand-total-label">الإجمالي العام:</span>
              <span className="grand-total-amount">
                ج.م
                {calculateCategorySales()
                  .reduce((sum, cat) => sum + cat.categoryTotal, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="report-footer">
            <div className="footer-content">
              <p>تم إنشاء هذا التقرير في: {new Date().toLocaleString()}</p>
              <div className="powered-by">
                <img src="/images/eathrel.png" alt="Eathrel Logo" className="footer-logo" />
                <span>Powered by Ethereal</span>
              </div>
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

          .company-logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin-right: 20px;
            border: 2px solid #333;
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

          .company-address,
          .company-phone {
            font-size: 12px;
            margin: 0 0 2px 0;
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
            grid-template-columns: repeat(3, 1fr);
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

          .report-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ccc;
            text-align: center;
          }

          .footer-content p {
            font-size: 10px;
            color: #666;
            margin: 0 0 10px 0;
          }

          .powered-by {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 5px;
          }

          .footer-logo {
            width: 16px;
            height: 16px;
          }

          .powered-by span {
            font-size: 10px;
            color: #666;
          }

          .no-data {
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
