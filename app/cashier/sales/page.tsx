"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, Printer, Save, X, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { menuItems } from "@/mock-data/menu-items"
import { orders } from "@/mock-data/orders"
import Image from "next/image"
import { useReactToPrint } from "react-to-print"
import { useRouter } from "next/navigation"

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

// Enhanced CSS - Compact kitchen order and single tall page printing
const receiptPrintStyles = `
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    
    body {
      margin: 0;
      padding: 0;
    }
    
    .receipt-container {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 2mm;
      font-size: 11px;
      line-height: 1.2;
      page-break-inside: avoid;
    }
    
    .receipt-container h1 {
      font-size: 16px;
      margin: 3px 0;
      font-weight: bold;
    }
    
    .receipt-container h2 {
      font-size: 14px;
      margin: 2px 0;
      font-weight: bold;
    }
    
    .receipt-container p,
    .receipt-container div {
      font-size: 10px;
      margin: 1px 0;
    }
    
    .receipt-logo {
      width: 40px !important;
      height: 40px !important;
    }
    
    .print\\:hidden {
      display: none !important;
    }
    
    .print-receipt-container {
      display: block !important;
    }
    
    /* Kitchen receipt - SEPARATE PAGE */
    .kitchen-receipt {
      page-break-before: always !important;
      margin-top: 0;
      font-family: 'Courier New', monospace;
      border: 1px solid #000 !important;
      padding: 2mm !important;
      background: white !important;
    }
    
    .customer-receipt {
      font-family: inherit;
      background: white;
      border-radius: 0;
      box-shadow: none;
      page-break-inside: avoid !important;
    }
    
    /* Compact Kitchen Order Styling */
    .kitchen-receipt .kitchen-header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 1mm;
      margin-bottom: 2mm;
    }
    
    .kitchen-receipt .kitchen-title {
      font-size: 16px !important;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    
    .kitchen-receipt .order-info {
      font-size: 9px !important;
      font-weight: bold;
      margin: 0.5mm 0;
    }
    
    .kitchen-receipt .customer-type-banner {
      background: #000 !important;
      color: #fff !important;
      padding: 1mm !important;
      text-align: center;
      font-size: 12px !important;
      font-weight: bold;
      margin: 2mm 0;
    }
    
    .kitchen-receipt .section-title {
      font-size: 12px !important;
      font-weight: bold;
      text-align: center;
      border-bottom: 1px solid #000;
      padding-bottom: 1mm;
      margin-bottom: 2mm;
    }
    
    .kitchen-receipt .kitchen-item {
      border-bottom: 1px dotted #666;
      margin: 1mm 0;
      padding: 1mm 0;
    }
    
    .kitchen-receipt .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1mm;
    }
    
    .kitchen-receipt .item-name {
      font-size: 12px !important;
      font-weight: bold;
    }
    
    .kitchen-receipt .item-quantity {
      font-size: 12px !important;
      font-weight: bold;
      background: #000 !important;
      color: #fff !important;
      padding: 0.5mm 1mm;
    }
    
    .kitchen-receipt .item-details {
      font-size: 9px !important;
      margin: 0.5mm 0;
    }
    
    .kitchen-receipt .item-size {
      background: #f0f0f0 !important;
      padding: 0.5mm;
      display: inline-block;
      margin-right: 2mm;
    }
    
    .kitchen-receipt .item-extras {
      color: #666 !important;
      font-style: italic;
    }
    
    .kitchen-receipt .item-notes {
      background: #fff3cd !important;
      padding: 1mm;
      margin: 1mm 0;
      font-weight: bold;
      font-size: 9px !important;
    }
    
    .kitchen-receipt .total-section {
      border: 2px solid #000;
      padding: 2mm;
      text-align: center;
      font-size: 14px !important;
      font-weight: bold;
      margin-top: 2mm;
    }
    
    .kitchen-receipt .kitchen-footer {
      text-align: center;
      margin-top: 2mm;
      padding-top: 1mm;
      border-top: 1px solid #000;
      font-size: 8px !important;
    }
    
    /* Enhanced spacing for items */
    .receipt-item {
      margin-bottom: 6px !important;
      padding-bottom: 4px !important;
      border-bottom: 1px dotted #ccc !important;
    }
    
    .receipt-item:last-child {
      border-bottom: none !important;
    }
  }
`

// Add the style tag to the document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style")
  styleElement.textContent = receiptPrintStyles
  document.head.appendChild(styleElement)
}

export default function SalesPage() {
  const [activeCategory, setActiveCategory] = useState("pizza")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in")
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [itemNotes, setItemNotes] = useState("")
  const [itemSize, setItemSize] = useState("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [showItemModal, setShowItemModal] = useState(false)
  const [orderId, setOrderId] = useState(Math.floor(Math.random() * 10000) + 1)
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([])
  const [cashierName, setCashierName] = useState("أحمد محمد")
  const [shift, setShift] = useState("")
  const combinedReceiptRef = useRef<HTMLDivElement>(null)
  const kitchenReceiptRef = useRef<HTMLDivElement>(null)

  // Cancel request states
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<any>(null)

  const categories = [
    { id: "pizza", name: "بيتزا" },
    { id: "feteer", name: "فطير" },
    { id: "sandwiches", name: "ساندويتشات" },
    { id: "crepes", name: "كريب" },
    { id: "grilled", name: "فراخ مشوية" },
    { id: "pasta", name: "مكرونة" },
    { id: "rice", name: "أرز" },
    { id: "extras", name: "اضافات" },
    { id: "desserts", name: "حلويات" },
    { id: "drinks", name: "مشروبات" },
  ]

  const router = useRouter()

  useEffect(() => {
    // Generate a new order ID based on existing orders
    const savedOrdersString = localStorage.getItem("savedOrders")
    const savedOrders = savedOrdersString ? JSON.parse(savedOrdersString) : []
    const lastOrder = savedOrders.length > 0 ? savedOrders[savedOrders.length - 1] : orders[orders.length - 1]
    const newOrderId = lastOrder ? Number(lastOrder.id) + 1 : Math.floor(Math.random() * 10000) + 1
    setOrderId(newOrderId)

    // Set cashier and shift from localStorage
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      if (user.name) setCashierName(user.name)
      if (user.shift) setShift(user.shift)
    }
  }, [])

  const handleAddToCart = () => {
    if (!currentItem) return

    // For items with size options, require size selection
    if (Object.keys(currentItem.prices).length > 1 && !itemSize) return

    const basePrice = currentItem.prices[itemSize] || currentItem.prices[Object.keys(currentItem.prices)[0]]
    const extrasPrice = selectedExtras.reduce((sum, extra) => sum + extra.price, 0)
    const totalItemPrice = basePrice + extrasPrice

    const newItem: CartItem = {
      id: `${currentItem.id}-${Date.now()}`,
      name: currentItem.name,
      price: totalItemPrice,
      basePrice: basePrice,
      quantity: itemQuantity,
      size: itemSize || Object.keys(currentItem.prices)[0],
      notes: itemNotes,
      category: currentItem.category,
      extras: selectedExtras,
    }

    setCart([...cart, newItem])
    setShowItemModal(false)
    resetItemForm()
  }

  const resetItemForm = () => {
    setCurrentItem(null)
    setItemNotes("")
    setItemSize("")
    setItemQuantity(1)
    setSelectedExtras([])
  }

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setCart(cart.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const handleSelectItem = (item: any) => {
    setCurrentItem(item)
    // Set default size based on available prices
    const availableSizes = Object.keys(item.prices)
    setItemSize(availableSizes[0] || "regular")
    setShowItemModal(true)
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handlePrintCombinedReceipt = useReactToPrint({
    contentRef: combinedReceiptRef,
    documentTitle: `Combined Receipt - Order #${orderId}`,
    onAfterPrint: () => {
      // After printing, save the order if not already saved
      if (cart.length > 0) {
        const savedOrdersString = localStorage.getItem("savedOrders")
        const savedOrders = savedOrdersString ? JSON.parse(savedOrdersString) : []
        // Avoid duplicate order IDs
        if (!savedOrders.some((order: any) => order.id === orderId)) {
          const newOrder = {
            id: orderId,
            customerName,
            orderType,
            phoneNumber: orderType === "delivery" ? phoneNumber : undefined,
            items: cart,
            total: calculateTotal(),
            date: new Date().toISOString(),
            status: "pending",
            paymentMethod: "cash",
            cashier: cashierName,
            shift: shift,
          }
          const updatedOrders = [...savedOrders, newOrder]
          localStorage.setItem("savedOrders", JSON.stringify(updatedOrders))

          // Dispatch custom event to update dashboard
          window.dispatchEvent(new CustomEvent("orderAdded"))
        }
        // Reset for next order with NEW AUTO-INCREMENTED ID
        setCart([])
        setCustomerName("")
        setPhoneNumber("")
        setOrderType("dine-in")
        // Generate next order ID based on last saved order
        const nextId = Math.max(...savedOrders.map((o) => o.id), orderId) + 1
        setOrderId(nextId)
      }
    },
    onPrintError: (error) => {
      console.error("Print error:", error)
    },
  })

  const onPrintClick = () => {
    if (!combinedReceiptRef.current) {
      console.error("Receipt content not ready for printing")
      return
    }

    if (cart.length === 0) {
      console.error("Cannot print empty receipt")
      return
    }

    handlePrintCombinedReceipt()
  }

  const handleSaveOrder = () => {
    if (cart.length === 0) {
      alert("Cannot save an empty order.")
      return
    }

    const newOrder: Order = {
      id: orderId,
      customerName,
      orderType,
      phoneNumber: orderType === "delivery" ? phoneNumber : undefined,
      items: cart,
      total: calculateTotal(),
      date: new Date().toISOString(),
      status: "pending" as const,
      paymentMethod: "cash" as const,
      cashier: cashierName,
      shift: shift,
    }

    const savedOrdersString = localStorage.getItem("savedOrders")
    const savedOrders: Order[] = savedOrdersString ? JSON.parse(savedOrdersString) : []
    const updatedOrders = [...savedOrders, newOrder]
    localStorage.setItem("savedOrders", JSON.stringify(updatedOrders))

    // Dispatch custom event to update dashboard
    window.dispatchEvent(new CustomEvent("orderAdded"))

    // Reset for next order with NEW AUTO-INCREMENTED ID
    setCart([])
    setCustomerName("")
    setPhoneNumber("")
    setOrderType("dine-in")
    // Generate next order ID based on saved orders
    const nextId = Math.max(...updatedOrders.map((o) => o.id)) + 1
    setOrderId(nextId)
  }

  const handleCancelOrderRequest = (order: any) => {
    setSelectedOrderToCancel(order)
    setShowCancelModal(true)
  }

  const submitCancelRequest = () => {
    if (!cancelReason.trim()) {
      alert("يرجى إدخال سبب الإلغاء")
      return
    }

    // Create cancel request
    const cancelRequest = {
      id: `req-${Date.now()}`,
      orderId: selectedOrderToCancel.id,
      cashier: cashierName,
      reason: cancelReason,
      timestamp: new Date().toISOString(),
      status: "pending",
    }

    // Store in localStorage for now (in real app, this would go to backend)
    const existingRequests = JSON.parse(localStorage.getItem("cancelRequests") || "[]")
    existingRequests.push(cancelRequest)
    localStorage.setItem("cancelRequests", JSON.stringify(existingRequests))

    // Update order status to show cancel request pending
    const orderIndex = orders.findIndex((o) => o.id === selectedOrderToCancel.id)
    if (orderIndex !== -1) {
      orders[orderIndex].cancelReason = cancelReason
      orders[orderIndex].cancelRequestedBy = cashierName
      orders[orderIndex].status = "pending"
    }

    alert("تم إرسال طلب الإلغاء للمدير للمراجعة")
    setShowCancelModal(false)
    setCancelReason("")
    setSelectedOrderToCancel(null)
  }

  const filteredItems = menuItems.filter((item) => item.category === activeCategory)

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      <div className="w-full lg:w-2/3 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Menu Items</CardTitle>
              <Badge variant="outline" className="text-lg">
                Order #{orderId}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pizza" value={activeCategory} onValueChange={setActiveCategory}>
              <ScrollArea className="w-full">
                <TabsList className="w-full justify-start mb-4">
                  {categories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="m-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                      <motion.div key={item.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Card className="cursor-pointer overflow-hidden" onClick={() => handleSelectItem(item)}>
                          <div className="aspect-square relative">
                            <Image
                              src={item.image || "/placeholder.svg?height=200&width=200"}
                              alt={item.name}
                              width={200}
                              height={200}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium">{item.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              من {Math.min(...Object.values(item.prices))} ج.م
                            </div>
                            {item.extras && item.extras.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1">متوفر:</div>
                                <div className="flex flex-wrap gap-1">
                                  {item.extras.slice(0, 3).map((extra) => (
                                    <span
                                      key={extra.name}
                                      className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded"
                                    >
                                      {extra.name}
                                    </span>
                                  ))}
                                  {item.extras.length > 3 && (
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                                      +{item.extras.length - 3} أكثر
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

      <div className="w-full lg:w-1/3 flex flex-col items-center">
        {/* Customer Receipt (Invoice) - always visible, styled as in screenshot */}
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mt-4">
          <div className="flex flex-col items-center mb-4">
            <Image src="/images/logo.png" alt="Logo" width={80} height={80} className="rounded-full mb-2" />
            <h1 className="text-2xl font-bold">Dawar Juha</h1>
            <p className="text-sm text-gray-600">Restaurant & Café</p>
            <p className="text-sm text-gray-600">123 Main Street, City</p>
            <p className="text-sm text-gray-600">Tel: +123 456 7890</p>
          </div>
          <div className="w-full mb-2">
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">Order #:</span>
              <span>{orderId}</span>
            </div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">Time:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">Customer:</span>
              <span>{customerName || "Walk-in Customer"}</span>
            </div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">Type:</span>
              <span className="capitalize">{orderType.replace("-", " ")}</span>
            </div>
            {orderType === "delivery" && phoneNumber && (
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Phone:</span>
                <span>{phoneNumber}</span>
              </div>
            )}
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">Cashier:</span>
              <span>{cashierName}</span>
            </div>
          </div>
          <div className="w-full mt-2 mb-2">
            <div className="flex font-semibold border-b pb-1 text-sm">
              <div className="w-2/5">Item</div>
              <div className="w-1/5 text-center">Qty</div>
              <div className="w-1/5 text-right">Price</div>
              <div className="w-1/5 text-right">Total</div>
            </div>
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-4 text-xs">---</div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="border-b last:border-b-0 py-2 text-xs group">
                  {/* Main Item Row */}
                  <div className="flex items-center mb-1">
                    <div className="w-2/5 truncate">
                      {item.name}
                      {item.size && item.size !== "regular" && (
                        <span className="text-[10px] text-gray-500 ml-1">({item.size})</span>
                      )}
                    </div>
                    <div className="w-1/5 text-center">{item.quantity}</div>
                    <div className="w-1/5 text-right">ج.م{item.basePrice.toFixed(2)}</div>
                    <div className="w-1/5 text-right">ج.م{(item.basePrice * item.quantity).toFixed(2)}</div>
                  </div>
                  {/* Extras Rows */}
                  {item.extras && item.extras.length > 0 && (
                    <div className="w-full text-[10px] text-gray-500 pl-2 mb-1">
                      {item.extras.map((extra) => (
                        <div key={extra.name} className="flex">
                          <div className="w-2/5 truncate italic">+ {extra.name}</div>
                          <div className="w-1/5 text-center">{item.quantity}</div>
                          <div className="w-1/5 text-right">ج.م{extra.price.toFixed(2)}</div>
                          <div className="w-1/5 text-right">ج.م{(extra.price * item.quantity).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Notes Row */}
                  {item.notes && <div className="w-full text-[10px] italic text-gray-500 pl-2">Note: {item.notes}</div>}
                  {/* Delete Button Row */}
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
              <span>Total</span>
              <span>ج.م{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Type Selection */}
          {cart.length > 0 && (
            <div className="w-full border-t pt-2 mt-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Customer Type:</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as "dine-in" | "takeaway" | "delivery")}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="dine-in">Dine In</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Customer Name:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="text-sm border rounded px-2 py-1 flex-1"
                  />
                </div>
                {orderType === "delivery" && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Phone:</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+123 456 7890"
                      className="text-sm border rounded px-2 py-1 flex-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center text-xs text-gray-600 mt-4">
            <p>Thank you for your order!</p>
            <p>Please come again</p>
            <div className="flex flex-col items-center mt-3">
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-700 mb-1" />
              <div className="flex items-center gap-2 mt-1">
                <Image src="/images/eathrel.png" alt="Eathrel Logo" width={20} height={20} className="w-5 h-5 object-contain" />
                <span className="text-[11px] text-blue-700 font-semibold tracking-wide uppercase">
                  Powered by Ethereal
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 print:hidden">
          <Button onClick={onPrintClick} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={cart.length === 0}>
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
          <Button
            onClick={handleSaveOrder}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={cart.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Order
          </Button>
        </div>

        {/* Combined Receipt for Printing - Hidden from normal view */}
        <div ref={combinedReceiptRef} className="hidden print:block print-receipt-container">
          {/* Customer Receipt - First on page */}
          <div className="receipt-container customer-receipt bg-white p-6 w-full flex flex-col items-center">
            <div className="flex flex-col items-center mb-4">
              <Image src="/images/logo.png" alt="Logo" width={80} height={80} className="receipt-logo rounded-full mb-2" />
              <h1 className="text-2xl font-bold">Dawar Juha</h1>
              <p className="text-sm text-gray-600">Restaurant & Café</p>
              <p className="text-sm text-gray-600">123 Main Street, City</p>
              <p className="text-sm text-gray-600">Tel: +123 456 7890</p>
            </div>
            <div className="w-full mb-2">
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Order #:</span>
                <span>{orderId}</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Time:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Customer:</span>
                <span>{customerName || "Walk-in Customer"}</span>
              </div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Type:</span>
                <span className="capitalize">{orderType.replace("-", " ")}</span>
              </div>
              {orderType === "delivery" && phoneNumber && (
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-medium">Phone:</span>
                  <span>{phoneNumber}</span>
                </div>
              )}
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Cashier:</span>
                <span>{cashierName}</span>
              </div>
            </div>
            <div className="w-full mt-2 mb-2">
              <div className="flex font-semibold border-b pb-1 text-sm">
                <div className="w-2/5">Item</div>
                <div className="w-1/5 text-center">Qty</div>
                <div className="w-1/5 text-right">Price</div>
                <div className="w-1/5 text-right">Total</div>
              </div>
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-4 text-xs">---</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="receipt-item text-xs">
                    {/* Main Item Row */}
                    <div className="flex items-center mb-1">
                      <div className="w-2/5 truncate">
                        {item.name}
                        {item.size && item.size !== "regular" && (
                          <span className="text-[10px] text-gray-500 ml-1">({item.size})</span>
                        )}
                      </div>
                      <div className="w-1/5 text-center">{item.quantity}</div>
                      <div className="w-1/5 text-right">ج.م{item.basePrice.toFixed(2)}</div>
                      <div className="w-1/5 text-right">ج.م{(item.basePrice * item.quantity).toFixed(2)}</div>
                    </div>

                    {/* Extras Rows */}
                    {item.extras && item.extras.length > 0 && (
                      <div className="w-full text-[10px] text-gray-500 pl-2 mb-1">
                        {item.extras.map((extra) => (
                          <div key={extra.name} className="flex">
                            <div className="w-2/5 truncate italic">+ {extra.name}</div>
                            <div className="w-1/5 text-center">{item.quantity}</div>
                            <div className="w-1/5 text-right">ج.م{extra.price.toFixed(2)}</div>
                            <div className="w-1/5 text-right">ج.م{(extra.price * item.quantity).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes Row */}
                    {item.notes && (
                      <div className="w-full text-[10px] italic text-gray-500 pl-2">Note: {item.notes}</div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="w-full border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>ج.م{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            <div className="text-center text-xs text-gray-600 mt-4">
              <p>Thank you for your order!</p>
              <p>Please come again</p>
              <div className="flex flex-col items-center mt-3">
                <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-700 mb-1" />
                <div className="flex items-center gap-2 mt-1">
                  <Image src="/images/eathrel.png" alt="Eathrel Logo" width={20} height={20} className="w-5 h-5 object-contain" />
                  <span className="text-[11px] text-blue-700 font-semibold tracking-wide uppercase">
                    Powered by Ethereal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kitchen Receipt - Compact Design */}
          <div className="receipt-container kitchen-receipt bg-white p-4 w-full" dir="rtl">
            <div className="kitchen-header">
              <div className="kitchen-title">KITCHEN ORDER</div>
              <div className="order-info">Order #{orderId}</div>
              <div className="order-info">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                {new Date().toLocaleDateString()}
              </div>
              {orderType === "delivery" && phoneNumber && <div className="order-info">Phone: {phoneNumber}</div>}
            </div>

            {/* Customer Type Banner */}
            <div className="customer-type-banner">
              {(orderType as string) === "dine-in"
                ? "DINE IN"
                : (orderType as string) === "takeaway"
                  ? "TAKEAWAY"
                  : (orderType as string) === "delivery"
                    ? "DELIVERY"
                    : (orderType as string).toUpperCase()}
            </div>

            <div className="section-title">ITEMS TO PREPARE</div>

            <div>
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-2 text-xs">لا يوجد عناصر</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="kitchen-item">
                    <div className="item-header">
                      <div className="item-name">{item.name}</div>
                      <div className="item-quantity">x{item.quantity}</div>
                    </div>

                    <div className="item-details">
                      {item.size && item.size !== "regular" && <span className="item-size">الحجم: {item.size}</span>}
                      {item.extras && item.extras.length > 0 && (
                        <span className="item-extras">
                          الإضافات: {item.extras.map((extra) => extra.name).join(", ")}
                        </span>
                      )}
                      <div className="text-left">ج.م{(item.price * item.quantity).toFixed(2)}</div>
                    </div>

                    {item.notes && <div className="item-notes">ملاحظات: {item.notes}</div>}
                  </div>
                ))
              )}
            </div>

            <div className="total-section">
              <div>الإجمالي: ج.م{calculateTotal().toFixed(2)}</div>
            </div>

            <div className="kitchen-footer">
              <div>--- KITCHEN COPY ---</div>
              <div>{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showItemModal && (
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
              <div className="p-4 space-y-4">
                {currentItem && Object.keys(currentItem.prices).length > 1 && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(currentItem.prices).map(([size, price]: [string, any]) => (
                        <Button
                          key={size}
                          variant={itemSize === size ? "default" : "outline"}
                          className={itemSize === size ? "bg-orange-600 hover:bg-orange-700" : ""}
                          onClick={() => setItemSize(size)}
                        >
                          {size === "small"
                            ? "صغير"
                            : size === "medium"
                              ? "وسط"
                              : size === "large"
                                ? "كبير"
                                : size === "regular"
                                  ? "عادي"
                                  : size}{" "}
                          - ج.م{price}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-1 block">Quantity</label>
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
                  <label className="text-sm font-medium mb-1 block">Special Instructions</label>
                  <Textarea
                    placeholder="E.g., No onions, extra cheese, etc."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                  />
                </div>
                {currentItem?.extras && currentItem.extras.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Extras</label>
                    <div className="flex flex-wrap gap-2">
                      {currentItem.extras.map((extra: { name: string; price: number }) => {
                        const isSelected = selectedExtras.some((e) => e.name === extra.name)
                        return (
                          <Badge
                            key={extra.name}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer ${isSelected ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedExtras(selectedExtras.filter((e) => e.name !== extra.name))
                              } else {
                                setSelectedExtras([...selectedExtras, extra])
                              }
                            }}
                          >
                            {extra.name} - ج.م{extra.price.toFixed(2)}
                          </Badge>
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
                  disabled={currentItem && Object.keys(currentItem.prices).length > 1 && !itemSize}
                >
                  Add to Order
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Order Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-lg w-full max-w-md"
          >
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-lg font-medium">إلغاء طلب الطعام</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCancelModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">سبب الإلغاء</label>
                <Textarea
                  placeholder="أدخل سبب الإلغاء"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={submitCancelRequest}
                disabled={!cancelReason.trim()}
              >
                إرسال طلب الإلغاء
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
