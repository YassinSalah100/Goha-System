"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Minus,
  Search,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit,
  Printer,
  Package,
  TrendingDown,
  TrendingUp,
  Eye,
  Filter,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

interface StockItem {
  stock_item_id: string
  name: string
  type: string
  current_quantity: number
  unit: string
  minimum_value: number
  last_updated_at: string
  status: string
  price?: number
  supplier?: string
}

interface StockStats {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  totalValue: number
  criticalAlerts: number
}

export default function EnhancedStockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [stockStats, setStockStats] = useState<StockStats>({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
    criticalAlerts: 0,
  })

  const [newItem, setNewItem] = useState({
    name: "",
    type: "ingredient",
    quantity: 0,
    unit: "kg",
    minQuantity: 0,
    price: 0,
    supplier: "",
  })
  const [updateQuantity, setUpdateQuantity] = useState(0)
  const [updateType, setUpdateType] = useState<"add" | "reduce">("add")

  const { toast } = useToast()

  // Enhanced stock status calculation with better logic
  const getStockStatus = (item: StockItem) => {
    const currentQty = Number(item.current_quantity) || 0
    const minQty = Number(item.minimum_value) || 0

    if (currentQty <= 0) return "out"
    if (currentQty <= minQty) return "low"
    if (currentQty <= minQty * 1.5) return "warning" // New warning level
    return "ok"
  }

  // Enhanced stock status badge with better colors and icons
  const getStatusBadge = (item: StockItem) => {
    const status = getStockStatus(item)

    switch (status) {
      case "out":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300 font-medium">
            <AlertTriangle className="w-3 h-3 mr-1" />
            نفذ المخزون
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-medium">
            <TrendingDown className="w-3 h-3 mr-1" />
            منخفض
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 font-medium">
            <Eye className="w-3 h-3 mr-1" />
            تحذير
          </Badge>
        )
      default:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            متوفر
          </Badge>
        )
    }
  }

  // Calculate comprehensive stock statistics
  const calculateStockStats = (items: StockItem[]) => {
    const stats = items.reduce(
      (acc, item) => {
        const status = getStockStatus(item)
        const itemValue = (item.price || 0) * item.current_quantity

        acc.totalItems += 1
        acc.totalValue += itemValue

        if (status === "out") acc.outOfStockItems += 1
        if (status === "low" || status === "warning") acc.lowStockItems += 1
        if (status === "out" || status === "low") acc.criticalAlerts += 1

        return acc
      },
      {
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        criticalAlerts: 0,
      },
    )

    setStockStats(stats)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
    }
    fetchStockItems()
    fetchLowStockItems()
  }, [])

  useEffect(() => {
    calculateStockStats(stockItems)
  }, [stockItems])

  const fetchStockItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/stock-items`)
      if (!response.ok) throw new Error("Failed to fetch stock items")
      const result = await response.json()

      const items = result.data?.stockItems || []
      setStockItems(items)
    } catch (error) {
      console.error("Fetch error:", error)
      setStockItems([])
      toast({
        title: "خطأ",
        description: "فشل في تحميل عناصر المخزون",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLowStockItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock-items/low-stock`)
      if (!response.ok) throw new Error("Failed to fetch low stock items")
      const result = await response.json()

      const items = Array.isArray(result) ? result : result.data || []
      setLowStockItems(items)
    } catch (error) {
      console.error("Error fetching low stock items:", error)
      setLowStockItems([])
    }
  }

  const fetchStockItemsByType = async (type: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/stock-items/type/${type}`)
      if (!response.ok) throw new Error("Failed to fetch stock items by type")
      const result = await response.json()

      const items = result.data?.stockItems || []
      setStockItems(items)
    } catch (error) {
      console.error("Error fetching stock items by type:", error)
      setStockItems([])
      toast({
        title: "خطأ",
        description: "فشل في تحميل عناصر المخزون حسب النوع",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    if (type === "all") {
      fetchStockItems()
    } else {
      fetchStockItemsByType(type)
    }
  }

  const filteredStockItems = (Array.isArray(stockItems) ? stockItems : []).filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "low") {
      const status = getStockStatus(item)
      return matchesSearch && (status === "low" || status === "warning" || status === "out")
    }
    if (activeTab === "critical") {
      const status = getStockStatus(item)
      return matchesSearch && (status === "out" || status === "low")
    }
    return matchesSearch
  })

  const handleAddItem = async () => {
    try {
      const requestBody = {
        name: newItem.name,
        type: newItem.type,
        unit: newItem.unit,
        current_quantity: newItem.quantity,
        minimum_value: newItem.minQuantity,
        status: "available",
      }

      const response = await fetch(`${API_BASE_URL}/stock-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors
            .map((err: any) => `${err.path || err.param}: ${err.msg || err.message}`)
            .join(", ")
          throw new Error(`Validation failed: ${errorMessages}`)
        }
        const errorMessage = errorData.message || errorData.error || "Unknown error"
        throw new Error(`Failed to create stock item: ${errorMessage}`)
      }

      const result = await response.json()
      const createdItem = result.data
      setStockItems([...stockItems, createdItem])
      setShowAddDialog(false)
      setNewItem({
        name: "",
        type: "ingredient",
        quantity: 0,
        unit: "kg",
        minQuantity: 0,
        price: 0,
        supplier: "",
      })

      toast({
        title: "نجح",
        description: "تم إضافة العنصر بنجاح",
      })

      fetchLowStockItems()
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في إضافة العنصر",
        variant: "destructive",
      })
    }
  }

  const handleUpdateQuantity = async () => {
    if (!selectedItem) return

    try {
      const newQuantity =
        updateType === "add"
          ? selectedItem.current_quantity + updateQuantity
          : Math.max(0, selectedItem.current_quantity - updateQuantity)

      const response = await fetch(`${API_BASE_URL}/stock-items/${selectedItem.stock_item_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedItem.name,
          type: selectedItem.type,
          unit: selectedItem.unit,
          current_quantity: newQuantity,
          minimum_value: selectedItem.minimum_value,
          status: selectedItem.status || "available",
        }),
      })

      if (!response.ok) throw new Error("Failed to update stock item")

      const result = await response.json()
      const updatedItem = result.data
      setStockItems(stockItems.map((item) => (item.stock_item_id === selectedItem.stock_item_id ? updatedItem : item)))

      setShowUpdateDialog(false)
      setSelectedItem(null)
      setUpdateQuantity(0)

      toast({
        title: "نجح",
        description: "تم تحديث الكمية بنجاح",
      })

      fetchLowStockItems()
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الكمية",
        variant: "destructive",
      })
    }
  }

  const handleEditItem = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch(`${API_BASE_URL}/stock-items/${selectedItem.stock_item_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedItem.name,
          type: selectedItem.type,
          unit: selectedItem.unit,
          current_quantity: selectedItem.current_quantity,
          minimum_value: selectedItem.minimum_value,
          status: selectedItem.status || "available",
        }),
      })

      if (!response.ok) throw new Error("Failed to update stock item")

      const result = await response.json()
      const updatedItem = result.data
      setStockItems(stockItems.map((item) => (item.stock_item_id === selectedItem.stock_item_id ? updatedItem : item)))

      setShowEditDialog(false)
      setSelectedItem(null)

      toast({
        title: "نجح",
        description: "تم تحديث العنصر بنجاح",
      })
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث العنصر",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العنصر؟")) return

    try {
      const response = await fetch(`${API_BASE_URL}/stock-items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete stock item")

      setStockItems(stockItems.filter((item) => item.stock_item_id !== itemId))

      toast({
        title: "نجح",
        description: "تم حذف العنصر بنجاح",
      })

      fetchLowStockItems()
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف العنصر",
        variant: "destructive",
      })
    }
  }

  const openUpdateDialog = (item: StockItem) => {
    setSelectedItem(item)
    setUpdateQuantity(0)
    setUpdateType("add")
    setShowUpdateDialog(true)
  }

  const openEditDialog = (item: StockItem) => {
    setSelectedItem({ ...item })
    setShowEditDialog(true)
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              إدارة المخزون المتقدمة
            </h1>
            <p className="text-lg text-muted-foreground">نظام شامل لإدارة ومراقبة مخزون المطعم مع التنبيهات الذكية</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="bg-white hover:bg-gray-50 border-gray-200"
            >
              <Printer className="mr-2 h-4 w-4" />
              طباعة التقرير
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              إضافة عنصر جديد
            </Button>
          </div>
        </div>

        {/* Critical Alerts */}
        <AnimatePresence>
          {stockStats.criticalAlerts > 0 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>تنبيه هام:</strong> يوجد {stockStats.criticalAlerts} عنصر يحتاج اهتمام فوري (نفذ أو منخفض
                  المخزون)
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  إجمالي العناصر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stockStats.totalItems}</div>
                <p className="text-blue-100 text-sm">عنصر في المخزون</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  مخزون منخفض
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stockStats.lowStockItems}</div>
                <p className="text-orange-100 text-sm">عنصر يحتاج تجديد</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  نفذ المخزون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stockStats.outOfStockItems}</div>
                <p className="text-red-100 text-sm">عنصر غير متوفر</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  قيمة المخزون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stockStats.totalValue.toLocaleString("ar-SA", {
                    style: "currency",
                    currency: "SAR",
                    minimumFractionDigits: 0,
                  })}
                </div>
                <p className="text-green-100 text-sm">إجمالي القيمة</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="border-b bg-white/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <CardTitle className="text-2xl font-bold text-gray-800">جدول المخزون</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Select value={selectedType} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-48 pl-10 bg-white">
                      <SelectValue placeholder="فلترة حسب النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="ingredient">مكونات</SelectItem>
                      <SelectItem value="beverage">مشروبات</SelectItem>
                      <SelectItem value="packaging">تغليف</SelectItem>
                      <SelectItem value="cleaning">تنظيف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="بحث في المخزون..."
                    className="w-64 pl-10 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6 pt-6">
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white">
                    جميع العناصر
                  </TabsTrigger>
                  <TabsTrigger value="low" className="data-[state=active]:bg-white flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    مخزون منخفض
                    {stockStats.lowStockItems > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {stockStats.lowStockItems}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="critical" className="data-[state=active]:bg-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    حرج
                    {stockStats.criticalAlerts > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {stockStats.criticalAlerts}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="m-0 p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">العنصر</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">النوع</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الكمية الحالية</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الحد الأدنى</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الحالة</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">آخر تحديث</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-5 w-5 animate-spin" />
                                جاري التحميل...
                              </div>
                            </td>
                          </tr>
                        ) : filteredStockItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              لا توجد عناصر مطابقة للبحث
                            </td>
                          </tr>
                        ) : (
                          filteredStockItems.map((item, index) => (
                            <motion.tr
                              key={item.stock_item_id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                {item.supplier && <div className="text-sm text-gray-500">المورد: {item.supplier}</div>}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {item.type}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="font-semibold text-lg">
                                  {item.current_quantity} {item.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-gray-600">
                                  {item.minimum_value} {item.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">{getStatusBadge(item)}</td>
                              <td className="px-6 py-4 text-center text-sm text-gray-500">
                                {new Date(item.last_updated_at).toLocaleDateString("ar-SA")}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openUpdateDialog(item)}
                                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(item)}
                                    className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteItem(item.stock_item_id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="low" className="m-0 p-6">
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-amber-100 to-orange-100">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-amber-800">العنصر</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-amber-800">النوع</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-amber-800">الكمية الحالية</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-amber-800">الحد الأدنى</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-amber-800">الحالة</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-amber-800">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-200">
                        {filteredStockItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-amber-600">
                              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-amber-400" />
                              ممتاز! لا توجد عناصر منخفضة المخزون
                            </td>
                          </tr>
                        ) : (
                          filteredStockItems.map((item, index) => (
                            <motion.tr
                              key={item.stock_item_id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="hover:bg-amber-100/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="font-medium text-amber-900">{item.name}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                  {item.type}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="font-semibold text-lg text-amber-900">
                                  {item.current_quantity} {item.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-amber-700">
                                  {item.minimum_value} {item.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">{getStatusBadge(item)}</td>
                              <td className="px-6 py-4 text-center">
                                <Button
                                  onClick={() => openUpdateDialog(item)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white"
                                  size="sm"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  تجديد المخزون
                                </Button>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="critical" className="m-0 p-6">
                <div className="rounded-lg border border-red-200 bg-red-50/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-red-100 to-red-200">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-red-800">العنصر</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-red-800">النوع</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-red-800">الكمية الحالية</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-red-800">الحد الأدنى</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-red-800">الحالة</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-red-800">إجراء فوري</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-200">
                        {filteredStockItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-red-600">
                              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                              لا توجد عناصر في حالة حرجة
                            </td>
                          </tr>
                        ) : (
                          filteredStockItems.map((item, index) => (
                            <motion.tr
                              key={item.stock_item_id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="hover:bg-red-100/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="font-medium text-red-900 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  {item.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                  {item.type}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="font-semibold text-lg text-red-900">
                                  {item.current_quantity} {item.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-red-700">
                                  {item.minimum_value} {item.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">{getStatusBadge(item)}</td>
                              <td className="px-6 py-4 text-center">
                                <Button
                                  onClick={() => openUpdateDialog(item)}
                                  className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                  size="sm"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  تجديد فوري
                                </Button>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialogs remain the same as in original code */}
        {/* Add Item Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة عنصر جديد للمخزون</DialogTitle>
              <DialogDescription>أدخل تفاصيل العنصر الجديد لإضافته إلى المخزون</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم العنصر</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="أدخل اسم العنصر"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">النوع</Label>
                <Select value={newItem.type} onValueChange={(value) => setNewItem({ ...newItem, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingredient">مكونات</SelectItem>
                    <SelectItem value="beverage">مشروبات</SelectItem>
                    <SelectItem value="packaging">تغليف</SelectItem>
                    <SelectItem value="cleaning">تنظيف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">الوحدة</Label>
                  <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="اختر الوحدة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">كيلوجرام</SelectItem>
                      <SelectItem value="g">جرام</SelectItem>
                      <SelectItem value="liters">لتر</SelectItem>
                      <SelectItem value="units">وحدة</SelectItem>
                      <SelectItem value="boxes">صندوق</SelectItem>
                      <SelectItem value="cans">علبة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minQuantity">الحد الأدنى للمخزون</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  min="0"
                  value={newItem.minQuantity}
                  onChange={(e) => setNewItem({ ...newItem, minQuantity: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">السعر</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">المورد</Label>
                <Input
                  id="supplier"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="اسم المورد"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={!newItem.name || !newItem.type}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Quantity Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تحديث المخزون: {selectedItem?.name}</DialogTitle>
              <DialogDescription>قم بتحديث كمية العنصر في المخزون</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">الكمية الحالية:</p>
                  <p className="font-medium text-lg">
                    {selectedItem?.current_quantity} {selectedItem?.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحد الأدنى:</p>
                  <p className="font-medium text-lg">
                    {selectedItem?.minimum_value} {selectedItem?.unit}
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>نوع التحديث</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={updateType === "add" ? "default" : "outline"}
                    className={updateType === "add" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setUpdateType("add")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    إضافة للمخزون
                  </Button>
                  <Button
                    type="button"
                    variant={updateType === "reduce" ? "default" : "outline"}
                    className={updateType === "reduce" ? "bg-amber-600 hover:bg-amber-700" : ""}
                    onClick={() => setUpdateType("reduce")}
                  >
                    <Minus className="mr-2 h-4 w-4" />
                    خصم من المخزون
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="updateQuantity">الكمية</Label>
                <Input
                  id="updateQuantity"
                  type="number"
                  min="0"
                  value={updateQuantity}
                  onChange={(e) => setUpdateQuantity(Number(e.target.value))}
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">الكمية بعد التحديث:</p>
                <p className="text-2xl font-bold text-blue-900">
                  {selectedItem && updateType === "add"
                    ? selectedItem.current_quantity + updateQuantity
                    : selectedItem
                      ? Math.max(0, selectedItem.current_quantity - updateQuantity)
                      : 0}{" "}
                  {selectedItem?.unit}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleUpdateQuantity}
                disabled={updateQuantity <= 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                تحديث
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تعديل العنصر: {selectedItem?.name}</DialogTitle>
              <DialogDescription>قم بتعديل تفاصيل العنصر</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editName">اسم العنصر</Label>
                <Input
                  id="editName"
                  value={selectedItem?.name || ""}
                  onChange={(e) => setSelectedItem(selectedItem ? { ...selectedItem, name: e.target.value } : null)}
                  placeholder="أدخل اسم العنصر"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editType">النوع</Label>
                <Select
                  value={selectedItem?.type || ""}
                  onValueChange={(value) => setSelectedItem(selectedItem ? { ...selectedItem, type: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingredient">مكونات</SelectItem>
                    <SelectItem value="beverage">مشروبات</SelectItem>
                    <SelectItem value="packaging">تغليف</SelectItem>
                    <SelectItem value="cleaning">تنظيف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editUnit">الوحدة</Label>
                  <Select
                    value={selectedItem?.unit || ""}
                    onValueChange={(value) => setSelectedItem(selectedItem ? { ...selectedItem, unit: value } : null)}
                  >
                    <SelectTrigger id="editUnit">
                      <SelectValue placeholder="اختر الوحدة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">كيلوجرام</SelectItem>
                      <SelectItem value="g">جرام</SelectItem>
                      <SelectItem value="liters">لتر</SelectItem>
                      <SelectItem value="units">وحدة</SelectItem>
                      <SelectItem value="boxes">صندوق</SelectItem>
                      <SelectItem value="cans">علبة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editMinQuantity">الحد الأدنى</Label>
                  <Input
                    id="editMinQuantity"
                    type="number"
                    min="0"
                    value={selectedItem?.minimum_value || 0}
                    onChange={(e) =>
                      setSelectedItem(selectedItem ? { ...selectedItem, minimum_value: Number(e.target.value) } : null)
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleEditItem}
                disabled={!selectedItem?.name}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
