"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { orders } from "../../../mock-data/orders"
import { dailyReports } from "../../../mock-data/daily-reports"

export default function ReportsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("sales")
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [selectedCashier, setSelectedCashier] = useState("all")
  const [selectedShift, setSelectedShift] = useState("all")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
    }
  }, [])

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.date).toISOString().split("T")[0]
    const matchesDateRange = orderDate >= dateRange.start && orderDate <= dateRange.end
    const matchesCashier = selectedCashier === "all" || order.cashier === selectedCashier

    return matchesDateRange && matchesCashier
  })

  const filteredReports = dailyReports.filter((report) => {
    const reportDate = report.date
    const matchesDateRange = reportDate >= dateRange.start && reportDate <= dateRange.end
    const matchesShift = selectedShift === "all" || report.shift === selectedShift

    return matchesDateRange && matchesShift
  })

  const calculateTotalSales = () => {
    return filteredOrders.reduce((sum, order) => sum + order.total, 0)
  }

  const calculateAverageOrderValue = () => {
    return filteredOrders.length > 0 ? calculateTotalSales() / filteredOrders.length : 0
  }

  const calculateTotalNetRevenue = () => {
    return filteredReports.reduce((sum, report) => sum + report.netRevenue, 0)
  }

  const calculateTotalExpenses = () => {
    return filteredReports.reduce(
      (sum, report) => sum + report.expenses.reduce((expSum, exp) => expSum + exp.amount, 0),
      0,
    )
  }

  const calculateTotalWages = () => {
    return filteredReports.reduce((sum, report) => sum + report.wages, 0)
  }

  const getSalesByCategory = () => {
    const categorySales: Record<string, number> = {}

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!categorySales[item.category]) {
          categorySales[item.category] = 0
        }
        categorySales[item.category] += item.price * item.quantity
      })
    })

    return Object.entries(categorySales).map(([category, total]) => ({
      category,
      total,
      percentage: (total / calculateTotalSales()) * 100,
    }))
  }

  const getSalesByCashier = () => {
    const cashierSales: Record<string, number> = {}

    filteredOrders.forEach((order) => {
      if (!cashierSales[order.cashier]) {
        cashierSales[order.cashier] = 0
      }
      cashierSales[order.cashier] += order.total
    })

    return Object.entries(cashierSales).map(([cashier, total]) => ({
      cashier,
      total,
      percentage: (total / calculateTotalSales()) * 100,
    }))
  }

  const getSalesByDay = () => {
    const daySales: Record<string, number> = {}

    filteredOrders.forEach((order) => {
      const day = new Date(order.date).toISOString().split("T")[0]
      if (!daySales[day]) {
        daySales[day] = 0
      }
      daySales[day] += order.total
    })

    return Object.entries(daySales).map(([day, total]) => ({
      day,
      total,
    }))
  }

  const getTopSellingItems = () => {
    const itemSales: Record<string, { quantity: number; total: number }> = {}

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { quantity: 0, total: 0 }
        }
        itemSales[item.name].quantity += item.quantity
        itemSales[item.name].total += item.price * item.quantity
      })
    })

    return Object.entries(itemSales)
      .map(([name, { quantity, total }]) => ({
        name,
        quantity,
        total,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">التقارير</h2>
        <p className="text-muted-foreground">View and analyze business performance reports</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>تصفية التقارير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">من تاريخ</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">إلى تاريخ</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashier">الكاشير</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger id="cashier">
                  <SelectValue placeholder="اختر الكاشير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="cashier">Ahmed Cashier</SelectItem>
                  <SelectItem value="sara">Sara Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift">الوردية</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger id="shift">
                  <SelectValue placeholder="اختر الوردية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="morning">صباحية</SelectItem>
                  <SelectItem value="evening">مسائية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="sales">تقارير المبيعات</TabsTrigger>
          <TabsTrigger value="financial">التقارير المالية</TabsTrigger>
          <TabsTrigger value="performance">تقارير الأداء</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="m-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${calculateTotalSales().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredOrders.length} طلبات • {dateRange.start} إلى {dateRange.end}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">متوس قيمة الطلب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${calculateAverageOrderValue().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">لكل طلب • {filteredOrders.length} طلبات إجمالي</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">أعلى يوم مبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                {getSalesByDay().length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      ${Math.max(...getSalesByDay().map((day) => day.total)).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getSalesByDay().sort((a, b) => b.total - a.total)[0].day}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>المبيعات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getSalesByCategory().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد بيانات</div>
                  ) : (
                    getSalesByCategory().map((category) => (
                      <div key={category.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="capitalize">{category.category}</span>
                          <span>${category.total.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-right text-muted-foreground mt-1">
                          {category.percentage.toFixed(1)}%
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المبيعات حسب الكاشير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getSalesByCashier().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد بيانات</div>
                  ) : (
                    getSalesByCashier().map((cashier) => (
                      <div key={cashier.cashier}>
                        <div className="flex items-center justify-between mb-1">
                          <span>{cashier.cashier === "cashier" ? "Ahmed Cashier" : "Sara Cashier"}</span>
                          <span>${cashier.total.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${cashier.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-right text-muted-foreground mt-1">
                          {cashier.percentage.toFixed(1)}%
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>أكثر العناصر مبيعاً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle font-medium">العنصر</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">الكمية</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">إجمالي المبيعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTopSellingItems().length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-muted-foreground">
                          لا توجد بيانات
                        </td>
                      </tr>
                    ) : (
                      getTopSellingItems().map((item, index) => (
                        <tr key={item.name} className="border-t hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{index + 1}.</span>
                              <span>{item.name}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle text-center">{item.quantity}</td>
                          <td className="p-4 align-middle text-right">${item.total.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              تصدير التقرير
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="m-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${filteredReports.reduce((sum, report) => sum + report.totalRevenue, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredReports.length} تقارير • {dateRange.start} إلى {dateRange.end}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${calculateTotalExpenses().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredReports.reduce((sum, report) => sum + report.expenses.length, 0)} عناصر
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">صافي الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${calculateTotalNetRevenue().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">بعد المصروفات والأجور</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>التقارير اليومية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle font-medium">التاريخ</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">الوردية</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">إيرادات التيك أواي</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">إيرادات الكافيه</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">إيرادات الأرضية</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">المصروفات</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">الأجور</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">الصافي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-muted-foreground">
                          لا توجد تقارير مطابقة
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report.id} className="border-t hover:bg-muted/50">
                          <td className="p-4 align-middle">{report.date}</td>
                          <td className="p-4 align-middle text-center capitalize">
                            {report.shift === "morning" ? "صباحية" : "مسائية"}
                          </td>
                          <td className="p-4 align-middle text-right">${report.takeawayRevenue.toFixed(2)}</td>
                          <td className="p-4 align-middle text-right">${report.cafeRevenue.toFixed(2)}</td>
                          <td className="p-4 align-middle text-right">${report.groundRevenue.toFixed(2)}</td>
                          <td className="p-4 align-middle text-right text-red-600">
                            ${report.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                          </td>
                          <td className="p-4 align-middle text-right text-red-600">${report.wages.toFixed(2)}</td>
                          <td className="p-4 align-middle text-right font-medium text-green-600">
                            ${report.netRevenue.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد بيانات</div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span>إيرادات التيك أواي</span>
                          <span>
                            ${filteredReports.reduce((sum, report) => sum + report.takeawayRevenue, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{
                              width: `${
                                (filteredReports.reduce((sum, report) => sum + report.takeawayRevenue, 0) /
                                  filteredReports.reduce((sum, report) => sum + report.totalRevenue, 0)) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span>إيرادات الكافيه</span>
                          <span>
                            ${filteredReports.reduce((sum, report) => sum + report.cafeRevenue, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${
                                (filteredReports.reduce((sum, report) => sum + report.cafeRevenue, 0) /
                                  filteredReports.reduce((sum, report) => sum + report.totalRevenue, 0)) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span>إيرادات الأرضية</span>
                          <span>
                            ${filteredReports.reduce((sum, report) => sum + report.groundRevenue, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{
                              width: `${
                                (filteredReports.reduce((sum, report) => sum + report.groundRevenue, 0) /
                                  filteredReports.reduce((sum, report) => sum + report.totalRevenue, 0)) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد بيانات</div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span>المصروفات</span>
                          <span>${calculateTotalExpenses().toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{
                              width: `${
                                (calculateTotalExpenses() / (calculateTotalExpenses() + calculateTotalWages())) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span>الأجور</span>
                          <span>${calculateTotalWages().toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{
                              width: `${
                                (calculateTotalWages() / (calculateTotalExpenses() + calculateTotalWages())) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              تصدير التقرير
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="m-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">متوسط الطلبات اليومية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(
                    filteredOrders.length /
                    ((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24) +
                      1)
                  ).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">طلبات في اليوم</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">نسبة الربح</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredReports.length > 0
                    ? (
                        (calculateTotalNetRevenue() /
                          filteredReports.reduce((sum, report) => sum + report.totalRevenue, 0)) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </div>
                <p className="text-xs text-muted-foreground">صافي الربح / إجمالي الإيرادات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">نسبة المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredReports.length > 0
                    ? (
                        ((calculateTotalExpenses() + calculateTotalWages()) /
                          filteredReports.reduce((sum, report) => sum + report.totalRevenue, 0)) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </div>
                <p className="text-xs text-muted-foreground">(المصروفات + الأجور) / إجمالي الإيرادات</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>أداء الكاشير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle font-medium">الكاشير</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">عدد الطلبات</th>
                      <th className="h-10 px-4 text-center align-middle font-medium">متوسط قيمة الطلب</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">إجمالي المبيعات</th>
                      <th className="h-10 px-4 text-right align-middle font-medium">النسبة من المبيعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSalesByCashier().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          لا توجد بيانات
                        </td>
                      </tr>
                    ) : (
                      getSalesByCashier().map((cashier) => {
                        const cashierOrders = filteredOrders.filter((order) => order.cashier === cashier.cashier)
                        const avgOrderValue = cashierOrders.length > 0 ? cashier.total / cashierOrders.length : 0

                        return (
                          <tr key={cashier.cashier} className="border-t hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              {cashier.cashier === "cashier" ? "Ahmed Cashier" : "Sara Cashier"}
                            </td>
                            <td className="p-4 align-middle text-center">{cashierOrders.length}</td>
                            <td className="p-4 align-middle text-center">${avgOrderValue.toFixed(2)}</td>
                            <td className="p-4 align-middle text-right">${cashier.total.toFixed(2)}</td>
                            <td className="p-4 align-middle text-right">{cashier.percentage.toFixed(1)}%</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع أنواع الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد بيانات</div>
                  ) : (
                    (() => {
                      const orderTypes: Record<string, number> = {
                        "dine-in": 0,
                        takeaway: 0,
                        delivery: 0,
                      }

                      filteredOrders.forEach((order) => {
                        orderTypes[order.orderType]++
                      })

                      return Object.entries(orderTypes).map(([type, count]) => {
                        const percentage = (count / filteredOrders.length) * 100

                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="capitalize">
                                {type === "dine-in" ? "في المطعم" : type === "takeaway" ? "تيك أواي" : "توصيل"}
                              </span>
                              <span>{count} طلبات</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  type === "dine-in"
                                    ? "bg-green-500"
                                    : type === "takeaway"
                                      ? "bg-orange-500"
                                      : "bg-blue-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-right text-muted-foreground mt-1">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        )
                      })
                    })()
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع طرق الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد بيانات</div>
                  ) : (
                    (() => {
                      const paymentMethods: Record<string, { count: number; total: number }> = {
                        cash: { count: 0, total: 0 },
                        card: { count: 0, total: 0 },
                      }

                      filteredOrders.forEach((order) => {
                        paymentMethods[order.paymentMethod].count++
                        paymentMethods[order.paymentMethod].total += order.total
                      })

                      return Object.entries(paymentMethods).map(([method, { count, total }]) => {
                        const percentage = (count / filteredOrders.length) * 100

                        return (
                          <div key={method}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="capitalize">{method === "cash" ? "نقدي" : "بطاقة"}</span>
                              <span>
                                {count} طلبات • ${total.toFixed(2)}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  method === "cash" ? "bg-green-500" : "bg-purple-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-right text-muted-foreground mt-1">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        )
                      })
                    })()
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              تصدير التقرير
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
