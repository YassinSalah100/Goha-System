// Journal Report Summary Component
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatEgyptianCurrency } from "@/lib/journal-utils"
import { ReportData, calculateReportMetrics } from "@/lib/journal-report-utils"
import { 
  DollarSign, 
  Users, 
  Clock, 
  TrendingUp,
  Receipt,
  UserCheck
} from "lucide-react"

interface JournalReportSummaryProps {
  reportData: ReportData
}

export const JournalReportSummary: React.FC<JournalReportSummaryProps> = ({ reportData }) => {
  const metrics = calculateReportMetrics(reportData)
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Financial Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي التكاليف</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatEgyptianCurrency(metrics.totalCost)}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            <div>المصروفات: {formatEgyptianCurrency(reportData.summary.totalExpenses)}</div>
            <div>الرواتب: {formatEgyptianCurrency(reportData.summary.totalSalaries)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Workers Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الموظفين</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {reportData.summary.workersCount.present} / {metrics.workersCount}
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              حاضر: {reportData.summary.workersCount.present}
            </Badge>
            {reportData.summary.workersCount.absent > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                غائب: {reportData.summary.workersCount.absent}
              </Badge>
            )}
            {reportData.summary.workersCount.late > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                متأخر: {reportData.summary.workersCount.late}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">معدل الحضور</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {metrics.attendanceRate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            من إجمالي {metrics.workersCount} موظفين
          </div>
        </CardContent>
      </Card>

      {/* Shift Duration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">مدة الوردية</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {reportData.shift.totalHours.toFixed(1)} ساعة
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {reportData.shift.endTime ? 'منتهية' : 'مستمرة'}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">عدد المصروفات</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.expensesCount}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            متوسط: {formatEgyptianCurrency(metrics.averageExpensePerCategory)}
          </div>
        </CardContent>
      </Card>

      {/* Average Salary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">متوسط الراتب</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatEgyptianCurrency(metrics.averageSalaryPerWorker)}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            لكل موظف
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
