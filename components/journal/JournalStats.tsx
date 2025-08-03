"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatEgyptianCurrency } from "@/lib/journal-utils"
import { Receipt, Users, UserCheck, RefreshCw } from "lucide-react"

interface JournalStatsProps {
  totalExpenses: number
  totalStaffCost: number
  activeStaffCount: number
  onRefresh: () => void
  isLoading: boolean
}

export const JournalStats: React.FC<JournalStatsProps> = ({
  totalExpenses,
  totalStaffCost,
  activeStaffCount,
  onRefresh,
  isLoading
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-l-4 border-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">المصروفات اليوم</p>
              <p className="text-xl font-bold text-blue-600">{formatEgyptianCurrency(totalExpenses)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">تكلفة الموظفين</p>
              <p className="text-xl font-bold text-green-600">{formatEgyptianCurrency(totalStaffCost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">الموظفين الحاضرين</p>
              <p className="text-xl font-bold text-purple-600">{activeStaffCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
