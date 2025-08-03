// Report utility functions for daily journal reports
import { formatEgyptianCurrency } from './journal-utils'

export interface ReportData {
  date: string
  shift: {
    startTime: string
    endTime?: string
    cashier: string
    totalHours: number
  }
  expenses: Array<{
    id: string
    category: string
    item: string
    amount: number
    description?: string
    timestamp: string
  }>
  workers: Array<{
    id: string
    name: string
    hours: number
    hourlyRate: number
    totalSalary: number
    status: 'present' | 'absent' | 'late'
  }>
  summary: {
    totalExpenses: number
    totalSalaries: number
    expensesByCategory: Record<string, number>
    workersCount: {
      present: number
      absent: number
      late: number
    }
  }
}

export const generateDailyReport = (
  expenses: any[],
  workers: any[],
  shiftData: any
): ReportData => {
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
  
  // Calculate worker statistics
  const workersCount = workers.reduce(
    (acc, worker) => {
      acc[worker.status || 'present']++
      return acc
    },
    { present: 0, absent: 0, late: 0 }
  )
  
  const totalSalaries = workers.reduce(
    (sum, worker) => sum + (worker.totalSalary || 0),
    0
  )
  
  return {
    date: new Date().toISOString().split('T')[0],
    shift: {
      startTime: shiftData?.startTime || new Date().toISOString(),
      endTime: shiftData?.endTime,
      cashier: shiftData?.cashierName || 'غير محدد',
      totalHours: shiftData?.totalHours || 0
    },
    expenses: expenses.map(expense => ({
      id: expense.id,
      category: expense.category,
      item: expense.item,
      amount: expense.amount,
      description: expense.description,
      timestamp: expense.createdAt || expense.timestamp
    })),
    workers: workers.map(worker => ({
      id: worker.id,
      name: worker.name || 'موظف غير محدد',
      hours: worker.hours || 0,
      hourlyRate: worker.hourlyRate || 0,
      totalSalary: worker.totalSalary || 0,
      status: worker.status || 'present'
    })),
    summary: {
      totalExpenses,
      totalSalaries,
      expensesByCategory,
      workersCount
    }
  }
}

export const formatReportForPrint = (reportData: ReportData): string => {
  const date = new Date(reportData.date).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  return `
تقرير يومية المصروفات والموظفين - ${date}

=== معلومات الوردية ===
الكاشير: ${reportData.shift.cashier}
وقت البداية: ${new Date(reportData.shift.startTime).toLocaleTimeString('ar-EG')}
${reportData.shift.endTime ? `وقت النهاية: ${new Date(reportData.shift.endTime).toLocaleTimeString('ar-EG')}` : 'الوردية مستمرة'}
إجمالي الساعات: ${reportData.shift.totalHours.toFixed(2)} ساعة

=== ملخص المالي ===
إجمالي المصروفات: ${formatEgyptianCurrency(reportData.summary.totalExpenses)}
إجمالي الرواتب: ${formatEgyptianCurrency(reportData.summary.totalSalaries)}
إجمالي التكاليف: ${formatEgyptianCurrency(reportData.summary.totalExpenses + reportData.summary.totalSalaries)}

=== المصروفات حسب الفئة ===
${Object.entries(reportData.summary.expensesByCategory)
  .map(([category, amount]) => `${category}: ${formatEgyptianCurrency(amount)}`)
  .join('\n')}

=== تفاصيل المصروفات ===
${reportData.expenses.map(expense => 
  `• ${expense.item} (${expense.category}) - ${formatEgyptianCurrency(expense.amount)}${expense.description ? ` - ${expense.description}` : ''}`
).join('\n')}

=== الموظفين ===
الحاضرين: ${reportData.summary.workersCount.present}
الغائبين: ${reportData.summary.workersCount.absent}
المتأخرين: ${reportData.summary.workersCount.late}

تفاصيل الموظفين:
${reportData.workers.map(worker => 
  `• ${worker.name} - ${worker.hours.toFixed(2)} ساعة - ${formatEgyptianCurrency(worker.totalSalary)} (${worker.status === 'present' ? 'حاضر' : worker.status === 'late' ? 'متأخر' : 'غائب'})`
).join('\n')}

---
تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}
  `.trim()
}

export const exportReportAsJSON = (reportData: ReportData): string => {
  return JSON.stringify(reportData, null, 2)
}

export const calculateReportMetrics = (reportData: ReportData) => {
  const averageExpensePerCategory = Object.keys(reportData.summary.expensesByCategory).length > 0
    ? reportData.summary.totalExpenses / Object.keys(reportData.summary.expensesByCategory).length
    : 0
  
  const averageSalaryPerWorker = reportData.workers.length > 0
    ? reportData.summary.totalSalaries / reportData.workers.length
    : 0
  
  const attendanceRate = reportData.workers.length > 0
    ? (reportData.summary.workersCount.present / reportData.workers.length) * 100
    : 0
  
  return {
    averageExpensePerCategory,
    averageSalaryPerWorker,
    attendanceRate,
    totalCost: reportData.summary.totalExpenses + reportData.summary.totalSalaries,
    expensesCount: reportData.expenses.length,
    workersCount: reportData.workers.length
  }
}
