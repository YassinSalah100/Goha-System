"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Receipt, Save, Trash2, Edit } from "lucide-react"
import Image from "next/image"
import logo from "@/public/images/logo.png"

interface JuhaEntry {
  id: string
  date: string
  shiftType: "morning" | "evening"
  amount: number
  notes?: string
  otherExpenses?: number
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

interface StandaloneExpense {
  id: string
  date: string
  amount: number
  expenseName: string
  notes?: string
  created_at: string
}

export default function JuhaBalancePage() {
  const [entries, setEntries] = useState<JuhaEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [standaloneExpenses, setStandaloneExpenses] = useState<StandaloneExpense[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [shiftType, setShiftType] = useState<"morning" | "evening">("morning")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseName, setExpenseName] = useState("")
  const [otherExpenses, setOtherExpenses] = useState("")
  // Standalone expense form states
  const [standaloneExpenseDate, setStandaloneExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [standaloneExpenseAmount, setStandaloneExpenseAmount] = useState("")
  const [standaloneExpenseName, setStandaloneExpenseName] = useState("")
  const [standaloneExpenseNotes, setStandaloneExpenseNotes] = useState("")
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

    const savedStandaloneExpenses = localStorage.getItem("juhaStandaloneExpenses")
    if (savedStandaloneExpenses) {
      try {
        const parsed = JSON.parse(savedStandaloneExpenses)
        if (Array.isArray(parsed)) {
          setStandaloneExpenses(parsed)
          console.log("Loaded standalone expenses:", parsed)
        }
      } catch (e) {
        console.error("Error parsing juhaStandaloneExpenses:", e)
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

  // Save standalone expenses to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && standaloneExpenses.length > 0) {
      localStorage.setItem("juhaStandaloneExpenses", JSON.stringify(standaloneExpenses))
      console.log("Saved standalone expenses to localStorage:", standaloneExpenses)
    }
  }, [standaloneExpenses, isLoaded])

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
            ? { 
                ...entry, 
                date, 
                shiftType, 
                amount: numAmount, 
                notes: notes.trim() || undefined,
                otherExpenses: otherExpenses ? parseFloat(otherExpenses) : undefined
              }
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
        otherExpenses: otherExpenses ? parseFloat(otherExpenses) : undefined,
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
    setOtherExpenses("")
  }

  const handleDelete = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id))
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id))
  }

  const handleDeleteStandaloneExpense = (id: string) => {
    setStandaloneExpenses(standaloneExpenses.filter(expense => expense.id !== id))
  }

  const handleStandaloneExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!standaloneExpenseDate || !standaloneExpenseAmount || !standaloneExpenseName) {
      setError("يرجى ملء جميع حقول المصروف المطلوبة")
      return
    }

    const numAmount = parseFloat(standaloneExpenseAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("يرجى إدخال مبلغ صحيح للمصروف")
      return
    }

    const newStandaloneExpense: StandaloneExpense = {
      id: `${Date.now()}`,
      date: standaloneExpenseDate,
      amount: numAmount,
      expenseName: standaloneExpenseName.trim(),
      notes: standaloneExpenseNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    }

    setStandaloneExpenses([...standaloneExpenses, newStandaloneExpense])

    // Reset form
    setStandaloneExpenseAmount("")
    setStandaloneExpenseName("")
    setStandaloneExpenseNotes("")
  }

  const handleEditEntry = (entry: JuhaEntry) => {
    setEditingId(entry.id)
    setEditingType("income")
    setDate(entry.date)
    setShiftType(entry.shiftType)
    setAmount(entry.amount.toString())
    setNotes(entry.notes || "")
    setOtherExpenses(entry.otherExpenses ? entry.otherExpenses.toString() : "")
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
    setOtherExpenses("")
    setExpenseAmount(expense.amount.toString())
    setExpenseName(expense.expenseName)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingType(null)
    setAmount("")
    setNotes("")
    setOtherExpenses("")
    setExpenseAmount("")
    setExpenseName("")
    setDate(new Date().toISOString().split('T')[0])
    setShiftType("morning")
  }

  const handleResetAllData = () => {
    if (confirm("هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.")) {
      setEntries([])
      setExpenses([])
      setStandaloneExpenses([])
      localStorage.removeItem("juhaEntries")
      localStorage.removeItem("juhaExpenses")
      localStorage.removeItem("juhaStandaloneExpenses")
    }
  }

  const calculateTotal = () => {
    return entries.reduce((sum, entry) => sum + entry.amount, 0)
  }

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  const calculateTotalStandaloneExpenses = () => {
    return standaloneExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  const calculateAllExpenses = () => {
    return calculateTotalExpenses() + calculateTotalStandaloneExpenses()
  }

  const calculateNetTotal = () => {
    return calculateTotal() - calculateAllExpenses()
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
      // Create a temporary style element for print
      const printStyles = document.createElement('style')
      printStyles.textContent = `
        @media print {
          body * {
            visibility: hidden;
          }
          #juha-print-section, #juha-print-section * {
            visibility: visible;
          }
          #juha-print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `
      
      // Add styles to head
      document.head.appendChild(printStyles)
      
      // Show the print section
      const printSection = printRef.current
      printSection.style.display = 'block'
      
      // Print
      window.print()
      
      // Clean up - hide print section and remove styles
      printSection.style.display = 'none'
      document.head.removeChild(printStyles)
    }
  }

  // Helper to get month label based on entries data
  const getMonthLabel = () => {
    const monthNames = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ]
    
    // If we have entries, find the most common month from the data
    if (entries.length > 0) {
      const monthCounts: { [key: number]: number } = {}
      
      entries.forEach(entry => {
        const entryMonth = new Date(entry.date).getMonth()
        monthCounts[entryMonth] = (monthCounts[entryMonth] || 0) + 1
      })
      
      // Find the month with the most entries
      const mostCommonMonth = Object.keys(monthCounts).reduce((a, b) => 
        monthCounts[parseInt(a)] > monthCounts[parseInt(b)] ? a : b
      )
      
      return monthNames[parseInt(mostCommonMonth)]
    }
    
    // If no entries, use current month
    const now = new Date()
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
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="income">حساب اليومية</TabsTrigger>
              <TabsTrigger value="expenses">مصاريف منفصلة</TabsTrigger>
            </TabsList>
            
            <TabsContent value="income" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="expenses" className="space-y-4">
            <form onSubmit={handleStandaloneExpenseSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="date"
                      value={standaloneExpenseDate}
                      onChange={(e) => setStandaloneExpenseDate(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>اسم المصروف *</Label>
                  <Input
                    type="text"
                    placeholder="مثال: وقود، صيانة، مواد أولية..."
                    value={standaloneExpenseName}
                    onChange={(e) => setStandaloneExpenseName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>المبلغ *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={standaloneExpenseAmount}
                    onChange={(e) => setStandaloneExpenseAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea
                    placeholder="أضف ملاحظات عن هذا المصروف..."
                    value={standaloneExpenseNotes}
                    onChange={(e) => setStandaloneExpenseNotes(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                إضافة مصروف
              </Button>
            </form>

            {/* Standalone Expenses List */}
            {standaloneExpenses.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">المصاريف المنفصلة</h3>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm text-center">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 min-w-[120px]">التاريخ</th>
                        <th className="p-3 min-w-[150px]">اسم المصروف</th>
                        <th className="p-3 min-w-[100px]">المبلغ</th>
                        <th className="p-3 min-w-[200px]">ملاحظات</th>
                        <th className="p-3 min-w-[80px]">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standaloneExpenses.map((expense, idx) => (
                        <tr
                          key={expense.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="p-3 font-medium">{formatDate(expense.date)}</td>
                          <td className="p-3 text-red-600 font-bold">{expense.expenseName}</td>
                          <td className="p-3 text-red-600 font-bold">{formatCurrency(expense.amount)}</td>
                          <td className="p-3 text-gray-600">{expense.notes || <span className="text-gray-300">—</span>}</td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStandaloneExpense(expense.id)}
                              className="text-red-500 hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm text-red-600 mb-1">إجمالي المصاريف المنفصلة</div>
                    <div className="text-2xl font-bold text-red-700">
                      {formatCurrency(calculateTotalStandaloneExpenses())}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          </Tabs>
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
            <img src="/images/logo.png" alt="Logo" width="80" height="80" style={{ display: 'block', margin: '0 auto' }} />
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 32, marginBottom: 8, letterSpacing: 1, color: '#1e293b' }}>
            حساب جحا شهر {getMonthLabel()}
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
          {(expenses.length > 0 || standaloneExpenses.length > 0) && (
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
                  {standaloneExpenses.map((expense, idx) => (
                    <tr key={expense.id} style={{ background: (expenses.length + idx) % 2 === 0 ? "#fff" : "#fef2f2" }}>
                      <td style={{ border: "1.5px solid #fecaca", padding: 10 }}>{formatDate(expense.date)}</td>
                      <td style={{ border: "1.5px solid #fecaca", padding: 10 }}>مستقل</td>
                      <td style={{ border: "1.5px solid #fecaca", padding: 10, fontWeight: 700, color: '#dc2626' }}>{expense.expenseName}</td>
                      <td style={{ border: "1.5px solid #fecaca", padding: 10, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#dc2626", border: '2px solid #dc2626', borderRadius: 12, display: 'inline-block', padding: '8px 24px', marginBottom: 16 }}>
                إجمالي جميع المصروفات: {formatCurrency(calculateAllExpenses())}
              </div>
            </div>
          )}
          
          <div style={{ fontWeight: 900, fontSize: 24, color: "#2563eb", border: '2px solid #2563eb', borderRadius: 12, display: 'inline-block', padding: '12px 32px', marginTop: 16 }}>
            صافي الربح الإجمالي: {formatCurrency(calculateNetTotal())}
          </div>

          {/* Summary Section */}
          <div style={{ marginTop: 32, pageBreakInside: 'avoid' }}>
            <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16, color: '#374151', textAlign: 'center', borderBottom: '1px solid #d1d5db', paddingBottom: 8 }}>
              ملخص الحساب
            </h3>
            
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16, marginBottom: 16 }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #d1d5db", padding: 12, fontWeight: 600, backgroundColor: '#f9fafb' }}>إجمالي الإيرادات</td>
                  <td style={{ border: "1px solid #d1d5db", padding: 12, color: '#059669', fontWeight: 700, textAlign: 'center' }}>{formatCurrency(calculateTotal())}</td>
                  <td style={{ border: "1px solid #d1d5db", padding: 12, color: '#6b7280', textAlign: 'center', fontSize: 14 }}>({entries.length} عملية)</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #d1d5db", padding: 12, fontWeight: 600, backgroundColor: '#f9fafb' }}>مصروفات اليومية</td>
                  <td style={{ border: "1px solid #d1d5db", padding: 12, color: '#dc2626', fontWeight: 700, textAlign: 'center' }}>{formatCurrency(calculateTotalExpenses())}</td>
                  <td style={{ border: "1px solid #d1d5db", padding: 12, color: '#6b7280', textAlign: 'center', fontSize: 14 }}>({expenses.length} مصروف)</td>
                </tr>
                {standaloneExpenses.length > 0 && (
                  <tr>
                    <td style={{ border: "1px solid #d1d5db", padding: 12, fontWeight: 600, backgroundColor: '#f9fafb' }}>مصاريف منفصلة</td>
                    <td style={{ border: "1px solid #d1d5db", padding: 12, color: '#dc2626', fontWeight: 700, textAlign: 'center' }}>{formatCurrency(calculateTotalStandaloneExpenses())}</td>
                    <td style={{ border: "1px solid #d1d5db", padding: 12, color: '#6b7280', textAlign: 'center', fontSize: 14 }}>({standaloneExpenses.length} مصروف)</td>
                  </tr>
                )}
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <td style={{ border: "1px solid #d1d5db", padding: 12, fontWeight: 700, fontSize: 18 }}>صافي الربح</td>
                  <td style={{ border: "1px solid #d1d5db", padding: 12, color: calculateNetTotal() >= 0 ? '#2563eb' : '#dc2626', fontWeight: 900, textAlign: 'center', fontSize: 18 }}>{formatCurrency(calculateNetTotal())}</td>
                  <td style={{ border: "1px solid #d1d5db", padding: 12, color: '#6b7280', textAlign: 'center', fontSize: 14 }}>
                    {calculateNetTotal() >= 0 ? 'ربح' : 'خسارة'}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 16 }}>
              الشهر: {getMonthLabel()} • تاريخ التقرير: {formatDate(new Date().toISOString())}
              {entries.length > 0 && (
                <span> • الفترة: من {formatDate(entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date)} إلى {formatDate(entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date)}</span>
              )}
            </div>
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
                إيرادات: {formatCurrency(calculateTotal())} | مصروفات: {formatCurrency(calculateTotalExpenses())} | مصاريف منفصلة: {formatCurrency(calculateTotalStandaloneExpenses())}
              </div>
              {entries.length === 0 && (expenses.length > 0 || standaloneExpenses.length > 0) && (
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