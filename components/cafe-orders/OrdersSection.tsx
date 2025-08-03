"use client"
import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coffee } from "lucide-react"

interface OrdersSectionProps {
  title: string
  orders: any[]
  emptyMessage: string
  borderColor: string
  bgColor: string
  badgeColor: string
  children: React.ReactNode
}

export const OrdersSection: React.FC<OrdersSectionProps> = ({
  title,
  orders,
  emptyMessage,
  borderColor,
  bgColor,
  badgeColor,
  children,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-1 h-8 ${bgColor} rounded-full`}></div>
        <h3 className={`font-semibold text-lg ${borderColor.replace('border-', 'text-')}`}>
          {title}
        </h3>
        <Badge variant="outline" className={`${badgeColor}`}>
          {orders.length} طلب
        </Badge>
      </div>

      {orders.length === 0 ? (
        <Card className={`border-dashed ${borderColor.replace('border-', 'border-')} ${bgColor.replace('bg-', 'bg-')}/20`}>
          <CardContent className="p-8 text-center">
            <Coffee className={`h-12 w-12 mx-auto mb-3 ${borderColor.replace('border-', 'text-')}/60`} />
            <p className={`${borderColor.replace('border-', 'text-')} font-medium`}>
              {emptyMessage}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {children}
        </div>
      )}
    </div>
  )
}
