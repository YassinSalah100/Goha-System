"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, Printer, Save, X, Trash2, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useReactToPrint } from "react-to-print"
import { useRouter } from "next/navigation"

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
  extras: Array<{
    id: string
    name: string
    price: number
  }>
}

export default function SalesPageFixed() {
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

  // API Data
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const combinedReceiptRef = useRef<HTMLDivElement>(null)
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

      // Fetch products
      const productsResponse = await fetch(`${API_BASE_URL}/products`)
      if (!productsResponse.ok) throw new Error("Failed to fetch products")
      const productsData = await productsResponse.json()
      const productsList = productsData.success ? productsData.data.products || productsData.data : []
      setProducts(productsList)

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

    const validExtras = selectedExtras.filter((extra) => extra.id)
    const extrasPrice = validExtras.reduce((sum, extra) => sum + extra.price, 0)
    const totalItemPrice = basePrice + extrasPrice

    const newItem: CartItem = {
      id: `${currentItem.product_id}-${Date.now()}`,
      name: currentItem.name,
      price: totalItemPrice,
      basePrice: basePrice,
      quantity: itemQuantity,
      size: selectedSizeName,
      sizeId: itemSizeId || currentItem.sizePrices[0]?.size?.size_id || "",
      notes: itemNotes,
      category: currentItem.category?.name || "",
      categoryId: currentItem.category?.category_id || "",
      productId: currentItem.product_id,
      productSizeId: productSizeId,
      extras: validExtras,
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
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // Enhanced saveOrderToAPI with better data structure
  const saveOrderToAPI = async () => {
    if (cart.length === 0) {
      alert("لا يمكن حفظ طلب فارغ")
      return
    }

    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    if (!storedUser || !storedUser.user_id) {
      alert("يرجى تسجيل الدخول مجدداً")
      router.push("/")
      return
    }

    try {
      setLoading(true)

      // Create a properly structured order object
      const orderData = {
        order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customer_name: customerName || "عميل عابر",
        order_type: orderType,
        phone_number: orderType === "delivery" ? phoneNumber : null,
        total_price: calculateTotal(),
        status: "pending",
        payment_method: "cash",
        created_at: new Date().toISOString(),
        cashier: {
          user_id: storedUser.user_id,
          full_name: storedUser.full_name || storedUser.name || storedUser.username || "مستخدم غير معروف",
        },
        cashier_name: storedUser.full_name || storedUser.name || storedUser.username || "مستخدم غير معروف",
        shift: storedUser.shift || { shift_id: `shift_${Date.now()}`, shift_name: "وردية افتراضية" },
        items: cart.map((item) => ({
          order_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.basePrice.toString(),
          notes: item.notes || null,
          product_name: item.name, // Store product name for display
          size_name: item.size, // Store size name for display
          product: {
            product_id: item.productId,
            name: item.name,
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
          extras: item.extras.map((extra) => ({
            extra_id: extra.id,
            name: extra.name,
            price: extra.price.toString(),
            quantity: 1,
          })),
          total_price: item.price * item.quantity,
        })),
      }

      // Save to localStorage with the enhanced structure
      const savedOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]")
      localStorage.setItem("savedOrders", JSON.stringify([...savedOrders, orderData]))

      // Try to save to API (optional, don't fail if API is down)
      try {
        const apiResponse = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
          body: JSON.stringify({
            cashier_id: storedUser.user_id,
            shift_id: storedUser.shift?.shift_id || `shift_${Date.now()}`,
            table_number: null,
            order_type: orderType,
            customer_name: customerName || null,
            customer_phone: orderType === "delivery" ? phoneNumber : null,
            items: cart.map((item) => ({
              product_id: item.productId,
              product_size_id: item.productSizeId,
              quantity: item.quantity,
              unit_price: item.basePrice,
              notes: item.notes || null,
              extras: item.extras.map((extra) => ({
                extra_id: extra.id,
                quantity: 1,
              })),
            })),
          }),
        })

        if (apiResponse.ok) {
          console.log("Order saved to API successfully")
        } else {
          console.warn("Failed to save to API, but saved locally")
        }
      } catch (apiError) {
        console.warn("API save failed, but order saved locally:", apiError)
      }

      // Clear cart and reset form
      setCart([])
      setCustomerName("")
      setPhoneNumber("")
      setOrderType("dine-in")
      setOrderId(Math.floor(Math.random() * 10000) + 1)

      alert("تم حفظ الطلب بنجاح!")
      window.dispatchEvent(new CustomEvent("orderAdded"))
    } catch (error) {
      console.error("Error saving order:", error)
      alert(`فشل حفظ الطلب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`)
    } finally {
      setLoading(false)
    }
  }

  // Remove the enhanced CSS and restore original print handling
  const handlePrintCombinedReceipt = useReactToPrint({
    contentRef: combinedReceiptRef,
    documentTitle: `Combined Receipt - Order #${orderId}`,
    onAfterPrint: () => {
      if (cart.length > 0) {
        saveOrderToAPI()
      }
    },
  })

  const onPrintClick = () => {
    if (!combinedReceiptRef.current || cart.length === 0) {
      console.error("Cannot print empty receipt")
      return
    }
    handlePrintCombinedReceipt()
  }

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
                            <Image
                              src="/placeholder.svg?height=200&width=200"
                              alt={item.name}
                              width={200}
                              height={200}
                              className="object-cover w-full h-full"
                              priority
                            />
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium">{item.name}</h3>
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
      </div>

      {/* Receipt Section */}
      <div className="w-full lg:w-1/3 flex flex-col items-center">
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
              <span>{orderType === "dine-in" ? "تناول في المطعم" : orderType === "takeaway" ? "استلام" : "توصيل"}</span>
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
                          <div className="w-1/5 text-center">{item.quantity}</div>
                          <div className="w-1/5 text-right">ج.م{extra.price.toFixed(2)}</div>
                          <div className="w-1/5 text-right">ج.م{(extra.price * item.quantity).toFixed(2)}</div>
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
                    onChange={(e) => setOrderType(e.target.value as "dine-in" | "takeaway" | "delivery")}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="dine-in">تناول في المطعم</option>
                    <option value="takeaway">استلام</option>
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
              </div>
            </div>
          )}

          <div className="text-center text-xs text-gray-600 mt-4">
            <p>شكراً لطلبكم!</p>
            <p>نتطلع لرؤيتكم مرة أخرى</p>
            <div className="flex flex-col items-center mt-3">
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-700 mb-1" />
              <div className="flex items-center gap-2 mt-1">
                <Image
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
          <Button onClick={onPrintClick} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={cart.length === 0}>
            <Printer className="w-4 h-4 mr-2" />
            طباعة الفاتورة
          </Button>
          <Button
            onClick={saveOrderToAPI}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={cart.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            حفظ الطلب
          </Button>
        </div>

        {/* Print Content - Customer and Kitchen Receipts */}
        <div ref={combinedReceiptRef} className="hidden print:block">
          {/* Customer Receipt */}
          <div className="print-receipt mb-8">
            <div className="text-center mb-4">
              <img src="/images/logo.png" alt="Logo" className="w-20 h-20 mx-auto mb-2 rounded-full" />
              <h1 className="text-xl font-bold">Dawar Juha</h1>
              <p className="text-sm">Restaurant & Café</p>
              <p className="text-sm">123 Main Street, City</p>
              <p className="text-sm">Tel: +123 456 7890</p>
              <div className="border-b border-dashed border-gray-400 my-2"></div>
              <h2 className="text-lg font-bold">فاتورة العميل</h2>
            </div>

            <div className="mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span>طلب #:</span>
                <span>{orderId}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>التاريخ:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>الوقت:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>العميل:</span>
                <span>{customerName || "عميل عابر"}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>النوع:</span>
                <span>
                  {orderType === "dine-in" ? "تناول في المطعم" : orderType === "takeaway" ? "استلام" : "توصيل"}
                </span>
              </div>
              {orderType === "delivery" && phoneNumber && (
                <div className="flex justify-between mb-1">
                  <span>الهاتف:</span>
                  <span>{phoneNumber}</span>
                </div>
              )}
              <div className="flex justify-between mb-1">
                <span>الكاشير:</span>
                <span>{cashierName}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 mb-2"></div>

            <div className="mb-4">
              <div className="flex justify-between font-bold text-sm mb-2">
                <span className="w-2/5">الصنف</span>
                <span className="w-1/5 text-center">العدد</span>
                <span className="w-1/5 text-right">السعر</span>
                <span className="w-1/5 text-right">الإجمالي</span>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="mb-2 text-sm">
                  <div className="flex justify-between">
                    <span className="w-2/5">
                      {item.name}
                      {item.size && item.size !== "عادي" && <span className="text-xs"> ({item.size})</span>}
                    </span>
                    <span className="w-1/5 text-center">{item.quantity}</span>
                    <span className="w-1/5 text-right">ج.م{item.basePrice.toFixed(2)}</span>
                    <span className="w-1/5 text-right">ج.م{(item.basePrice * item.quantity).toFixed(2)}</span>
                  </div>

                  {item.extras && item.extras.length > 0 && (
                    <div className="text-xs text-gray-600 mr-2">
                      {item.extras.map((extra) => (
                        <div key={extra.id} className="flex justify-between">
                          <span className="w-2/5">+ {extra.name}</span>
                          <span className="w-1/5 text-center">{item.quantity}</span>
                          <span className="w-1/5 text-right">ج.م{extra.price.toFixed(2)}</span>
                          <span className="w-1/5 text-right">ج.م{(extra.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.notes && <div className="text-xs text-gray-600 mr-2 italic">ملاحظة: {item.notes}</div>}
                </div>
              ))}
            </div>

            <div className="border-t border-double border-gray-800 pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>الإجمالي</span>
                <span>ج.م{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center mt-4 text-sm">
              <p>شكراً لطلبكم!</p>
              <p>نتطلع لرؤيتكم مرة أخرى</p>
              <div className="flex justify-center items-center mt-2">
                <img src="/images/eathrel.png" alt="Eathrel Logo" className="w-4 h-4 mr-1" />
                <span className="text-xs">Powered by Ethereal</span>
              </div>
            </div>
          </div>

          {/* Kitchen Receipt */}
          <div className="print-receipt page-break-before">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold">Dawar Juha</h1>
              <h2 className="text-lg font-bold">طلب المطبخ</h2>
              <div className="border-b border-dashed border-gray-400 my-2"></div>
            </div>

            <div className="mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span>طلب #:</span>
                <span className="font-bold text-lg">{orderId}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>الوقت:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>النوع:</span>
                <span className="font-bold">
                  {orderType === "dine-in" ? "تناول في المطعم" : orderType === "takeaway" ? "استلام" : "توصيل"}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span>العميل:</span>
                <span>{customerName || "عميل عابر"}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 mb-2"></div>

            <div className="mb-4">
              <h3 className="font-bold text-center mb-2">عناصر الطلب</h3>

              {cart.map((item) => (
                <div key={item.id} className="mb-3 p-2 border border-gray-300 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-lg">{item.name}</span>
                    <span className="bg-gray-800 text-white px-2 py-1 rounded font-bold">x{item.quantity}</span>
                  </div>

                  {item.size && item.size !== "عادي" && (
                    <div className="text-sm text-gray-600 mb-1">الحجم: {item.size}</div>
                  )}

                  {item.extras && item.extras.length > 0 && (
                    <div className="text-sm mb-1">
                      <span className="font-medium">الإضافات:</span>
                      <ul className="list-disc list-inside ml-2">
                        {item.extras.map((extra) => (
                          <li key={extra.id}>{extra.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.notes && (
                    <div className="text-sm bg-yellow-100 p-1 rounded">
                      <span className="font-medium">ملاحظة خاصة:</span> {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-4 text-sm border-t border-dashed border-gray-400 pt-2">
              <p>إجمالي العناصر: {cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
              <p>الكاشير: {cashierName}</p>
            </div>
          </div>
        </div>

        <style jsx>{`
  @media print {
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    .print-receipt {
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
      font-family: 'Arial', 'Tahoma', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #000;
      background: white;
    }
    
    .print-receipt h1 {
      font-size: 22px;
      font-weight: bold;
      margin: 8px 0;
      line-height: 1.3;
    }
    
    .print-receipt h2 {
      font-size: 18px;
      font-weight: bold;
      margin: 6px 0;
      line-height: 1.4;
    }
    
    .print-receipt h3 {
      font-size: 16px;
      font-weight: bold;
      margin: 4px 0;
      line-height: 1.4;
    }
    
    .print-receipt p {
      margin: 3px 0;
      line-height: 1.5;
    }
    
    .print-receipt .text-sm {
      font-size: 13px;
      line-height: 1.5;
    }
    
    .print-receipt .text-xs {
      font-size: 11px;
      line-height: 1.4;
    }
    
    .print-receipt .text-lg {
      font-size: 16px;
      font-weight: bold;
      line-height: 1.4;
    }
    
    .print-receipt .text-xl {
      font-size: 20px;
      font-weight: bold;
      line-height: 1.3;
    }
    
    .print-receipt .mb-1 {
      margin-bottom: 4px;
    }
    
    .print-receipt .mb-2 {
      margin-bottom: 8px;
    }
    
    .print-receipt .mb-3 {
      margin-bottom: 12px;
    }
    
    .print-receipt .mb-4 {
      margin-bottom: 16px;
    }
    
    .print-receipt .mt-2 {
      margin-top: 8px;
    }
    
    .print-receipt .mt-4 {
      margin-top: 16px;
    }
    
    .print-receipt .p-1 {
      padding: 4px;
    }
    
    .print-receipt .p-2 {
      padding: 8px;
    }
    
    .print-receipt .py-1 {
      padding-top: 4px;
      padding-bottom: 4px;
    }
    
    .print-receipt .px-2 {
      padding-left: 8px;
      padding-right: 8px;
    }
    
    .print-receipt .border-dashed {
      border-style: dashed;
      border-width: 1px;
      border-color: #666;
    }
    
    .print-receipt .border-double {
      border-style: double;
      border-width: 3px;
      border-color: #000;
    }
    
    .print-receipt .border-t {
      border-top-width: 1px;
      border-top-style: solid;
      border-top-color: #000;
    }
    
    .print-receipt .border-b {
      border-bottom-width: 1px;
      border-bottom-style: solid;
      border-bottom-color: #000;
    }
    
    .print-receipt .border {
      border: 1px solid #333;
    }
    
    .print-receipt .rounded {
      border-radius: 4px;
    }
    
    .print-receipt .font-bold {
      font-weight: bold;
    }
    
    .print-receipt .text-center {
      text-align: center;
    }
    
    .print-receipt .text-right {
      text-align: right;
    }
    
    .print-receipt .flex {
      display: flex;
    }
    
    .print-receipt .justify-between {
      justify-content: space-between;
    }
    
    .print-receipt .justify-center {
      justify-content: center;
    }
    
    .print-receipt .items-center {
      align-items: center;
    }
    
    .print-receipt .bg-gray-800 {
      background-color: #1f2937;
    }
    
    .print-receipt .bg-yellow-100 {
      background-color: #fef3c7;
    }
    
    .print-receipt .text-white {
      color: white;
    }
    
    .print-receipt .text-gray-600 {
      color: #4b5563;
    }
    
    .print-receipt .w-20 {
      width: 80px;
    }
    
    .print-receipt .h-20 {
      height: 80px;
    }
    
    .print-receipt .w-4 {
      width: 16px;
    }
    
    .print-receipt .h-4 {
      height: 16px;
    }
    
    .print-receipt .mx-auto {
      margin-left: auto;
      margin-right: auto;
    }
    
    .print-receipt .mr-1 {
      margin-right: 4px;
    }
    
    .print-receipt .mr-2 {
      margin-right: 8px;
    }
    
    .print-receipt .ml-2 {
      margin-left: 8px;
    }
    
    .print-receipt .list-disc {
      list-style-type: disc;
    }
    
    .print-receipt .list-inside {
      list-style-position: inside;
    }
    
    .print-receipt .w-1\\/5 {
      width: 20%;
    }
    
    .print-receipt .w-2\\/5 {
      width: 40%;
    }
    
    .page-break-before {
      page-break-before: always;
      margin-top: 2in;
    }
    
    .print\\:hidden {
      display: none !important;
    }
    
    .print\\:block {
      display: block !important;
    }
    
    /* Enhanced spacing for better readability */
    .receipt-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      padding: 2px 0;
    }
    
    .receipt-items-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding: 4px 0;
      border-bottom: 1px dotted #ccc;
    }
    
    .receipt-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: bold;
      padding: 8px 0;
      margin-top: 8px;
    }
    
    /* Kitchen receipt specific styles */
    .kitchen-item {
      margin-bottom: 16px;
      padding: 12px;
      border: 2px solid #333;
      border-radius: 6px;
      background-color: #f9f9f9;
    }
    
    .kitchen-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }
    
    .kitchen-quantity-badge {
      background-color: #000;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 16px;
    }
    
    .kitchen-notes {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 8px;
      border-radius: 4px;
      margin-top: 8px;
    }
  }
`}</style>
      </div>

      {/* Item Modal */}
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
                        const isSelected = selectedExtras.some((e) => e.id === extra.extra_id)
                        return (
                          <Badge
                            key={extra.extra_id}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer ${isSelected ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedExtras(selectedExtras.filter((e) => e.id !== extra.extra_id))
                              } else {
                                setSelectedExtras([
                                  ...selectedExtras,
                                  {
                                    id: extra.extra_id,
                                    name: extra.name,
                                    price: Number.parseFloat(extra.price),
                                  },
                                ])
                              }
                            }}
                          >
                            {extra.name} - ج.م{Number.parseFloat(extra.price).toFixed(2)}
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
