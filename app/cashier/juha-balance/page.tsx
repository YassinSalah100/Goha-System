"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, Receipt, Save, Trash2 } from "lucide-react"
import Image from "next/image"
import logo from "@/public/images/logo.png"

interface JuhaEntry {
  id: string
  date: string
  shiftType: "morning" | "evening"
  amount: number
  notes?: string
  created_at: string
}

export default function JuhaBalancePage() {
  const [entries, setEntries] = useState<JuhaEntry[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [shiftType, setShiftType] = useState<"morning" | "evening">("morning")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const printRef = useRef<HTMLDivElement>(null)

  // Load entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem("juhaEntries")
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed)
        }
      } catch (e) {
        // ignore parse error
      }
    }
  }, [])

  // Save entries to localStorage whenever they change (but not on first mount if empty)
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem("juhaEntries", JSON.stringify(entries))
    }
  }, [entries])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!date || !shiftType || !amount) {
      setError("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("يرجى إدخال مبلغ صحيح")
      return
    }

    const newEntry: JuhaEntry = {
      id: `${Date.now()}`,
      date,
      shiftType,
      amount: numAmount,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    }

    setEntries([...entries, newEntry])
    
    // Reset form
    setAmount("")
    setNotes("")
  }

  const handleDelete = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id))
  }

  const calculateTotal = () => {
    return entries.reduce((sum, entry) => sum + entry.amount, 0)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG')
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ج.م`
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML
      const originalContents = document.body.innerHTML
      document.body.innerHTML = printContents
      window.print()
      document.body.innerHTML = originalContents
      window.location.reload()
    }
  }

  // Helper to get current month in Arabic format
  const getCurrentMonthLabel = () => {
    const now = new Date()
    return now.getMonth() + 1 // JS months are 0-based
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            حساب جحا
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>نوع الوردية</Label>
                <Select value={shiftType} onValueChange={setShiftType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">صباحي</SelectItem>
                    <SelectItem value="evening">مسائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>إجمالي الحساب</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  placeholder="أضف ملاحظاتك هنا..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full md:w-auto">
              <Save className="w-4 h-4 mr-2" />
              حفظ
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Print Button */}
      <div className="flex justify-end mb-2">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Receipt className="w-4 h-4 mr-2" />
          طباعة
        </Button>
      </div>

      {/* Printable Section */}
      <div style={{ display: "none" }} ref={printRef} id="juha-print-section">
        <div style={{ direction: "rtl", textAlign: "center", padding: 32, fontFamily: 'Tajawal, Arial, sans-serif', background: '#fff' }}>
          <div style={{ marginBottom: 12 }}>
            <img src="/images/logo.png" alt="Logo" width="80" height="80" style={{ display: 'block', margin: '0 auto' }} />
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 32, marginBottom: 8, letterSpacing: 1, color: '#1e293b' }}>
            حساب جحا شهر {getCurrentMonthLabel()}
          </h2>
          <div style={{ marginBottom: 24, fontSize: 18, color: '#334155' }}>
            <span>تاريخ الطباعة: {formatDate(new Date().toISOString())}</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 18 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>التاريخ</th>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>نوع الوردية</th>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>إجمالي الحساب</th>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ border: "1.5px solid #cbd5e1", padding: 10 }}>{formatDate(entry.date)}</td>
                  <td style={{ border: "1.5px solid #cbd5e1", padding: 10 }}>{entry.shiftType === "morning" ? "صباحي" : "مسائي"}</td>
                  <td style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700, color: '#059669' }}>{formatCurrency(entry.amount)}</td>
                  <td style={{ border: "1.5px solid #cbd5e1", padding: 10 }}>{entry.notes || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontWeight: 900, fontSize: 24, color: "#2563eb", border: '2px solid #2563eb', borderRadius: 12, display: 'inline-block', padding: '12px 32px', marginTop: 16 }}>
            إجمالي كل الفواتير: {formatCurrency(calculateTotal())}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل الحسابات</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 min-w-[120px]">التاريخ</th>
                    <th className="p-3 min-w-[100px]">نوع الوردية</th>
                    <th className="p-3 min-w-[120px]">إجمالي الحساب</th>
                    <th className="p-3 min-w-[200px]">ملاحظات</th>
                    <th className="p-3 min-w-[60px]">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-gray-400">لا توجد بيانات</td>
                    </tr>
                  ) : (
                    entries.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="p-3 font-medium">{formatDate(entry.date)}</td>
                        <td className="p-3">{entry.shiftType === "morning" ? "صباحي" : "مسائي"}</td>
                        <td className="p-3 text-green-700 font-bold">{formatCurrency(entry.amount)}</td>
                        <td className="p-3 text-gray-600">{entry.notes || <span className="text-gray-300">—</span>}</td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-500 hover:text-white hover:bg-red-500 transition rounded-full"
                            aria-label="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>

          <div className="mt-4 flex justify-end">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">إجمالي كل الفواتير</div>
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(calculateTotal())}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 