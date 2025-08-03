// PDF export utility for journal reports
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ReportData } from './journal-report-utils'
import { formatEgyptianCurrency } from './journal-utils'

export const generateJournalReportPDF = (reportData: ReportData): void => {
  // Create new PDF document
  const doc = new jsPDF('p', 'mm', 'a4')
  
  // Configure for better text rendering
  doc.setFont('helvetica')
  
  // Header information
  const pageWidth = doc.internal.pageSize.getWidth()
  const date = new Date(reportData.date).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  // Title - Arabic text centered
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Journal Expenses & Staff Report', pageWidth / 2, 15, { align: 'center' })
  doc.text('تقرير يومية المصروفات والموظفين', pageWidth / 2, 25, { align: 'center' })
  
  // Date
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(date, pageWidth / 2, 35, { align: 'center' })
  
  let yPosition = 50
  
  // Shift Information Section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Shift Information - معلومات الوردية', 20, yPosition)
  yPosition += 12
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  
  // Create a more organized layout for shift info
  const shiftData = [
    ['Cashier - الكاشير:', reportData.shift.cashier],
    ['Start Time - وقت البداية:', new Date(reportData.shift.startTime).toLocaleTimeString('en-US')],
    ['End Time - وقت النهاية:', reportData.shift.endTime ? new Date(reportData.shift.endTime).toLocaleTimeString('en-US') : 'Ongoing - مستمرة'],
    ['Total Hours - إجمالي الساعات:', `${reportData.shift.totalHours.toFixed(2)} hours`]
  ]
  
  // Use autoTable for better formatting
  autoTable(doc, {
    startY: yPosition,
    body: shiftData,
    styles: {
      fontSize: 11,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 100 }
    },
    margin: { left: 20, right: 20 }
  })
  
  yPosition = (doc as any).lastAutoTable.finalY + 15
  
  // Financial Summary Section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Financial Summary - الملخص المالي', 20, yPosition)
  yPosition += 12
  
  const financialData = [
    ['Total Expenses - إجمالي المصروفات:', formatEgyptianCurrency(reportData.summary.totalExpenses)],
    ['Total Salaries - إجمالي الرواتب:', formatEgyptianCurrency(reportData.summary.totalSalaries)],
    ['Total Costs - إجمالي التكاليف:', formatEgyptianCurrency(reportData.summary.totalExpenses + reportData.summary.totalSalaries)]
  ]
  
  autoTable(doc, {
    startY: yPosition,
    body: financialData,
    styles: {
      fontSize: 11,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 100 }
    },
    margin: { left: 20, right: 20 }
  })
  
  yPosition = (doc as any).lastAutoTable.finalY + 15
  
  // Expenses by Category Table
  if (Object.keys(reportData.summary.expensesByCategory).length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Expenses by Category - المصروفات حسب الفئة', 20, yPosition)
    yPosition += 10
    
    const categoryData = Object.entries(reportData.summary.expensesByCategory).map(([category, amount]) => [
      getCategoryLabel(category),
      formatEgyptianCurrency(amount)
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Category - الفئة', 'Amount - المبلغ']],
      body: categoryData,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 },
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }
  
  // Detailed Expenses Table
  if (reportData.expenses.length > 0) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Detailed Expenses (${reportData.expenses.length}) - تفاصيل المصروفات`, 20, yPosition)
    yPosition += 10
    
    const expenseData = reportData.expenses.map(expense => [
      expense.item,
      getCategoryLabel(expense.category),
      formatEgyptianCurrency(expense.amount),
      new Date(expense.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      expense.description || '-'
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Item - البند', 'Category - الفئة', 'Amount - المبلغ', 'Time - الوقت', 'Description - الوصف']],
      body: expenseData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        4: { cellWidth: 25 } // Description column width
      }
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }
  
  // Workers Details Table
  if (reportData.workers.length > 0) {
    // Check if we need a new page
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Staff Details (${reportData.workers.length}) - تفاصيل الموظفين`, 20, yPosition)
    yPosition += 10
    
    const workersData = reportData.workers.map(worker => [
      worker.name,
      getStatusLabel(worker.status),
      `${worker.hours.toFixed(2)} hrs`,
      formatEgyptianCurrency(worker.hourlyRate),
      formatEgyptianCurrency(worker.totalSalary)
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Name - الاسم', 'Status - الحالة', 'Hours - الساعات', 'Rate - السعر/ساعة', 'Total - الإجمالي']],
      body: workersData,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 },
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }
  
  // Workers Summary
  const workersCount = reportData.summary.workersCount
  if (yPosition > 270) {
    doc.addPage()
    yPosition = 20
  }
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Staff Summary - ملخص الموظفين', 20, yPosition)
  yPosition += 12
  
  const workersSummaryData = [
    ['Present - الحاضرين:', workersCount.present.toString()],
    ['Absent - الغائبين:', workersCount.absent.toString()],
    ['Late - المتأخرين:', workersCount.late.toString()],
    ['Total Staff - إجمالي الموظفين:', reportData.workers.length.toString()]
  ]
  
  autoTable(doc, {
    startY: yPosition,
    body: workersSummaryData,
    styles: {
      fontSize: 11,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 }
    },
    margin: { left: 20, right: 20 }
  })
  
  yPosition = (doc as any).lastAutoTable.finalY + 10
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )
  
  // Save the PDF
  const fileName = `journal-daily-report-${reportData.date}.pdf`
  doc.save(fileName)
}

// Helper functions
const getCategoryLabel = (category: string): string => {
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

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    'present': 'حاضر',
    'absent': 'غائب',
    'late': 'متأخر'
  }
  return statusLabels[status] || 'حاضر'
}
