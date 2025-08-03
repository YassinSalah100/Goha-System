"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatEgyptianCurrency } from "@/lib/journal-utils"
import { Trash2, Eye, Calendar, Receipt } from "lucide-react"

interface Expense {
  id: string
  item: string
  amount: number
  category: string
  description?: string
  time: string
  date: string
}

interface ExpenseListProps {
  expenses: Expense[]
  onDeleteExpense: (id: string) => Promise<void>
  isLoading: boolean
}

const categoryColors: Record<string, string> = {
  "مواد أولية": "bg-blue-100 text-blue-800",
  "مصروفات إدارية": "bg-green-100 text-green-800",
  "صيانة": "bg-orange-100 text-orange-800",
  "نظافة": "bg-purple-100 text-purple-800",
  "مرافق": "bg-yellow-100 text-yellow-800",
  "أخرى": "bg-gray-100 text-gray-800"
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ 
  expenses, 
  onDeleteExpense, 
  isLoading 
}) => {
  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">لا توجد مصروفات اليوم</h3>
          <p className="text-gray-400">ابدأ بإضافة أول مصروف لهذا اليوم</p>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            مصروفات اليوم ({expenses.length})
          </CardTitle>
          <div className="bg-blue-50 px-3 py-1 rounded-lg">
            <span className="text-blue-700 font-semibold">
              الإجمالي: {formatEgyptianCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div 
              key={expense.id} 
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{expense.item}</h4>
                    <Badge 
                      className={categoryColors[expense.category] || categoryColors["أخرى"]}
                    >
                      {expense.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Receipt className="w-4 h-4" />
                      <span className="font-semibold text-green-600">
                        {formatEgyptianCurrency(expense.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{expense.time}</span>
                    </div>
                  </div>
                  
                  {expense.description && (
                    <p className="text-sm text-gray-500 mt-2">{expense.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => onDeleteExpense(expense.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
