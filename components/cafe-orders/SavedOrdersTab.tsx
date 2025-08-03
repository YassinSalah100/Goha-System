"use client"
import React from "react"
import { OrderCard } from "./OrderCard"
import { OrdersSection } from "./OrdersSection"
import { SavedOrdersHeader } from "./SavedOrdersHeader"

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

interface SavedOrdersTabProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredUnpaidOrders: CafeOrder[]
  filteredPaidOrders: CafeOrder[]
  filteredSavedOrders: CafeOrder[]
  expandedOrders: { [orderId: string]: boolean }
  isUpdating: boolean
  isDeleting: string | null
  isMarkingPaid: string | null
  isConfirmingAll: boolean
  totalUnpaid: number
  totalPaid: number
  toggleOrderExpand: (orderId: string) => void
  loadAndSyncCafeOrders: () => void
  handlePrintAllSavedOrders: () => void
  confirmAllCafeOrders: () => void
  handleMarkOrderPaid: (orderId: string) => void
  handleDeleteCafeOrder: (orderId: string) => void
  handlePrintSingleSavedOrder: (order: CafeOrder) => void
}

export const SavedOrdersTab: React.FC<SavedOrdersTabProps> = ({
  searchQuery,
  setSearchQuery,
  filteredUnpaidOrders,
  filteredPaidOrders,
  filteredSavedOrders,
  expandedOrders,
  isUpdating,
  isDeleting,
  isMarkingPaid,
  isConfirmingAll,
  totalUnpaid,
  totalPaid,
  toggleOrderExpand,
  loadAndSyncCafeOrders,
  handlePrintAllSavedOrders,
  confirmAllCafeOrders,
  handleMarkOrderPaid,
  handleDeleteCafeOrder,
  handlePrintSingleSavedOrder,
}) => {
  return (
    <div className="space-y-6">
      <SavedOrdersHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={loadAndSyncCafeOrders}
        onPrintAll={handlePrintAllSavedOrders}
        onConfirmAllPayments={confirmAllCafeOrders}
        isUpdating={isUpdating}
        isConfirmingAll={isConfirmingAll}
        totalOrders={filteredSavedOrders.length}
        unpaidOrders={filteredUnpaidOrders.length}
        paidOrders={filteredPaidOrders.length}
        totalUnpaid={totalUnpaid}
        totalPaid={totalPaid}
      />

      {/* Unpaid Orders Section */}
      <OrdersSection
        title="طلبات غير مدفوعة"
        orders={filteredUnpaidOrders}
        emptyMessage="لا توجد طلبات غير مدفوعة"
        borderColor="border-red-500"
        bgColor="bg-red-500"
        badgeColor="bg-red-50 text-red-700"
      >
        {filteredUnpaidOrders.map((order) => (
          <OrderCard
            key={`unpaid-${order.orderId}`}
            order={order}
            isExpanded={expandedOrders[order.orderId] || false}
            isDeleting={isDeleting === order.orderId}
            isMarkingPaid={isMarkingPaid === order.orderId}
            onToggleExpand={() => toggleOrderExpand(order.orderId)}
            onDelete={() => handleDeleteCafeOrder(order.orderId)}
            onMarkPaid={() => handleMarkOrderPaid(order.orderId)}
            onPrint={() => handlePrintSingleSavedOrder(order)}
          />
        ))}
      </OrdersSection>

      {/* Paid Orders Section */}
      <OrdersSection
        title="طلبات مدفوعة"
        orders={filteredPaidOrders}
        emptyMessage="لا توجد طلبات مدفوعة"
        borderColor="border-green-500"
        bgColor="bg-green-500"
        badgeColor="bg-green-50 text-green-700"
      >
        {filteredPaidOrders.map((order) => (
          <OrderCard
            key={`paid-${order.orderId}`}
            order={order}
            isExpanded={expandedOrders[order.orderId] || false}
            isDeleting={isDeleting === order.orderId}
            isMarkingPaid={false}
            onToggleExpand={() => toggleOrderExpand(order.orderId)}
            onDelete={() => handleDeleteCafeOrder(order.orderId)}
            onPrint={() => handlePrintSingleSavedOrder(order)}
          />
        ))}
      </OrdersSection>
    </div>
  )
}
