"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { orders } from "@/mock-data/orders"
import { motion } from "framer-motion"
import Image from 'next/image'

export default function CashierCancelRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)

      // Load cancel requests from localStorage and filter by current cashier
      const storedRequests = JSON.parse(localStorage.getItem("cancelRequests") || "[]")
      const userRequests = storedRequests.filter((req) => req.cashier === user.name)
      setRequests(userRequests)
    }
  }, [])

  const getOrderDetails = (orderId: string | number) => {
    // First check saved orders
    const savedOrdersString = localStorage.getItem("savedOrders")
    if (savedOrdersString) {
      const savedOrders = JSON.parse(savedOrdersString)
      const savedOrder = savedOrders.find((order: any) => order.id == orderId)
      if (savedOrder) return savedOrder
    }

    // Then check mock orders
    return orders.find((order) => order.id == orderId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "pending":
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "تمت الموافقة"
      case "rejected":
        return "مرفوض"
      case "pending":
        return "في الانتظار"
      default:
        return "غير معروف"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">طلبات الإلغاء</h2>
        <p className="text-muted-foreground">عرض وتتبع طلبات إلغاء الطلبات التي قمت بإرسالها</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>طلبات الإلغاء</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد طلبات إلغاء</div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => {
                const order = getOrderDetails(request.orderId)
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 ${
                      request.status === "approved"
                        ? "bg-green-50 border-green-200"
                        : request.status === "rejected"
                          ? "bg-red-50 border-red-200"
                          : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            طلب إلغاء #{request.id} - طلب #{request.orderId}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(request.status)}>{getStatusText(request.status)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(request.timestamp).toLocaleString()}
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                          <p className="text-sm font-medium mb-1">سبب الإلغاء:</p>
                          <p className="text-sm">{request.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="text-sm font-medium">{getStatusText(request.status)}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <h4 className="font-medium mb-2">تفاصيل الطلب:</h4>
                      {order ? (
                        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs mx-auto">
                          <div className="flex flex-col items-center mb-4">
                            <img
                              src="/images/logo.png"
                              alt="Logo"
                              className="rounded-full mb-2"
                              style={{ width: 80, height: 80 }}
                            />
                            <h1 className="text-2xl font-bold">Dawar Juha</h1>
                            <p className="text-sm text-gray-600">Restaurant & Café</p>
                            <p className="text-sm text-gray-600">123 Main Street, City</p>
                            <p className="text-sm text-gray-600">Tel: +123 456 7890</p>
                          </div>
                          <div className="w-full mb-2">
                            <div className="flex justify-between mb-1 text-sm">
                              <span className="font-medium">Order #:</span>
                              <span>{order.id}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm">
                              <span className="font-medium">Date:</span>
                              <span>{new Date(order.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm">
                              <span className="font-medium">Time:</span>
                              <span>{new Date(order.date).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm">
                              <span className="font-medium">Customer:</span>
                              <span>{order.customerName}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm">
                              <span className="font-medium">Type:</span>
                              <span className="capitalize">{order.orderType.replace("-", " ")}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm">
                              <span className="font-medium">Cashier:</span>
                              <span>{order.cashier}</span>
                            </div>
                          </div>
                          <div className="w-full mt-2 mb-2">
                            <div className="flex font-semibold border-b pb-1 text-sm">
                              <div className="w-1/3">Item</div>
                              <div className="w-1/6 text-center">Qty</div>
                              <div className="w-1/4 text-right">Price</div>
                              <div className="w-1/4 text-right">Total</div>
                            </div>
                            {order.items.map((item) => (
                              <div key={item.id} className="flex flex-col border-b last:border-0 py-1 text-xs">
                                <div className="flex">
                                  <div className="w-1/3 truncate">
                                    {item.name}
                                    {item.size && (
                                      <span className="text-[10px] text-gray-500 block">
                                        {item.size === "small"
                                          ? "صغير"
                                          : item.size === "medium"
                                            ? "وسط"
                                            : item.size === "large"
                                              ? "كبير"
                                              : item.size === "regular"
                                                ? "عادي"
                                                : item.size}
                                      </span>
                                    )}
                                  </div>
                                  <div className="w-1/6 text-center">{item.quantity}</div>
                                  <div className="w-1/4 text-right">ج.م{item.price.toFixed(2)}</div>
                                  <div className="w-1/4 text-right">ج.م{(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                                {item.extras && item.extras.length > 0 && (
                                  <div className="w-full text-[10px] text-gray-500 pl-1 pt-0.5">
                                    {item.extras.map((extra) => (
                                      <div key={extra.name} className="flex justify-between">
                                        <span>+ {extra.name}</span>
                                        <span>ج.م{extra.price.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {item.notes && (
                                  <div className="w-full text-[10px] italic text-gray-500 pl-1 pt-0.5">
                                    Note: {item.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="w-full border-t pt-2 mt-2">
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total</span>
                              <span>ج.م{order.total.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="text-center text-xs text-gray-600 mt-4">
                            <p>Thank you for your order!</p>
                            <p>Please come again</p>
                            <div className="flex flex-col items-center mt-3">
                              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-700 mb-1" />
                              <div className="flex items-center gap-2 mt-1">
                                <Image src="/images/eathrel.png" alt="Eathrel Logo" width={20} height={20} className="w-5 h-5 object-contain" />
                                <span className="text-[11px] text-blue-700 font-semibold tracking-wide uppercase">
                                  Powered by Ethereal
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">تفاصيل الطلب غير متوفرة</p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إحصائيات طلبات الإلغاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {requests.filter((r) => r.status === "pending").length}
              </div>
              <div className="text-sm text-blue-600">في الانتظار</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {requests.filter((r) => r.status === "approved").length}
              </div>
              <div className="text-sm text-green-600">تمت الموافقة</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {requests.filter((r) => r.status === "rejected").length}
              </div>
              <div className="text-sm text-red-600">مرفوض</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
