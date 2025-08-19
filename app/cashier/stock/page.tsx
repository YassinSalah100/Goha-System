"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import "./print.css"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthApiService } from "@/lib/services/auth-api"
import {
  Search,
  AlertTriangle,
  RefreshCw,
  Edit,
  Package,
  TrendingDown,
  TrendingUp,
  Filter,
  UtensilsCrossed,
  Printer,
  Eye,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

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

// Stock Reports Component
function StockReportsTab() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedShiftId, setSelectedShiftId] = useState<string>("")
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>("")
  const [shiftReport, setShiftReport] = useState<ShiftStockReport | null>(null)
  const [allTransactions, setAllTransactions] = useState<StockTransactionDetail[]>([])
  const [itemTransactions, setItemTransactions] = useState<StockTransactionDetail[]>([])
  const [itemStats, setItemStats] = useState<StockTransactionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [reportType, setReportType] = useState<"comprehensive" | "shift" | "transactions" | "item-stats">("comprehensive")
  // New comprehensive report data
  const [comprehensiveReport, setComprehensiveReport] = useState<{
    shiftReport: ShiftStockReport | null
    allTransactions: StockTransactionDetail[]
    currentStock: StockItem[]
    lowStockItems: StockItem[]
    criticalAlerts: StockItem[]
    dailySummary: any
  } | null>(null)
  const { toast } = useToast()

  // Comprehensive report generation
  const fetchComprehensiveReport = async () => {
    try {
      setLoading(true)
      
      // Get current user's shift automatically
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      let shiftId = selectedShiftId
      
      // If no shift ID selected, try to get from user data
      if (!shiftId && storedUser?.shift?.shift_id) {
        shiftId = storedUser.shift.shift_id
        setSelectedShiftId(shiftId)
      }
      
      // If still no shift ID, use user ID as fallback
      if (!shiftId && (storedUser?.user_id || storedUser?.id)) {
        shiftId = storedUser.user_id || storedUser.id
        setSelectedShiftId(shiftId)
      }
      
      if (!shiftId) {
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على معرف الوردية",
          variant: "destructive",
        })
        return
      }

      // Fetch all data in parallel
      const [shiftResponse, transactionsResponse, stockResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/stock-reports/shift/${shiftId}?date=${reportDate}`),
        fetch(`${API_BASE_URL}/stock-transactions?limit=100`),
        fetch(`${API_BASE_URL}/stock-items`)
      ])
      
      if (!shiftResponse.ok || !transactionsResponse.ok || !stockResponse.ok) {
        throw new Error('Failed to fetch comprehensive report data')
      }
      
      const [shiftResult, transactionsResult, stockResult] = await Promise.all([
        shiftResponse.json(),
        transactionsResponse.json(),
        stockResponse.json()
      ])

      const stockItems = stockResult.data?.stockItems || []
      const lowStockItems = stockItems.filter((item: StockItem) => {
        const currentQty = Number(item.current_quantity) || 0
        const minQty = Number(item.minimum_value) || 0
        return currentQty <= minQty && currentQty > 0
      })
      const criticalAlerts = stockItems.filter((item: StockItem) => {
        const currentQty = Number(item.current_quantity) || 0
        return currentQty <= 0
      })

      // Set comprehensive report data
      setComprehensiveReport({
        shiftReport: shiftResult.data,
        allTransactions: transactionsResult.data.transactions || [],
        currentStock: stockItems,
        lowStockItems,
        criticalAlerts,
        dailySummary: {
          totalItems: stockItems.length,
          totalValue: stockItems.reduce((sum: number, item: StockItem) => sum + ((item.price || 0) * item.current_quantity), 0),
          lowStockCount: lowStockItems.length,
          criticalCount: criticalAlerts.length,
          transactionCount: (transactionsResult.data.transactions || []).length
        }
      })
      
      toast({
        title: "نجح",
        description: "تم تحميل التقرير الشامل بنجاح",
      })
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: `فشل في تحميل التقرير الشامل: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchShiftReport = async () => {
    try {
      setLoading(true)
      
      // Get current user's shift automatically
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      let shiftId = selectedShiftId
      
      // If no shift ID selected, try to get from user data
      if (!shiftId && storedUser?.shift?.shift_id) {
        shiftId = storedUser.shift.shift_id
        setSelectedShiftId(shiftId)
      }
      
      // If still no shift ID, use user ID as fallback
      if (!shiftId && (storedUser?.user_id || storedUser?.id)) {
        shiftId = storedUser.user_id || storedUser.id
        setSelectedShiftId(shiftId)
      }
      
      if (!shiftId) {
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على معرف الوردية",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${API_BASE_URL}/stock-reports/shift/${shiftId}?date=${reportDate}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch shift report')
      }
      
      const result = await response.json()
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
      const response = await fetch(`${API_BASE_URL}/stock-transactions?limit=50`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      
      const result = await response.json()
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
      const transactionsResponse = await fetch(`${API_BASE_URL}/stock-transactions/stock-item/${selectedStockItemId}`)
      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch item transactions')
      }
      const transactionsResult = await transactionsResponse.json()
      setItemTransactions(transactionsResult.data || [])

      // Fetch stats for the item
      const statsResponse = await fetch(`${API_BASE_URL}/stock-transactions/stats/${selectedStockItemId}`)
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json()
        setItemStats(statsResult.data || null)
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
    if (reportType === "comprehensive") {
      fetchComprehensiveReport()
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
      {/* Report Controls - Cashier Style */}
      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-teal-700 flex items-center gap-2">
            <Printer className="w-5 h-5" />
            تقارير المخزون - الكاشير
          </CardTitle>
          <p className="text-sm text-teal-600">تقارير سريعة ومفصلة لورديتك الحالية</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="reportType">نوع التقرير</Label>
              <Select value={reportType} onValueChange={(value: "comprehensive" | "shift" | "transactions" | "item-stats") => setReportType(value)}>
                <SelectTrigger className="border-teal-200 focus:ring-teal-400">
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">التقرير الشامل</SelectItem>
                  <SelectItem value="shift">تقرير ورديتي</SelectItem>
                  <SelectItem value="transactions">معاملات المخزون</SelectItem>
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
                className="bg-white border-teal-200 focus:ring-teal-400"
              />
            </div>

            {reportType === "item-stats" && (
              <div>
                <Label htmlFor="stockItemId">عنصر المخزون</Label>
                <Input
                  id="stockItemId"
                  placeholder="معرف عنصر المخزون"
                  value={selectedStockItemId}
                  onChange={(e) => setSelectedStockItemId(e.target.value)}
                  className="bg-white border-teal-200 focus:ring-teal-400"
                />
              </div>
            )}
            
            <Button 
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg"
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

      {/* Comprehensive Report Display */}
      {comprehensiveReport && reportType === "comprehensive" && (
        <div className="space-y-6 print-container" id="stockReport">
          {/* Simple Header */}
          <Card className="bg-white border-teal-200 shadow-md print:shadow-none print:border-0">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200 flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold text-teal-700 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  التقرير الشامل للمخزون - كاشير
                </CardTitle>
                <p className="text-sm text-teal-600 mt-1">
                  <span className="print-date">التاريخ: {new Date(reportDate).toLocaleDateString('ar-EG')}</span> | 
                  <span className="print-shift">الوردية: {comprehensiveReport.shiftReport?.shift_name || 'ورديتي الحالية'}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    // Set print title and trigger print dialog
                    document.title = `تقرير المخزون - ${new Date(reportDate).toLocaleDateString('ar-EG')}`;
                    
                    // Add top logo image URL if available
                    const style = document.createElement('style');
                    style.textContent = `
                      @media print {
                        .print-container:before {
                          content: "";
                          background-image: url('/images/eathrel.png');
                          background-repeat: no-repeat;
                          background-position: center top;
                          background-size: 100px;
                          display: block;
                          height: 100px;
                          margin-bottom: 10px;
                        }
                      }
                    `;
                    document.head.appendChild(style);
                    
                    window.print();
                    
                    // Clean up
                    setTimeout(() => document.head.removeChild(style), 1000);
                  }}
                  className="print:hidden bg-teal-600 hover:bg-teal-700"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  طباعة التقرير
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      setPdfLoading(true);
                      toast({
                        title: "جاري التحميل",
                        description: "جاري إنشاء ملف PDF، يرجى الانتظار...",
                      });
                      
                      // Dynamically import jsPDF and html2canvas
                      const jsPDFModule = await import('jspdf');
                      const html2canvasModule = await import('html2canvas');
                      const jsPDF = jsPDFModule.default;
                      const html2canvas = html2canvasModule.default;
                      
                      // Get the report element
                      const reportElement = document.getElementById('stockReport');
                      if (!reportElement) {
                        throw new Error('لم يتم العثور على عنصر التقرير');
                      }

                      // Before generating PDF, apply preparation styles to optimize appearance
                      const styleElement = document.createElement('style');
                      styleElement.id = 'pdf-export-styles';
                      styleElement.innerHTML = `
                        @page { size: A4 landscape; margin: 10mm; }
                        .pdf-export-container { 
                          width: 100%; 
                          background-color: white !important;
                          direction: rtl !important;
                          font-family: 'Arial', 'Tajawal', sans-serif !important;
                          color: black !important;
                          position: relative !important;
                          padding-bottom: 40px !important;
                        }
                        .pdf-export-container .card {
                          box-shadow: none !important;
                          border: none !important;
                          margin: 0 !important;
                        }
                        .pdf-export-container table {
                          width: 100% !important;
                          border-collapse: collapse !important;
                          margin: 0 auto !important;
                          font-size: 16pt !important;
                          border: 2px solid #0f766e !important;
                        }
                        .pdf-export-container th, .pdf-export-container td {
                          border: 1.5px solid #0f766e !important;
                          padding: 12px !important;
                          text-align: center !important;
                          font-size: 16pt !important;
                        }
                        .pdf-export-container th {
                          background-color: #e6f7f5 !important;
                          font-weight: bold !important;
                          color: #0f766e !important;
                        }
                        .pdf-export-container tr:nth-child(even) {
                          background-color: #f8fafa !important;
                        }
                        .pdf-export-container .report-summary-row th {
                          background-color: #f0f9f9 !important;
                        }
                        .pdf-export-container .report-title {
                          text-align: center !important;
                          font-size: 24pt !important;
                          font-weight: bold !important;
                          margin-bottom: 15px !important;
                          color: #0f766e !important;
                        }
                        .pdf-export-container .report-header {
                          display: flex !important;
                          justify-content: space-between !important;
                          align-items: center !important;
                          margin-bottom: 30px !important;
                        }
                        .pdf-export-container .summary-grid {
                          display: grid !important;
                          grid-template-columns: repeat(4, 1fr) !important;
                          gap: 10px !important;
                        }
                      `;
                      document.head.appendChild(styleElement);
                      
                      // Create a container specifically for the PDF export
                      const exportContainer = document.createElement('div');
                      exportContainer.className = 'pdf-export-container';
                      
                      // Add restaurant logo and report title at the top with more organized shift details
                      const shiftName = comprehensiveReport.shiftReport?.shift_name || 'الوردية الحالية';
                      const shiftTime = new Date().toLocaleTimeString('ar-EG');
                      // Get the cashier name using a more reliable method
                      let cashierName = 'yassin'; // Default to current user
                      // Try to get name from multiple possible sources
                      try {
                        // First try to get from the current document if there's a user display name
                        if (document) {
                          // Look for elements that might contain the user name (common in nav/header components)
                          const userNameElements = document.querySelectorAll('.user-name, .profile-name, .username, [data-user-name]');
                          if (userNameElements.length > 0 && userNameElements[0].textContent) {
                            const possibleName = userNameElements[0].textContent.trim();
                            if (possibleName && possibleName.length > 0 && possibleName !== 'undefined') {
                              cashierName = possibleName;
                            }
                          }
                        }
                        
                        // If nothing found yet, try localStorage options
                        if (typeof window !== 'undefined') {
                          const storedName = localStorage.getItem('userName') || 
                                           localStorage.getItem('user_name') || 
                                           localStorage.getItem('cashierName') ||
                                           sessionStorage.getItem('userName') ||
                                           localStorage.getItem('currentUser');
                          
                          if (storedName && storedName !== 'undefined' && storedName.trim()) {
                            cashierName = storedName.trim();
                          }
                          
                          // If we have access to the user object in any form
                          const userObject = localStorage.getItem('user') || localStorage.getItem('currentUser');
                          if (userObject) {
                            try {
                              const user = JSON.parse(userObject);
                              if (user && (user.name || user.username || user.displayName)) {
                                cashierName = user.name || user.username || user.displayName;
                              }
                            } catch (parseErr) {
                              console.log('Could not parse user object');
                            }
                          }
                        }
                      } catch (e) {
                        console.log('Could not get cashier name from storage:', e);
                        // Keep default yassin
                        cashierName = 'yassin';
                      }
                      
                      exportContainer.innerHTML = `
                        <div style="padding: 20px; margin-bottom: 30px; background: linear-gradient(to bottom, #f0fdfa, #ffffff); border-bottom: 3px solid #0f766e;">
                          <!-- Header Top Section with Title and Date -->
                          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center;">
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 5px; background-color: rgba(15, 118, 110, 0.05); padding: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                              <div style="font-size: 20pt; font-weight: bold; color: #0f766e;">${new Date(reportDate).toLocaleDateString('ar-EG')}</div>
                              <div style="font-size: 16pt; color: #0f766e;">${shiftName}</div>
                              <div style="font-size: 18pt; font-weight: bold; color: #0f766e; margin-top: 8px; border-top: 1px solid #0f766e; padding-top: 8px;">الكاشير: ${cashierName}</div>
                            </div>
                            <div style="text-align: center; flex-grow: 1;">
                              <div style="font-size: 32pt; font-weight: bold; color: #0f766e; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">تقرير المخزون الشامل</div>
                            </div>
                            <div style="text-align: left; background-color: rgba(15, 118, 110, 0.05); padding: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                              <div style="font-size: 16pt; color: #0f766e;">وقت الإصدار: ${shiftTime}</div>
                              <div style="font-size: 16pt; color: #0f766e;">عدد العناصر: ${comprehensiveReport.currentStock.length}</div>
                            </div>
                          </div>
                          
                          <!-- Center Logo -->
                          <div style="display: flex; justify-content: center; align-items: center; margin: 20px 0;">
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; background-color: rgba(255, 255, 255, 0.7); padding: 15px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                              <img src="/images/logo.png" alt="Restaurant Logo" style="height: 120px; width: auto;" />
                              <div style="font-weight: bold; font-size: 22pt; color: #0f766e; text-align: center;">مطعم جحا</div>
                            </div>
                          </div>
                          
                          <!-- Report Summary Box -->
                          <div style="margin-top: 20px; background-color: rgba(15, 118, 110, 0.08); border: 1px solid #0f766e; border-radius: 10px; padding: 15px; display: flex; justify-content: space-between;">
                            <div style="flex: 1; text-align: center; border-right: 1px solid #0f766e; padding: 0 15px;">
                              <div style="font-weight: bold; font-size: 16pt; color: #0f766e;">التاريخ</div>
                              <div style="font-size: 18pt;">${new Date(reportDate).toLocaleDateString('ar-EG')}</div>
                            </div>
                            <div style="flex: 1; text-align: center; border-right: 1px solid #0f766e; padding: 0 15px;">
                              <div style="font-weight: bold; font-size: 16pt; color: #0f766e;">الوردية</div>
                              <div style="font-size: 18pt;">${shiftName}</div>
                            </div>
                            <div style="flex: 1; text-align: center; border-right: 1px solid #0f766e; padding: 0 15px; background-color: rgba(15, 118, 110, 0.05);">
                              <div style="font-weight: bold; font-size: 16pt; color: #0f766e;">الكاشير</div>
                              <div style="font-size: 18pt; font-weight: bold;">${cashierName}</div>
                            </div>
                            <div style="flex: 1; text-align: center; border-right: 1px solid #0f766e; padding: 0 15px;">
                              <div style="font-weight: bold; font-size: 16pt; color: #0f766e;">وقت الإصدار</div>
                              <div style="font-size: 18pt;">${shiftTime}</div>
                            </div>
                            <div style="flex: 1; text-align: center; padding: 0 15px;">
                              <div style="font-weight: bold; font-size: 16pt; color: #0f766e;">عدد العناصر</div>
                              <div style="font-size: 18pt;">${comprehensiveReport.currentStock.length}</div>
                            </div>
                          </div>
                        </div>
                      `;
                      
                      // Create a completely new reorganized table for PDF (do not use original table)
                      const tableOriginal = reportElement.querySelector('table');
                      
                      // Create a new table with better structure for PDF - COMPLETELY REPLACE THE ORIGINAL
                      const newTable = document.createElement('table');
                      newTable.style.width = '100%';
                      newTable.style.borderCollapse = 'collapse';
                      newTable.style.margin = '20px auto';
                      newTable.style.fontSize = '16pt';
                      newTable.style.border = '2px solid #0f766e';
                      
                      // Create table header
                      const thead = document.createElement('thead');
                      thead.innerHTML = `
                        <tr style="background-color: #0f766e; color: white;">
                          <th style="padding: 15px; border: 1px solid #0f766e; text-align: center; font-size: 18pt;" colspan="5">
                            تقرير المخزون والمعاملات
                          </th>
                        </tr>
                        <tr style="background-color: #e6f7f5; color: #0f766e;">
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold;">العنصر</th>
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold;">النوع</th>
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold;">الكمية الحالية</th>
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold;">الوحدة</th>
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold;">حالة المخزون</th>
                        </tr>
                      `;
                      newTable.appendChild(thead);
                      
                      // Create table body with reorganized content
                      const tbody = document.createElement('tbody');
                      
                      // Group all stock items by category/type
                      const stockByCategory: {[key: string]: {critical: any[], low: any[], normal: any[]}} = {};
                      comprehensiveReport.currentStock.forEach(item => {
                        const category = item.type || 'غير محدد';
                        if (!stockByCategory[category]) {
                          stockByCategory[category] = {
                            critical: [],
                            low: [],
                            normal: []
                          };
                        }
                        
                        // Categorize by stock status
                        if (comprehensiveReport.criticalAlerts.some(critical => critical.stock_item_id === item.stock_item_id)) {
                          stockByCategory[category].critical.push(item);
                        } else if (comprehensiveReport.lowStockItems.some(lowStock => lowStock.stock_item_id === item.stock_item_id)) {
                          stockByCategory[category].low.push(item);
                        } else {
                          stockByCategory[category].normal.push(item);
                        }
                      });
                      
                      // Display each category with its items
                      Object.keys(stockByCategory).forEach(category => {
                        const categoryData = stockByCategory[category];
                        const totalItems = categoryData.critical.length + categoryData.low.length + categoryData.normal.length;
                        
                        // Category header
                        const categoryHeader = document.createElement('tr');
                        categoryHeader.innerHTML = `
                          <td colspan="5" style="background-color: #f0f9ff; color: #0369a1; font-weight: bold; text-align: center; padding: 15px; border: 1px solid #0f766e; font-size: 16pt;">
                            فئة: ${category} (${totalItems} عنصر)
                          </td>
                        `;
                        tbody.appendChild(categoryHeader);
                        
                        // Critical items in this category
                        categoryData.critical.forEach((item: any, index: number) => {
                          const row = document.createElement('tr');
                          row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                          row.innerHTML = `
                            <td style="padding: 12px; font-weight: bold; border: 1px solid #0f766e;">${item.name}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">${item.type}</td>
                            <td style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #0f766e; font-size: 16pt;">${item.current_quantity}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">${item.unit}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">نفذ المخزون - يحتاج تموين فوري</td>
                          `;
                          tbody.appendChild(row);
                        });
                        
                        // Low stock items in this category
                        categoryData.low.forEach((item: any, index: number) => {
                          const row = document.createElement('tr');
                          row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                          row.innerHTML = `
                            <td style="padding: 12px; font-weight: bold; border: 1px solid #0f766e;">${item.name}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">${item.type}</td>
                            <td style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #0f766e; font-size: 16pt;">${item.current_quantity}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">${item.unit}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">مخزون منخفض - يحتاج تموين</td>
                          `;
                          tbody.appendChild(row);
                        });
                        
                        // Normal stock items in this category
                        categoryData.normal.forEach((item: any, index: number) => {
                          const row = document.createElement('tr');
                          row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                          row.innerHTML = `
                            <td style="padding: 12px; font-weight: bold; border: 1px solid #0f766e;">${item.name}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">${item.type}</td>
                            <td style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #0f766e; font-size: 16pt;">${item.current_quantity}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">${item.unit}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">متوفر</td>
                          `;
                          tbody.appendChild(row);
                        });
                      });
                      
                      // Add transactions section
                      if (comprehensiveReport.allTransactions && comprehensiveReport.allTransactions.length > 0) {
                        // Transactions header
                        const transactionsHeader = document.createElement('tr');
                        transactionsHeader.innerHTML = `
                          <td colspan="5" style="background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; padding: 15px; border: 1px solid #0f766e; font-size: 16pt;">
                            آخر المعاملات على المخزون (${comprehensiveReport.allTransactions.slice(0, 10).length} معاملة)
                          </td>
                        `;
                        tbody.appendChild(transactionsHeader);
                        
                        // Transaction table header
                        const transactionHeaderRow = document.createElement('tr');
                        transactionHeaderRow.innerHTML = `
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold; background-color: #fef3c7;">العنصر</th>
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold; background-color: #fef3c7;">نوع المعاملة</th>
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold; background-color: #fef3c7;">الكمية</th>
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold; background-color: #fef3c7;">المستخدم</th>
                          <th style="padding: 12px; border: 1px solid #0f766e; text-align: center; font-weight: bold; background-color: #fef3c7;">الوقت</th>
                        `;
                        tbody.appendChild(transactionHeaderRow);
                        
                        // Add recent transactions
                        comprehensiveReport.allTransactions.slice(0, 10).forEach((transaction, index) => {
                          const row = document.createElement('tr');
                          row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                          row.innerHTML = `
                            <td style="padding: 12px; font-weight: bold; border: 1px solid #0f766e;">${transaction.stock_item_name}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">${transaction.type === 'in' ? 'إضافة' : 'استخدام'}</td>
                            <td style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #0f766e;">
                              <span style="color: ${transaction.type === 'in' ? '#10b981' : '#dc2626'};">
                                ${transaction.type === 'in' ? '+' : '-'}${transaction.quantity}
                              </span>
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e; font-weight: bold;">${transaction.user_name || cashierName}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #0f766e;">${new Date(transaction.timestamp).toLocaleString('ar-EG')}</td>
                          `;
                          tbody.appendChild(row);
                        });
                      }
                      
                      newTable.appendChild(tbody);
                      exportContainer.appendChild(newTable);
                      
                      // Add compact footer inline with table
                      const footerRow = document.createElement('tr');
                      footerRow.innerHTML = `
                        <td colspan="5" style="background-color: #f0fdfa; padding: 20px; text-align: center; border: 1px solid #0f766e; font-size: 18pt; background: linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%);">
                          <div style="display: flex; align-items: center; justify-content: center; gap: 15px; padding: 10px; border-radius: 10px; background-color: rgba(255, 255, 255, 0.8); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                            <img src="/images/eathrel.png" alt="Eathrel Logo" style="height: 40px; width: auto;" />
                            <span style="font-weight: bold; color: #0f766e; font-size: 22pt; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Powered by Eathrel</span>
                          </div>
                        </td>
                      `;
                      tbody.appendChild(footerRow);
                      
                      // Temporarily add to the document but hide it
                      exportContainer.style.position = 'fixed';
                      exportContainer.style.top = '-9999px';
                      exportContainer.style.left = '-9999px';
                      document.body.appendChild(exportContainer);
                      
                      // Apply additional styling to ensure the table is bigger and remove unnecessary spaces
                      const tables = exportContainer.querySelectorAll('table');
                      tables.forEach(table => {
                        table.style.width = '100%';
                        table.style.tableLayout = 'fixed';
                        
                        // Remove any empty rows or cells that might create big spaces
                        const emptyRows = table.querySelectorAll('tr:empty');
                        emptyRows.forEach(row => row.remove());
                        
                        // Remove "إجمالي القيمة" text from the summary section
                        const summaryRows = table.querySelectorAll('.report-summary-row');
                        summaryRows.forEach(row => {
                          const allDivs = row.querySelectorAll('div');
                          allDivs.forEach(div => {
                            if (div.textContent && div.textContent.includes('إجمالي القيمة')) {
                              div.remove();
                            }
                          });
                        });
                        
                        // Make column widths more proportional
                        const headerCells = table.querySelectorAll('th');
                        if (headerCells.length >= 5) {
                          // Item name column should be wider
                          headerCells[0].style.width = '35%'; 
                          // Other columns distributed evenly
                          const otherWidth = 65 / (headerCells.length - 1);
                          for (let i = 1; i < headerCells.length; i++) {
                            headerCells[i].style.width = `${otherWidth}%`;
                          }
                        }
                        
                        // Compact empty cells and rows
                        const allCells = table.querySelectorAll('td, th');
                        allCells.forEach(cell => {
                          const cellContent = cell.textContent;
                          if (cellContent && !cellContent.trim()) {
                            (cell as HTMLElement).style.padding = '0';
                            (cell as HTMLElement).style.height = '0';
                          }
                        });
                      });
                      
                      // Generate canvas with optimized settings for smaller file size
                      const canvas = await html2canvas(exportContainer, {
                        scale: 1.5, // Reduced scale for smaller file size
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        width: exportContainer.offsetWidth,
                        height: exportContainer.offsetHeight,
                        windowWidth: exportContainer.offsetWidth,
                        windowHeight: exportContainer.offsetHeight
                      });
                      
                      // Clean up temporary elements
                      document.body.removeChild(exportContainer);
                      const pdfStyleElement = document.getElementById('pdf-export-styles');
                      if (pdfStyleElement && pdfStyleElement.parentNode) {
                        pdfStyleElement.parentNode.removeChild(pdfStyleElement);
                      }
                      
                      // Create PDF (landscape for better table fitting)
                      const imgData = canvas.toDataURL('image/png', 1.0);
                      const pdf = new jsPDF({
                        orientation: 'landscape', 
                        unit: 'mm',
                        format: 'a4'
                      });
                      
                      // Get dimensions
                      const pageWidth = pdf.internal.pageSize.getWidth();
                      const pageHeight = pdf.internal.pageSize.getHeight();
                      
                      // Calculate image dimensions while maintaining aspect ratio
                      const imgWidth = pageWidth - 20; // 10mm margin on each side
                      const imgHeight = (canvas.height * imgWidth) / canvas.width;
                      
                      // Add image centered
                      pdf.addImage(
                        imgData, 
                        'PNG', 
                        10, // x position (10mm from left)
                        10, // y position (10mm from top)
                        imgWidth, 
                        imgHeight
                      );
                      
                      // For multi-page support if the table is very long
                      if (imgHeight > pageHeight - 20) { // if image taller than page
                        let heightLeft = imgHeight;
                        let position = 10;
                        
                        // Remove the first page that was automatically added
                        pdf.deletePage(1);
                        
                        // Add new pages as needed
                        for (let i = 0; heightLeft > 0; i++) {
                          position = -pageHeight * i + 10;
                          pdf.addPage();
                          pdf.addImage(
                            imgData, 
                            'PNG', 
                            10, 
                            position, 
                            imgWidth, 
                            imgHeight
                          );
                          heightLeft -= pageHeight - 20;
                        }
                      }
                      
                      // Save the PDF
                      pdf.save(`تقرير-المخزون-${new Date(reportDate).toLocaleDateString('ar-EG')}.pdf`);
                      
                      toast({
                        title: "تم بنجاح",
                        description: "تم تصدير التقرير كملف PDF بنجاح",
                      });
                    } catch (error) {
                      console.error('Error generating PDF:', error);
                      toast({
                        title: "خطأ",
                        description: "حدث خطأ أثناء إنشاء ملف PDF",
                        variant: "destructive",
                      });
                    } finally {
                      setPdfLoading(false);
                    }
                  }}
                  className="print:hidden bg-blue-600 hover:bg-blue-700"
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      جاري التصدير...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      تصدير كـ PDF
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {/* Single Comprehensive Table */}
            <CardContent className="p-6">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full border-collapse border-2 border-gray-300 print:w-full">
                  <thead className="bg-gray-50">
                    <tr className="report-title-row">
                      <th colSpan={7} className="border-2 border-gray-300 px-6 py-3 text-center bg-teal-100 text-teal-800 font-bold text-lg">
                        تقرير المخزون الشامل
                      </th>
                    </tr>
                    <tr className="report-summary-row">
                      <th colSpan={7} className="border-2 border-gray-300 px-6 py-4 text-center bg-amber-50 text-amber-800">
                        <div className="grid grid-cols-5 gap-4 text-center summary-grid">
                          <div className="flex flex-col summary-item">
                            <span className="font-bold">إجمالي العناصر</span>
                            <span>{comprehensiveReport.dailySummary.totalItems}</span>
                          </div>
                          <div className="flex flex-col summary-item">
                            <span className="font-bold">المعاملات</span>
                            <span>{comprehensiveReport.dailySummary.transactionCount}</span>
                          </div>
                          <div className="flex flex-col summary-item">
                            <span className="font-bold">مخزون منخفض</span>
                            <span>{comprehensiveReport.dailySummary.lowStockCount}</span>
                          </div>
                          <div className="flex flex-col summary-item">
                            <span className="font-bold">تنبيهات حرجة</span>
                            <span>{comprehensiveReport.dailySummary.criticalCount}</span>
                          </div>
                          <div className="flex flex-col summary-item">
                            <span className="font-bold">إجمالي القيمة</span>
                            <span>{comprehensiveReport.dailySummary.totalValue.toFixed(0)} ج.م</span>
                          </div>
                        </div>
                      </th>
                    </tr>
                    <tr className="bg-gray-100">
                      <th className="border-2 border-gray-300 px-6 py-3 text-right font-bold">العنصر</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">النوع</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">الكمية الحالية</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">الوحدة</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">السعر</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">القيمة الإجمالية</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">حالة المخزون</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-200">
                    {/* Critical Alerts First */}
                    {comprehensiveReport.criticalAlerts.length > 0 && (
                      <>
                        <tr>
                          <td colSpan={7} className="border-2 border-gray-300 px-6 py-3 text-center bg-red-50 text-red-800 font-bold">
                            تحذير: عناصر نفذت من المخزون - تتطلب تموين فوري
                          </td>
                        </tr>
                        {comprehensiveReport.criticalAlerts.map((item) => (
                          <tr key={`critical-${item.stock_item_id}`} className="bg-red-50">
                            <td className="border-2 border-gray-300 px-6 py-3 font-medium">{item.name}</td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">{item.type}</td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center font-bold text-red-600">
                              {item.current_quantity}
                            </td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">{item.unit}</td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">{(item.price || 0).toFixed(2)}</td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">
                              {((item.price || 0) * item.current_quantity).toFixed(2)} ج.م
                            </td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">
                              <Badge variant="destructive">نفذ المخزون</Badge>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}

                    {/* Low Stock Items */}
                    {comprehensiveReport.lowStockItems.length > 0 && (
                      <>
                        <tr>
                          <td colSpan={7} className="border-2 border-gray-300 px-6 py-3 text-center bg-amber-50 text-amber-800 font-bold">
                            تنبيه: عناصر بمخزون منخفض - تحتاج إعادة تموين قريباً
                          </td>
                        </tr>
                        {comprehensiveReport.lowStockItems.map((item) => (
                          <tr key={`low-${item.stock_item_id}`} className="bg-amber-50">
                            <td className="border-2 border-gray-300 px-6 py-3 font-medium">{item.name}</td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">{item.type}</td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center font-bold text-amber-600">
                              {item.current_quantity}
                            </td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">{item.unit}</td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">{(item.price || 0).toFixed(2)}</td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">
                              {((item.price || 0) * item.current_quantity).toFixed(2)} ج.م
                            </td>
                            <td className="border-2 border-gray-300 px-6 py-3 text-center">
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300">مخزون منخفض</Badge>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}

                    {/* Normal Stock Items */}
                    <tr>
                      <td colSpan={7} className="border-2 border-gray-300 px-6 py-3 text-center bg-green-50 text-green-800 font-bold">
                        جميع عناصر المخزون
                      </td>
                    </tr>
                    {comprehensiveReport.currentStock
                      .filter(item => 
                        !comprehensiveReport.criticalAlerts.some(critical => critical.stock_item_id === item.stock_item_id) &&
                        !comprehensiveReport.lowStockItems.some(lowStock => lowStock.stock_item_id === item.stock_item_id)
                      )
                      .map((item) => (
                        <tr key={`normal-${item.stock_item_id}`} className="hover:bg-gray-50 even:bg-gray-50">
                          <td className="border-2 border-gray-300 px-6 py-3 font-medium">{item.name}</td>
                          <td className="border-2 border-gray-300 px-6 py-3 text-center">{item.type}</td>
                          <td className="border-2 border-gray-300 px-6 py-3 text-center font-bold">
                            {item.current_quantity}
                          </td>
                          <td className="border-2 border-gray-300 px-6 py-3 text-center">{item.unit}</td>
                          <td className="border-2 border-gray-300 px-6 py-3 text-center">{(item.price || 0).toFixed(2)}</td>
                          <td className="border-2 border-gray-300 px-6 py-3 text-center">
                            {((item.price || 0) * item.current_quantity).toFixed(2)} ج.م
                          </td>
                          <td className="border-2 border-gray-300 px-6 py-3 text-center">
                            <Badge variant="outline" className="bg-green-100 text-green-800">طبيعي</Badge>
                          </td>
                        </tr>
                    ))}

                    {/* Recent Transactions Section */}
                    <tr>
                      <td colSpan={7} className="border-2 border-gray-300 px-6 py-3 text-center bg-blue-50 text-blue-800 font-bold">
                        آخر المعاملات على المخزون
                      </td>
                    </tr>
                    <tr className="bg-blue-50">
                      <th className="border-2 border-gray-300 px-6 py-3 text-right font-bold">العنصر</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">نوع المعاملة</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">الكمية</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">المستخدم</th>
                      <th className="border-2 border-gray-300 px-6 py-3 text-center font-bold">الوقت</th>
                      <th colSpan={2} className="border-2 border-gray-300 px-6 py-3 text-center font-bold">رمز المعاملة</th>
                    </tr>
                    {comprehensiveReport.allTransactions.slice(0, 10).map((transaction, idx) => (
                      <tr key={`trans-${transaction.transaction_id}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border-2 border-gray-300 px-6 py-3 font-medium">{transaction.stock_item_name}</td>
                        <td className="border-2 border-gray-300 px-6 py-3 text-center">
                          <Badge variant={transaction.type === 'in' ? 'default' : 'destructive'}>
                            {transaction.type === 'in' ? 'إضافة' : 'استخدام'}
                          </Badge>
                        </td>
                        <td className="border-2 border-gray-300 px-6 py-3 text-center font-bold">
                          <span className={transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'in' ? '+' : '-'}{transaction.quantity}
                          </span>
                        </td>
                        <td className="border-2 border-gray-300 px-6 py-3 text-center">{transaction.user_name}</td>
                        <td className="border-2 border-gray-300 px-6 py-3 text-center">
                          {new Date(transaction.timestamp).toLocaleString('ar-EG')}
                        </td>
                        <td colSpan={2} className="border-2 border-gray-300 px-6 py-3 text-center">
                          {transaction.shift_id?.substring(0, 8)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shift Report Display - Cashier Style */}
      {shiftReport && reportType === "shift" && (
        <Card className="bg-white shadow-xl border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200">
            <CardTitle className="text-xl font-bold text-teal-700 flex items-center gap-2">
              <Package className="w-5 h-5" />
              تقرير ورديتي - {shiftReport.shift_name}
            </CardTitle>
            <p className="text-sm text-teal-600">
              {new Date(shiftReport.shift_date).toLocaleDateString('ar-EG')}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Shift Statistics - Cashier Colors */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 shadow-sm">
                <div className="text-2xl font-bold text-teal-600">{shiftReport.total_transactions}</div>
                <div className="text-sm text-teal-700">إجمالي المعاملات</div>
              </div>
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200 shadow-sm">
                <div className="text-2xl font-bold text-cyan-600">{shiftReport.total_stock_items}</div>
                <div className="text-sm text-cyan-700">إجمالي العناصر</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 shadow-sm">
                <div className="text-2xl font-bold text-amber-600">{shiftReport.low_stock_items_count}</div>
                <div className="text-sm text-amber-700">مخزون منخفض</div>
              </div>
              <div className="bg-rose-50 p-4 rounded-lg border border-rose-200 shadow-sm">
                <div className="text-2xl font-bold text-rose-600">{shiftReport.out_of_stock_items_count}</div>
                <div className="text-sm text-rose-700">نفذ المخزون</div>
              </div>
            </div>

            {/* Transaction Summary - Cashier Style */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-teal-600 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                ملخص معاملات ورديتي
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shiftReport.transaction_summary.map((summary) => (
                  <div key={summary.type} className={`p-4 rounded-lg border shadow-sm ${
                    summary.type === 'in' ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {summary.type === 'in' ? 'إضافة للمخزون' : 'استخدام من المخزون'}
                      </span>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          summary.type === 'in' ? 'text-emerald-600' : 'text-orange-600'
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

            {/* Recent Transactions - Cashier Style */}
            {shiftReport.transactions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-teal-600 mb-3 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  معاملاتي الأخيرة
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-teal-200 rounded-lg shadow-sm">
                    <thead className="bg-teal-50">
                      <tr>
                        <th className="border border-teal-200 px-4 py-2 text-right">العنصر</th>
                        <th className="border border-teal-200 px-4 py-2 text-center">النوع</th>
                        <th className="border border-teal-200 px-4 py-2 text-center">الكمية</th>
                        <th className="border border-teal-200 px-4 py-2 text-center">المستخدم</th>
                        <th className="border border-teal-200 px-4 py-2 text-center">الوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftReport.transactions.slice(0, 10).map((transaction) => (
                        <tr key={transaction.transaction_id} className="hover:bg-teal-25">
                          <td className="border border-teal-200 px-4 py-2 font-medium">{transaction.stock_item_name}</td>
                          <td className="border border-teal-200 px-4 py-2 text-center">
                            <Badge variant={transaction.type === 'in' ? 'default' : 'destructive'} className={transaction.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}>
                              {transaction.type === 'in' ? 'إضافة' : 'استخدام'}
                            </Badge>
                          </td>
                          <td className="border border-teal-200 px-4 py-2 text-center font-semibold">{transaction.quantity}</td>
                          <td className="border border-teal-200 px-4 py-2 text-center">{transaction.user_name}</td>
                          <td className="border border-teal-200 px-4 py-2 text-center">
                            {new Date(transaction.timestamp).toLocaleTimeString('ar-EG')}
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
      {!shiftReport && allTransactions.length === 0 && !itemStats && itemTransactions.length === 0 && !comprehensiveReport && !loading && (
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

export default function CashierStockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null)

  // Get current active shift ID - use ONLY localStorage to avoid API errors
  const getCurrentActiveShift = (): string => {
    try {
      // ONLY use stored user's shift data - no API calls since they cause 500 errors
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      
      if (storedUser?.shift?.shift_id) {
        console.log("Using cashier's current shift ID:", storedUser.shift.shift_id)
        setActiveShiftId(storedUser.shift.shift_id)
        return storedUser.shift.shift_id
      }
      
      // If no shift in stored user, use user ID as shift reference
      if (storedUser?.user_id || storedUser?.id) {
        const userId = storedUser.user_id || storedUser.id
        console.log("Using user ID as shift reference:", userId)
        setActiveShiftId(userId)
        return userId
      }
    } catch (error) {
      console.warn("Could not get user shift data:", error)
    }
    
    // Final fallback - create a temporary shift ID based on current time
    const tempShiftId = `cashier_shift_${Date.now()}`
    setActiveShiftId(tempShiftId)
    console.log("Using temporary shift ID:", tempShiftId)
    return tempShiftId
  }

  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [stockStats, setStockStats] = useState<StockStats>({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
    criticalAlerts: 0,
  })

  const [updateQuantity, setUpdateQuantity] = useState(0)
  const [updateType, setUpdateType] = useState<"add" | "reduce">("add")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("inventory")

  const { toast } = useToast()

  // Enhanced stock status calculation
  const getStockStatus = (item: StockItem) => {
    const currentQty = Number(item.current_quantity) || 0
    const minQty = Number(item.minimum_value) || 0
    if (currentQty <= 0) return StockItemStatus.OUTOFSTOCK
    if (currentQty <= minQty) return StockItemStatus.LOWSTOCK
    return StockItemStatus.AVAILABLE
  }

  // Enhanced stock status badge
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

  // Filtered items memoized
  const filteredStockItems = useMemo(() => {
    if (typeFilter === "all") return stockItems
    return stockItems.filter(item => {
      const enumValue = Object.entries(StockItemType).find(([key, value]) => key === typeFilter)?.[1]
      return item.type === enumValue || item.type === typeFilter
    })
  }, [stockItems, typeFilter])

  const handleUpdateQuantity = async () => {
    if (!selectedItem) return

    try {
      // Get current shift ID
      const currentShiftId = getCurrentActiveShift()
      
      if (!currentShiftId) {
        toast({
          title: "خطأ",
          description: "لا توجد وردية نشطة. يجب فتح وردية أولاً",
          variant: "destructive",
        })
        return
      }

      // Create stock transaction - this is the correct way for cashiers
      const transactionData = {
        stock_item_id: selectedItem.stock_item_id,
        type: updateType === "add" ? "in" : "out",
        quantity: updateQuantity,
        user_id: currentUser?.id || currentUser?.user_id,
        shift_id: currentShiftId,
        notes: `Stock ${updateType === "add" ? "addition" : "reduction"} for ${selectedItem.name}`,
      }

      console.log("Creating stock transaction:", transactionData)

      // Create the transaction (this will automatically update the stock item quantity on the backend)
      const result = await AuthApiService.apiRequest<any>('/stock-transactions', {
        method: "POST",
        body: JSON.stringify(transactionData),
      })

      console.log("Stock transaction created successfully:", result)

      // Update local state with the new quantity
      const newQuantity = updateType === "add" 
        ? selectedItem.current_quantity + updateQuantity
        : Math.max(0, selectedItem.current_quantity - updateQuantity)

      const updatedItem = {
        ...selectedItem,
        current_quantity: newQuantity
      }

      setStockItems(stockItems.map((item) => 
        item.stock_item_id === selectedItem.stock_item_id ? updatedItem : item
      ))

      setShowUpdateDialog(false)
      setSelectedItem(null)
      setUpdateQuantity(0)

      toast({
        title: "نجح",
        description: "تم تسجيل حركة المخزون بنجاح",
      })

      // Refresh the stock data to get updated quantities
      fetchStockItems()
      fetchLowStockItems()
      
    } catch (error: any) {
      console.error("Error creating stock transaction:", error)
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل حركة المخزون",
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

  // Filter items based on search query
  const searchFilteredItems = useMemo(() => {
    if (!searchQuery) return filteredStockItems
    return filteredStockItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [filteredStockItems, searchQuery])

  if (!currentUser) return null

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-100 bg-fixed">
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">إدارة المخزون - الكاشير</h1>
          <p className="text-gray-600">متابعة وإدارة كميات المخزون</p>
          {currentUser?.shift?.shift_name && (
            <p className="text-sm text-blue-600 mt-2">
              الوردية الحالية: {currentUser.shift.shift_name}
            </p>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">إجمالي العناصر</p>
                  <p className="text-2xl font-bold">{stockStats.totalItems}</p>
                </div>
                <Package className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">مخزون منخفض</p>
                  <p className="text-2xl font-bold">{stockStats.lowStockItems}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">نفذ المخزون</p>
                  <p className="text-2xl font-bold">{stockStats.outOfStockItems}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">القيمة الإجمالية</p>
                  <p className="text-2xl font-bold">{stockStats.totalValue.toFixed(0)} ج.م</p>
                </div>
                <UtensilsCrossed className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">تنبيهات حرجة</p>
                  <p className="text-2xl font-bold">{stockStats.criticalAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              البحث والتصفية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث عن عنصر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية حسب النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {stockTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={fetchStockItems} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stock Items Table */}
        <Card className="shadow-lg border-0 overflow-hidden bg-white/90 backdrop-blur-md">
          <CardHeader className="border-b bg-white/50">
            <div className="flex items-center gap-3 mb-2">
              <UtensilsCrossed className="w-7 h-7 text-orange-600" />
              <CardTitle className="text-3xl font-extrabold text-orange-700 tracking-tight">إدارة المخزون</CardTitle>
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
                  <div className="flex items-center gap-3 mb-6">
                    <Package className="w-5 h-5 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-800">عناصر المخزون ({searchFilteredItems.length})</h2>
                  </div>
                  
                  {/* Filter Controls */}
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className="mr-2">جاري التحميل...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3 font-semibold">العنصر</th>
                      <th className="text-center p-3 font-semibold">النوع</th>
                      <th className="text-center p-3 font-semibold">الكمية الحالية</th>
                      <th className="text-center p-3 font-semibold">الحد الأدنى</th>
                      <th className="text-center p-3 font-semibold">الوحدة</th>
                      <th className="text-center p-3 font-semibold">الحالة</th>
                      <th className="text-center p-3 font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchFilteredItems.map((item) => (
                      <tr key={item.stock_item_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3 text-center">{item.type}</td>
                        <td className="p-3 text-center">{item.current_quantity}</td>
                        <td className="p-3 text-center">{item.minimum_value}</td>
                        <td className="p-3 text-center">{item.unit}</td>
                        <td className="p-3 text-center">{getStatusBadge(item)}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => openUpdateDialog(item)}
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>تنبيه:</strong> يوجد {lowStockItems.length} عناصر بمخزون منخفض تحتاج إلى إعادة تموين
            </AlertDescription>
          </Alert>
        )}

                </div>
              </TabsContent>

              <TabsContent value="reports" className="mt-0">
                <StockReportsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Stock Transaction Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تسجيل حركة مخزون</DialogTitle>
              <DialogDescription>تسجيل حركة مخزون لـ {selectedItem?.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="updateType">نوع الحركة</Label>
                <Select value={updateType} onValueChange={(value: "add" | "reduce") => setUpdateType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">إضافة للمخزون</SelectItem>
                    <SelectItem value="reduce">تقليل من المخزون</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">الكمية</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={updateQuantity}
                  onChange={(e) => setUpdateQuantity(Number(e.target.value))}
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateQuantity} disabled={updateQuantity <= 0}>
                تسجيل الحركة
              </Button>
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                إلغاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
