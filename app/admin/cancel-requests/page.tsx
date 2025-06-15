"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle } from "lucide-react"
import { orders } from "@/mock-data/orders"
import { motion } from "framer-motion"

// Mock cancel requests
const cancelRequests = [
  {
    id: "req-001",
    orderId: "0003",
    cashier: "Ahmed Cashier",
    reason: "Customer changed their mind",
    timestamp: new Date().toISOString(),
    status: "pending",
  },
  {
    id: "req-002",
    orderId: "0002",
    cashier: "Sara Cashier",
    reason: "Order was incorrect",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    status: "pending",
  },
]

export default function CancelRequestsPage() {
  const [requests, setRequests] = useState(cancelRequests)
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

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">طلبات إلغاء الطلبات</h2>
        <p className="text-muted-foreground">Manage order cancellation requests from cashiers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>طلبات الإلغاء المعلقة</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد طلبات إلغاء معلقة</div>
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
                          : "bg-white"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            طلب إلغاء #{request.id} - طلب #{request.orderId}
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
                          طلب بواسطة: {request.cashier} • {new Date(request.timestamp).toLocaleString()}
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                          <p className="text-sm font-medium mb-1">سبب الإلغاء:</p>
                          <p className="text-sm">{request.reason}</p>
                        </div>
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
                          تمت الموافقة على الإلغاء
                        </div>
                      )}

                      {request.status === "rejected" && (
                        <div className="flex items-center text-red-600">
                          <XCircle className="mr-2 h-5 w-5" />
                          تم رفض الإلغاء
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <h4 className="font-medium mb-2">تفاصيل الطلب:</h4>
                      {order ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">العميل:</p>
                            <p className="font-medium">{order.customerName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">رقم الهاتف:</p>
                            <p className="font-medium">{order.customerPhone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">نوع الطلب:</p>
                            <p className="font-medium capitalize">{order.orderType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">المبلغ الإجمالي:</p>
                            <p className="font-medium">${order.total.toFixed(2)}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">تفاصيل الطلب غير متوفرة</p>
                      )}

                      {order && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">العناصر:</h4>
                          <div className="bg-gray-50 rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">العنصر</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">الحجم</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">الكمية</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">السعر</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {order.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm">{item.name}</td>
                                    <td className="px-4 py-2 text-sm text-center">{item.size}</td>
                                    <td className="px-4 py-2 text-sm text-center">{item.quantity}</td>
                                    <td className="px-4 py-2 text-sm text-right">${item.price.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
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
          <CardTitle>سجل طلبات الإلغاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">لا توجد طلبات إلغاء سابقة</div>
        </CardContent>
      </Card>
    </div>
  )
}
