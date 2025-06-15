"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { orders } from "@/mock-data/orders"
import { motion } from "framer-motion"

export default function EndShiftPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [shiftOrders, setShiftOrders] = useState<any[]>([])
  const [shiftStats, setShiftStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    cashSales: 0,
    cardSales: 0,
  })
  const [notes, setNotes] = useState("")
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)

      // Filter orders for today and current cashier
      const today = new Date().toDateString()
      const loginTime = new Date(user.loginTime)
      const filteredOrders = orders.filter(
        (order) =>
          new Date(order.date).toDateString() === today &&
          order.cashier === user.username &&
          new Date(order.date) >= loginTime,
      )

      setShiftOrders(filteredOrders)

      // Calculate stats
      const total = filteredOrders.reduce((sum, order) => sum + order.total, 0)
      const cashTotal = filteredOrders
        .filter((order) => order.paymentMethod === "cash")
        .reduce((sum, order) => sum + order.total, 0)
      const cardTotal = filteredOrders
        .filter((order) => order.paymentMethod === "card")
        .reduce((sum, order) => sum + order.total, 0)

      setShiftStats({
        totalOrders: filteredOrders.length,
        totalSales: total,
        cashSales: cashTotal,
        cardSales: cardTotal,
      })
    }
  }, [])

  const handleEndShiftRequest = () => {
    // In a real app, this would send a request to the admin
    setRequestSent(true)

    // After 3 seconds, redirect to login page (simulating approval)
    setTimeout(() => {
      localStorage.removeItem("currentUser")
      router.push("/")
    }, 3000)
  }

  if (!currentUser) return null

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">End Shift Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {requestSent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">End Shift Request Sent</h3>
              <p className="text-muted-foreground mb-4">
                Your request has been sent to the admin for approval. Please wait...
              </p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mt-4">
                <motion.div
                  className="bg-green-500 h-2.5 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                ></motion.div>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">End Shift Confirmation</h4>
                  <p className="text-amber-700 text-sm">
                    You are about to end your {currentUser.shift} shift. This action requires admin approval. Please
                    review your shift summary below.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Shift Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cashier:</span>
                      <span className="font-medium">{currentUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shift Type:</span>
                      <span className="font-medium capitalize">{currentUser.shift}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started At:</span>
                      <span className="font-medium">
                        {new Date(currentUser.loginTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{new Date(currentUser.loginTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {Math.round(
                          (new Date().getTime() - new Date(currentUser.loginTime).getTime()) / (1000 * 60 * 60),
                        )}{" "}
                        hours
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Sales Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Orders:</span>
                      <span className="font-medium">{shiftStats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Sales:</span>
                      <span className="font-medium">${shiftStats.totalSales.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cash Sales:</span>
                      <span className="font-medium">${shiftStats.cashSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Card Sales:</span>
                      <span className="font-medium">${shiftStats.cardSales.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Recent Orders</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {shiftOrders.length > 0 ? (
                        shiftOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{order.id}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {new Date(order.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{order.customerName}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">${order.total.toFixed(2)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center text-sm text-gray-500">
                            No orders during this shift
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Additional Notes</h3>
                <Textarea
                  placeholder="Add any notes about your shift (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-24"
                />
              </div>
            </>
          )}
        </CardContent>
        {!requestSent && (
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleEndShiftRequest}>
              Submit End Shift Request
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
