"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, Receipt, Save, Trash2, Edit } from "lucide-react"
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

interface ExpenseEntry {
  id: string
  date: string
  shiftType: "morning" | "evening"
  amount: number
  expenseName: string
  created_at: string
}

export default function JuhaBalancePage() {
  const [entries, setEntries] = useState<JuhaEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [shiftType, setShiftType] = useState<"morning" | "evening">("morning")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseName, setExpenseName] = useState("")
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<"income" | "expense" | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Load entries and expenses from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem("juhaEntries")
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries)
        if (Array.isArray(parsed)) {
          setEntries(parsed)
          console.log("Loaded entries:", parsed)
        }
      } catch (e) {
        console.error("Error parsing juhaEntries:", e)
      }
    }

    const savedExpenses = localStorage.getItem("juhaExpenses")
    if (savedExpenses) {
      try {
        const parsed = JSON.parse(savedExpenses)
        if (Array.isArray(parsed)) {
          setExpenses(parsed)
          console.log("Loaded expenses:", parsed)
        }
      } catch (e) {
        console.error("Error parsing juhaExpenses:", e)
      }
    }
    
    setIsLoaded(true)
  }, [])

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && entries.length > 0) {
      localStorage.setItem("juhaEntries", JSON.stringify(entries))
      console.log("Saved entries to localStorage:", entries)
    }
  }, [entries, isLoaded])

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && expenses.length > 0) {
      localStorage.setItem("juhaExpenses", JSON.stringify(expenses))
      console.log("Saved expenses to localStorage:", expenses)
    }
  }, [expenses, isLoaded])

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

    if (editingId && editingType) {
      // Update existing entry
      if (editingType === "income") {
        setEntries(entries.map(entry => 
          entry.id === editingId 
            ? { ...entry, date, shiftType, amount: numAmount, notes: notes.trim() || undefined }
            : entry
        ))
        
        // If there's an expense amount when editing income, add it as a new expense
        if (expenseAmount && parseFloat(expenseAmount) > 0) {
          const numExpenseAmount = parseFloat(expenseAmount)
          if (!isNaN(numExpenseAmount)) {
            const newExpense: ExpenseEntry = {
              id: `${Date.now() + 1}`, // Different ID
              date,
              shiftType,
              amount: numExpenseAmount,
              expenseName: expenseName.trim() || "مصروف",
              created_at: new Date().toISOString(),
            }
            setExpenses([...expenses, newExpense])
          }
        }
      } else if (editingType === "expense") {
        if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
          setError("يرجى إدخال مبلغ المصروف")
          return
        }
        const numExpenseAmount = parseFloat(expenseAmount)
        if (isNaN(numExpenseAmount)) {
          setError("يرجى إدخال مبلغ صحيح للمصروف")
          return
        }
        setExpenses(expenses.map(expense => 
          expense.id === editingId 
            ? { ...expense, date, shiftType, amount: numExpenseAmount, expenseName: expenseName.trim() || "مصروف" }
            : expense
        ))
      }
      // Clear edit mode
      setEditingId(null)
      setEditingType(null)
    } else {
      // Add new entry
      const newEntry: JuhaEntry = {
        id: `${Date.now()}`,
        date,
        shiftType,
        amount: numAmount,
        notes: notes.trim() || undefined,
        created_at: new Date().toISOString(),
      }

      setEntries([...entries, newEntry])

      // Add expense entry if provided
      if (expenseAmount && parseFloat(expenseAmount) > 0) {
        const numExpenseAmount = parseFloat(expenseAmount)
        if (!isNaN(numExpenseAmount)) {
          const newExpense: ExpenseEntry = {
            id: `${Date.now() + 1}`, // Different ID
            date,
            shiftType,
            amount: numExpenseAmount,
            expenseName: expenseName.trim() || "مصروف",
            created_at: new Date().toISOString(),
          }
          setExpenses([...expenses, newExpense])
        }
      }
    }
    
    // Reset form
    setAmount("")
    setNotes("")
    setExpenseAmount("")
    setExpenseName("")
  }

  const handleDelete = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id))
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id))
  }

  const handleEditEntry = (entry: JuhaEntry) => {
    setEditingId(entry.id)
    setEditingType("income")
    setDate(entry.date)
    setShiftType(entry.shiftType)
    setAmount(entry.amount.toString())
    setNotes(entry.notes || "")
    setExpenseAmount("")
    setExpenseName("")
  }

  const handleEditExpense = (expense: ExpenseEntry) => {
    setEditingId(expense.id)
    setEditingType("expense")
    setDate(expense.date)
    setShiftType(expense.shiftType)
    setAmount("")
    setNotes("")
    setExpenseAmount(expense.amount.toString())
    setExpenseName(expense.expenseName)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingType(null)
    setAmount("")
    setNotes("")
    setExpenseAmount("")
    setExpenseName("")
    setDate(new Date().toISOString().split('T')[0])
    setShiftType("morning")
  }

  const handleResetAllData = () => {
    if (confirm("هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.")) {
      setEntries([])
      setExpenses([])
      localStorage.removeItem("juhaEntries")
      localStorage.removeItem("juhaExpenses")
    }
  }

  const calculateTotal = () => {
    return entries.reduce((sum, entry) => sum + entry.amount, 0)
  }

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  const calculateNetTotal = () => {
    return calculateTotal() - calculateTotalExpenses()
  }

  // Get expenses for a specific date and shift
  const getExpensesForDate = (selectedDate: string, selectedShift: "morning" | "evening") => {
    return expenses.filter(expense => expense.date === selectedDate && expense.shiftType === selectedShift)
  }

  // Get total expense for a specific date and shift
  const getExpenseTotalForDate = (selectedDate: string, selectedShift: "morning" | "evening") => {
    return getExpensesForDate(selectedDate, selectedShift).reduce((sum, expense) => sum + expense.amount, 0)
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
    const monthNames = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ]
    return monthNames[now.getMonth()]
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            حساب جحا
            {editingId && (
              <span className="text-sm text-orange-600 font-normal">
                (وضع التعديل - {editingType === "income" ? "إيراد" : "مصروف"})
              </span>
            )}
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
                <Select value={shiftType} onValueChange={(value: "morning" | "evening") => setShiftType(value)}>
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
                <Label>مصروف اليوم (اختياري)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
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

              <div className="space-y-2">
                <Label>اسم المصروف (اختياري)</Label>
                <Input
                  type="text"
                  placeholder="مثال: وقود، صيانة، مواد أولية..."
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full md:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {editingId ? "حفظ التعديلات" : "حفظ"}
            </Button>
            
            {editingId && (
              <Button type="button" variant="outline" onClick={handleCancelEdit} className="ml-2">
                إلغاء التعديل
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Print Button */}
      <div className="flex justify-between mb-2">
        <Button 
          onClick={handleResetAllData} 
          variant="destructive" 
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          مسح جميع البيانات
        </Button>
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Receipt className="w-4 h-4 mr-2" />
          طباعة
        </Button>
      </div>

      {/* Printable Section */}
      <div style={{ display: "none" }} ref={printRef} id="juha-print-section">
        <div style={{ direction: "rtl", textAlign: "center", padding: 32, fontFamily: 'Tajawal, Arial, sans-serif', background: '#fff' }}>
          <div style={{ marginBottom: 12 }}>
            <img src="/placeholder-logo.svg" alt="Logo" width="80" height="80" style={{ display: 'block', margin: '0 auto' }} />
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 32, marginBottom: 8, letterSpacing: 1, color: '#1e293b' }}>
            حساب جحا شهر {getCurrentMonthLabel()}
          </h2>
          <div style={{ marginBottom: 24, fontSize: 18, color: '#334155' }}>
            <span>تاريخ الطباعة: {formatDate(new Date().toISOString())}</span>
          </div>
          
          <h3 style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, color: '#059669' }}>الإيرادات</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 18 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>التاريخ</th>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>نوع الوردية</th>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>إجمالي الحساب</th>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>المصروفات</th>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>صافي الربح</th>
                <th style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700 }}>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const dayExpenses = getExpensesForDate(entry.date, entry.shiftType)
                const totalExpense = getExpenseTotalForDate(entry.date, entry.shiftType)
                const netAmount = entry.amount - totalExpense
                
                return (
                  <tr key={entry.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ border: "1.5px solid #cbd5e1", padding: 10 }}>{formatDate(entry.date)}</td>
                    <td style={{ border: "1.5px solid #cbd5e1", padding: 10 }}>{entry.shiftType === "morning" ? "صباحي" : "مسائي"}</td>
                    <td style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700, color: '#059669' }}>{formatCurrency(entry.amount)}</td>
                    <td style={{ border: "1.5px solid #cbd5e1", padding: 10, color: '#dc2626' }}>
                      {totalExpense > 0 ? (
                        <div>
                          <div style={{ fontWeight: 700 }}>{formatCurrency(totalExpense)}</div>
                          {dayExpenses.map(exp => (
                            <div key={exp.id} style={{ fontSize: 18, color: '#1f2937', fontWeight: 900, marginTop: 8, padding: '4px 8px', backgroundColor: '#fef2f2', borderRadius: 6, border: '1px solid #fecaca' }}>• {exp.expenseName}</div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                    <td style={{ border: "1.5px solid #cbd5e1", padding: 10, fontWeight: 700, color: '#2563eb' }}>{formatCurrency(netAmount)}</td>
                    <td style={{ border: "1.5px solid #cbd5e1", padding: 10 }}>{entry.notes || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {/* Total Expenses Section */}
          {expenses.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, color: '#dc2626' }}>إجمالي المصروفات</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 18 }}>
                <thead>
                  <tr style={{ background: "#fef2f2" }}>
                    <th style={{ border: "1.5px solid #fecaca", padding: 10, fontWeight: 700 }}>التاريخ</th>
                    <th style={{ border: "1.5px solid #fecaca", padding: 10, fontWeight: 700 }}>نوع الوردية</th>
                    <th style={{ border: "1.5px solid #fecaca", padding: 10, fontWeight: 700 }}>اسم المصروف</th>
                    <th style={{ border: "1.5px solid #fecaca", padding: 10, fontWeight: 700 }}>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, idx) => (
                    <tr key={expense.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fef2f2" }}>
                      <td style={{ border: "1.5px solid #fecaca", padding: 10 }}>{formatDate(expense.date)}</td>
                      <td style={{ border: "1.5px solid #fecaca", padding: 10 }}>{expense.shiftType === "morning" ? "صباحي" : "مسائي"}</td>
                      <td style={{ border: "1.5px solid #fecaca", padding: 10, fontWeight: 700, color: '#dc2626' }}>{expense.expenseName}</td>
                      <td style={{ border: "1.5px solid #fecaca", padding: 10, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#dc2626", border: '2px solid #dc2626', borderRadius: 12, display: 'inline-block', padding: '8px 24px', marginBottom: 16 }}>
                إجمالي المصروفات: {formatCurrency(calculateTotalExpenses())}
              </div>
            </div>
          )}
          
          <div style={{ fontWeight: 900, fontSize: 24, color: "#2563eb", border: '2px solid #2563eb', borderRadius: 12, display: 'inline-block', padding: '12px 32px', marginTop: 16 }}>
            صافي الربح الإجمالي: {formatCurrency(calculateNetTotal())}
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
                    <th className="p-3 min-w-[120px]">المصروفات</th>
                    <th className="p-3 min-w-[120px]">صافي الربح</th>
                    <th className="p-3 min-w-[200px]">ملاحظات</th>
                    <th className="p-3 min-w-[80px]">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-gray-400">لا توجد بيانات</td>
                    </tr>
                  ) : (
                    entries.map((entry, idx) => {
                      const dayExpenses = getExpensesForDate(entry.date, entry.shiftType)
                      const totalExpense = getExpenseTotalForDate(entry.date, entry.shiftType)
                      const netAmount = entry.amount - totalExpense
                      
                      return (
                        <tr
                          key={entry.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="p-3 font-medium">{formatDate(entry.date)}</td>
                          <td className="p-3">{entry.shiftType === "morning" ? "صباحي" : "مسائي"}</td>
                          <td className="p-3 text-green-700 font-bold">{formatCurrency(entry.amount)}</td>
                          <td className="p-3 text-red-600">
                            {totalExpense > 0 ? (
                              <div>
                                <div className="font-bold">{formatCurrency(totalExpense)}</div>
                                {dayExpenses.map(exp => (
                                  <div key={exp.id} className="text-base text-gray-800 flex justify-between items-center mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    <span className="font-bold text-lg">• {exp.expenseName}</span>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditExpense(exp)}
                                        className="text-blue-500 hover:text-blue-700 h-7 w-7 p-0"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteExpense(exp.id)}
                                        className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="p-3 text-blue-700 font-bold">{formatCurrency(netAmount)}</td>
                          <td className="p-3 text-gray-600">{entry.notes || <span className="text-gray-300">—</span>}</td>
                          <td className="p-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEntry(entry)}
                                className="text-blue-500 hover:bg-blue-100"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry.id)}
                                className="text-red-500 hover:bg-red-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>

          <div className="mt-4 flex justify-end">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">صافي الربح الإجمالي</div>
              <div className={`text-2xl font-bold ${calculateNetTotal() < 0 ? 'text-red-700' : 'text-blue-700'}`}>
                {formatCurrency(calculateNetTotal())}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                إيرادات: {formatCurrency(calculateTotal())} | مصروفات: {formatCurrency(calculateTotalExpenses())}
              </div>
              {entries.length === 0 && expenses.length > 0 && (
                <div className="text-xs text-red-500 mt-1">
                  ⚠️ يوجد مصروفات بدون إيرادات
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 