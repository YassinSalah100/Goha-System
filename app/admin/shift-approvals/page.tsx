"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, DollarSign } from "lucide-react"
import { orders } from "@/mock-data/orders"
import { motion } from "framer-motion"

// Mock shift end requests
const shiftRequests = [
  {
    id: "shift-001",
    cashier: {
      id: "1",
      name: "Ahmed Cashier",
      username: "cashier",
    },
    shift: "morning",
    startTime: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(), // 8 AM
    endTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), // 8 PM
    orders: ["0001", "0002"],
    totalSales: 34.95,
    cashSales: 21.96,
    cardSales: 12.99,
    notes: "Everything went well today.",
    status: "pending",
  },
  {
    id: "shift-002",
    cashier: {
      id: "4",
      name: "Sara Cashier",
      username: "sara",
    },
    shift: "evening",
    startTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), // 8 PM
    endTime: (() => {
      const nextDay = new Date()
      nextDay.setDate(nextDay.getDate() + 1)
      nextDay.setHours(8, 0, 0, 0)
      return nextDay.toISOString()
    })(), // 8 AM next day
    orders: ["0003"],
    totalSales: 29.97,
    cashSales: 29.97,
    cardSales: 0,
    notes: "Had a busy evening shift.",
    status: "pending",
  },
]

export default function ShiftApprovalsPage() {
  const [requests, setRequests] = useState(shiftRequests)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
    }
  }, [])

  const handleApprove = (requestId: string) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "approved",
            }
          : req,
      ),
    )
  }

  const handleReject = (requestId: string) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "rejected",
            }
          : req,
      ),
    )
  }

  const getOrderDetails = (orderId: string) => {
    return orders.find((order) => order.id === orderId)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const durationMs = endTime - startTime
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">طلبات إنهاء الورديات</h2>
        <p className="text-muted-foreground">Manage shift end requests from cashiers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>طلبات إنهاء الورديات المعلقة</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد طلبات إنهاء ورديات معلقة</div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-lg p-4 ${
                    request.status === "approved"
                      ? "bg-green-50 border-green-200"
                      : request.status === "rejected"
                        ? "bg-red-50 border-red-200"
                        : "bg-white"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">
                          طلب إنهاء وردية #{request.id} - {request.cashier.name}
                        </h3>
                        <Badge
                          variant={
                            request.status === "approved"
                              ? "success"
                              : request.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {request.status === "approved"
                            ? "تمت الموافقة"
                            : request.status === "rejected"
                              ? "مرفوض"
                              : "معلق"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        وردية {request.shift === "morning" ? "صباحية" : "مسائية"} • {formatDate(request.startTime)}
                      </p>
                    </div>

                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleApprove(request.id)} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          موافقة
                        </Button>
                        <Button onClick={() => handleReject(request.id)} variant="destructive">
                          <XCircle className="mr-2 h-4 w-4" />
                          رفض
                        </Button>
                      </div>
                    )}

                    {request.status === "approved" && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        تمت الموافقة على إنهاء الوردية
                      </div>
                    )}

                    {request.status === "rejected" && (
                      <div className="flex items-center text-red-600">
                        <XCircle className="mr-2 h-5 w-5" />
                        تم رفض إنهاء الوردية
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">تفاصيل الوردية</h4>
                      <div className="bg-gray-50 p-4 rounded-md space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">وقت البدء:</span>
                          <span>{formatTime(request.startTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">وقت الإنتهاء:</span>
                          <span>{formatTime(request.endTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">المدة:</span>
                          <span>{calculateDuration(request.startTime, request.endTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">عدد الطلبات:</span>
                          <span>{request.orders.length}</span>
                        </div>
                        {request.notes && (
                          <div className="pt-2">
                            <p className="text-sm text-muted-foreground mb-1">ملاحظات:</p>
                            <p className="text-sm bg-white p-2 rounded border">{request.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">ملخص المبيعات</h4>
                      <div className="bg-gray-50 p-4 rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                            <span className="text-muted-foreground">إجمالي المبيعات:</span>
                          </div>
                          <span className="font-medium">${request.totalSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">مبيعات نقدية:</span>
                          <span>${request.cashSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">مبيعات بطاقة:</span>
                          <span>${request.cardSales.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>المبلغ النقدي للتسليم:</span>
                          <span className="text-green-600">${request.cashSales.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-3">الطلبات خلال الوردية</h4>
                    <div className="bg-gray-50 rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">رقم الطلب</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">الوقت</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">العميل</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">نوع الطلب</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">طريقة الدفع</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">المبلغ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {request.orders.map((orderId) => {
                            const order = getOrderDetails(orderId)
                            return order ? (
                              <tr key={order.id}>
                                <td className="px-4 py-2 text-sm">#{order.id}</td>
                                <td className="px-4 py-2 text-sm">
                                  {new Date(order.date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                                <td className="px-4 py-2 text-sm">{order.customerName}</td>
                                <td className="px-4 py-2 text-sm text-center capitalize">{order.orderType}</td>
                                <td className="px-4 py-2 text-sm text-center capitalize">{order.paymentMethod}</td>
                                <td className="px-4 py-2 text-sm text-right font-medium">${order.total.toFixed(2)}</td>
                              </tr>
                            ) : (
                              <tr key={orderId}>
                                <td colSpan={6} className="px-4 py-2 text-sm text-center text-muted-foreground">
                                  تفاصيل الطلب غير متوفرة
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل طلبات إنهاء الورديات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">لا توجد طلبات إنهاء ورديات سابقة</div>
        </CardContent>
      </Card>
    </div>
  )
}
