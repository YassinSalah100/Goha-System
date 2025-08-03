// Cashier Activities Component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  DollarSign, 
  Clock, 
  BarChart3,
  AlertCircle
} from "lucide-react"
import { CashierActivity } from "@/lib/types/monitoring"
import { formatPrice } from "@/lib/services/monitoring-api"

interface CashierActivitiesProps {
  activities: CashierActivity[]
  isLoading?: boolean
}

export function CashierActivities({ activities, isLoading = false }: CashierActivitiesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            نشاط الكاشيرين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
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
          <Users className="w-5 h-5" />
          نشاط الكاشيرين ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">لا يوجد نشاط للكاشيرين</h3>
            <p className="text-gray-400">سيظهر نشاط الكاشيرين هنا</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.cashierId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {activity.cashierName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{activity.cashierName}</h4>
                      <Badge variant={activity.isActive ? "default" : "secondary"}>
                        {activity.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">الطلبات:</span>
                        <span className="font-medium">{activity.ordersToday}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600">المبيعات:</span>
                        <span className="font-medium text-green-600">
                          {formatPrice(activity.totalSales)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-600">آخر طلب:</span>
                        <span className="font-medium">
                          {new Date(activity.lastOrderTime).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-600">متوسط الطلب:</span>
                        <span className="font-medium">
                          {activity.ordersToday > 0 
                            ? formatPrice(activity.totalSales / activity.ordersToday)
                            : formatPrice(0)
                          }
                        </span>
                      </div>
                    </div>

                    {/* Order types breakdown */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">توزيع الطلبات والمبيعات:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(activity.orderTypes).map(([type, count]) => {
                          if (count === 0) return null
                          const typeLabels = {
                            "dine-in": "صالة",
                            "takeaway": "تيك أواي", 
                            "delivery": "توصيل",
                            "cafe": "كافيه"
                          }
                          const salesForType = activity.salesByType?.[type as keyof typeof activity.salesByType] || 0
                          return (
                            <div key={type} className="p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-700">
                                  {typeLabels[type as keyof typeof typeLabels]}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {count}
                                </Badge>
                              </div>
                              <div className="text-xs text-green-600 font-medium mt-1">
                                {formatPrice(salesForType)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
