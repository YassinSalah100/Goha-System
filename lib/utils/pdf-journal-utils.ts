// PDF export utility for journal reports      
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ReportData } from './journal-report-utils'
import { formatEgyptianCurrency } from './journal-utils'

// Arabic text labels for better readability - Use English only to avoid encoding issues
const LABELS = {
  REPORT_TITLE: 'Daily Journal Report - Expenses & Staff',
  SHIFT_INFO: 'Shift Information',
  CASHIER: 'Cashier',
  START_TIME: 'Start Time',
  END_TIME: 'End Time',
  TOTAL_HOURS: 'Total Hours',
  HOURS: 'hours',
  ONGOING: 'Ongoing',
  FINANCIAL_SUMMARY: 'Financial Summary',
  TOTAL_EXPENSES: 'Total Expenses',
  TOTAL_SALARIES: 'Total Salaries',
  TOTAL_COSTS: 'Total Costs',
  EXPENSES_BY_CATEGORY: 'Expenses by Category',
  CATEGORY: 'Category',
  AMOUNT: 'Amount',
  DETAILED_EXPENSES: 'Detailed Expenses',
  ITEM: 'Item',
  TIME: 'Time',
  DESCRIPTION: 'Description',
  STAFF_DETAILS: 'Staff Details',
  WORKER_NAME: 'Worker Name',
  WORKED_HOURS: 'Worked Hours',
  HOURLY_RATE: 'Hourly Rate',
  TOTAL_SALARY: 'Total Salary',
  STAFF_SUMMARY: 'Staff Summary',
  TOTAL_WORKERS: 'Total Workers',
  TOTAL_WORK_HOURS: 'Total Work Hours'
}

export const generateJournalReportPDF = (reportData: ReportData): void => {
  // Create new PDF document
  const doc = new jsPDF('p', 'mm', 'a4')
  
  // Configure for better text rendering - use default font which handles Unicode better
  doc.setFont('helvetica')
  
  // Header information
  const pageWidth = doc.internal.pageSize.getWidth()
  const date = new Date(reportData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  // Title - English only to avoid encoding issues
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Daily Journal Report', pageWidth / 2, 15, { align: 'center' })
  doc.text('Expenses & Staff Management', pageWidth / 2, 25, { align: 'center' })
  
  // Date
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(date, pageWidth / 2, 35, { align: 'center' })
  
  let yPosition = 50
  
  // Shift Information Section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(LABELS.SHIFT_INFO, 20, yPosition)
  yPosition += 12
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  
  // Create a more organized layout for shift info using English labels only
  const shiftData = [
    [`${LABELS.CASHIER}:`, reportData.shift.cashier],
    [`${LABELS.START_TIME}:`, new Date(reportData.shift.startTime).toLocaleTimeString('en-US')],
    [`${LABELS.END_TIME}:`, reportData.shift.endTime ? new Date(reportData.shift.endTime).toLocaleTimeString('en-US') : LABELS.ONGOING],
    [`${LABELS.TOTAL_HOURS}:`, `${reportData.shift.totalHours.toFixed(2)} ${LABELS.HOURS}`]
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
  doc.text(LABELS.FINANCIAL_SUMMARY, 20, yPosition)
  yPosition += 12
  
  const financialData = [
    [`${LABELS.TOTAL_EXPENSES}:`, formatEgyptianCurrency(reportData.summary.totalExpenses)],
    [`${LABELS.TOTAL_SALARIES}:`, formatEgyptianCurrency(reportData.summary.totalSalaries)],
    [`${LABELS.TOTAL_COSTS}:`, formatEgyptianCurrency(reportData.summary.totalExpenses + reportData.summary.totalSalaries)]
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
    doc.text(LABELS.EXPENSES_BY_CATEGORY, 20, yPosition)
    yPosition += 10
    
    const categoryData = Object.entries(reportData.summary.expensesByCategory).map(([category, amount]) => [
      getCategoryLabel(category),
      formatEgyptianCurrency(amount)
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [[LABELS.CATEGORY, LABELS.AMOUNT]],
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
    doc.text(`${LABELS.DETAILED_EXPENSES} (${reportData.expenses.length})`, 20, yPosition)
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
      head: [[LABELS.ITEM, LABELS.CATEGORY, LABELS.AMOUNT, LABELS.TIME, LABELS.DESCRIPTION]],
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
    doc.text(`${LABELS.STAFF_DETAILS} (${reportData.workers.length})`, 20, yPosition)
    yPosition += 10
    
    const workersData = reportData.workers.map(worker => [
      worker.name,
      getStatusLabel(worker.status),
      `${worker.hours.toFixed(2)} ${LABELS.HOURS}`,
      formatEgyptianCurrency(worker.hourlyRate),
      formatEgyptianCurrency(worker.totalSalary)
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [[LABELS.WORKER_NAME, 'Status', LABELS.WORKED_HOURS, LABELS.HOURLY_RATE, LABELS.TOTAL_SALARY]],
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
  doc.text(LABELS.STAFF_SUMMARY, 20, yPosition)
  yPosition += 12
  
  const workersSummaryData = [
    ['Present:', workersCount.present.toString()],
    ['Absent:', workersCount.absent.toString()],
    ['Late:', workersCount.late.toString()],
    [`${LABELS.TOTAL_WORKERS}:`, reportData.workers.length.toString()]
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
  
  // Footer with English text to avoid encoding issues
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Report generated on: ${new Date().toLocaleString('en-US')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )
  
  // Save the PDF
  const fileName = `journal-daily-report-${reportData.date}.pdf`
  doc.save(fileName)
}

// Helper functions - Use English labels to avoid encoding issues
const getCategoryLabel = (category: string): string => {
  const categories: Record<string, string> = {
    'food_supplies': 'Food Supplies',
    'beverages': 'Beverages', 
    'utilities': 'Utilities',
    'maintenance': 'Maintenance',
    'cleaning': 'Cleaning',
    'delivery': 'Delivery',
    'packaging': 'Packaging',
    'communication': 'Communications',
    'fuel': 'Fuel',
    'other': 'Other'
  }
  return categories[category] || category
}

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    'present': 'Present',
    'absent': 'Absent', 
    'late': 'Late'
  }
  return statusLabels[status] || 'Present'
}
