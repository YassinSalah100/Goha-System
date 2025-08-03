// Arabic PDF export utility for journal reports using HTML2PDF
const html2pdf = require('html2pdf.js')
import { ReportData } from './journal-report-utils'
import { formatEgyptianCurrency } from './journal-utils'

// Arabic labels for the PDF report
const ARABIC_LABELS = {
  REPORT_TITLE: 'تقرير يومية المصروفات والموظفين',
  SHIFT_INFO: 'معلومات الوردية',
  CASHIER: 'الكاشير',
  START_TIME: 'وقت البداية',
  END_TIME: 'وقت النهاية',
  TOTAL_HOURS: 'إجمالي الساعات',
  HOURS: 'ساعة',
  ONGOING: 'مستمرة',
  FINANCIAL_SUMMARY: 'الملخص المالي',
  TOTAL_EXPENSES: 'إجمالي المصروفات',
  TOTAL_SALARIES: 'إجمالي الرواتب',
  TOTAL_COSTS: 'إجمالي التكاليف',
  EXPENSES_BY_CATEGORY: 'المصروفات حسب الفئة',
  CATEGORY: 'الفئة',
  AMOUNT: 'المبلغ',
  DETAILED_EXPENSES: 'تفاصيل المصروفات',
  ITEM: 'البند',
  TIME: 'الوقت',
  DESCRIPTION: 'الوصف',
  STAFF_DETAILS: 'تفاصيل الموظفين',
  WORKER_NAME: 'اسم الموظف',
  WORKED_HOURS: 'ساعات العمل',
  HOURLY_RATE: 'معدل الساعة',
  TOTAL_SALARY: 'إجمالي الراتب',
  STAFF_SUMMARY: 'ملخص الموظفين',
  TOTAL_WORKERS: 'إجمالي الموظفين',
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  LATE: 'متأخر',
  GENERATED_ON: 'تم إنشاء التقرير في',
  PREVIEW: 'معاينة التقرير',
  DOWNLOAD: 'تحميل PDF',
  CLOSE: 'إغلاق'
}

// Arabic category labels
const getCategoryLabelArabic = (category: string): string => {
  const categories: Record<string, string> = {
    'food_supplies': 'مواد غذائية',
    'beverages': 'مشروبات',
    'utilities': 'مرافق',
    'maintenance': 'صيانة',
    'cleaning': 'تنظيف',
    'delivery': 'توصيل',
    'packaging': 'تغليف',
    'communication': 'اتصالات',
    'fuel': 'وقود',
    'other': 'أخرى'
  }
  return categories[category] || category
}

const getStatusLabelArabic = (status: string): string => {
  const statusLabels: Record<string, string> = {
    'present': 'حاضر',
    'absent': 'غائب',
    'late': 'متأخر'
  }
  return statusLabels[status] || 'حاضر'
}

// Preview the PDF in a modal before downloading
export const previewArabicJournalReportPDF = (reportData: ReportData): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create HTML content for preview
    const htmlContent = createSimpleArabicReportHTML(reportData)
    
    // Create modal for preview
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      direction: rtl;
    `
    
    const modalContent = document.createElement('div')
    modalContent.style.cssText = `
      background: white;
      width: 90%;
      max-width: 900px;
      max-height: 90%;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `
    
    const modalHeader = document.createElement('div')
    modalHeader.style.cssText = `
      background: #1e40af;
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `
    modalHeader.innerHTML = `
      <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${ARABIC_LABELS.PREVIEW}</h3>
      <div>
        <button id="downloadBtn" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          margin-left: 8px;
          cursor: pointer;
          font-weight: 500;
        ">${ARABIC_LABELS.DOWNLOAD}</button>
        <button id="closeBtn" style="
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        ">${ARABIC_LABELS.CLOSE}</button>
      </div>
    `
    
    const previewContainer = document.createElement('div')
    previewContainer.style.cssText = `
      max-height: 70vh;
      overflow-y: auto;
      padding: 0;
    `
    previewContainer.innerHTML = htmlContent
    
    modalContent.appendChild(modalHeader)
    modalContent.appendChild(previewContainer)
    modal.appendChild(modalContent)
    document.body.appendChild(modal)
    
    // Handle close button
    const closeBtn = modal.querySelector('#closeBtn') as HTMLButtonElement
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve(false)
    })
    
    // Handle download button
    const downloadBtn = modal.querySelector('#downloadBtn') as HTMLButtonElement
    downloadBtn.addEventListener('click', async () => {
      document.body.removeChild(modal)
      await generateArabicJournalReportPDF(reportData)
      resolve(true)
    })
    
    // Handle backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
        resolve(false)
      }
    })
  })
}

// Download the PDF directly
export const generateArabicJournalReportPDF = async (reportData: ReportData): Promise<void> => {
  // Create HTML content for the PDF
  const htmlContent = createSimpleArabicReportHTML(reportData)
  
  // Configure html2pdf options
  const options = {
    margin: [15, 10, 15, 10],
    filename: `تقرير-يومية-${reportData.date}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait'
    }
  }

  try {
    // Generate PDF from HTML
    const element = document.createElement('div')
    element.innerHTML = htmlContent
    
    await html2pdf().set(options).from(element).save()
  } catch (error) {
    console.error('Error generating Arabic PDF:', error)
    throw new Error('خطأ في إنشاء ملف PDF')
  }
}

// Create a simple, clean HTML version for better user experience
const createSimpleArabicReportHTML = (reportData: ReportData): string => {
  const date = new Date(reportData.date).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${ARABIC_LABELS.REPORT_TITLE}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Noto Sans Arabic', Arial, sans-serif;
          direction: rtl;
          text-align: right;
          background: #ffffff;
          color: #333;
          line-height: 1.5;
          font-size: 14px;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          border-bottom: 2px solid #ddd;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          margin: 0 auto 15px;
          background: #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: 600;
          background-image: url('/images/logo.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        
        .title {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        
        .date {
          font-size: 16px;
          color: #666;
          font-weight: 400;
        }
        
        .section {
          margin-bottom: 25px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ddd;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .summary-card {
          text-align: center;
          padding: 15px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
        }
        
        .card-label {
          font-size: 13px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .card-amount {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        
        .info-item:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-weight: 500;
          color: #555;
        }
        
        .info-value {
          color: #333;
          font-weight: 400;
        }
        
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          background: white;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .simple-table th {
          background: #f5f5f5;
          padding: 12px 8px;
          font-weight: 600;
          text-align: right;
          border: 1px solid #ddd;
          color: #333;
          font-size: 13px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .simple-table td {
          padding: 10px 8px;
          border: 1px solid #ddd;
          font-size: 13px;
          color: #333;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .simple-table tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .simple-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .amount {
          font-weight: 600;
          color: #2c5e2e;
        }
        
        .no-data {
          text-align: center;
          color: #999;
          font-style: italic;
          padding: 20px;
          background: white;
          border: 1px dashed #ccc;
          border-radius: 6px;
          margin: 10px 0;
        }
        
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 15px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
        
        @media print {
          body { 
            background: white;
            padding: 15px;
          }
          .section {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .simple-table {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .simple-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .simple-table th {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .simple-table td {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .section-title {
            break-after: avoid;
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="logo">
          <div style="display: none;">ش</div>
        </div>
        <h1 class="title">${ARABIC_LABELS.REPORT_TITLE}</h1>
        <div class="date">${date}</div>
      </div>

      <!-- Financial Summary -->
      <div class="section">
        <h2 class="section-title">${ARABIC_LABELS.FINANCIAL_SUMMARY}</h2>
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-label">${ARABIC_LABELS.TOTAL_EXPENSES}</div>
            <div class="card-amount">${formatEgyptianCurrency(reportData.summary.totalExpenses)}</div>
          </div>
          <div class="summary-card">
            <div class="card-label">${ARABIC_LABELS.TOTAL_SALARIES}</div>
            <div class="card-amount">${formatEgyptianCurrency(reportData.summary.totalSalaries)}</div>
          </div>
          <div class="summary-card">
            <div class="card-label">${ARABIC_LABELS.TOTAL_COSTS}</div>
            <div class="card-amount">${formatEgyptianCurrency(reportData.summary.totalExpenses + reportData.summary.totalSalaries)}</div>
          </div>
        </div>
      </div>

      <!-- Shift Information -->
      <div class="section">
        <h2 class="section-title">${ARABIC_LABELS.SHIFT_INFO}</h2>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">${ARABIC_LABELS.CASHIER}</span>
              <span class="info-value">${reportData.shift.cashier}</span>
            </div>
            <div class="info-item">
              <span class="info-label">${ARABIC_LABELS.START_TIME}</span>
              <span class="info-value">${new Date(reportData.shift.startTime).toLocaleTimeString('ar-EG')}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">${ARABIC_LABELS.END_TIME}</span>
              <span class="info-value">${reportData.shift.endTime ? new Date(reportData.shift.endTime).toLocaleTimeString('ar-EG') : ARABIC_LABELS.ONGOING}</span>
            </div>
            <div class="info-item">
              <span class="info-label">${ARABIC_LABELS.TOTAL_HOURS}</span>
              <span class="info-value">${reportData.shift.totalHours.toFixed(2)} ${ARABIC_LABELS.HOURS}</span>
            </div>
          </div>
        </div>
      </div>

      ${generateSimpleExpensesSection(reportData)}
      ${generateSimpleStaffSection(reportData)}

      <!-- Footer -->
      <div class="footer">
        ${ARABIC_LABELS.GENERATED_ON}: ${new Date().toLocaleString('ar-EG')}
      </div>
    </body>
    </html>
  `
}

// Generate simple expenses section
const generateSimpleExpensesSection = (reportData: ReportData): string => {
  if (!reportData.expenses || reportData.expenses.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${ARABIC_LABELS.DETAILED_EXPENSES}</h2>
        <div class="no-data">لا توجد مصروفات مسجلة لهذا اليوم</div>
      </div>
    `
  }

  const expenseRows = reportData.expenses.map(expense => `
    <tr>
      <td>${expense.item || 'غير محدد'}</td>
      <td>${getCategoryLabelArabic(expense.category)}</td>
      <td class="amount">${formatEgyptianCurrency(expense.amount)}</td>
      <td>${new Date(expense.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
    </tr>
  `).join('')

  return `
    <div class="section">
      <h2 class="section-title">${ARABIC_LABELS.DETAILED_EXPENSES}</h2>
      <table class="simple-table">
        <thead>
          <tr>
            <th>${ARABIC_LABELS.ITEM}</th>
            <th>${ARABIC_LABELS.CATEGORY}</th>
            <th>${ARABIC_LABELS.AMOUNT}</th>
            <th>${ARABIC_LABELS.TIME}</th>
          </tr>
        </thead>
        <tbody>
          ${expenseRows}
        </tbody>
      </table>
    </div>
  `
}

// Generate simple staff section
const generateSimpleStaffSection = (reportData: ReportData): string => {
  console.log('Staff Section Debug:', {
    workers: reportData.workers,
    workersLength: reportData.workers?.length,
    workersData: JSON.stringify(reportData.workers, null, 2)
  })

  if (!reportData.workers || reportData.workers.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${ARABIC_LABELS.STAFF_DETAILS}</h2>
        <div class="no-data">لا يوجد موظفين مسجلين لهذا اليوم</div>
        <div style="font-size: 12px; color: #999; margin-top: 10px;">
          عدد الموظفين في البيانات: ${reportData.workers?.length || 0}
        </div>
      </div>
    `
  }

  // Create a more compact layout to prevent table breaking
  const workersList = reportData.workers.map((worker, index) => `
    <div style="
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 12px; 
      background: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'}; 
      border-bottom: 1px solid #eee;
      break-inside: avoid;
      page-break-inside: avoid;
    ">
      <div style="flex: 2; font-weight: 600; color: #333;">
        ${worker.name || 'موظف غير محدد'}
      </div>
      <div style="flex: 1; text-align: center; color: #666;">
        ${(worker.hours || 0).toFixed(2)} ${ARABIC_LABELS.HOURS}
      </div>
      <div style="flex: 1; text-align: center; color: #666;">
        ${formatEgyptianCurrency(worker.hourlyRate || 0)}
      </div>
      <div style="flex: 1; text-align: center; font-weight: 600; color: #2c5e2e;">
        ${formatEgyptianCurrency(worker.totalSalary || 0)}
      </div>
      <div style="flex: 1; text-align: center; color: #666;">
        ${getStatusLabelArabic(worker.status || 'present')}
      </div>
    </div>
  `).join('')

  return `
    <div class="section" style="break-inside: avoid; page-break-inside: avoid;">
      <h2 class="section-title">${ARABIC_LABELS.STAFF_DETAILS}</h2>
      
      <!-- Workers Header -->
      <div style="
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 12px; 
        background: #f5f5f5; 
        border: 1px solid #ddd;
        font-weight: 600;
        color: #333;
        break-inside: avoid;
        page-break-inside: avoid;
      ">
        <div style="flex: 2;">${ARABIC_LABELS.WORKER_NAME}</div>
        <div style="flex: 1; text-align: center;">${ARABIC_LABELS.WORKED_HOURS}</div>
        <div style="flex: 1; text-align: center;">${ARABIC_LABELS.HOURLY_RATE}</div>
        <div style="flex: 1; text-align: center;">${ARABIC_LABELS.TOTAL_SALARY}</div>
        <div style="flex: 1; text-align: center;">الحالة</div>
      </div>
      
      <!-- Workers List -->
      <div style="border: 1px solid #ddd; border-top: none; break-inside: avoid; page-break-inside: avoid;">
        ${workersList}
      </div>
      
      <!-- Workers Summary -->
      <div style="
        margin-top: 15px; 
        padding: 15px; 
        background: white; 
        border: 1px solid #ddd;
        border-radius: 4px; 
        break-inside: avoid;
        page-break-inside: avoid;
      ">
        <div style="font-weight: 600; margin-bottom: 8px; color: #333;">ملخص الموظفين:</div>
        <div style="display: flex; justify-content: space-around; font-size: 14px; color: #666;">
          <span>الحاضرين: <strong style="color: #2c5e2e;">${reportData.summary?.workersCount?.present || 0}</strong></span>
          <span>الغائبين: <strong style="color: #dc2626;">${reportData.summary?.workersCount?.absent || 0}</strong></span>
          <span>المتأخرين: <strong style="color: #ea580c;">${reportData.summary?.workersCount?.late || 0}</strong></span>
        </div>
      </div>
    </div>
  `
}
