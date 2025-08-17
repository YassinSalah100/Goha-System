// Shift Summaries Component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Briefcase, 
  User, 
  DollarSign, 
  Users, 
  Receipt, 
  Clock,
  Eye,
  AlertTriangle
} from "lucide-react"
import { DetailedShiftSummary, ShiftType, ShiftStatus } from "@/lib/types/monitoring"
import { formatPrice } from "@/lib/services/monitoring-api"
import { useState } from "react"

interface ShiftSummariesProps {
  shifts: DetailedShiftSummary[]
  isLoading?: boolean
  onDeleteShift?: (shiftId: string) => Promise<void>
  onViewDetails?: (shiftId: string) => Promise<any>
}

export function ShiftSummaries({ shifts, isLoading = false, onDeleteShift, onViewDetails }: ShiftSummariesProps) {
  const [selectedShiftDetails, setSelectedShiftDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const handleViewDetails = async (shiftId: string) => {
    if (!onViewDetails) return
    
    setIsLoadingDetails(true)
    try {
      const details = await onViewDetails(shiftId)
      setSelectedShiftDetails(details)
    } catch (error) {
      console.error('Error fetching shift details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const getShiftTypeName = (type: string): string => {
    switch (type) {
      case ShiftType.MORNING:
        return "صباحية"
      case ShiftType.NIGHT:
        return "مسائية"
      default:
        return type
    }
  }

  const getShiftStatusBadge = (status: string) => {
    switch (status) {
      case ShiftStatus.OPENED:
        return { label: "مفتوحة", variant: "default" as const }
      case ShiftStatus.CLOSED:
        return { label: "مغلقة", variant: "secondary" as const }
      case ShiftStatus.REQUESTED_CLOSE:
        return { label: "طلب إغلاق", variant: "destructive" as const }
      default:
        return { label: status, variant: "outline" as const }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            ملخص الورديات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          ملخص الورديات ({shifts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">لا توجد ورديات</h3>
            <p className="text-gray-400">ستظهر ملخصات الورديات هنا</p>
          </div>
        ) : (
          <ScrollArea className="h-[700px]">
            <div className="space-y-6">
              {shifts.map((shift) => (
                <div key={shift.shift_id} className="border rounded-lg p-6 bg-white">
                  {/* Shift Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          وردية {getShiftTypeName(shift.type)}
                        </h3>
                        <Badge {...getShiftStatusBadge(shift.status)}>
                          {getShiftStatusBadge(shift.status).label}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>فتحت بواسطة: {shift.opened_by?.full_name || 'غير محدد'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(shift.start_time).toLocaleString('ar-EG')}
                          </span>
                        </div>
                        
                        {shift.end_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>انتهت: {new Date(shift.end_time).toLocaleString('ar-EG')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(shift.shift_id)}
                          disabled={isLoadingDetails}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {isLoadingDetails ? 'جاري التحميل...' : 'عرض التفاصيل'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {selectedShiftDetails?.shift_type === ShiftType.MORNING ? (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <span>تفاصيل الوردية الصباحية</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                <span>تفاصيل الوردية المسائية</span>
                              </div>
                            )}
                          </DialogTitle>
                        </DialogHeader>
                        {selectedShiftDetails && (
                          <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">معلومات أساسية</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">نوع الوردية:</span>
                                    <div className="flex items-center gap-1">
                                      {selectedShiftDetails.shift_type === ShiftType.MORNING ? (
                                        <>
                                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                          <span className="font-semibold text-yellow-700">صباحية</span>
                                        </>
                                      ) : (
                                        <>
                                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                          <span className="font-semibold text-blue-700">مسائية</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <p><span className="font-medium">وقت البداية:</span> {new Date(selectedShiftDetails.start_time).toLocaleString('ar-EG')}</p>
                                  <p><span className="font-medium">وقت النهاية:</span> {selectedShiftDetails.end_time ? new Date(selectedShiftDetails.end_time).toLocaleString('ar-EG') : 'لم تنته بعد'}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">الملخص المالي</h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">إجمالي الطلبات:</span> {selectedShiftDetails.total_orders}</p>
                                  <p><span className="font-medium">طلبات الكافيه:</span> {selectedShiftDetails.total_cafe_orders}</p>
                                  <p><span className="font-medium">إجمالي الإيرادات:</span> {formatPrice(selectedShiftDetails.total_revenue)}</p>
                                  <p><span className="font-medium">إيرادات الكافيه:</span> {formatPrice(selectedShiftDetails.cafe_revenue)}</p>
                                  <p><span className="font-medium">إجمالي المصروفات:</span> {formatPrice(selectedShiftDetails.total_expenses)}</p>
                                  <p><span className="font-medium">إجمالي الرواتب:</span> {formatPrice(selectedShiftDetails.total_salaries)}</p>
                                  <p><span className="font-medium text-green-600">الرقم النهائي:</span> {formatPrice(selectedShiftDetails.final_number)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Cashiers */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3">الكاشيرين</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {selectedShiftDetails.cashiers?.map((cashier: any, index: number) => (
                                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm">{cashier.username}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Workers */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3">العمال ({selectedShiftDetails.workers?.length || 0})</h4>
                              <div className="space-y-2">
                                {selectedShiftDetails.workers?.map((worker: any) => (
                                  <div key={worker.shift_worker_id} className="flex justify-between items-center p-3 border rounded-lg bg-purple-50">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-purple-600" />
                                      <div>
                                        <div className="font-medium">{worker.worker_name}</div>
                                        <div className="text-sm text-gray-500">
                                          معدل الساعة: {worker.hourly_rate} جنيه
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <div className="text-sm font-medium text-purple-600">
                                        {worker.calculated_salary > 0 ? `${worker.calculated_salary} جنيه` : 'جاري العمل'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {worker.end_time ? (
                                          `انتهى: ${new Date(worker.end_time).toLocaleTimeString('ar-EG')}`
                                        ) : (
                                          `بدأ: ${new Date(worker.start_time).toLocaleTimeString('ar-EG')}`
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {(!selectedShiftDetails.workers || selectedShiftDetails.workers.length === 0) && (
                                  <p className="text-gray-500 text-center py-4">لا يوجد عمال مسجلين</p>
                                )}
                              </div>
                            </div>

                            {/* Expenses */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3">المصروفات ({selectedShiftDetails.expenses?.length || 0})</h4>
                              <div className="max-h-60 overflow-y-auto">
                                <div className="space-y-2">
                                  {selectedShiftDetails.expenses?.map((expense: any) => (
                                    <div key={expense.expense_id} className="flex justify-between items-center p-3 border rounded-lg">
                                      <div>
                                        <div className="font-medium">{expense.title}</div>
                                        <div className="text-sm text-gray-500">
                                          {new Date(expense.created_at).toLocaleString('ar-EG')}
                                        </div>
                                      </div>
                                      <div className="text-lg font-bold text-red-600">
                                        {formatPrice(expense.amount)}
                                      </div>
                                    </div>
                                  ))}
                                  {(!selectedShiftDetails.expenses || selectedShiftDetails.expenses.length === 0) && (
                                    <p className="text-gray-500 text-center py-4">لا توجد مصروفات</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    {onDeleteShift && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-2"
                        onClick={async () => {
                          if (window.confirm('هل أنت متأكد أنك تريد حذف هذه الوردية؟ لا يمكن التراجع عن هذا الإجراء.')) {
                            await onDeleteShift(shift.shift_id)
                          }
                        }}
                      >
                        حذف الوردية
                      </Button>
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Receipt className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">الطلبات</span>
                      </div>
                      <div className="text-lg font-bold text-blue-700">{shift.total_orders || 0}</div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">المبيعات</span>
                      </div>
                      <div className="text-lg font-bold text-green-700">
                        {formatPrice(shift.total_sales || 0)}
                      </div>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">الموظفين</span>
                      </div>
                      <div className="text-lg font-bold text-purple-700">{shift.total_workers || 0}</div>
                      <div className="text-xs text-purple-600">
                        نشط: {shift.active_workers || 0}
                      </div>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">المصروفات</span>
                      </div>
                      <div className="text-lg font-bold text-orange-700">
                        {formatPrice(shift.total_expenses || 0)}
                      </div>
                      <div className="text-xs text-orange-600">
                        {shift.expenses_count || 0} مصروف
                      </div>
                    </div>
                  </div>

                  {/* Order Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Order Types */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">أنواع الطلبات</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>صالة:</span>
                          <span className="font-medium">{shift.orders_by_type?.["dine-in"] || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>تيك أواي:</span>
                          <span className="font-medium">{shift.orders_by_type?.takeaway || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>توصيل:</span>
                          <span className="font-medium">{shift.orders_by_type?.delivery || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>كافيه:</span>
                          <span className="font-medium">{shift.orders_by_type?.cafe || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Status */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">حالة الطلبات</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>مكتملة:</span>
                          <span className="font-medium text-green-600">{shift.orders_by_status?.completed || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>قيد التنفيذ:</span>
                          <span className="font-medium text-orange-600">{shift.orders_by_status?.pending || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ملغية:</span>
                          <span className="font-medium text-red-600">{shift.orders_by_status?.cancelled || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">طرق الدفع</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>نقدي:</span>
                          <span className="font-medium">{shift.orders_by_payment?.cash || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>بطاقة:</span>
                          <span className="font-medium">{shift.orders_by_payment?.card || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Cost Summary */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">إجمالي تكلفة الموظفين:</span>
                      <span className="font-medium text-purple-600">
                        {formatPrice(shift.total_staff_cost || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold mt-2">
                      <span className="text-gray-700">صافي المبيعات:</span>
                      <span className="text-green-600">
                        {formatPrice((shift.total_sales || 0) - (shift.total_expenses || 0) - (shift.total_staff_cost || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
