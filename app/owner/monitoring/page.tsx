"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  RefreshCw,
  BarChart3,
  AlertTriangle,
  Package,
  Users,
  Briefcase,
  Eye
} from "lucide-react"

// Components
import { StatsCards } from "@/components/monitoring/StatsCards"
import { LiveOrders } from "@/components/monitoring/LiveOrders"
import { CashierActivities } from "@/components/monitoring/CashierActivities"
import { ShiftSummaries } from "@/components/monitoring/ShiftSummaries"

// Hooks and utilities
import { useMonitoringData } from "@/hooks/use-monitoring-data"
import { formatPrice } from "@/lib/services/monitoring-api"

export default function MonitoringPage() {
  const {
    // Data
    liveOrders,
    cancelledOrders,
    lowStockItems,
    orderStats,
    shiftSummaries,
    cashierActivities,
    todayStats,
    
    // Loading states
    loading,
    
    // Error state
    error,
    
    // Filters
    filters,
    updateFilters,
    
    // Actions
    refreshAllData,
    fetchLiveOrders,
    fetchShiftSummaries,
    fetchShiftSummaryDetails,
    deleteShift,
  } = useMonitoringData()

  const [activeTab, setActiveTab] = useState("live")

  // Filter today's orders for display
  const today = new Date().toISOString().split('T')[0]
  const todayOrders = liveOrders.filter(order => order.created_at.startsWith(today))

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              لوحة مراقبة المطعم
            </h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshAllData}
                disabled={Object.values(loading).some(Boolean)}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
                تحديث الكل
              </Button>
            </div>
          </div>
          
          <p className="text-gray-600">
            {new Date().toLocaleDateString('ar-EG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <StatsCards stats={todayStats} isLoading={loading.orders || loading.stats} />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              الطلبات المباشرة
            </TabsTrigger>
            <TabsTrigger value="cashiers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              نشاط الكاشيرين
            </TabsTrigger>
            <TabsTrigger value="shifts" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              ملخص الورديات
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              التنبيهات
            </TabsTrigger>
          </TabsList>

          {/* Live Orders Tab */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LiveOrders 
                  orders={todayOrders} 
                  isLoading={loading.orders}
                  onRefresh={fetchLiveOrders}
                />
              </div>
              
              <div className="space-y-6">
                {/* Order Statistics */}
                {orderStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        إحصائيات اليوم
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>إجمالي الطلبات:</span>
                            <span className="font-bold">{orderStats.totalOrders}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>إجمالي المبيعات:</span>
                            <span className="font-bold text-green-600">
                              {formatPrice(orderStats.totalRevenue)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500 mb-2">أنواع الطلبات:</div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>صالة:</span>
                              <Badge variant="outline">{orderStats.ordersByType["dine-in"]}</Badge>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>تيك أواي:</span>
                              <Badge variant="outline">{orderStats.ordersByType.takeaway}</Badge>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>توصيل:</span>
                              <Badge variant="outline">{orderStats.ordersByType.delivery}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cancelled Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      الطلبات الملغية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading.cancelled ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ) : cancelledOrders.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">لا توجد طلبات ملغية اليوم</p>
                    ) : (
                      <ScrollArea className="h-40">
                        <div className="space-y-2">
                          {cancelledOrders.slice(0, 5).map((cancelled) => (
                            <div key={cancelled.cancelled_order_id} className="text-sm border-b pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium">#{cancelled.original_order_id.slice(-6)}</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {cancelled.cancellation_reason}
                                  </p>
                                </div>
                                <span className="text-xs text-red-500">
                                  {new Date(cancelled.cancelled_at).toLocaleTimeString('ar-EG')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Cashiers Tab */}
          <TabsContent value="cashiers" className="space-y-6">
            <CashierActivities 
              activities={cashierActivities} 
              isLoading={loading.cashiers}
            />
          </TabsContent>

          {/* Shifts Tab */}
          <TabsContent value="shifts" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="date">التاريخ</Label>
                    <Input
                      id="date"
                      type="date"
                      value={filters.selectedDate}
                      onChange={(e) => updateFilters({ selectedDate: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shift-type">نوع الوردية</Label>
                    <Select 
                      value={filters.selectedShiftType} 
                      onValueChange={(value) => updateFilters({ selectedShiftType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الوردية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الورديات</SelectItem>
                        <SelectItem value="morning">صباحية</SelectItem>
                        <SelectItem value="night">مسائية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="shift-status">حالة الوردية</Label>
                    <Select 
                      value={filters.selectedShiftStatus} 
                      onValueChange={(value) => updateFilters({ selectedShiftStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="opened">مفتوحة</SelectItem>
                        <SelectItem value="closed">مغلقة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={fetchShiftSummaries}
                      disabled={loading.shifts}
                      className="w-full"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading.shifts ? 'animate-spin' : ''}`} />
                      تحديث
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ShiftSummaries 
              shifts={shiftSummaries}
              isLoading={loading.shifts}
              onDeleteShift={deleteShift}
              onViewDetails={fetchShiftSummaryDetails}
            />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Low Stock Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    تنبيه المخزون المنخفض
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.stock ? (
                    <div className="animate-pulse space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : lowStockItems.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">جميع المنتجات متوفرة في المخزون</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-60">
                      <div className="space-y-3">
                        {lowStockItems.map((item) => (
                          <div key={item.stock_item_id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                            <div>
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-600">
                                متوفر: {item.quantity} {item.unit}
                              </p>
                            </div>
                            <Badge variant="destructive">
                              أقل من {item.min_quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    تنبيهات النظام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Pending orders alert */}
                    {todayStats.pendingOrders > 5 && (
                      <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">
                            يوجد {todayStats.pendingOrders} طلب قيد الانتظار
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          تحقق من الطلبات المعلقة في قائمة الطلبات المباشرة
                        </p>
                      </div>
                    )}

                    {/* No active cashiers */}
                    {todayStats.activeCashiers === 0 && (
                      <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-800">
                            لا يوجد كاشيرين نشطين
                          </span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          تأكد من وجود كاشيرين يعملون حالياً
                        </p>
                      </div>
                    )}

                    {/* Low daily sales */}
                    {todayStats.totalSales < 1000 && new Date().getHours() > 12 && (
                      <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-800">
                            مبيعات اليوم منخفضة
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          مبيعات اليوم: {formatPrice(todayStats.totalSales)}
                        </p>
                      </div>
                    )}

                    {/* All clear */}
                    {todayStats.pendingOrders <= 5 && 
                     todayStats.activeCashiers > 0 && 
                     lowStockItems.length === 0 && (
                      <div className="text-center py-8">
                        <Eye className="w-16 h-16 mx-auto text-green-400 mb-4" />
                        <p className="text-green-600 font-medium">جميع الأنظمة تعمل بشكل طبيعي</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
