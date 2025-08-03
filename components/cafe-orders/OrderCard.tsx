"use client"
import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  Users,
  Package,
  DollarSign,
  Trash2,
  Printer,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { formatOrderNumber, formatCurrency, getOrderStatusColor } from "@/lib/cafe-orders-utils"

interface CartItem {
  id: string
  name: string
  price: number
  basePrice: number
  quantity: number
  size: string
  sizeId: string
  notes: string
  category: string
  categoryId: string
  productId: string
  productSizeId: string
  image_url?: string
  extras: Array<{
    id: string
    name: string
    price: number
  }>
}

type OrderStatus = "pending" | "completed" | "cancelled" | "processing" | "ready" | "delivered"

interface CafeOrder {
  orderId: string
  staffName: string
  shift_id: string
  items: CartItem[]
  total: number
  orderDate: string
  orderTime: string
  isPaid: boolean
  status: OrderStatus
  paymentTime?: string
  tableNumber?: string
  source: "localStorage" | "api"
  api_saved?: boolean
}

interface OrderCardProps {
  order: CafeOrder
  isExpanded: boolean
  isDeleting: boolean
  isMarkingPaid: boolean
  onToggleExpand: () => void
  onDelete: () => void
  onMarkPaid?: () => void
  onPrint: () => void
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isExpanded,
  isDeleting,
  isMarkingPaid,
  onToggleExpand,
  onDelete,
  onMarkPaid,
  onPrint,
}) => {
  const orderNumber = formatOrderNumber(order.orderId)
  const { borderColor, bgColor, badgeColor, statusText } = getOrderStatusColor(order.isPaid)

  return (
    <Card className={`border-l-4 ${borderColor} ${bgColor} hover:shadow-md transition-all duration-200`}>
      <CardContent className="p-4">
        {/* Order Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-lg">طلب #{orderNumber}</h4>
              <Badge variant={order.isPaid ? "default" : "secondary"} className={`text-xs ${badgeColor}`}>
                {statusText}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${order.api_saved ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}
              >
                {order.api_saved ? "مزامنة" : "محلي"}
              </Badge>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{order.staffName}</span>
              </div>
              {order.tableNumber && (
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  <span>طاولة {order.tableNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{order.orderDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{order.orderTime}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-1">
              {!order.isPaid && onMarkPaid && (
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white px-3"
                  onClick={onMarkPaid}
                  disabled={isMarkingPaid}
                  title="تأكيد الدفع"
                >
                  {isMarkingPaid ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-1" />
                      دفع
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onPrint}
                title="طباعة الطلب"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onDelete}
                disabled={isDeleting}
                title="حذف الطلب"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex justify-between items-center py-2 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg text-gray-800">
              {formatCurrency(order.total)}
            </span>
            <span className="text-sm text-gray-600">
              {order.items?.length || 0} عنصر
            </span>
            {order.isPaid && order.paymentTime && (
              <span className="text-xs text-green-600">
                تم الدفع: {order.paymentTime}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                إخفاء التفاصيل
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                عرض التفاصيل
              </>
            )}
          </Button>
        </div>

        {/* Expandable Order Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="font-semibold text-sm text-gray-700 mb-3">تفاصيل الطلب:</h5>
                
                {order.items && order.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="py-2 px-3 text-right font-semibold">المنتج</th>
                          <th className="py-2 px-3 text-center font-semibold">الحجم</th>
                          <th className="py-2 px-3 text-center font-semibold">الكمية</th>
                          <th className="py-2 px-3 text-center font-semibold">سعر الوحدة</th>
                          <th className="py-2 px-3 text-center font-semibold">إجمالي المنتج</th>
                          <th className="py-2 px-3 text-center font-semibold">الإضافات</th>
                          <th className="py-2 px-3 text-center font-semibold">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, index) => {
                          const itemBaseTotal = item.basePrice * item.quantity;
                          const extrasTotal = item.extras?.reduce((sum, extra) => sum + (extra.price * item.quantity), 0) || 0;
                          const itemGrandTotal = itemBaseTotal + extrasTotal;
                          
                          return (
                            <tr key={`${order.orderId}-item-${item.id || index}`} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3 font-medium text-gray-800">{item.name}</td>
                              <td className="py-2 px-3 text-center">
                                {item.size ? (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {item.size}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center font-medium">{item.quantity}</td>
                              <td className="py-2 px-3 text-center">{formatCurrency(item.basePrice)}</td>
                              <td className="py-2 px-3 text-center font-semibold text-blue-700">
                                {formatCurrency(itemBaseTotal)}
                              </td>
                              <td className="py-2 px-3">
                                {item.extras && item.extras.length > 0 ? (
                                  <div className="space-y-1">
                                    <table className="w-full text-xs border border-blue-100 rounded">
                                      <thead>
                                        <tr className="bg-blue-50">
                                          <th className="px-1 py-0.5 text-right">الإضافة</th>
                                          <th className="px-1 py-0.5 text-center">سعر الوحدة</th>
                                          <th className="px-1 py-0.5 text-center">الكمية</th>
                                          <th className="px-1 py-0.5 text-center">الإجمالي</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.extras.map((extra, i) => (
                                          <tr key={extra.id || i} className="border-b border-blue-50">
                                            <td className="px-1 py-0.5 text-right">{extra.name}</td>
                                            <td className="px-1 py-0.5 text-center">{formatCurrency(extra.price)}</td>
                                            <td className="px-1 py-0.5 text-center">{item.quantity}</td>
                                            <td className="px-1 py-0.5 text-center font-semibold text-blue-700">
                                              {formatCurrency(extra.price * item.quantity)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    <div className="text-xs text-blue-700 font-semibold mt-1">
                                      مجموع الإضافات: {formatCurrency(extrasTotal)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">لا يوجد</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {item.notes && item.notes.trim() ? (
                                  <div className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded border border-yellow-200">
                                    {item.notes}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">لا يوجد</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Order Summary */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي المنتجات:</span>
                          <span className="font-semibold">
                            {formatCurrency(order.items.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي الإضافات:</span>
                          <span className="font-semibold">
                            {formatCurrency(order.items.reduce((sum, item) => 
                              sum + (item.extras?.reduce((extraSum, extra) => extraSum + (extra.price * item.quantity), 0) || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-800 font-semibold">المجموع الكلي:</span>
                          <span className="font-bold text-green-700">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>لا توجد عناصر في هذا الطلب</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
