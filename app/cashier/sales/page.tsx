"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Trash2, Printer, Save, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { menuItems } from "@/mock-data/menu-items"
import { orders } from "@/mock-data/orders"
import Image from "next/image"

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  size: string
  notes: string
  category: string
}

export default function SalesPage() {
  const [activeCategory, setActiveCategory] = useState("pizza")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [orderType, setOrderType] = useState("dine-in")
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [itemNotes, setItemNotes] = useState("")
  const [itemSize, setItemSize] = useState("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [showItemModal, setShowItemModal] = useState(false)
  const [orderId, setOrderId] = useState("")

  const categories = [
    { id: "pizza", name: "بيتزا" },
    { id: "feteer", name: "فطير" },
    { id: "sandwiches", name: "ساندويتشات" },
    { id: "crepes", name: "كريب" },
    { id: "grilled", name: "فراخ مشوية" },
    { id: "pasta", name: "مكرونة" },
    { id: "rice", name: "أرز" },
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
    if (!currentItem || !itemSize) return

    const newItem: CartItem = {
      id: `${currentItem.id}-${Date.now()}`,
      name: currentItem.name,
      price: currentItem.prices[itemSize],
      quantity: itemQuantity,
      size: itemSize,
      notes: itemNotes,
      category: currentItem.category,
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
    setItemSize(Object.keys(item.prices)[0])
    setShowItemModal(true)
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handlePrintInvoice = () => {
    window.print()
  }

  const handleSaveOrder = () => {
    // In a real app, this would save to a database
    alert(`Order #${orderId} saved successfully!`)
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
                              fill
                              className="object-cover"
                            />
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium">{item.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              من {Math.min(...Object.values(item.prices))} ج.م
                            </div>
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

      <div className="w-full lg:w-1/3 space-y-6">
        <Card className="sticky top-6">
          <CardHeader className="pb-3">
            <CardTitle>Current Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Customer Name</label>
                <Input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Order Type</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                >
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
            </div>

            <Separator className="my-4" />

            <ScrollArea className="h-[300px] pr-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No items added yet</div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.size} • ج.م{item.price}
                        </div>
                        {item.notes && <div className="text-xs italic text-muted-foreground">Note: {item.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleRemoveFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>ج.م{calculateTotal()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%)</span>
                <span>ج.م{calculateTotal() * 0.1}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>ج.م{calculateTotal() * 1.1}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" className="w-1/2" onClick={handlePrintInvoice} disabled={cart.length === 0}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
              className="w-1/2 bg-orange-600 hover:bg-orange-700"
              onClick={handleSaveOrder}
              disabled={cart.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Order
            </Button>
          </CardFooter>
        </Card>
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
                <div>
                  <label className="text-sm font-medium mb-1 block">Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {currentItem &&
                      Object.entries(currentItem.prices).map(([size, price]: [string, any]) => (
                        <Button
                          key={size}
                          variant={itemSize === size ? "default" : "outline"}
                          className={itemSize === size ? "bg-orange-600 hover:bg-orange-700" : ""}
                          onClick={() => setItemSize(size)}
                        >
                          {size} - ج.م{price}
                        </Button>
                      ))}
                  </div>
                </div>
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
              </div>
              <div className="p-4 border-t flex justify-end">
                <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleAddToCart} disabled={!itemSize}>
                  Add to Order
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print-only invoice */}
      <div className="print-only">
        <div className="p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <Image src="/images/logo.png" alt="Dawar Juha Logo" width={80} height={80} className="rounded-full" />
            </div>
            <h1 className="text-2xl font-bold">Dawar Juha</h1>
            <p className="text-sm text-gray-600">Restaurant & Café</p>
            <p className="text-sm text-gray-600">123 Main Street, City</p>
            <p className="text-sm text-gray-600">Tel: +123 456 7890</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Order #:</span>
              <span>{orderId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Time:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Customer:</span>
              <span>{customerName || "Walk-in Customer"}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Type:</span>
              <span className="capitalize">{orderType}</span>
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-600">{item.size}</div>
                    {item.notes && <div className="text-xs italic text-gray-600">Note: {item.notes}</div>}
                  </td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">ج.م{item.price}</td>
                  <td className="text-right py-2">ج.م{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>ج.م{calculateTotal()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Tax (10%)</span>
              <span>ج.م{calculateTotal() * 0.1}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>ج.م{calculateTotal() * 1.1}</span>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Thank you for your order!</p>
            <p>Please come again</p>
          </div>
        </div>
      </div>
    </div>
  )
}
