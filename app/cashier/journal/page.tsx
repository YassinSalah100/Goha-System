"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  ChefHat,
  Receipt,
  AlertCircle,
  Users,
  Coffee,
  BookOpen,
  Clock,
  UserCheck,
  UserX,
  ShoppingCart,
  Lightbulb,
  Wrench,
  Home,
  Truck,
  Package,
  Phone,
  Car,
  MoreVertical,
} from "lucide-react"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

// Simple Arabic labels for journal
const arabicLabels = {
  daily_journal: "السجل اليومي",
  today_date: "اليوم",
  shift_info: "معلومات الوردية",
  add_expense: "إضافة مصروف",
  expense_title: "نوع المصروف",
  expense_description: "التفاصيل",
  expense_amount: "المبلغ (ج.م)",
  expense_category: "الفئة",
  submit: "إضافة",
  edit: "تعديل",
  delete: "حذف",
  success: "تم بنجاح ✓",
  update_success: "تم التحديث ✓",
  delete_success: "تم الحذف ✓",
  fail: "خطأ في العملية",
  validation_error: "تحقق من البيانات",
  required_field: "مطلوب",
  positive_number: "رقم صحيح فقط",
  expenses_list: "قائمة المصروفات",
  no_expenses: "لا توجد مصروفات اليوم",
  loading: "جاري التحميل...",
  refresh: "تحديث",
  delete_confirm_title: "حذف المصروف؟",
  delete_confirm_message: "هل تريد حذف هذا المصروف؟",
  cancel: "إلغاء",
  confirm_delete: "حذف",
  edit_expense: "تعديل المصروف",
  update: "حفظ",
  total_expenses: "إجمالي المصروفات",
  total_staff_cost: "تكلفة الموظفين",
  active_staff_count: "الموظفين الحاضرين",
  no_active_shift: "لا توجد وردية مفتوحة",
  no_user_found: "خطأ في تسجيل الدخول",
  assign_staff: "تسجيل حضور",
  active_staff: "الموظفين الحاضرين",
  available_staff: "الموظفين المتاحين",
  hourly_rate: "الأجر/ساعة",
  hours_worked: "ساعات العمل",
  estimated_salary: "الراتب المتوقع",
  check_in: "حضور",
  check_out: "انصراف",
  overview_tab: "نظرة عامة",
  expenses_tab: "المصروفات",
  staff_tab: "الموظفين",
}

// Simple expense categories
const expenseCategories = [
  { value: "food_supplies", label: "مواد غذائية", icon: ShoppingCart, color: "bg-green-500" },
  { value: "beverages", label: "مشروبات", icon: Coffee, color: "bg-blue-500" },
  { value: "utilities", label: "مرافق", icon: Lightbulb, color: "bg-yellow-500" },
  { value: "maintenance", label: "صيانة", icon: Wrench, color: "bg-red-500" },
  { value: "cleaning", label: "تنظيف", icon: Home, color: "bg-purple-500" },
  { value: "delivery", label: "توصيل", icon: Truck, color: "bg-orange-500" },
  { value: "packaging", label: "تغليف", icon: Package, color: "bg-indigo-500" },
  { value: "communication", label: "اتصالات", icon: Phone, color: "bg-pink-500" },
  { value: "fuel", label: "وقود", icon: Car, color: "bg-gray-500" },
  { value: "other", label: "أخرى", icon: MoreVertical, color: "bg-slate-500" },
]

interface Worker {
  worker_id: string
  full_name: string
  status: string
  base_hourly_rate: number
}

interface Shift {
  shift_id: string
  type: string
  status?: string
  start_time?: string
  opened_by?: string
  is_closed?: boolean
}

interface Expense {
  expense_id: string
  title: string
  description?: string
  amount: number
  category?: string
  shift: Shift
  created_by: Worker
  created_at: string
}

interface FormData {
  title: string
  description: string
  amount: string
  category: string
}

interface FormErrors {
  title?: string
  amount?: string
  category?: string
}

interface CurrentUser {
  worker_id: string
  full_name: string
  status: string
  shift?: Shift
}

interface ShiftWorker {
  shift_worker_id: string
  worker: Worker
  shift: Shift
  start_time: string
  end_time?: string
  hours_worked?: number
  calculated_salary?: number
  is_active: boolean
  created_at: string
}

export default function SimpleRestaurantJournal() {
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    amount: "",
    category: "",
  })

  const [editForm, setEditForm] = useState<FormData>({
    title: "",
    description: "",
    amount: "",
    category: "",
  })

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editErrors, setEditErrors] = useState<FormErrors>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [msgType, setMsgType] = useState<"success" | "error">("success")
  const [loading, setLoading] = useState(false)
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [loadingShift, setLoadingShift] = useState(true)
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([])
  const [shiftWorkers, setShiftWorkers] = useState<ShiftWorker[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [assigningWorker, setAssigningWorker] = useState<string | null>(null)
  const [endingWorker, setEndingWorker] = useState<string | null>(null)
  // Store pending assigned workers with a timestamp
  const [pendingWorkers, setPendingWorkers] = useState<{workerId: string, addedAt: number, sw: any}[]>([])

  // Helper function to validate or format ID
  const ensureValidId = (id: any, fieldName: string): string => {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error(`${fieldName} مفقود`);
    }
    
    const idStr = String(id).trim();
    
    // Check if it's already a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idStr)) {
      return idStr;
    }
    
    // If it's a simple number or string, return as-is (let backend handle validation)
    return idStr;
  };

  const validateForm = (formData: FormData, setErrorsFunc: (errors: FormErrors) => void): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = arabicLabels.required_field
    }

    if (!formData.amount.trim()) {
      newErrors.amount = arabicLabels.required_field
    } else {
      const amount = Number.parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = arabicLabels.positive_number
      }
    }

    if (!formData.category) {
      newErrors.category = arabicLabels.required_field
    }

    setErrorsFunc(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (name: string, value: string, isEdit = false) => {
    if (isEdit) {
      setEditForm({ ...editForm, [name]: value })
      if (editErrors[name as keyof FormErrors]) {
        setEditErrors({ ...editErrors, [name]: undefined })
      }
    } else {
      setForm({ ...form, [name]: value })
      if (errors[name as keyof FormErrors]) {
        setErrors({ ...errors, [name]: undefined })
      }
    }
  }

  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser")
      if (userData) {
        const user = JSON.parse(userData)
        const mappedUser = {
          worker_id: user.user_id || user.worker_id,
          full_name: user.full_name,
          status: user.role || user.status,
        }
        setCurrentUser(mappedUser)

        if (user.shift) {
          const mappedShift = {
            shift_id: user.shift.shift_id,
            type: user.shift.type || user.shift.shift_type,
            status: user.shift.status || "OPEN",
            start_time: user.shift.start_time,
            opened_by: user.shift.opened_by,
            is_closed: user.shift.is_closed || false,
          }
          setActiveShift(mappedShift)
          setLoadingShift(false)
          return
        }
      }
    } catch (error) {
      console.error("Error getting current user:", error)
    } finally {
      setLoadingShift(false)
    }
  }

  const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
    try {
      console.log(`Making request to: ${url}`, options)

      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      })

      console.log(`Response from ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      const responseData = await response.json()
      console.log(`Response data from ${url}:`, responseData)

      if (!response.ok) {
        const errorMessage =
          responseData.message ||
          responseData.error ||
          responseData.details ||
          `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      return responseData
    } catch (error) {
      console.error(`API Error for ${url}:`, error)
      throw error
    }
  }

  const fetchAvailableWorkers = async () => {
    setLoadingWorkers(true)
    try {
      const responseData = await fetchWithErrorHandling(`${API_BASE_URL}/workers`)
      const workers = responseData.success ? responseData.data : responseData
      setAvailableWorkers(Array.isArray(workers) ? workers : [])
    } catch (error) {
      console.error("Error fetching workers:", error)
      setAvailableWorkers([])
    } finally {
      setLoadingWorkers(false)
    }
  }

  // Modified fetchShiftWorkers to merge backend and pending
  const fetchShiftWorkers = async () => {
    if (!activeShift) return

    try {
      const responseData = await fetchWithErrorHandling(`${API_BASE_URL}/shift-workers/shift/${activeShift.shift_id}`)
      const workers = Array.isArray(responseData.success ? responseData.data : responseData)
        ? (responseData.success ? responseData.data : responseData)
        : []
      // Remove expired pending workers (older than 30s)
      const now = Date.now()
      const validPending = pendingWorkers.filter(pw => now - pw.addedAt < 30000)
      setPendingWorkers(validPending)
      // Merge: add any pending worker not in backend list
      const backendIds = new Set(workers.map((sw: any) => sw.worker.worker_id))
      const merged = [
        ...validPending.filter(pw => !backendIds.has(pw.workerId)).map(pw => pw.sw),
        ...workers
      ]
      setShiftWorkers(merged)
    } catch (error) {
      console.error("Error fetching shift workers:", error)
      setShiftWorkers([])
    }
  }

  const assignWorkerToShift = async (workerId: string) => {
    if (!activeShift) {
      setMsg("لا توجد وردية نشطة")
      setMsgType("error")
      return
    }

    if (!currentUser) {
      setMsg("لا يوجد مستخدم مسجل")
      setMsgType("error")
      return
    }

    console.log("Assigning worker to shift:", {
      worker_id: workerId,
      shift_id: activeShift.shift_id,
      activeShift: activeShift,
      currentUser: currentUser,
    })

    setAssigningWorker(workerId)
    try {
      // Find the selected worker to get their base_hourly_rate
      const selectedWorker = availableWorkers.find(w => w.worker_id === workerId);
      const hourlyRate = selectedWorker?.base_hourly_rate;
      if (!hourlyRate || hourlyRate <= 0) {
        setMsg("يجب تحديد أجر/ساعة صحيح للموظف")
        setMsgType("error")
        setAssigningWorker(null)
        return;
      }

      // More complete payload with all required fields
      const payload = {
        worker_id: workerId,
        shift_id: activeShift.shift_id,
        hourly_rate: hourlyRate,
        start_time: new Date().toISOString(),
        status: "active",
        is_active: true,
        created_by: currentUser.worker_id,
        assigned_by: currentUser.worker_id,
      }

      console.log("Complete payload being sent:", payload)

      const response = await fetch(`${API_BASE_URL}/shift-workers`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      const responseData = await response.json()
      console.log("Response data:", responseData)

      if (!response.ok) {
        // Log the full error details
        console.error("API Error Details:", {
          status: response.status,
          statusText: response.statusText,
          responseData: responseData,
        })

        // Show specific error message if available
        const errorMessage =
          responseData.message ||
          responseData.error ||
          responseData.details ||
          (responseData.errors && Array.isArray(responseData.errors)
            ? responseData.errors.map((e: any) => e.msg || e.message).join(", ")
            : `HTTP ${response.status}: ${response.statusText}`)
        throw new Error(errorMessage)
      }

      setMsg("تم تسجيل حضور الموظف ✓")
      setMsgType("success")
      // Optimistically add the worker to the shiftWorkers list if not present
      const alreadyExists = shiftWorkers.some(sw => sw.worker.worker_id === workerId && sw.is_active)
      if (!alreadyExists && selectedWorker) {
        const pendingSw = {
          shift_worker_id: responseData.data?.shift_worker_id || `${workerId}-${activeShift.shift_id}`,
          worker: selectedWorker,
          shift: activeShift,
          start_time: payload.start_time,
          is_active: true,
          created_at: new Date().toISOString(),
        }
        setShiftWorkers([pendingSw, ...shiftWorkers])
        setPendingWorkers([
          ...pendingWorkers,
          { workerId, addedAt: Date.now(), sw: pendingSw }
        ])
      }
      fetchShiftWorkers()
    } catch (error: any) {
      console.error("Full error object:", error)
      setMsg(error.message || "خطأ في تسجيل الحضور")
      setMsgType("error")
    } finally {
      setAssigningWorker(null)
    }
  }

  const endWorkerShift = async (shiftWorkerId: string) => {
    setEndingWorker(shiftWorkerId)
    try {
      await fetchWithErrorHandling(`${API_BASE_URL}/shift-workers/${shiftWorkerId}/end`, {
        method: "PUT",
        body: JSON.stringify({
          end_time: new Date().toISOString(),
        }),
      })

      setMsg("تم إنهاء وردية الموظف ✓")
      setMsgType("success")
      fetchShiftWorkers()
    } catch (error: any) {
      setMsg(error.message || "خطأ في إنهاء الوردية")
      setMsgType("error")
    } finally {
      setEndingWorker(null)
    }
  }

  const calculateHours = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
  }

  const calculateSalary = (hours: number, hourlyRate: number) => {
    return Math.round(hours * hourlyRate * 100) / 100
  }

  const fetchExpenses = async () => {
    setLoadingExpenses(true)
    try {
      const responseData = await fetchWithErrorHandling(`${API_BASE_URL}/expenses`)

      if (Array.isArray(responseData)) {
        setExpenses(responseData)
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setExpenses(responseData.data)
      } else if (responseData.success && responseData.data) {
        setExpenses(Array.isArray(responseData.data) ? responseData.data : [responseData.data])
      } else {
        setExpenses([])
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
      setExpenses([])
    } finally {
      setLoadingExpenses(false)
    }
  }

  useEffect(() => {
    getCurrentUser()
    fetchExpenses()
    fetchAvailableWorkers()
  }, [])

  useEffect(() => {
    if (activeShift) {
      fetchShiftWorkers()
    }
  }, [activeShift])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsg(null)
    setErrors({})

    if (!validateForm(form, setErrors)) {
      setMsg(arabicLabels.validation_error)
      setMsgType("error")
      return
    }

    if (!currentUser || !activeShift) {
      setMsg(!currentUser ? arabicLabels.no_user_found : arabicLabels.no_active_shift)
      setMsgType("error")
      return
    }

    setLoading(true)

    try {
      // Use helper function to ensure valid IDs
      const created_by = ensureValidId(currentUser.worker_id, 'معرف المستخدم');
      const shift_id = ensureValidId(activeShift.shift_id, 'معرف الوردية');

      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        amount: Number.parseFloat(form.amount),
        created_by: created_by,
        shift_id: shift_id,
      }
      
      if (form.category && form.category.trim() !== "") {
        payload.category = form.category.trim();
      }

      // Debug logging to check data format
      console.log('Expense Payload Debug:', {
        payload,
        originalData: {
          currentUser_worker_id: currentUser.worker_id,
          activeShift_shift_id: activeShift.shift_id,
        },
        processedData: {
          created_by,
          shift_id,
          created_by_type: typeof created_by,
          shift_id_type: typeof shift_id
        }
      });

      // Alternative payload if backend expects integer IDs (uncomment if needed):
      // const payloadWithIntIds = {
      //   ...payload,
      //   created_by: parseInt(created_by) || created_by,
      //   shift_id: parseInt(shift_id) || shift_id,
      // };

      await fetchWithErrorHandling(`${API_BASE_URL}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      setMsg(arabicLabels.success)
      setMsgType("success")
      setForm({ title: "", description: "", amount: "", category: "" })
      fetchExpenses()
    } catch (error: any) {
      console.error('Expense creation error:', error);
      
      // Handle specific validation errors
      let errorMessage = error.message || arabicLabels.fail;
      
      if (error.message && error.message.includes('Validation failed')) {
        errorMessage = 'خطأ في التحقق من البيانات - تأكد من صحة المعلومات المدخلة';
      } else if (error.message && error.message.includes('UUID')) {
        errorMessage = 'خطأ في معرف المستخدم أو الوردية - يرجى إعادة تسجيل الدخول';
      } else if (error.message && error.message.includes('400')) {
        errorMessage = 'البيانات المدخلة غير صحيحة - يرجى التحقق من جميع الحقول';
      }
      
      setMsg(errorMessage)
      setMsgType("error")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setEditForm({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount.toString(),
      category: expense.category || "",
    })
    setEditErrors({})
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingExpense) return

    if (!validateForm(editForm, setEditErrors)) {
      return
    }

    setLoading(true)

    try {
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        amount: Number.parseFloat(editForm.amount),
        category: editForm.category,
      }

      await fetchWithErrorHandling(`${API_BASE_URL}/expenses/${editingExpense.expense_id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      setMsg(arabicLabels.update_success)
      setMsgType("success")
      setEditDialogOpen(false)
      setEditingExpense(null)
      fetchExpenses()
    } catch (error: any) {
      setMsg(error.message || arabicLabels.fail)
      setMsgType("error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (expenseId: string, expenseTitle: string) => {
    setDeletingExpense(expenseId)
    try {
      await fetchWithErrorHandling(`${API_BASE_URL}/expenses/${expenseId}`, {
        method: "DELETE",
      })

      setMsg(`${arabicLabels.delete_success}: ${expenseTitle}`)
      setMsgType("success")
      setExpenses(expenses.filter((e) => e.expense_id !== expenseId))
    } catch (error: any) {
      setMsg(error.message || arabicLabels.fail)
      setMsgType("error")
    } finally {
      setDeletingExpense(null)
    }
  }

  const formatEgyptianCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getTotalStaffCost = () => {
    return shiftWorkers.reduce((total, sw) => {
      const hours = calculateHours(sw.start_time, sw.end_time)
      return total + calculateSalary(hours, sw.worker.base_hourly_rate)
    }, 0)
  }

  const getWorkerRoleIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "chef":
      case "طباخ":
        return <ChefHat className="w-4 h-4" />
      case "waiter":
      case "نادل":
        return <Coffee className="w-4 h-4" />
      case "cashier":
      case "كاشير":
        return <Receipt className="w-4 h-4" />
      case "delivery":
      case "موصل":
        return <Truck className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getWorkerRoleColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "chef":
      case "طباخ":
        return "bg-red-100 text-red-700"
      case "waiter":
      case "نادل":
        return "bg-blue-100 text-blue-700"
      case "cashier":
      case "كاشير":
        return "bg-green-100 text-green-700"
      case "delivery":
      case "موصل":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = expenseCategories.find((c) => c.value === category)
    return cat ? <cat.icon className="w-4 h-4 text-white" /> : <MoreVertical className="w-4 h-4 text-white" />
  }

  const getCategoryColor = (category: string) => {
    const cat = expenseCategories.find((c) => c.value === category)
    return cat ? cat.color : "bg-gray-500"
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-xl shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {arabicLabels.daily_journal}
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  {new Date().toLocaleDateString("ar-EG", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center min-w-[120px]">
                <div className="flex items-center justify-center mb-2">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">المدير الحالي</p>
                <p className="font-bold text-gray-900 text-sm">
                  {currentUser ? currentUser.full_name : "غير محدد"}
                </p>
              </div>
              
              <div className={`px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all duration-300 ${
                activeShift 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200" 
                  : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200"
              }`}>
                <div className="flex items-center gap-2">
                  {activeShift ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>{activeShift ? `${activeShift.type} - نشطة` : "لا توجد وردية"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    <p className="text-blue-700 text-sm font-bold">المصروفات اليوم</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-800 mb-1">
                    {formatEgyptianCurrency(getTotalExpenses())}
                  </p>
                  <p className="text-xs text-blue-600">
                    {expenses.length} عملية شراء
                  </p>
                </div>
                <div className="bg-blue-500 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <p className="text-green-700 text-sm font-bold">تكلفة الموظفين</p>
                  </div>
                  <p className="text-3xl font-bold text-green-800 mb-1">
                    {formatEgyptianCurrency(getTotalStaffCost())}
                  </p>
                  <p className="text-xs text-green-600">
                    متوقع حتى الآن
                  </p>
                </div>
                <div className="bg-green-500 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    <p className="text-purple-700 text-sm font-bold">الموظفين الحاضرين</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-800 mb-1">
                    {shiftWorkers.filter((sw) => sw.is_active).length}
                  </p>
                  <p className="text-xs text-purple-600">
                    من {availableWorkers.length} موظف
                  </p>
                </div>
                <div className="bg-purple-500 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Message Alert */}
        {msg && (
          <Alert className={`border-0 shadow-lg backdrop-blur-sm transition-all duration-500 ${
            msgType === "success" 
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500" 
              : "bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-l-red-500"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                msgType === "success" ? "bg-green-100" : "bg-red-100"
              }`}>
                {msgType === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <AlertDescription className={`font-medium text-lg ${
                msgType === "success" ? "text-green-800" : "text-red-800"
              }`}>
                {msg}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-3 px-4 transition-all duration-300"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">{arabicLabels.overview_tab}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="expenses" 
                className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-3 px-4 transition-all duration-300"
              >
                <Receipt className="w-5 h-5" />
                <span className="font-medium">{arabicLabels.expenses_tab}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="staff" 
                className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-3 px-4 transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">{arabicLabels.staff_tab}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Enhanced Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Enhanced Recent Expenses */}
              <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <span>آخر المصروفات</span>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {expenses.length}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {expenses.slice(0, 5).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <Receipt className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg font-medium">لا توجد مصروفات اليوم</p>
                      <p className="text-gray-400 text-sm mt-1">ابدأ بإضافة أول مصروف</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expenses.slice(0, 5).map((expense, index) => (
                        <div
                          key={expense.expense_id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-300 border border-gray-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 ${getCategoryColor(expense.category || "other")} rounded-xl shadow-lg`}>
                              {getCategoryIcon(expense.category || "other")}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-lg">{expense.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="w-4 h-4 text-gray-500" />
                                <p className="text-sm text-gray-600 font-medium">{expense.created_by.full_name}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-500">
                                  {new Date(expense.created_at).toLocaleTimeString("ar-EG", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-red-600 text-xl">{formatEgyptianCurrency(expense.amount)}</p>
                            <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium mt-1">
                              مصروف #{index + 1}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Active Staff */}
              <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <span>الموظفين الحاضرين</span>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {shiftWorkers.filter((sw) => sw.is_active).length}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {shiftWorkers.filter((sw) => sw.is_active).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg font-medium">لا يوجد موظفين حاضرين</p>
                      <p className="text-gray-400 text-sm mt-1">قم بتسجيل حضور الموظفين</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {shiftWorkers
                        .filter((sw) => sw.is_active)
                        .slice(0, 5)
                        .map((sw, index) => {
                          const hours = calculateHours(sw.start_time)
                          const salary = calculateSalary(hours, sw.worker.base_hourly_rate)
                          return (
                            <div
                              key={sw.shift_worker_id}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all duration-300 border border-green-200"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl shadow-lg ${getWorkerRoleColor(sw.worker.status)}`}>
                                  {getWorkerRoleIcon(sw.worker.status)}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-lg">{sw.worker.full_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                      {sw.worker.status}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-sm">
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <Clock className="w-4 h-4" />
                                      <span className="font-medium">{hours.toFixed(1)} ساعة</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-green-600 text-xl">{formatEgyptianCurrency(salary)}</p>
                                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium mt-1">
                                  راتب متوقع
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Enhanced Add Expense Form */}
              <div className="lg:col-span-2">
                <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden sticky top-6">
                  <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span>{arabicLabels.add_expense}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          {arabicLabels.expense_category}
                        </Label>
                        <Select value={form.category} onValueChange={(value) => handleChange("category", value)}>
                          <SelectTrigger className={`h-12 ${errors.category ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"} transition-colors`}>
                            <SelectValue placeholder="اختر فئة المصروف" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded ${category.color}`}></div>
                                  <span className="font-medium">{category.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.category}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          {arabicLabels.expense_title}
                        </Label>
                        <Input
                          id="title"
                          value={form.title}
                          onChange={(e) => handleChange("title", e.target.value)}
                          className={`h-12 ${errors.title ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"} transition-colors`}
                          placeholder="مثال: خضروات، لحوم، مواد تنظيف..."
                          required
                        />
                        {errors.title && (
                          <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.title}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          {arabicLabels.expense_description}
                        </Label>
                        <Textarea
                          id="description"
                          value={form.description}
                          onChange={(e) => handleChange("description", e.target.value)}
                          className="border-gray-300 hover:border-gray-400 transition-colors min-h-[80px]"
                          placeholder="تفاصيل إضافية (اختياري)"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          {arabicLabels.expense_amount}
                        </Label>
                        <div className="relative">
                          <Input
                            id="amount"
                            type="number"
                            value={form.amount}
                            onChange={(e) => handleChange("amount", e.target.value)}
                            className={`h-12 pr-16 text-lg font-bold ${errors.amount ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"} transition-colors`}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
                            ج.م
                          </div>
                        </div>
                        {errors.amount && (
                          <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.amount}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !currentUser || !activeShift}
                        className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>جاري الحفظ...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Plus className="w-5 h-5" />
                            <span>{arabicLabels.submit}</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Expenses List */}
              <div className="lg:col-span-3">
                <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-800 text-white">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xl">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <span>{arabicLabels.expenses_list}</span>
                        <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                          {expenses.length}
                        </div>
                      </div>
                      <Button 
                        onClick={fetchExpenses} 
                        disabled={loadingExpenses} 
                        variant="ghost" 
                        size="sm"
                        className="text-white hover:bg-white/20 transition-colors"
                      >
                        <RefreshCw className={`w-5 h-5 ${loadingExpenses ? "animate-spin" : ""}`} />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingExpenses ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
                          <span className="text-gray-600 text-lg font-medium">{arabicLabels.loading}</span>
                        </div>
                      </div>
                    ) : expenses.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <Receipt className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-xl font-bold mb-2">{arabicLabels.no_expenses}</p>
                        <p className="text-gray-400">ابدأ بإضافة أول مصروف لهذا اليوم</p>
                      </div>
                    ) : (
                      <div className="max-h-[600px] overflow-y-auto">
                        {expenses.map((expense, index) => (
                          <div
                            key={expense.expense_id}
                            className={`p-6 border-b hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-300 ${
                              index === expenses.length - 1 ? "border-b-0" : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className={`p-3 ${getCategoryColor(expense.category || "other")} rounded-xl shadow-lg`}>
                                  {getCategoryIcon(expense.category || "other")}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-gray-900 text-lg">{expense.title}</h3>
                                    <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                                      #{index + 1}
                                    </div>
                                  </div>
                                  {expense.description && (
                                    <p className="text-gray-600 mb-3 bg-gray-50 p-2 rounded-lg">{expense.description}</p>
                                  )}
                                  <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2 text-blue-600">
                                      <User className="w-4 h-4" />
                                      <span className="font-medium">{expense.created_by.full_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {new Date(expense.created_at).toLocaleTimeString("ar-EG", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-left">
                                  <p className="font-bold text-red-600 text-2xl">{formatEgyptianCurrency(expense.amount)}</p>
                                  <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold mt-1 text-center">
                                    مصروف
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    onClick={() => handleEdit(expense)}
                                  >
                                    <Edit className="w-5 h-5" />
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-10 w-10 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                        disabled={deletingExpense === expense.expense_id}
                                      >
                                        {deletingExpense === expense.expense_id ? (
                                          <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-5 h-5" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>{arabicLabels.delete_confirm_title}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {arabicLabels.delete_confirm_message}
                                          <br />
                                          <strong>{expense.title}</strong>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>{arabicLabels.cancel}</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(expense.expense_id, expense.title)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          {arabicLabels.confirm_delete}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Enhanced Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Enhanced Assign Staff */}
              <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <span>{arabicLabels.assign_staff}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {!activeShift ? (
                    <Alert className="border-0 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-l-yellow-500">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <AlertDescription className="text-yellow-800 font-medium text-lg">
                          يجب فتح وردية أولاً لتسجيل حضور الموظفين
                        </AlertDescription>
                      </div>
                    </Alert>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">{arabicLabels.available_staff}:</h3>
                      </div>
                      {loadingWorkers ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
                            <span className="text-gray-600 font-medium">جاري التحميل...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {availableWorkers
                            .filter(
                              (worker) =>
                                !shiftWorkers.some((sw) => sw.worker.worker_id === worker.worker_id && sw.is_active),
                            )
                            .map((worker) => (
                              <div
                                key={worker.worker_id}
                                className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl shadow-lg ${getWorkerRoleColor(worker.status)}`}>
                                    {getWorkerRoleIcon(worker.status)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-lg">{worker.full_name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                                        {worker.status}
                                      </div>
                                    </div>
                                    <p className="text-green-600 font-bold text-sm mt-1">
                                      {formatEgyptianCurrency(worker.base_hourly_rate)}/ساعة
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => assignWorkerToShift(worker.worker_id)}
                                  disabled={assigningWorker === worker.worker_id}
                                  size="lg"
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                  {assigningWorker === worker.worker_id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <UserCheck className="w-5 h-5" />
                                      <span>تسجيل حضور</span>
                                    </div>
                                  )}
                                </Button>
                              </div>
                            ))}
                          {availableWorkers.filter(
                            (worker) =>
                              !shiftWorkers.some((sw) => sw.worker.worker_id === worker.worker_id && sw.is_active),
                          ).length === 0 && (
                            <div className="text-center py-12">
                              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                <UserCheck className="w-10 h-10 text-gray-400" />
                              </div>
                              <p className="text-gray-500 text-lg font-medium">جميع الموظفين مسجلين في الوردية</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Active Staff */}
              <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <span>{arabicLabels.active_staff}</span>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {shiftWorkers.filter((sw) => sw.is_active).length}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {shiftWorkers.filter((sw) => sw.is_active).length === 0 ? (
                    <div className="text-center py-16 px-6">
                      <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                        <Users className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-xl font-bold mb-2">لا يوجد موظفين حاضرين</p>
                      <p className="text-gray-400">قم بتسجيل حضور الموظفين من القائمة المجاورة</p>
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto">
                      {shiftWorkers
                        .filter((sw) => sw.is_active)
                        .map((shiftWorker, index) => {
                          const hoursWorked = calculateHours(shiftWorker.start_time, shiftWorker.end_time)
                          const estimatedSalary = calculateSalary(hoursWorked, shiftWorker.worker.base_hourly_rate)

                          return (
                            <div
                              key={shiftWorker.shift_worker_id}
                              className={`p-6 border-b hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 ${
                                index === shiftWorkers.filter((sw) => sw.is_active).length - 1 ? "border-b-0" : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl shadow-lg ${getWorkerRoleColor(shiftWorker.worker.status)}`}>
                                    {getWorkerRoleIcon(shiftWorker.worker.status)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="font-bold text-gray-900 text-lg">{shiftWorker.worker.full_name}</h3>
                                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                        نشط
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                        {shiftWorker.worker.status}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium">بدء: {new Date(shiftWorker.start_time).toLocaleTimeString("ar-EG", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-green-600">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-bold">{hoursWorked.toFixed(1)} ساعة</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-left">
                                    <p className="font-bold text-green-600 text-2xl mb-1">
                                      {formatEgyptianCurrency(estimatedSalary)}
                                    </p>
                                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold text-center">
                                      راتب متوقع
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => endWorkerShift(shiftWorker.shift_worker_id)}
                                    disabled={endingWorker === shiftWorker.shift_worker_id}
                                    size="lg"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700 font-bold transition-all duration-300"
                                  >
                                    {endingWorker === shiftWorker.shift_worker_id ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <UserX className="w-5 h-5" />
                                        <span>انصراف</span>
                                      </div>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-2xl">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Edit className="w-6 h-6" />
                </div>
                {arabicLabels.edit_expense}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 px-2">
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {arabicLabels.expense_category}
                </Label>
                <Select value={editForm.category} onValueChange={(value) => handleChange("category", value, true)}>
                  <SelectTrigger className={`h-12 ${editErrors.category ? "border-red-500 bg-red-50" : "border-gray-300"} hover:border-gray-400 transition-colors`}>
                    <SelectValue placeholder="اختر فئة المصروف" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${category.color}`}></div>
                          <span className="font-medium">{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.category && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {editErrors.category}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  {arabicLabels.expense_title}
                </Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => handleChange("title", e.target.value, true)}
                  className={`h-12 ${editErrors.title ? "border-red-500 bg-red-50" : "border-gray-300"} hover:border-gray-400 transition-colors`}
                />
                {editErrors.title && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {editErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {arabicLabels.expense_description}
                </Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => handleChange("description", e.target.value, true)}
                  rows={3}
                  className="border-gray-300 hover:border-gray-400 transition-colors min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-amount" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  {arabicLabels.expense_amount}
                </Label>
                <div className="relative">
                  <Input
                    id="edit-amount"
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => handleChange("amount", e.target.value, true)}
                    className={`h-12 pr-16 text-lg font-bold ${editErrors.amount ? "border-red-500 bg-red-50" : "border-gray-300"} hover:border-gray-400 transition-colors`}
                    min="0"
                    step="0.01"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">ج.م</div>
                </div>
                {editErrors.amount && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {editErrors.amount}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-3 pt-6">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                className="h-12 px-6 border-2 border-gray-300 hover:border-gray-400 font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  {arabicLabels.cancel}
                </div>
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={loading}
                className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {arabicLabels.update}
                  </div>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
