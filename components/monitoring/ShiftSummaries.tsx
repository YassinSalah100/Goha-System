// Shift Summaries Component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { DetailedShiftSummary } from "@/lib/types/monitoring"
import { formatPrice } from "@/lib/services/monitoring-api"

interface ShiftSummariesProps {
  shifts: DetailedShiftSummary[]
  isLoading?: boolean
}

export function ShiftSummaries({ shifts, isLoading = false }: ShiftSummariesProps) {
  const getShiftTypeName = (type: string): string => {
    const types = {
      "MORNING": "صباحية",
      "NIGHT": "مسائية",
    }
    return types[type as keyof typeof types] || type
  }

  const getShiftStatusBadge = (status: string) => {
    const statuses = {
      "opened": { label: "مفتوحة", variant: "default" as const },
      "closed": { label: "مغلقة", variant: "secondary" as const },
      "REQUESTED_CLOSE": { label: "طلب إغلاق", variant: "destructive" as const },
    }
    return statuses[status as keyof typeof statuses] || { label: status, variant: "outline" as const }
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
                          <span>فتحت بواسطة: {shift.opened_by.full_name}</span>
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
                    
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      عرض التفاصيل
                    </Button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Receipt className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">الطلبات</span>
                      </div>
                      <div className="text-lg font-bold text-blue-700">{shift.total_orders}</div>
                      <div className="text-xs text-blue-600">
                        متوسط: {formatPrice(shift.average_order_value)}
                      </div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">المبيعات</span>
                      </div>
                      <div className="text-lg font-bold text-green-700">
                        {formatPrice(shift.total_sales)}
                      </div>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">الموظفين</span>
                      </div>
                      <div className="text-lg font-bold text-purple-700">{shift.total_workers}</div>
                      <div className="text-xs text-purple-600">
                        نشط: {shift.active_workers}
                      </div>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">المصروفات</span>
                      </div>
                      <div className="text-lg font-bold text-orange-700">
                        {formatPrice(shift.total_expenses)}
                      </div>
                      <div className="text-xs text-orange-600">
                        {shift.expenses_count} مصروف
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
                          <span className="font-medium">{shift.orders_by_type["dine-in"]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>تيك أواي:</span>
                          <span className="font-medium">{shift.orders_by_type.takeaway}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>توصيل:</span>
                          <span className="font-medium">{shift.orders_by_type.delivery}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>كافيه:</span>
                          <span className="font-medium">{shift.orders_by_type.cafe}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Status */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">حالة الطلبات</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>مكتملة:</span>
                          <span className="font-medium text-green-600">{shift.orders_by_status.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>قيد التنفيذ:</span>
                          <span className="font-medium text-orange-600">{shift.orders_by_status.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ملغية:</span>
                          <span className="font-medium text-red-600">{shift.orders_by_status.cancelled}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">طرق الدفع</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>نقدي:</span>
                          <span className="font-medium">{shift.orders_by_payment.cash}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>بطاقة:</span>
                          <span className="font-medium">{shift.orders_by_payment.card}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Cost Summary */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">إجمالي تكلفة الموظفين:</span>
                      <span className="font-medium text-purple-600">
                        {formatPrice(shift.total_staff_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold mt-2">
                      <span className="text-gray-700">صافي المبيعات:</span>
                      <span className="text-green-600">
                        {formatPrice(shift.total_sales - shift.total_expenses - shift.total_staff_cost)}
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
