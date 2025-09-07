"use client"

import { useState, useEffect, useMemo } from "react"
import { AuthApiService } from "@/lib/services/auth-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {Dialog,DialogContent, DialogHeader,DialogTitle,DialogFooter,DialogDescription} from "@/components/ui/dialog"
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
  UtensilsCrossed,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

import { API_CONFIG } from "@/lib/config"

// Stock Reports Interfaces
interface StockReportItem {
  stock_item_id: string
  name: string
  type: string
  unit: string
  current_quantity: number
  minimum_value: number
  status: string
  is_low_stock: boolean
  quantity_used_in_shift: number
  quantity_added_in_shift: number
  net_change_in_shift: number
}

interface StockTransactionDetail {
  transaction_id: string
  stock_item_id: string
  stock_item_name: string
  type: string
  quantity: number
  user_id: string
  user_name: string
  shift_id: string
  timestamp: string
}

interface StockTransactionStats {
  stock_item_id: string
  stock_item_name: string
  total_in: number
  total_out: number
  net_change: number
  transaction_count: number
}

interface ShiftTransactionDetail {
  transaction_id: string
  stock_item_id: string
  stock_item_name: string
  type: string
  quantity: number
  user_id: string
  user_name: string
  timestamp: string
}

interface ShiftStockTransactionSummary {
  type: string
  transaction_count: number
  total_quantity: number
}

interface ShiftStockReport {
  shift_id: string
  shift_date: string
  shift_name: string
  total_stock_items: number
  low_stock_items_count: number
  out_of_stock_items_count: number
  total_transactions: number
  transaction_summary: ShiftStockTransactionSummary[]
  transactions: ShiftTransactionDetail[]
  stock_items: StockReportItem[]
  low_stock_items: StockReportItem[]
  out_of_stock_items: StockReportItem[]
}

interface DailyStockReport {
  report_date: string
  report_generated_at: string
  total_shifts: number
  total_stock_items: number
  total_low_stock_items: number
  total_out_of_stock_items: number
  total_transactions: number
  shift_reports: ShiftStockReport[]
  critical_stock_items: StockReportItem[]
}

// Stock Reports Component
function StockReportsTab() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedShiftId, setSelectedShiftId] = useState<string>("")
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>("")
  const [dailyReport, setDailyReport] = useState<DailyStockReport | null>(null)
  const [shiftReport, setShiftReport] = useState<ShiftStockReport | null>(null)
  const [allTransactions, setAllTransactions] = useState<StockTransactionDetail[]>([])
  const [itemTransactions, setItemTransactions] = useState<StockTransactionDetail[]>([])
  const [itemStats, setItemStats] = useState<StockTransactionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<"daily" | "shift" | "transactions" | "item-stats">("daily")
  const { toast } = useToast()

  const fetchDailyReport = async () => {
    try {
      setLoading(true)
      const result = await AuthApiService.apiRequest<any>(`/stock-reports/daily?date=${reportDate}`)
      
      setDailyReport(result.data)
      
      toast({
        title: "نجح",
        description: "تم تحميل التقرير اليومي بنجاح",
      })
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: `فشل في تحميل التقرير: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchShiftReport = async () => {
    if (!selectedShiftId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار وردية أولاً",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const result = await AuthApiService.apiRequest<any>(`/stock-reports/shift/${selectedShiftId}?date=${reportDate}`)
      
      setShiftReport(result.data)
      
      toast({
        title: "نجح",
        description: "تم تحميل تقرير الوردية بنجاح",
      })
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: `فشل في تحميل التقرير: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTransactions = async () => {
    try {
      setLoading(true)
      const result = await AuthApiService.apiRequest<any>('/stock-transactions?limit=50')
      
      setAllTransactions(result.data.transactions || [])
      
      toast({
        title: "نجح",
        description: "تم تحميل جميع المعاملات بنجاح",
      })
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: `فشل في تحميل المعاملات: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchItemTransactions = async () => {
    if (!selectedStockItemId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار عنصر مخزون أولاً",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      // Fetch transactions for the item
      const transactionsResult = await AuthApiService.apiRequest<any>(`/stock-transactions/stock-item/${selectedStockItemId}`)
      setItemTransactions(transactionsResult.data || [])

      // Fetch stats for the item
      try {
        const statsResult = await AuthApiService.apiRequest<any>(`/stock-transactions/stats/${selectedStockItemId}`)
        setItemStats(statsResult.data || null)
      } catch (statsError) {
        console.warn("Could not fetch item stats:", statsError)
        setItemStats(null)
      }
      
      toast({
        title: "نجح",
        description: "تم تحميل معاملات العنصر بنجاح",
      })
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: `فشل في تحميل معاملات العنصر: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = () => {
    if (reportType === "daily") {
      fetchDailyReport()
    } else if (reportType === "shift") {
      fetchShiftReport()
    } else if (reportType === "transactions") {
      fetchAllTransactions()
    } else if (reportType === "item-stats") {
      fetchItemTransactions()
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Report Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <Printer className="w-5 h-5" />
            تقارير المخزون
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="reportType">نوع التقرير</Label>
              <Select value={reportType} onValueChange={(value: "daily" | "shift" | "transactions" | "item-stats") => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">تقرير يومي</SelectItem>
                  <SelectItem value="shift">تقرير وردية</SelectItem>
                  <SelectItem value="transactions">جميع المعاملات</SelectItem>
                  <SelectItem value="item-stats">إحصائيات عنصر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reportDate">التاريخ</Label>
              <Input
                id="reportDate"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="bg-white"
              />
            </div>
            
            {reportType === "shift" && (
              <div>
                <Label htmlFor="shiftId">الوردية</Label>
                <Input
                  id="shiftId"
                  placeholder="معرف الوردية"
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="bg-white"
                />
              </div>
            )}

            {reportType === "item-stats" && (
              <div>
                <Label htmlFor="stockItemId">عنصر المخزون</Label>
                <Input
                  id="stockItemId"
                  placeholder="معرف عنصر المخزون"
                  value={selectedStockItemId}
                  onChange={(e) => setSelectedStockItemId(e.target.value)}
                  className="bg-white"
                />
              </div>
            )}
            
            <Button 
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  إنشاء التقرير
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Report Display */}
      {dailyReport && reportType === "daily" && (
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
            <CardTitle className="text-xl font-bold text-green-700">
              التقرير اليومي - {new Date(dailyReport.report_date).toLocaleDateString('ar-EG')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{dailyReport.total_shifts}</div>
                <div className="text-sm text-blue-700">إجمالي الورديات</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{dailyReport.total_stock_items}</div>
                <div className="text-sm text-green-700">إجمالي العناصر</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{dailyReport.total_low_stock_items}</div>
                <div className="text-sm text-yellow-700">مخزون منخفض</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{dailyReport.total_out_of_stock_items}</div>
                <div className="text-sm text-red-700">نفذ المخزون</div>
              </div>
            </div>

            {/* Critical Stock Items */}
            {dailyReport.critical_stock_items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  عناصر حرجة تحتاج اهتمام فوري
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-red-200 rounded-lg">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="border border-red-200 px-4 py-2 text-right">العنصر</th>
                        <th className="border border-red-200 px-4 py-2 text-center">الكمية الحالية</th>
                        <th className="border border-red-200 px-4 py-2 text-center">الحد الأدنى</th>
                        <th className="border border-red-200 px-4 py-2 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyReport.critical_stock_items.map((item) => (
                        <tr key={item.stock_item_id} className="hover:bg-red-25">
                          <td className="border border-red-200 px-4 py-2 font-medium">{item.name}</td>
                          <td className="border border-red-200 px-4 py-2 text-center">{item.current_quantity} {item.unit}</td>
                          <td className="border border-red-200 px-4 py-2 text-center">{item.minimum_value} {item.unit}</td>
                          <td className="border border-red-200 px-4 py-2 text-center">
                            <Badge variant="destructive">حرج</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Shift Reports Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-600 mb-3">تقارير الورديات</h3>
              <div className="space-y-4">
                {dailyReport.shift_reports.map((shift) => (
                  <Card key={shift.shift_id} className="border border-blue-200">
                    <CardHeader className="bg-blue-50 py-3">
                      <CardTitle className="text-sm font-medium text-blue-700">
                        {shift.shift_name} - {shift.total_transactions} معاملة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">العناصر: </span>
                          <span className="font-medium">{shift.total_stock_items}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">مخزون منخفض: </span>
                          <span className="font-medium text-yellow-600">{shift.low_stock_items_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">نفذ المخزون: </span>
                          <span className="font-medium text-red-600">{shift.out_of_stock_items_count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Stock Items in Daily Report */}
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                جميع عناصر المخزون
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-green-200 rounded-lg">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="border border-green-200 px-4 py-2 text-right">العنصر</th>
                      <th className="border border-green-200 px-4 py-2 text-center">النوع</th>
                      <th className="border border-green-200 px-4 py-2 text-center">الكمية الحالية</th>
                      <th className="border border-green-200 px-4 py-2 text-center">الحد الأدنى</th>
                      <th className="border border-green-200 px-4 py-2 text-center">الوحدة</th>
                      <th className="border border-green-200 px-4 py-2 text-center">الحالة</th>
                      <th className="border border-green-200 px-4 py-2 text-center">إجمالي الاستخدام</th>
                      <th className="border border-green-200 px-4 py-2 text-center">إجمالي الإضافة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReport.shift_reports.flatMap(shift => shift.stock_items).reduce((unique, item) => {
                      const exists = unique.find(u => u.stock_item_id === item.stock_item_id);
                      if (!exists) {
                        // Calculate totals across all shifts for this item
                        const itemInAllShifts = dailyReport.shift_reports.flatMap(s => s.stock_items).filter(i => i.stock_item_id === item.stock_item_id);
                        const totalUsed = itemInAllShifts.reduce((sum, i) => sum + i.quantity_used_in_shift, 0);
                        const totalAdded = itemInAllShifts.reduce((sum, i) => sum + i.quantity_added_in_shift, 0);
                        unique.push({ ...item, totalUsed, totalAdded });
                      }
                      return unique;
                    }, [] as any[]).map((item) => (
                      <tr key={item.stock_item_id} className="hover:bg-green-25">
                        <td className="border border-green-200 px-4 py-2 font-medium">{item.name}</td>
                        <td className="border border-green-200 px-4 py-2 text-center">{item.type}</td>
                        <td className="border border-green-200 px-4 py-2 text-center">{item.current_quantity} {item.unit}</td>
                        <td className="border border-green-200 px-4 py-2 text-center">{item.minimum_value} {item.unit}</td>
                        <td className="border border-green-200 px-4 py-2 text-center">{item.unit}</td>
                        <td className="border border-green-200 px-4 py-2 text-center">
                          <Badge variant={item.is_low_stock ? "destructive" : "default"}>
                            {item.is_low_stock ? "منخفض" : "متوفر"}
                          </Badge>
                        </td>
                        <td className="border border-green-200 px-4 py-2 text-center text-red-600 font-medium">
                          -{item.totalUsed} {item.unit}
                        </td>
                        <td className="border border-green-200 px-4 py-2 text-center text-green-600 font-medium">
                          +{item.totalAdded} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift Report Display */}
      {shiftReport && reportType === "shift" && (
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <CardTitle className="text-xl font-bold text-purple-700">
              تقرير الوردية - {shiftReport.shift_name}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {new Date(shiftReport.shift_date).toLocaleDateString('ar-EG')}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Shift Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{shiftReport.total_transactions}</div>
                <div className="text-sm text-purple-700">إجمالي المعاملات</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{shiftReport.total_stock_items}</div>
                <div className="text-sm text-green-700">إجمالي العناصر</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{shiftReport.low_stock_items_count}</div>
                <div className="text-sm text-yellow-700">مخزون منخفض</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{shiftReport.out_of_stock_items_count}</div>
                <div className="text-sm text-red-700">نفذ المخزون</div>
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-purple-600 mb-3">ملخص المعاملات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shiftReport.transaction_summary.map((summary) => (
                  <div key={summary.type} className={`p-4 rounded-lg border ${
                    summary.type === 'in' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {summary.type === 'in' ? 'إضافة للمخزون' : 'استخدام من المخزون'}
                      </span>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          summary.type === 'in' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {summary.transaction_count}
                        </div>
                        <div className="text-sm text-gray-600">معاملة</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            {shiftReport.transactions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">المعاملات الأخيرة</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-blue-200 rounded-lg">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="border border-blue-200 px-4 py-2 text-right">العنصر</th>
                        <th className="border border-blue-200 px-4 py-2 text-center">النوع</th>
                        <th className="border border-blue-200 px-4 py-2 text-center">الكمية</th>
                        <th className="border border-blue-200 px-4 py-2 text-center">المستخدم</th>
                        <th className="border border-blue-200 px-4 py-2 text-center">الوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftReport.transactions.slice(0, 10).map((transaction) => (
                        <tr key={transaction.transaction_id} className="hover:bg-blue-25">
                          <td className="border border-blue-200 px-4 py-2 font-medium">{transaction.stock_item_name}</td>
                          <td className="border border-blue-200 px-4 py-2 text-center">
                            <Badge variant={transaction.type === 'in' ? 'default' : 'destructive'}>
                              {transaction.type === 'in' ? 'إضافة' : 'استخدام'}
                            </Badge>
                          </td>
                          <td className="border border-blue-200 px-4 py-2 text-center">{transaction.quantity}</td>
                          <td className="border border-blue-200 px-4 py-2 text-center">{transaction.user_name}</td>
                          <td className="border border-blue-200 px-4 py-2 text-center">
                            {new Date(transaction.timestamp).toLocaleTimeString('ar-EG')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All Stock Items in Shift */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-purple-600 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                جميع عناصر المخزون في هذه الوردية
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-purple-200 rounded-lg">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="border border-purple-200 px-4 py-2 text-right">العنصر</th>
                      <th className="border border-purple-200 px-4 py-2 text-center">النوع</th>
                      <th className="border border-purple-200 px-4 py-2 text-center">الكمية الحالية</th>
                      <th className="border border-purple-200 px-4 py-2 text-center">الحد الأدنى</th>
                      <th className="border border-purple-200 px-4 py-2 text-center">الوحدة</th>
                      <th className="border border-purple-200 px-4 py-2 text-center">الحالة</th>
                      <th className="border border-purple-200 px-4 py-2 text-center">مستخدم في الوردية</th>
                      <th className="border border-purple-200 px-4 py-2 text-center">مضاف في الوردية</th>
                      <th className="border border-purple-200 px-4 py-2 text-center">صافي التغيير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftReport.stock_items.map((item) => (
                      <tr key={item.stock_item_id} className="hover:bg-purple-25">
                        <td className="border border-purple-200 px-4 py-2 font-medium">{item.name}</td>
                        <td className="border border-purple-200 px-4 py-2 text-center">{item.type}</td>
                        <td className="border border-purple-200 px-4 py-2 text-center">{item.current_quantity} {item.unit}</td>
                        <td className="border border-purple-200 px-4 py-2 text-center">{item.minimum_value} {item.unit}</td>
                        <td className="border border-purple-200 px-4 py-2 text-center">{item.unit}</td>
                        <td className="border border-purple-200 px-4 py-2 text-center">
                          <Badge variant={item.is_low_stock ? "destructive" : "default"}>
                            {item.is_low_stock ? "منخفض" : "متوفر"}
                          </Badge>
                        </td>
                        <td className="border border-purple-200 px-4 py-2 text-center text-red-600 font-medium">
                          -{item.quantity_used_in_shift} {item.unit}
                        </td>
                        <td className="border border-purple-200 px-4 py-2 text-center text-green-600 font-medium">
                          +{item.quantity_added_in_shift} {item.unit}
                        </td>
                        <td className="border border-purple-200 px-4 py-2 text-center font-medium">
                          <span className={item.net_change_in_shift >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.net_change_in_shift >= 0 ? '+' : ''}{item.net_change_in_shift} {item.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Low Stock Items in Shift */}
            {shiftReport.low_stock_items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  عناصر المخزون المنخفض
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-yellow-200 rounded-lg">
                    <thead className="bg-yellow-50">
                      <tr>
                        <th className="border border-yellow-200 px-4 py-2 text-right">العنصر</th>
                        <th className="border border-yellow-200 px-4 py-2 text-center">الكمية الحالية</th>
                        <th className="border border-yellow-200 px-4 py-2 text-center">الحد الأدنى</th>
                        <th className="border border-yellow-200 px-4 py-2 text-center">الوحدة</th>
                        <th className="border border-yellow-200 px-4 py-2 text-center">النقص</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftReport.low_stock_items.map((item) => (
                        <tr key={item.stock_item_id} className="hover:bg-yellow-25">
                          <td className="border border-yellow-200 px-4 py-2 font-medium">{item.name}</td>
                          <td className="border border-yellow-200 px-4 py-2 text-center">{item.current_quantity} {item.unit}</td>
                          <td className="border border-yellow-200 px-4 py-2 text-center">{item.minimum_value} {item.unit}</td>
                          <td className="border border-yellow-200 px-4 py-2 text-center">{item.unit}</td>
                          <td className="border border-yellow-200 px-4 py-2 text-center text-red-600 font-medium">
                            {Math.max(0, item.minimum_value - item.current_quantity)} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Out of Stock Items in Shift */}
            {shiftReport.out_of_stock_items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  عناصر نفذت من المخزون
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-red-200 rounded-lg">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="border border-red-200 px-4 py-2 text-right">العنصر</th>
                        <th className="border border-red-200 px-4 py-2 text-center">النوع</th>
                        <th className="border border-red-200 px-4 py-2 text-center">الكمية الحالية</th>
                        <th className="border border-red-200 px-4 py-2 text-center">آخر استخدام في الوردية</th>
                        <th className="border border-red-200 px-4 py-2 text-center">الوحدة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftReport.out_of_stock_items.map((item) => (
                        <tr key={item.stock_item_id} className="hover:bg-red-25">
                          <td className="border border-red-200 px-4 py-2 font-medium">{item.name}</td>
                          <td className="border border-red-200 px-4 py-2 text-center">{item.type}</td>
                          <td className="border border-red-200 px-4 py-2 text-center">{item.current_quantity} {item.unit}</td>
                          <td className="border border-red-200 px-4 py-2 text-center text-red-600 font-medium">
                            -{item.quantity_used_in_shift} {item.unit}
                          </td>
                          <td className="border border-red-200 px-4 py-2 text-center">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Transactions Display */}
      {allTransactions.length > 0 && reportType === "transactions" && (
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <CardTitle className="text-xl font-bold text-indigo-700">
              جميع معاملات المخزون
            </CardTitle>
            <p className="text-sm text-gray-600">
              إجمالي {allTransactions.length} معاملة
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-indigo-200 rounded-lg">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="border border-indigo-200 px-4 py-2 text-right">العنصر</th>
                    <th className="border border-indigo-200 px-4 py-2 text-center">نوع المعاملة</th>
                    <th className="border border-indigo-200 px-4 py-2 text-center">الكمية</th>
                    <th className="border border-indigo-200 px-4 py-2 text-center">المستخدم</th>
                    <th className="border border-indigo-200 px-4 py-2 text-center">الوقت</th>
                    <th className="border border-indigo-200 px-4 py-2 text-center">الوردية</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="hover:bg-indigo-25">
                      <td className="border border-indigo-200 px-4 py-2 font-medium">{transaction.stock_item_name}</td>
                      <td className="border border-indigo-200 px-4 py-2 text-center">
                        <Badge variant={transaction.type === 'in' ? 'default' : 'destructive'}>
                          {transaction.type === 'in' ? 'إضافة' : 'استخدام'}
                        </Badge>
                      </td>
                      <td className="border border-indigo-200 px-4 py-2 text-center font-medium">
                        <span className={transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'in' ? '+' : '-'}{transaction.quantity}
                        </span>
                      </td>
                      <td className="border border-indigo-200 px-4 py-2 text-center">{transaction.user_name}</td>
                      <td className="border border-indigo-200 px-4 py-2 text-center">
                        {new Date(transaction.timestamp).toLocaleString('ar-EG')}
                      </td>
                      <td className="border border-indigo-200 px-4 py-2 text-center text-xs text-gray-500">
                        {transaction.shift_id.substring(0, 8)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Statistics Display */}
      {(itemStats || itemTransactions.length > 0) && reportType === "item-stats" && (
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
            <CardTitle className="text-xl font-bold text-teal-700">
              إحصائيات العنصر - {itemStats?.stock_item_name || 'غير محدد'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Item Statistics Summary */}
            {itemStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">+{itemStats.total_in}</div>
                  <div className="text-sm text-green-700">إجمالي الإضافة</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">-{itemStats.total_out}</div>
                  <div className="text-sm text-red-700">إجمالي الاستخدام</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className={`text-2xl font-bold ${itemStats.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {itemStats.net_change >= 0 ? '+' : ''}{itemStats.net_change}
                  </div>
                  <div className="text-sm text-blue-700">صافي التغيير</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{itemStats.transaction_count}</div>
                  <div className="text-sm text-purple-700">عدد المعاملات</div>
                </div>
              </div>
            )}

            {/* Item Transactions History */}
            {itemTransactions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-teal-600 mb-3">تاريخ المعاملات</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-teal-200 rounded-lg">
                    <thead className="bg-teal-50">
                      <tr>
                        <th className="border border-teal-200 px-4 py-2 text-center">نوع المعاملة</th>
                        <th className="border border-teal-200 px-4 py-2 text-center">الكمية</th>
                        <th className="border border-teal-200 px-4 py-2 text-center">المستخدم</th>
                        <th className="border border-teal-200 px-4 py-2 text-center">الوقت</th>
                        <th className="border border-teal-200 px-4 py-2 text-center">الوردية</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemTransactions.map((transaction) => (
                        <tr key={transaction.transaction_id} className="hover:bg-teal-25">
                          <td className="border border-teal-200 px-4 py-2 text-center">
                            <Badge variant={transaction.type === 'in' ? 'default' : 'destructive'}>
                              {transaction.type === 'in' ? 'إضافة' : 'استخدام'}
                            </Badge>
                          </td>
                          <td className="border border-teal-200 px-4 py-2 text-center font-medium">
                            <span className={transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.type === 'in' ? '+' : '-'}{transaction.quantity}
                            </span>
                          </td>
                          <td className="border border-teal-200 px-4 py-2 text-center">{transaction.user_name}</td>
                          <td className="border border-teal-200 px-4 py-2 text-center">
                            {new Date(transaction.timestamp).toLocaleString('ar-EG')}
                          </td>
                          <td className="border border-teal-200 px-4 py-2 text-center text-xs text-gray-500">
                            {transaction.shift_id.substring(0, 8)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!dailyReport && !shiftReport && allTransactions.length === 0 && !itemStats && itemTransactions.length === 0 && !loading && (
        <Card className="bg-gray-50">
          <CardContent className="text-center py-12">
            <Printer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد تقارير</h3>
            <p className="text-gray-500">اختر نوع التقرير والتاريخ ثم اضغط على "إنشاء التقرير"</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

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

// ENUMS for Stock
export enum StockItemType {
    INGREDIENT = 'مكونات',
    EQUIPMENT = 'ادوات',
    VEGETABLE = 'خضراوات',
    FRUIT = 'فاكهة',
    MEAT = 'لحم',
    CHICKEN = 'فراخ',
    FISH = 'سمك',
    DRINK = 'مشروبات',
    OTHER = 'اخري'
}

export enum StockItemStatus {
    AVAILABLE = 'available',
    LOWSTOCK = 'lowstock',
    OUTOFSTOCK = 'outofstock'
}

export enum StockTransactionType {
    IN = 'in',
    OUT = 'out',
}

const stockTypeOptions = [
  { value: 'INGREDIENT', label: StockItemType.INGREDIENT },
  { value: 'EQUIPMENT', label: StockItemType.EQUIPMENT },
  { value: 'VEGETABLE', label: StockItemType.VEGETABLE },
  { value: 'FRUIT', label: StockItemType.FRUIT },
  { value: 'MEAT', label: StockItemType.MEAT },
  { value: 'CHICKEN', label: StockItemType.CHICKEN },
  { value: 'FISH', label: StockItemType.FISH },
  { value: 'DRINK', label: StockItemType.DRINK },
  { value: 'OTHER', label: StockItemType.OTHER },
]

const stockStatusLabels: Record<string, string> = {
  [StockItemStatus.AVAILABLE]: 'متوفر',
  [StockItemStatus.LOWSTOCK]: 'منخفض',
  [StockItemStatus.OUTOFSTOCK]: 'نفذ المخزون',
}

export default function EnhancedStockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("inventory")
  const [selectedType, setSelectedType] = useState("all")
  const [loading, setLoading] = useState(true)
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null)

  // Get current active shift ID for transactions - use ONLY localStorage to avoid API errors
  const getCurrentActiveShift = (): string => {
    try {
      // ONLY use stored user's shift data - no API calls since they cause 500 errors with your backend
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      
      if (storedUser?.shift?.shift_id) {
        console.log("📊 Using owner's current shift ID:", storedUser.shift.shift_id)
        setActiveShiftId(storedUser.shift.shift_id)
        return storedUser.shift.shift_id
      }
      
      // If no shift in stored user, use user ID as shift reference
      if (storedUser?.user_id || storedUser?.id) {
        const userId = storedUser.user_id || storedUser.id
        console.log("📊 Using user ID as shift reference:", userId)
        setActiveShiftId(userId)
        return userId
      }
    } catch (error) {
      console.warn("⚠️ Could not get user shift data:", error)
    }
    
    // Final fallback - create a temporary shift ID
    const fallbackShiftId = `owner_shift_${Date.now()}`
    setActiveShiftId(fallbackShiftId)
    console.log("📊 Using temporary shift ID:", fallbackShiftId)
    return fallbackShiftId
  }
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
    type: "INGREDIENT",
    quantity: 0,
    unit: "kg",
    minQuantity: 0,
  })
  const [updateQuantity, setUpdateQuantity] = useState(0)
  const [updateType, setUpdateType] = useState<"add" | "reduce">("add")

  // Add state for filtering
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const { toast } = useToast()

  // Enhanced stock status calculation with enum logic
  const getStockStatus = (item: StockItem) => {
    const currentQty = Number(item.current_quantity) || 0
    const minQty = Number(item.minimum_value) || 0
    if (currentQty <= 0) return StockItemStatus.OUTOFSTOCK
    if (currentQty <= minQty) return StockItemStatus.LOWSTOCK
    return StockItemStatus.AVAILABLE
  }

  // Enhanced stock status badge with enum
  const getStatusBadge = (item: StockItem) => {
    const status = getStockStatus(item)
    switch (status) {
      case StockItemStatus.OUTOFSTOCK:
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300 font-medium">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {stockStatusLabels[StockItemStatus.OUTOFSTOCK]}
          </Badge>
        )
      case StockItemStatus.LOWSTOCK:
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-medium">
            <TrendingDown className="w-3 h-3 mr-1" />
            {stockStatusLabels[StockItemStatus.LOWSTOCK]}
          </Badge>
        )
      default:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            {stockStatusLabels[StockItemStatus.AVAILABLE]}
          </Badge>
        )
    }
  }

  // Calculate comprehensive stock statistics
  const calculateStockStats = (items: StockItem[]) => {
    if (!Array.isArray(items)) {
      setStockStats({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        criticalAlerts: 0,
      })
      console.error("calculateStockStats: items is not an array", items)
      return
    }
    const stats = items.reduce(
      (acc, item) => {
        const status = getStockStatus(item)
        const itemValue = (item.price || 0) * item.current_quantity

        acc.totalItems += 1
        acc.totalValue += itemValue

        if (status === StockItemStatus.OUTOFSTOCK) acc.outOfStockItems += 1
        if (status === StockItemStatus.LOWSTOCK || status === StockItemStatus.OUTOFSTOCK) acc.lowStockItems += 1
        if (status === StockItemStatus.OUTOFSTOCK || status === StockItemStatus.LOWSTOCK) acc.criticalAlerts += 1

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
    // Initialize active shift for transactions
    getCurrentActiveShift()
  }, [])

  useEffect(() => {
    calculateStockStats(stockItems)
  }, [stockItems])

  const fetchStockItems = async () => {
    try {
      setLoading(true)
      const result = await AuthApiService.apiRequest<any>('/stock-items')
      
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
      const result = await AuthApiService.apiRequest<any>('/stock-items/low-stock')
      
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
      const result = await AuthApiService.apiRequest<any>(`/stock-items/type/${type}`)
      
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

  // Filtered items memoized
  const filteredStockItems = useMemo(() => {
    if (typeFilter === "all") return stockItems
    return stockItems.filter(item => {
      const enumValue = Object.entries(StockItemType).find(([key, value]) => key === typeFilter)?.[1]
      return item.type === enumValue || item.type === typeFilter
    })
  }, [stockItems, typeFilter])

  const handleAddItem = async () => {
    try {
      const enumValue = Object.entries(StockItemType).find(([key, value]) => key === newItem.type)?.[1]
      const requestBody = {
        name: newItem.name,
        type: enumValue || newItem.type, // use enum value
        unit: newItem.unit,
        current_quantity: newItem.quantity,
        minimum_value: newItem.minQuantity,
        status: StockItemStatus.AVAILABLE, // always use correct value
      }

      const result = await AuthApiService.apiRequest<any>('/stock-items', {
        method: "POST",
        body: JSON.stringify(requestBody),
      })

      if (!result.success) {
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessages = result.errors
            .map((err: any) => `${err.path || err.param}: ${err.msg || err.message}`)
            .join(", ")
          throw new Error(`Validation failed: ${errorMessages}`)
        }
        const errorMessage = result.message || result.error || "Unknown error"
        throw new Error(`Failed to create stock item: ${errorMessage}`)
      }

      const createdItem = result.data

      // Create initial transaction for the newly added item
      if (newItem.quantity > 0) {
        try {
          // Get current active shift ID
          const currentShiftId = getCurrentActiveShift()

          const transactionData = {
            stock_item_id: createdItem.stock_item_id,
            type: "in",
            quantity: newItem.quantity,
            user_id: currentUser.id || currentUser.user_id,
            shift_id: currentShiftId,
            notes: `Initial stock for new item: ${createdItem.name}`,
          }

          await AuthApiService.apiRequest<any>('/stock-transactions', {
            method: "POST",
            body: JSON.stringify(transactionData),
          })

          console.log("Initial transaction recorded successfully")
        } catch (transactionError) {
          console.warn("Error creating initial transaction:", transactionError)
          // Don't fail the main operation if transaction creation fails
        }
      }

      setStockItems([...stockItems, createdItem])
      setShowAddDialog(false)
      setNewItem({
        name: "",
        type: "INGREDIENT",
        quantity: 0,
        unit: "kg",
        minQuantity: 0,
      })

      toast({
        title: "نجح",
        description: "تم إضافة العنصر وتسجيل المعاملة بنجاح",
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

      // First, update the stock item
      const updatedItem = await AuthApiService.apiRequest<any>(`/stock-items/${selectedItem.stock_item_id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: selectedItem.name,
          type: selectedItem.type,
          unit: selectedItem.unit,
          current_quantity: newQuantity,
          minimum_value: selectedItem.minimum_value,
          status: selectedItem.status || "available",
        }),
      })

      // Create a transaction record
      try {
        // Get current active shift ID
        const currentShiftId = getCurrentActiveShift()

        const transactionData = {
          stock_item_id: selectedItem.stock_item_id,
          type: updateType === "add" ? "in" : "out",
          quantity: updateQuantity,
          user_id: currentUser.id || currentUser.user_id,
          shift_id: currentShiftId,
          notes: `Stock ${updateType === "add" ? "addition" : "reduction"} for ${selectedItem.name}`,
        }

        await AuthApiService.apiRequest<any>('/stock-transactions', {
          method: "POST",
          body: JSON.stringify(transactionData),
        })

        console.log("Transaction recorded successfully")
      } catch (transactionError) {
        console.warn("Error creating transaction:", transactionError)
        // Don't fail the main operation if transaction creation fails
      }

      setStockItems(stockItems.map((item) => (item.stock_item_id === selectedItem.stock_item_id ? updatedItem : item)))

      setShowUpdateDialog(false)
      setSelectedItem(null)
      setUpdateQuantity(0)

      toast({
        title: "نجح",
        description: "تم تحديث الكمية وتسجيل المعاملة بنجاح",
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
      const updatedItem = await AuthApiService.apiRequest<any>(`/stock-items/${selectedItem.stock_item_id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: selectedItem.name,
          type: selectedItem.type,
          unit: selectedItem.unit,
          current_quantity: selectedItem.current_quantity,
          minimum_value: selectedItem.minimum_value,
          status: selectedItem.status || "available",
        }),
      })
      
      setStockItems(stockItems.map((item) => (item.stock_item_id === selectedItem.stock_item_id ? updatedItem.data : item)))

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
      await AuthApiService.apiRequest<any>(`/stock-items/${itemId}`, {
        method: "DELETE",
      })

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
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 via-white to-yellow-100 bg-fixed">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              إدارة المخزن
            </h1>
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
        </div>

        {/* Main Content with Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mt-8">
          <CardHeader className="border-b bg-white/50">
            <div className="flex items-center gap-3 mb-2">
              <UtensilsCrossed className="w-7 h-7 text-orange-600" />
              <CardTitle className="text-3xl font-extrabold text-orange-700 tracking-tight">إدارة المخزن</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-orange-50 border-b border-orange-200">
                <TabsTrigger value="inventory" className="data-[state=active]:bg-white data-[state=active]:text-orange-700">
                  المخزون
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:text-orange-700">
                  التقارير
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="mt-0">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-between items-center mb-4">
                    {/* Filter by type */}
                    <div className="relative w-full sm:w-auto">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-48 pl-10 bg-white border-orange-200 focus:ring-orange-400">
                          <SelectValue placeholder="فلترة حسب النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الأنواع</SelectItem>
                          {stockTypeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Search */}
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="search"
                        placeholder="بحث في المخزون..."
                        className="w-64 pl-10 bg-white border-orange-200 focus:ring-orange-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-orange-100 bg-orange-50/30">
                    <table className="w-full border-separate border-spacing-y-1 text-sm">
                      <thead>
                        <tr className="bg-orange-100">
                          <th className="px-4 py-2 text-right font-bold text-orange-900">العنصر</th>
                          <th className="px-4 py-2 text-center font-bold text-orange-900">النوع</th>
                          <th className="px-4 py-2 text-center font-bold text-orange-900">الكمية</th>
                          <th className="px-4 py-2 text-center font-bold text-orange-900">الحد الأدنى</th>
                          <th className="px-4 py-2 text-center font-bold text-orange-900">الوحدة</th>
                          <th className="px-4 py-2 text-center font-bold text-orange-900">الحالة</th>
                          <th className="px-4 py-2 text-center font-bold text-orange-900">آخر تحديث</th>
                          <th className="px-4 py-2 text-center font-bold text-orange-900">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStockItems.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center text-gray-400 py-8">لا توجد عناصر مطابقة</td>
                          </tr>
                        ) : (
                          filteredStockItems.map((item, idx) => (
                            <tr key={item.stock_item_id} className={idx % 2 === 0 ? "bg-white" : "bg-orange-50/60"}>
                              <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                              <td className="px-4 py-2 text-center">{item.type}</td>
                              <td className="px-4 py-2 text-center">{item.current_quantity}</td>
                              <td className="px-4 py-2 text-center">{item.minimum_value}</td>
                              <td className="px-4 py-2 text-center">{item.unit}</td>
                              <td className="px-4 py-2 text-center">
                                {getStatusBadge(item)}
                              </td>
                              <td className="px-4 py-2 text-center text-xs text-gray-500">
                                {item.last_updated_at ? new Date(item.last_updated_at).toLocaleDateString("ar-EG") : "—"}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex justify-center gap-2">
                                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)} aria-label="تعديل" className="text-blue-600 hover:bg-blue-50">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => openUpdateDialog(item)} aria-label="تحديث الكمية" className="text-green-600 hover:bg-green-50">
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.stock_item_id)} aria-label="حذف" className="text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="mt-0">
                <StockReportsTab />
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
                <Select value={newItem.type} onValueChange={val => setNewItem({ ...newItem, type: val })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر نوع العنصر" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
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
                    {stockTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
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
