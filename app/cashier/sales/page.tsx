"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Trash2, Printer, Save, X } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { menuItems } from "@/mock-data/menu-items"
import { orders } from "@/mock-data/orders"
import Image from "next/image"
import { useReactToPrint } from "react-to-print"

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  size: string
  notes: string
  category: string
  extras: {
    name: string
    price: number
  }[]
}

export default function SalesPage() {
  const [activeCategory, setActiveCategory] = useState("pizza")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in")
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [itemNotes, setItemNotes] = useState("")
  const [itemSize, setItemSize] = useState("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [showItemModal, setShowItemModal] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([])
  const [cashierName, setCashierName] = useState("أحمد محمد")
  const receiptRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    // Generate a new order ID
    const lastOrder = orders[orders.length - 1]
    const newOrderId = lastOrder ? String(Number(lastOrder.id) + 1).padStart(4, "0") : "0001"
    setOrderId(newOrderId)
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

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt - Order #${orderId}`,
    onAfterPrint: () => {
      console.log("Receipt printed successfully")
    },
    onPrintError: (error) => {
      console.error("Print error:", error)
    },
  })

  const onPrintClick = () => {
    if (!receiptRef.current) {
      console.error("Receipt content not ready for printing")
      return
    }
    
    if (cart.length === 0) {
      console.error("Cannot print empty receipt")
      return
    }

    handlePrintReceipt()
  }

  const handleSaveOrder = () => {
    if (cart.length === 0) {
      alert("Cannot save empty order")
      return
    }

    // Create new order object
    const newOrder = {
      id: orderId,
      customerName: customerName || "Walk-in Customer",
      customerPhone: customerPhone,
      orderType: orderType as "dine-in" | "takeaway" | "delivery",
      items: cart,
      total: calculateTotal(),
      cashier: cashierName,
      date: new Date().toISOString(),
      status: "completed" as const,
      paymentMethod: "cash" as const
    }

    // Add to orders array
    orders.push(newOrder)
    
    // Show success message
    alert(`Order #${orderId} saved successfully!`)
    
    // Generate new order ID
    const newOrderId = String(Number(orderId) + 1).padStart(4, "0")
    setOrderId(newOrderId)
    
    // Reset form
    setCart([])
    setCustomerName("")
    setCustomerPhone("")
    setOrderType("dine-in")
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
                                    <span key={extra.name} className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
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
        {/* Receipt (Invoice) - always visible, styled as in screenshot */}
        <div ref={receiptRef} className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mt-4">
          <div className="flex flex-col items-center mb-4">
            <img src="/images/logo.png" alt="Logo" className="rounded-full mb-2" style={{ width: 80, height: 80 }} />
            <h1 className="text-2xl font-bold">Dawar Juha</h1>
            <p className="text-sm text-gray-600">Restaurant & Café</p>
            <p className="text-sm text-gray-600">123 Main Street, City</p>
            <p className="text-sm text-gray-600">Tel: +123 456 7890</p>
          </div>
          <div className="w-full mb-2">
            <div className="flex justify-between mb-1 text-sm"><span className="font-medium">Order #:</span><span>{orderId}</span></div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-medium">Date:</span><span>{new Date().toLocaleDateString()}</span></div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-medium">Time:</span><span>{new Date().toLocaleTimeString()}</span></div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-medium">Customer:</span><span>{customerName || "Walk-in Customer"}</span></div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-medium">Type:</span><span className="capitalize">{orderType.replace('-', ' ')}</span></div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-medium">Cashier:</span><span>{cashierName}</span></div>
          </div>
          <div className="w-full mt-2 mb-2">
            <div className="flex font-semibold border-b pb-1 text-sm">
              <div className="w-1/3">Item</div>
              <div className="w-1/6 text-center">Qty</div>
              <div className="w-1/4 text-right">Price</div>
              <div className="w-1/4 text-right">Total</div>
            </div>
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-4 text-xs">---</div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex flex-col border-b last:border-0 py-1 text-xs">
                  <div className="flex">
                    <div className="w-1/3 truncate">
                      {item.name}
                      {item.size && (
                        <span className="text-[10px] text-gray-500 block">
                          {item.size === 'small' ? 'صغير' : 
                           item.size === 'medium' ? 'وسط' : 
                           item.size === 'large' ? 'كبير' : 
                           item.size === 'regular' ? 'عادي' : item.size}
                        </span>
                      )}
                    </div>
                    <div className="w-1/6 text-center">{item.quantity}</div>
                    <div className="w-1/4 text-right">ج.م{item.price.toFixed(2)}</div>
                    <div className="w-1/4 text-right">ج.م{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="w-full text-[10px] text-gray-500 pl-1 pt-0.5">
                      {item.extras.map((extra) => (
                        <div key={extra.name} className="flex justify-between">
                          <span>+ {extra.name}</span>
                          <span>ج.م{extra.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <div className="w-full text-[10px] italic text-gray-500 pl-1 pt-0.5">Note: {item.notes}</div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="w-full border-t pt-2 mt-2">
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>ج.م{calculateTotal().toFixed(2)}</span></div>
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
              </div>
            </div>
          )}
          <div className="text-center text-xs text-gray-600 mt-4">
            <p>Thank you for your order!</p>
            <p>Please come again</p>
            <div className="flex flex-col items-center mt-3">
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-700 mb-1" />
              <div className="flex items-center gap-2 mt-1">
                <img src="/images/eathrel.png" alt="Eathrel Logo" className="w-5 h-5 object-contain" />
                <span className="text-[11px] text-blue-700 font-semibold tracking-wide uppercase">Powered by Ethereal</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 print:hidden">
          <Button 
            onClick={onPrintClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={cart.length === 0}
          >
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
                          {size === 'small' ? 'صغير' : 
                           size === 'medium' ? 'وسط' : 
                           size === 'large' ? 'كبير' : 
                           size === 'regular' ? 'عادي' : size} - ج.م{price}
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
                        const isSelected = selectedExtras.some(e => e.name === extra.name)
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
    </div>
  )
}
