/**
 * Utility functions for cafe orders
 */

export const formatOrderNumber = (orderId: string): string => {
  if (orderId.startsWith("cafe_")) {
    return orderId.substring(5, 13)
  }
  return orderId.substring(orderId.length - 8)
}

export const calculateItemTotal = (item: any): number => {
  const baseTotal = (item.price || item.basePrice || 0) * (item.quantity || 1)
  const extrasTotal = item.extras ? 
    item.extras.reduce((sum: number, extra: any) => sum + (Number(extra.price) * item.quantity), 0) : 0
  return baseTotal + extrasTotal
}

export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} ج.م`
}

export const getOrderStatusColor = (isPaid: boolean) => {
  return {
    borderColor: isPaid ? "border-green-500" : "border-red-500",
    bgColor: isPaid ? "bg-green-50/30" : "bg-red-50/30",
    badgeColor: isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
    statusText: isPaid ? "مدفوع" : "غير مدفوع"
  }
}

export const filterOrdersBySearch = (orders: any[], searchQuery: string) => {
  if (!searchQuery.trim()) return orders
  const q = searchQuery.trim().toLowerCase()
  return orders.filter((order) => {
    return (
      (order.tableNumber && order.tableNumber.toLowerCase().includes(q)) ||
      (order.staffName && order.staffName.toLowerCase().includes(q)) ||
      (typeof order.orderId === "string" && order.orderId.toLowerCase().includes(q))
    )
  })
}
