"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus, Search, AlertTriangle, RefreshCw } from "lucide-react"
import { inventory as inventoryData, type InventoryItem } from "@/mock-data/inventory"
import { motion } from "framer-motion"

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(inventoryData)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Ingredients",
    quantity: 0,
    unit: "kg",
    minQuantity: 0,
  })
  const [updateQuantity, setUpdateQuantity] = useState(0)
  const [updateType, setUpdateType] = useState<"add" | "reduce">("add")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
    }
  }, [])

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "low") return matchesSearch && item.quantity <= item.minQuantity
    return matchesSearch
  })

  const handleAddItem = () => {
    const newItemId = `inv-${inventory.length + 1}`
    const itemToAdd: InventoryItem = {
      id: newItemId,
      name: newItem.name,
      category: newItem.category,
      quantity: newItem.quantity,
      unit: newItem.unit,
      minQuantity: newItem.minQuantity,
      lastUpdated: new Date().toISOString(),
    }

    setInventory([...inventory, itemToAdd])
    setShowAddDialog(false)
    setNewItem({
      name: "",
      category: "Ingredients",
      quantity: 0,
      unit: "kg",
      minQuantity: 0,
    })
  }

  const handleUpdateItem = () => {
    if (!selectedItem) return

    setInventory(
      inventory.map((item) => {
        if (item.id === selectedItem.id) {
          const newQuantity =
            updateType === "add" ? item.quantity + updateQuantity : Math.max(0, item.quantity - updateQuantity)

          return {
            ...item,
            quantity: newQuantity,
            lastUpdated: new Date().toISOString(),
          }
        }
        return item
      }),
    )

    setShowUpdateDialog(false)
    setSelectedItem(null)
    setUpdateQuantity(0)
  }

  const openUpdateDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setUpdateQuantity(0)
    setUpdateType("add")
    setShowUpdateDialog(true)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return "out"
    if (item.quantity <= item.minQuantity) return "low"
    return "ok"
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">إدارة المخزون</h2>
          <p className="text-muted-foreground">Track and manage inventory items</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" />
          إضافة عنصر جديد
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>المخزون</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="بحث في المخزون..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">جميع العناصر</TabsTrigger>
              <TabsTrigger value="low" className="flex items-center">
                <AlertTriangle className="mr-1 h-4 w-4 text-amber-500" />
                مخزون منخفض
                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800">
                  {inventory.filter((item) => item.quantity <= item.minQuantity).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="m-0">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="h-10 px-4 text-left align-middle font-medium">العنصر</th>
                        <th className="h-10 px-4 text-left align-middle font-medium">الفئة</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">الكمية</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">الحد الأدنى</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">الحالة</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">آخر تحديث</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">
                            لا توجد عناصر مطابقة
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((item) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="p-4 align-middle">{item.name}</td>
                            <td className="p-4 align-middle">{item.category}</td>
                            <td className="p-4 align-middle text-center">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-4 align-middle text-center">
                              {item.minQuantity} {item.unit}
                            </td>
                            <td className="p-4 align-middle text-center">
                              <Badge
                                variant={
                                  getStockStatus(item) === "out"
                                    ? "destructive"
                                    : getStockStatus(item) === "low"
                                      ? "outline"
                                      : "default"
                                }
                                className={
                                  getStockStatus(item) === "out"
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : getStockStatus(item) === "low"
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                      : "bg-green-100 text-green-800 hover:bg-green-100"
                                }
                              >
                                {getStockStatus(item) === "out"
                                  ? "نفذ"
                                  : getStockStatus(item) === "low"
                                    ? "منخفض"
                                    : "متوفر"}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle text-right">
                              {new Date(item.lastUpdated).toLocaleDateString()}
                            </td>
                            <td className="p-4 align-middle text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUpdateDialog(item)}
                                className="h-8"
                              >
                                <RefreshCw className="mr-2 h-3 w-3" />
                                تحديث
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

            <TabsContent value="low" className="m-0">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="h-10 px-4 text-left align-middle font-medium">العنصر</th>
                        <th className="h-10 px-4 text-left align-middle font-medium">الفئة</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">الكمية</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">الحد الأدنى</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">الحالة</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">آخر تحديث</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">
                            لا توجد عناصر منخفضة المخزون
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((item) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="p-4 align-middle">{item.name}</td>
                            <td className="p-4 align-middle">{item.category}</td>
                            <td className="p-4 align-middle text-center">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-4 align-middle text-center">
                              {item.minQuantity} {item.unit}
                            </td>
                            <td className="p-4 align-middle text-center">
                              <Badge
                                variant={
                                  getStockStatus(item) === "out"
                                    ? "destructive"
                                    : getStockStatus(item) === "low"
                                      ? "outline"
                                      : "default"
                                }
                                className={
                                  getStockStatus(item) === "out"
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : getStockStatus(item) === "low"
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                      : "bg-green-100 text-green-800 hover:bg-green-100"
                                }
                              >
                                {getStockStatus(item) === "out"
                                  ? "نفذ"
                                  : getStockStatus(item) === "low"
                                    ? "منخفض"
                                    : "متوفر"}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle text-right">
                              {new Date(item.lastUpdated).toLocaleDateString()}
                            </td>
                            <td className="p-4 align-middle text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUpdateDialog(item)}
                                className="h-8"
                              >
                                <RefreshCw className="mr-2 h-3 w-3" />
                                تحديث
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

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة عنصر جديد للمخزون</DialogTitle>
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
              <Label htmlFor="category">الفئة</Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ingredients">مكونات</SelectItem>
                  <SelectItem value="Meat">لحوم</SelectItem>
                  <SelectItem value="Drinks">مشروبات</SelectItem>
                  <SelectItem value="Fruits">فواكه</SelectItem>
                  <SelectItem value="Supplies">مستلزمات</SelectItem>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddItem} disabled={!newItem.name} className="bg-orange-600 hover:bg-orange-700">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Item Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث المخزون: {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الكمية الحالية:</p>
                <p className="font-medium">
                  {selectedItem?.quantity} {selectedItem?.unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحد الأدنى:</p>
                <p className="font-medium">
                  {selectedItem?.minQuantity} {selectedItem?.unit}
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
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium">الكمية بعد التحديث:</p>
              <p className="text-lg font-bold">
                {selectedItem && updateType === "add"
                  ? selectedItem.quantity + updateQuantity
                  : selectedItem
                    ? Math.max(0, selectedItem.quantity - updateQuantity)
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
              onClick={handleUpdateItem}
              disabled={updateQuantity <= 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              تحديث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
