// Journal Daily Report Dialog Component
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ReportData, formatReportForPrint, exportReportAsJSON } from "@/lib/journal-report-utils"
import { generateJournalReportPDF } from "@/lib/pdf-journal-utils"
import { previewArabicJournalReportPDF, generateArabicJournalReportPDF } from "@/lib/pdf-arabic-utils"
import { JournalReportSummary } from "./ReportSummary"
import { JournalReportDetails } from "./ReportDetails"
import { 
  FileText, 
  Download, 
  Printer, 
  Eye,
  BarChart3,
  X
} from "lucide-react"

interface JournalDailyReportDialogProps {
  isOpen: boolean
  onClose: () => void
  reportData: ReportData | null
  isLoading?: boolean
}

export const JournalDailyReportDialog: React.FC<JournalDailyReportDialogProps> = ({
  isOpen,
  onClose,
  reportData,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('summary')

  const handlePrint = () => {
    if (!reportData) return
    
    const printContent = formatReportForPrint(reportData)
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>تقرير يومية المصروفات والموظفين - ${new Date(reportData.date).toLocaleDateString('ar-EG')}</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                direction: rtl;
                text-align: right;
                margin: 20px;
                line-height: 1.6;
              }
              pre { 
                white-space: pre-wrap; 
                font-family: inherit;
                font-size: 14px;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownloadJSON = () => {
    if (!reportData) return
    
    const jsonContent = exportReportAsJSON(reportData)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `journal-daily-report-${reportData.date}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadText = () => {
    if (!reportData) return
    
    const textContent = formatReportForPrint(reportData)
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `journal-daily-report-${reportData.date}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPDF = async () => {
    if (!reportData) return
    
    try {
      // Use the new preview function to show PDF before downloading
      await previewArabicJournalReportPDF(reportData)
    } catch (error) {
      console.error('Error previewing Arabic PDF:', error)
      // Fallback to direct download if preview fails
      try {
        await generateArabicJournalReportPDF(reportData)
      } catch (fallbackError) {
        console.error('Error generating Arabic PDF:', fallbackError)
        // Final fallback to original PDF generator
        try {
          generateJournalReportPDF(reportData)
        } catch (finalError) {
          console.error('Error generating PDF:', finalError)
          // You could add a toast notification here for error handling
        }
      }
    }
  }

  if (!reportData && !isLoading) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              تقرير يومية المصروفات والموظفين
              {reportData && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {new Date(reportData.date).toLocaleDateString('ar-EG')}
                </span>
              )}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription>
            تقرير شامل يتضمن تفاصيل المصروفات والموظفين لليوم المحدد
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحضير التقرير...</p>
            </div>
          </div>
        ) : reportData ? (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  ملخص التقرير
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  التفاصيل الكاملة
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4" style={{ maxHeight: '60vh' }}>
                <TabsContent value="summary" className="space-y-4">
                  <JournalReportSummary reportData={reportData} />
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <JournalReportDetails reportData={reportData} />
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <Separator />

            <DialogFooter>
              <div className="flex items-center gap-2 w-full">
                <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  طباعة
                </Button>
                
                <Button variant="outline" onClick={handleDownloadPDF} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200">
                  <Eye className="w-4 h-4" />
                  معاينة وتحميل PDF
                </Button>
                
                <Button variant="outline" onClick={handleDownloadText} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  تحميل نص
                </Button>
                
                <Button variant="outline" onClick={handleDownloadJSON} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  تحميل JSON
                </Button>
                
                <div className="flex-1"></div>
                
                <Button variant="secondary" onClick={onClose}>
                  إغلاق
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
