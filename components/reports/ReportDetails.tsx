// Journal Report Details Component
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatEgyptianCurrency } from "@/lib/journal-utils"
import { ReportData } from "@/lib/journal-report-utils"
import { 
  Receipt, 
  Users, 
  Clock,
  Calendar,
  User,
  Package
} from "lucide-react"

interface JournalReportDetailsProps {
  reportData: ReportData
}

export const JournalReportDetails: React.FC<JournalReportDetailsProps> = ({ reportData }) => {
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'food_supplies': 'مواد غذائية',
      'beverages': 'مشروبات',
      'utilities': 'مرافق',
      'maintenance': 'صيانة',
      'transport': 'مواصلات',
      'communications': 'اتصالات',
      'other': 'أخرى'
    }
    return categories[category] || category
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'present': { label: 'حاضر', className: 'bg-green-100 text-green-700' },
      'absent': { label: 'غائب', className: 'bg-red-100 text-red-700' },
      'late': { label: 'متأخر', className: 'bg-yellow-100 text-yellow-700' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present
    return <Badge className={config.className}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Shift Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            معلومات الوردية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">التاريخ:</span>
                <span className="font-medium">{formatDate(reportData.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">الكاشير:</span>
                <span className="font-medium">{reportData.shift.cashier}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">بداية الوردية:</span>
                <span className="font-medium">{formatTime(reportData.shift.startTime)}</span>
              </div>
              {reportData.shift.endTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">نهاية الوردية:</span>
                  <span className="font-medium">{formatTime(reportData.shift.endTime)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">إجمالي الساعات:</span>
                <span className="font-medium">{reportData.shift.totalHours.toFixed(2)} ساعة</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            المصروفات حسب الفئة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(reportData.summary.expensesByCategory).map(([category, amount], index) => (
              <div key={`${category}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{getCategoryLabel(category)}</span>
                <span className="font-bold text-lg">{formatEgyptianCurrency(amount)}</span>
              </div>
            ))}
            {Object.keys(reportData.summary.expensesByCategory).length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                لا توجد مصروفات مسجلة
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            تفاصيل المصروفات ({reportData.expenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.expenses.map((expense, index) => (
              <div key={`${expense.id}-${index}`} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{expense.item}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{getCategoryLabel(expense.category)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(expense.timestamp)}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground mt-1">{expense.description}</p>
                    )}
                  </div>
                  <div className="text-lg font-bold">
                    {formatEgyptianCurrency(expense.amount)}
                  </div>
                </div>
                {index < reportData.expenses.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
            {reportData.expenses.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                لا توجد مصروفات مسجلة
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workers Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            تفاصيل الموظفين ({reportData.workers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.workers.map((worker, index) => (
              <div key={`${worker.id}-${index}`} className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{worker.name}</h4>
                      {getStatusBadge(worker.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>{worker.hours.toFixed(2)} ساعة</span>
                      <span className="mx-2">•</span>
                      <span>{formatEgyptianCurrency(worker.hourlyRate)}/ساعة</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {formatEgyptianCurrency(worker.totalSalary)}
                  </div>
                </div>
                {index < reportData.workers.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
            {reportData.workers.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                لا يوجد موظفين مسجلين
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
