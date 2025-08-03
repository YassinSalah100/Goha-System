"use client"
import React from "react"

interface Extra {
  id: string
  name: string
  price: number
}

interface Item {
  id: string
  name: string
  basePrice: number
  quantity: number
  size: string
  notes?: string
  extras?: Extra[]
}

interface OrderDetailTableProps {
  items: Item[]
  orderId: string
  formatCurrency: (amount: number) => string
}

export const OrderDetailTable: React.FC<OrderDetailTableProps> = ({
  items,
  orderId,
  formatCurrency,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="h-12 w-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-400">📦</span>
        </div>
        <p>لا توجد عناصر في هذا الطلب</p>
      </div>
    )
  }

  const totalProducts = items.reduce((sum: number, item: Item) => sum + (item.basePrice * item.quantity), 0)
  const totalExtras = items.reduce((sum: number, item: Item) => 
    sum + (item.extras?.reduce((extraSum: number, extra: Extra) => extraSum + (extra.price * item.quantity), 0) || 0), 0)
  const grandTotal = totalProducts + totalExtras

  return (
    <div className="space-y-4">
      {/* Mobile View - Stacked Cards */}
      <div className="block md:hidden space-y-3">
        {items.map((item: Item, index: number) => {
          const itemBaseTotal = item.basePrice * item.quantity;
          const extrasTotal = item.extras?.reduce((sum: number, extra: Extra) => sum + (extra.price * item.quantity), 0) || 0;
          
          return (
            <div key={`${orderId}-mobile-item-${item.id || index}`} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h6 className="font-medium text-gray-800">{item.name}</h6>
                  {item.size && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                      {item.size}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-700 text-lg">
                    {formatCurrency(itemBaseTotal + extrasTotal)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(item.basePrice)} × {item.quantity}
                  </div>
                </div>
              </div>

              {/* Mobile Extras */}
              {item.extras && item.extras.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded border">
                  <div className="text-xs font-medium text-blue-700 mb-2">الإضافات:</div>
                  {item.extras.map((extra: Extra, i: number) => (
                    <div key={extra.id || i} className="flex justify-between text-xs text-blue-600 mb-1">
                      <span>+ {extra.name}</span>
                      <span>{formatCurrency(extra.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-blue-200 pt-1 mt-1">
                    <div className="flex justify-between text-xs font-semibold text-blue-700">
                      <span>مجموع الإضافات:</span>
                      <span>{formatCurrency(extrasTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Notes */}
              {item.notes && item.notes.trim() && (
                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <div className="text-xs">
                    <span className="font-medium text-yellow-700">ملاحظة:</span>
                    <span className="text-yellow-600 mr-1">{item.notes}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-right font-semibold">المنتج</th>
              <th className="py-3 px-4 text-center font-semibold">الحجم</th>
              <th className="py-3 px-4 text-center font-semibold">الكمية</th>
              <th className="py-3 px-4 text-center font-semibold">سعر الوحدة</th>
              <th className="py-3 px-4 text-center font-semibold">إجمالي المنتج</th>
              <th className="py-3 px-4 text-center font-semibold">الإضافات</th>
              <th className="py-3 px-4 text-center font-semibold">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: Item, index: number) => {
              const itemBaseTotal = item.basePrice * item.quantity;
              const extrasTotal = item.extras?.reduce((sum: number, extra: Extra) => sum + (extra.price * item.quantity), 0) || 0;
              
              return (
                <tr key={`${orderId}-desktop-item-${item.id || index}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{item.name}</td>
                  <td className="py-3 px-4 text-center">
                    {item.size ? (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {item.size}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">{item.quantity}</td>
                  <td className="py-3 px-4 text-center">{formatCurrency(item.basePrice)}</td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-700">
                    {formatCurrency(itemBaseTotal)}
                  </td>
                  <td className="py-3 px-4">
                    {item.extras && item.extras.length > 0 ? (
                      <div className="space-y-1">
                        <table className="w-full text-xs border border-blue-100 rounded">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="px-2 py-1 text-right">الإضافة</th>
                              <th className="px-2 py-1 text-center">سعر الوحدة</th>
                              <th className="px-2 py-1 text-center">الكمية</th>
                              <th className="px-2 py-1 text-center">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.extras.map((extra: Extra, i: number) => (
                              <tr key={extra.id || i} className="border-b border-blue-50">
                                <td className="px-2 py-1 text-right">{extra.name}</td>
                                <td className="px-2 py-1 text-center">{formatCurrency(extra.price)}</td>
                                <td className="px-2 py-1 text-center">{item.quantity}</td>
                                <td className="px-2 py-1 text-center font-semibold text-blue-700">
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
                  <td className="py-3 px-4">
                    {item.notes && item.notes.trim() ? (
                      <div className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded border border-yellow-200 max-w-[150px]">
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
      </div>

      {/* Order Summary */}
      <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
        <h6 className="font-semibold text-gray-700 mb-3">ملخص الطلب:</h6>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between p-2 bg-white rounded border">
            <span className="text-gray-600">إجمالي المنتجات:</span>
            <span className="font-semibold text-blue-700">{formatCurrency(totalProducts)}</span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded border">
            <span className="text-gray-600">إجمالي الإضافات:</span>
            <span className="font-semibold text-orange-700">{formatCurrency(totalExtras)}</span>
          </div>
          <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
            <span className="text-green-800 font-semibold">المجموع الكلي:</span>
            <span className="font-bold text-green-700 text-lg">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
