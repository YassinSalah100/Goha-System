// Live Orders Component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Eye, 
  RefreshCw, 
  Clock, 
  User, 
  Phone,
  Package,
  AlertTriangle
} from "lucide-react"
import { Order } from "@/lib/types/monitoring"
import { formatPrice } from "@/lib/services/monitoring-api"

interface LiveOrdersProps {
  orders: Order[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function LiveOrders({ orders, isLoading = false, onRefresh }: LiveOrdersProps) {
  const getOrderTypeBadge = (type: string) => {
    const types = {
      "dine-in": { label: "صالة", variant: "default" as const },
      "takeaway": { label: "تيك أواي", variant: "secondary" as const },
      "delivery": { label: "توصيل", variant: "outline" as const },
      "cafe": { label: "كافيه", variant: "secondary" as const },
    }
    return types[type as keyof typeof types] || { label: type, variant: "outline" as const }
  }

  const getStatusBadge = (status: string) => {
    const statuses = {
      "pending": { label: "قيد الانتظار", variant: "destructive" as const },
      "completed": { label: "مكتمل", variant: "secondary" as const },
      "cancelled": { label: "ملغي", variant: "outline" as const },
    }
    return statuses[status as keyof typeof statuses] || { label: status, variant: "outline" as const }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          الطلبات المباشرة ({orders.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">لا توجد طلبات مباشرة</h3>
            <p className="text-gray-400">ستظهر الطلبات الجديدة هنا تلقائياً</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.order_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">#{order.order_id.slice(-6)}</h4>
                        <Badge {...getOrderTypeBadge(order.order_type)}>
                          {getOrderTypeBadge(order.order_type).label}
                        </Badge>
                        <Badge {...getStatusBadge(order.status)}>
                          {getStatusBadge(order.status).label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{order.customer_name}</span>
                        </div>
                        
                        {order.phone_number && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{order.phone_number}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(order.created_at).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Show cashier name */}
                        {(order.cashier?.username || order.cashier?.full_name || order.cashier?.fullName) && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-blue-600">
                              الكاشير: {order.cashier?.username || order.cashier?.full_name || order.cashier?.fullName}
                            </span>
                          </div>
                        )}

                        {/* Show shift information */}
                        {order.shift?.shift_id && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-green-600">
                              الوردية: {order.shift?.shift_type === 'morning' ? 'صباحية' : order.shift?.shift_type === 'night' ? 'ليلية' : order.shift?.shift_name || `#${order.shift.shift_id.slice(-6)}`}
                            </span>
                          </div>
                        )}

                        {/* Show table number only for dine-in orders */}
                        {order.order_type === 'dine-in' && order.table_number && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-orange-500" />
                            <span className="font-medium text-orange-600">
                              رقم الطاولة: {order.table_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 mb-2">
                        {formatPrice(order.total_price)}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {order.payment_method === 'cash' ? 'نقدي' : 'بطاقة'}
                      </div>
                      <div className="text-xs text-gray-400">
                        رقم الطلب: #{order.order_id.slice(-6)}
                      </div>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        الأصناف ({order.items.length}):
                      </p>
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-sm text-gray-600 flex justify-between">
                            <span>
                              {item.quantity}x {item.product_size?.product_name || 'صنف'}
                              {item.product_size?.size_name && ` (${item.product_size.size_name})`}
                            </span>
                            <span>{formatPrice(item.unit_price)}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-sm text-gray-500">
                            ... و {order.items.length - 3} أصناف أخرى
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-3">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      عرض التفاصيل
                    </Button>
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
