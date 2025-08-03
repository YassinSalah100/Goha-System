"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  RefreshCw,
  Printer,
  CheckCircle,
  Loader2,
  Search,
} from "lucide-react"

interface SavedOrdersHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  onPrintAll: () => void
  onConfirmAllPayments: () => void
  isUpdating: boolean
  isConfirmingAll: boolean
  totalOrders: number
  unpaidOrders: number
  paidOrders: number
  totalUnpaid: number
  totalPaid: number
}

export const SavedOrdersHeader: React.FC<SavedOrdersHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  onPrintAll,
  onConfirmAllPayments,
  isUpdating,
  isConfirmingAll,
  totalOrders,
  unpaidOrders,
  paidOrders,
  totalUnpaid,
  totalPaid,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Search and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="بحث برقم الطاولة أو اسم الموظف أو رقم الطلب..."
            className="pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isUpdating}
            className="text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            تحديث
          </Button>
          
          <Button
            onClick={onPrintAll}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={totalOrders === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            طباعة الكل
          </Button>
          
          <Button
            onClick={onConfirmAllPayments}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isConfirmingAll || unpaidOrders === 0}
          >
            {isConfirmingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            تأكيد دفع الكل
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold text-amber-700">إجمالي الطلبات:</span>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 font-semibold">
              {totalOrders}
            </Badge>
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold text-red-600">غير مدفوع:</span>
            <Badge variant="outline" className="bg-red-100 text-red-700 font-semibold">
              {unpaidOrders} ({totalUnpaid.toFixed(2)} ج.م)
            </Badge>
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold text-green-600">مدفوع:</span>
            <Badge variant="outline" className="bg-green-100 text-green-700 font-semibold">
              {paidOrders} ({totalPaid.toFixed(2)} ج.م)
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
