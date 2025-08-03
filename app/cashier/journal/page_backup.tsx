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

const API_BASE_URL = "http://192.168.1.14:3000/api/v1"

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
  worker_id: string
  shift_id: string
  hourly_rate: number
  start_time: string
  end_time?: string
  hours_worked?: number
  calculated_salary?: number
  is_active: boolean
  created_at: string
  // Worker details - these will be populated from a separate call or joined data
  worker?: Worker
  // Fallback fields in case worker object is not populated
  worker_name?: string
  worker_status?: string
  worker_base_hourly_rate?: number
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
  // Track the mapping between shift workers and actual workers
  const [shiftWorkerMapping, setShiftWorkerMapping] = useState<Map<string, string>>(new Map())

  // Helper function to validate or format ID
  const ensureValidId = (id: any, fieldName: string): string => {
    if (!id || id === "undefined" || id === "null") {
      throw new Error(`${fieldName} مفقود`)
    }
    const idStr = String(id).trim()
    // Check if it's already a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (uuidRegex.test(idStr)) {
      return idStr
    }
    // If it's a simple number or string, return as-is (let backend handle validation)
    return idStr
  }

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
      console.log("Raw workers API response:", responseData)

      let workers = []
      if (responseData.success && Array.isArray(responseData.data)) {
        workers = responseData.data
      } else if (Array.isArray(responseData)) {
        workers = responseData
      } else if (responseData.data && Array.isArray(responseData.data)) {
        workers = responseData.data
      } else if (typeof responseData === "object" && responseData !== null) {
        // If it's an object, try to extract workers array
        const values = Object.values(responseData)
        workers = values.filter((item): item is Worker => {
          return item !== null && 
                 typeof item === "object" && 
                 'worker_id' in item && 
                 'full_name' in item
        })
      }

      console.log("Processed workers array:", workers)
      setAvailableWorkers(Array.isArray(workers) ? workers : [])
    } catch (error) {
      console.error("Error fetching workers:", error)
      setAvailableWorkers([])
    } finally {
      setLoadingWorkers(false)
    }
  }

  // Enhanced fetchShiftWorkers that uses mapping to match workers properly
  const fetchShiftWorkers = async () => {
    if (!activeShift) return
    try {
      const responseData = await fetchWithErrorHandling(`${API_BASE_URL}/shift-workers/shift/${activeShift.shift_id}`)
      const workers = Array.isArray(responseData.success ? responseData.data : responseData)
        ? responseData.success
          ? responseData.data
          : responseData
        : []

      console.log("Raw shift workers data:", workers)
      console.log("Available workers for matching:", availableWorkers)

      // Keep track of workers already assigned to avoid duplicates
      const usedWorkerIds = new Set<string>()

      // Process shift workers and match them with available workers using mapping
      const enrichedWorkers = workers
        .map((sw: any) => {
          try {
            // Create a standardized shift worker object
            const standardizedSW: ShiftWorker = {
              shift_worker_id: sw.shift_worker_id || sw.id,
              worker_id: "pending", // Will be determined by mapping
              shift_id: sw.shift_id || sw.shift?.shift_id || activeShift.shift_id,
              hourly_rate: Number(sw.hourly_rate) || 0,
              start_time: sw.start_time,
              end_time: sw.end_time,
              hours_worked: sw.hours_worked,
              calculated_salary: sw.calculated_salary,
              is_active: sw.end_time === null, // Active if no end_time
              created_at: sw.created_at || new Date().toISOString(),
            }

            let matchingWorker: Worker | undefined

            // Strategy 1: Try to use the mapping we stored when creating the worker
            const mappedWorkerId = shiftWorkerMapping.get(sw.shift_worker_id)
            if (mappedWorkerId && !usedWorkerIds.has(mappedWorkerId)) {
              matchingWorker = availableWorkers.find((w) => w.worker_id === mappedWorkerId)
              console.log(`Using mapping for ${sw.shift_worker_id} -> ${mappedWorkerId}:`, matchingWorker)
            }

            // Strategy 2: If no mapping or mapped worker not found, try to match by hourly rate
            if (!matchingWorker) {
              matchingWorker = availableWorkers.find(
                (worker) =>
                  Math.abs(worker.base_hourly_rate - standardizedSW.hourly_rate) < 0.01 &&
                  !usedWorkerIds.has(worker.worker_id),
              )
              console.log(`Matching by hourly rate ${standardizedSW.hourly_rate}:`, matchingWorker)
            }

            // Strategy 3: If still no match, find any available worker not yet used
            if (!matchingWorker) {
              matchingWorker = availableWorkers.find((worker) => !usedWorkerIds.has(worker.worker_id))
              console.log(`Using first available worker:`, matchingWorker)
            }

            if (matchingWorker) {
              standardizedSW.worker = {
                worker_id: matchingWorker.worker_id,
                full_name: matchingWorker.full_name,
                status: matchingWorker.status,
                base_hourly_rate: matchingWorker.base_hourly_rate,
              }
              standardizedSW.worker_id = matchingWorker.worker_id

              // Mark this worker as used to prevent duplicates
              usedWorkerIds.add(matchingWorker.worker_id)

              // Update mapping if we found a match and don't already have one
              if (!shiftWorkerMapping.has(sw.shift_worker_id)) {
                setShiftWorkerMapping((prev) => new Map(prev.set(sw.shift_worker_id, matchingWorker!.worker_id)))
              }

              console.log(`Successfully matched shift worker ${sw.shift_worker_id} with ${matchingWorker.full_name}`)
            } else {
              // Fallback: create a placeholder with better naming
              const placeholderName = `موظف غير محدد`
              standardizedSW.worker = {
                worker_id: `unknown_${sw.shift_worker_id}`,
                full_name: placeholderName,
                status: "موظف",
                base_hourly_rate: standardizedSW.hourly_rate,
              }
              standardizedSW.worker_id = standardizedSW.worker.worker_id
              console.log(`No match found for shift worker ${sw.shift_worker_id}, using placeholder`)
            }

            return standardizedSW
          } catch (error) {
            console.error("Error processing shift worker:", sw, error)
            return null
          }
        })
        .filter((sw: ShiftWorker | null): sw is ShiftWorker => sw !== null)

      console.log("Enriched shift workers:", enrichedWorkers)
      console.log("Used worker IDs:", Array.from(usedWorkerIds))
      setShiftWorkers(enrichedWorkers)
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

    // Check if this worker is already assigned to the active shift
    const isAlreadyAssigned = shiftWorkers.some((sw) => sw.worker_id === workerId && sw.is_active)

    if (isAlreadyAssigned) {
      setMsg("هذا الموظف مسجل حضوره بالفعل في الوردية")
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
      const selectedWorker = availableWorkers.find((w) => w.worker_id === workerId)
      const hourlyRate = selectedWorker?.base_hourly_rate

      if (!hourlyRate || hourlyRate <= 0) {
        setMsg("يجب تحديد أجر/ساعة صحيح للموظف")
        setMsgType("error")
        setAssigningWorker(null)
        return
      }

      // Enhanced payload with all required fields
      const payload = {
        worker_id: workerId,
        shift_id: activeShift.shift_id,
        hourly_rate: hourlyRate,
        start_time: new Date().toISOString(),
        status: "ACTIVE", // Use enum value
        is_active: true,
      }

      console.log("Enhanced payload being sent:", payload)

      const response = await fetch(`${API_BASE_URL}/shift-workers`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)
      const responseData = await response.json()
      console.log("Response data:", responseData)

      if (!response.ok) {
        console.error("API Error Details:", {
          status: response.status,
          statusText: response.statusText,
          responseData: responseData,
        })
        const errorMessage =
          responseData.message ||
          responseData.error ||
          responseData.details ||
          (responseData.errors && Array.isArray(responseData.errors)
            ? responseData.errors.map((e: any) => e.msg || e.message).join(", ")
            : `HTTP ${response.status}: ${response.statusText}`)
        throw new Error(errorMessage)
      }

      // Store the mapping between shift worker and actual worker
      const newShiftWorkerId = responseData.shift_worker_id || responseData.data?.shift_worker_id
      if (newShiftWorkerId) {
        console.log(`Storing mapping: ${newShiftWorkerId} -> ${workerId}`)
        setShiftWorkerMapping((prev) => new Map(prev.set(newShiftWorkerId, workerId)))
      }

      const workerName = selectedWorker?.full_name || "الموظف"
      setMsg(`تم تسجيل حضور ${workerName} ✓`)
      setMsgType("success")
      // Refresh the shift workers list
      await fetchShiftWorkers()
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
      // Use the correct endpoint pattern that matches your backend routes
      await fetchWithErrorHandling(`${API_BASE_URL}/shift-workers/end-time`, {
        method: "PATCH",
        body: JSON.stringify({
          shift_worker_id: shiftWorkerId,
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
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
    
    // Enforce a minimum of 0.25 hours (15 minutes) for UI display purposes
    // This is just for display - actual calculations should use the precise time
    // when submitting to the server
    return Math.max(hours, 0.25)
  }

  const calculateSalary = (hours: number, hourlyRate: number) => {
    return Math.round(hours * hourlyRate * 100) / 100
  }

  const fetchExpenses = async () => {
    if (!activeShift) {
      setExpenses([])
      return
    }
    
    setLoadingExpenses(true)
    try {
      // Directly fetch all expenses and filter client-side instead of trying a non-existent endpoint
      console.log("Fetching all expenses and filtering for current shift")
      const responseData = await fetchWithErrorHandling(`${API_BASE_URL}/expenses`)
      
      let expensesData = []
      
      if (Array.isArray(responseData)) {
        expensesData = responseData
      } else if (responseData.data && Array.isArray(responseData.data)) {
        expensesData = responseData.data
      } else if (responseData.success && responseData.data) {
        expensesData = Array.isArray(responseData.data) ? responseData.data : [responseData.data]
      }
      
      // Filter expenses to ensure they belong to the current shift
      const filteredExpenses = expensesData.filter((expense: any) => {
        // Check if expense has shift information and matches current shift
        if (expense.shift && expense.shift.shift_id) {
          return expense.shift.shift_id === activeShift.shift_id
        }
        // If no shift info, check shift_id directly (fallback)
        if (expense.shift_id) {
          return expense.shift_id === activeShift.shift_id
        }
        return false
      })
      
      console.log("Filtered expenses for current shift:", filteredExpenses)
      setExpenses(filteredExpenses)
    } catch (error) {
      console.error("Error fetching expenses:", error)
      setExpenses([])
    } finally {
      setLoadingExpenses(false)
    }
  }

  useEffect(() => {
    getCurrentUser()
    fetchAvailableWorkers()
  }, [])

  useEffect(() => {
    if (activeShift) {
      fetchExpenses()
      if (availableWorkers.length > 0) {
        fetchShiftWorkers()
      }
    }
  }, [activeShift, availableWorkers])

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
      const created_by = ensureValidId(currentUser.worker_id, "معرف المستخدم")
      const shift_id = ensureValidId(activeShift.shift_id, "معرف الوردية")

      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        amount: Number.parseFloat(form.amount),
        created_by: created_by,
        shift_id: shift_id,
      }

      if (form.category && form.category.trim() !== "") {
        payload.category = form.category.trim()
      }

      console.log("Expense Payload Debug:", {
        payload,
        originalData: {
          currentUser_worker_id: currentUser.worker_id,
          activeShift_shift_id: activeShift.shift_id,
        },
        processedData: {
          created_by,
          shift_id,
          created_by_type: typeof created_by,
          shift_id_type: typeof shift_id,
        },
      })

      await fetchWithErrorHandling(`${API_BASE_URL}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      setMsg(arabicLabels.success)
      setMsgType("success")
      setForm({ title: "", description: "", amount: "", category: "" })
      fetchExpenses()
    } catch (error: any) {
      console.error("Expense creation error:", error)
      // Handle specific validation errors
      let errorMessage = error.message || arabicLabels.fail
      if (error.message && error.message.includes("Validation failed")) {
        errorMessage = "خطأ في التحقق من البيانات - تأكد من صحة المعلومات المدخلة"
      } else if (error.message && error.message.includes("UUID")) {
        errorMessage = "خطأ في معرف المستخدم أو الوردية - يرجى إعادة تسجيل الدخول"
      } else if (error.message && error.message.includes("400")) {
        errorMessage = "البيانات المدخلة غير صحيحة - يرجى التحقق من جميع الحقول"
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
      // Safe access to worker properties with fallback values
      if (!sw.worker) {
        console.warn("Shift worker missing worker object:", sw)
        return total
      }
      
      // Calculate actual hours worked
      const hours = calculateHours(sw.start_time, sw.end_time)
      const hourlyRate = sw.worker.base_hourly_rate || sw.hourly_rate || 0
      const workerCost = calculateSalary(hours, hourlyRate)
      
      // Remove excessive logging that's causing console spam
      // Only log on development if needed for debugging
      // console.log(`Worker ${sw.worker.full_name}: ${hours}h × ${hourlyRate} = ${workerCost}`)
      
      return total + workerCost
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
    <div dir="rtl" className="min-h-screen bg-white p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Simplified Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">السجل اليومي</h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString("ar-EG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">الكاشير</p>
              <p className="font-medium text-gray-900">{currentUser ? currentUser.full_name : "غير محدد"}</p>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                activeShift ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {activeShift ? `${activeShift.type} - نشطة` : "لا توجد وردية"}
            </div>
          </div>
        </div>

        {/* Simplified Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-md border border-gray-100 shadow-sm p-3.5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-md">
                <Receipt className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">المصروفات اليوم</p>
                <p className="text-lg font-semibold text-gray-900">{formatEgyptianCurrency(getTotalExpenses())}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-md border border-gray-100 shadow-sm p-3.5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-md">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">تكلفة الموظفين</p>
                <p className="text-lg font-semibold text-gray-900">{formatEgyptianCurrency(getTotalStaffCost())}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-md border border-gray-100 shadow-sm p-3.5">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-md">
                <UserCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">الموظفين الحاضرين</p>
                <p className="text-lg font-semibold text-gray-900">
                  {shiftWorkers.filter((sw) => sw.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Message Alert */}
        {msg && (
          <div
            className={`rounded-md border p-3 flex items-center gap-2 text-sm ${
              msgType === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                : "bg-red-50 border-red-100 text-red-700"
            }`}
          >
            {msgType === "success" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{msg}</span>
          </div>
        )}

        {/* Streamlined Tabs */}
        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList className="w-full bg-gray-50 rounded-md p-1 border border-gray-100">
            <TabsTrigger
              value="expenses"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-1.5 px-3 text-sm"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>المصروفات</span>
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-1.5 px-3 text-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>الموظفين</span>
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Enhanced Add Expense Form */}
              <div className="lg:col-span-2">
                <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden sticky top-6">
                  <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Plus className="w-4 h-4" />
                      <span>{arabicLabels.add_expense}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="category"
                          className="text-xs font-medium text-gray-700 flex items-center gap-1.5"
                        >
                          <Package className="w-3.5 h-3.5" />
                          {arabicLabels.expense_category}
                        </Label>
                        <Select value={form.category} onValueChange={(value) => handleChange("category", value)}>
                          <SelectTrigger
                            className={`h-10 ${errors.category ? "border-red-500 bg-red-50" : "border-gray-200"} text-sm`}
                          >
                            <SelectValue placeholder="اختر فئة المصروف" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-sm ${category.color}`}></div>
                                  <span className="text-sm">{category.label}</span>
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

                      <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                          <Edit className="w-3.5 h-3.5" />
                          {arabicLabels.expense_title}
                        </Label>
                        <Input
                          id="title"
                          value={form.title}
                          onChange={(e) => handleChange("title", e.target.value)}
                          className={`h-10 text-sm ${errors.title ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                          placeholder="مثال: خضروات، لحوم، مواد تنظيف..."
                          required
                        />
                        {errors.title && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {errors.title}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="description"
                          className="text-xs font-medium text-gray-700 flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          {arabicLabels.expense_description}
                        </Label>
                        <Textarea
                          id="description"
                          value={form.description}
                          onChange={(e) => handleChange("description", e.target.value)}
                          className="border-gray-200 text-sm min-h-[60px]"
                          placeholder="تفاصيل إضافية (اختياري)"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="amount" className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5" />
                          {arabicLabels.expense_amount}
                        </Label>
                        <div className="relative">
                          <Input
                            id="amount"
                            type="number"
                            value={form.amount}
                            onChange={(e) => handleChange("amount", e.target.value)}
                            className={`h-10 pl-12 pr-4 text-sm text-right ${errors.amount ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                            dir="ltr"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                            ج.م
                          </div>
                        </div>
                        {errors.amount && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {errors.amount}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !currentUser || !activeShift}
                        className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري الحفظ...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
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
                        <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">{expenses.length}</div>
                      </div>
                      <Button
                        onClick={fetchExpenses}
                        disabled={loadingExpenses}
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700 h-7 w-7 p-0 bg-gray-100 hover:bg-gray-200 rounded-full"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingExpenses ? "animate-spin" : ""}`} />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingExpenses ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                          <span className="text-gray-500 text-sm">{arabicLabels.loading}</span>
                        </div>
                      </div>
                    ) : expenses.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                          <Receipt className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">{arabicLabels.no_expenses}</p>
                        <p className="text-gray-400 text-xs">ابدأ بإضافة أول مصروف لهذا اليوم</p>
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-y-auto border-t border-gray-100">
                        {expenses.map((expense, index) => (
                          <div
                            key={expense.expense_id}
                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between p-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`p-2 ${getCategoryColor(expense.category || "other")} rounded-md`}>
                                  {getCategoryIcon(expense.category || "other")}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-gray-900 text-sm">{expense.title}</h3>
                                    <div className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                                      #{index + 1}
                                    </div>
                                  </div>
                                  {expense.description && (
                                    <p className="text-xs text-gray-600 mb-2 bg-gray-50 p-1.5 rounded">
                                      {expense.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      <span>{expense.created_by.full_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
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
                              <div className="flex items-center gap-2">
                                <div className="text-left mr-2">
                                  <p className="font-medium text-blue-700 text-sm">
                                    {formatEgyptianCurrency(expense.amount)}
                                  </p>
                                  <div className="text-xs text-gray-500 mt-0.5 text-center">مصروف</div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    onClick={() => handleEdit(expense)}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                        disabled={deletingExpense === expense.expense_id}
                                      >
                                        {deletingExpense === expense.expense_id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-xs">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-base">
                                          {arabicLabels.delete_confirm_title}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm">
                                          {arabicLabels.delete_confirm_message}
                                          <br />
                                          <strong className="text-gray-900">{expense.title}</strong>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="gap-2 mt-4">
                                        <AlertDialogCancel className="text-xs h-8">
                                          {arabicLabels.cancel}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(expense.expense_id, expense.title)}
                                          className="bg-red-600 hover:bg-red-700 text-xs h-8"
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
                              (worker) => !shiftWorkers.some((sw) => sw.worker_id === worker.worker_id && sw.is_active),
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
                            (worker) => !shiftWorkers.some((sw) => sw.worker_id === worker.worker_id && sw.is_active),
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

              {/* Simplified Active Staff */}
              <Card className="bg-white border border-gray-100 rounded-md overflow-hidden">
                <CardHeader className="bg-emerald-600 text-white py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-4 h-4" />
                    <span>{arabicLabels.active_staff}</span>
                    <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {shiftWorkers.filter((sw) => sw.is_active).length}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {shiftWorkers.filter((sw) => sw.is_active).length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium mb-1">لا يوجد موظفين حاضرين</p>
                      <p className="text-gray-400 text-xs">قم بتسجيل حضور الموظفين من القائمة المجاورة</p>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto border-t border-gray-100">
                      {shiftWorkers
                        .filter((sw) => sw.is_active && sw.worker)
                        .map((shiftWorker, index) => {
                          const hoursWorked = calculateHours(shiftWorker.start_time, shiftWorker.end_time)
                          const estimatedSalary = calculateSalary(
                            hoursWorked,
                            shiftWorker.worker!.base_hourly_rate || shiftWorker.hourly_rate,
                          )
                          return (
                            <div
                              key={shiftWorker.shift_worker_id}
                              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-md ${getWorkerRoleColor(shiftWorker.worker!.status)}`}>
                                    {getWorkerRoleIcon(shiftWorker.worker!.status)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="font-bold text-gray-900 text-lg">
                                        {shiftWorker.worker!.full_name}
                                      </h3>
                                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                        نشط
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                        {shiftWorker.worker!.status}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium">
                                          بدء:{" "}
                                          {new Date(shiftWorker.start_time).toLocaleTimeString("ar-EG", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
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
          <DialogContent className="max-w-md bg-white rounded-md border border-gray-100">
            <DialogHeader className="bg-blue-600 text-white py-3 px-4 -m-6 mb-6 rounded-t-md">
              <DialogTitle className="text-base font-medium flex items-center gap-2">
                <Edit className="w-4 h-4" />
                {arabicLabels.edit_expense}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-category" className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  {arabicLabels.expense_category}
                </Label>
                <Select value={editForm.category} onValueChange={(value) => handleChange("category", value, true)}>
                  <SelectTrigger
                    className={`h-10 ${editErrors.category ? "border-red-500 bg-red-50" : "border-gray-200"} text-sm`}
                  >
                    <SelectValue placeholder="اختر فئة المصروف" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-sm ${category.color}`}></div>
                          <span className="text-sm">{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.category && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {editErrors.category}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" />
                  {arabicLabels.expense_title}
                </Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => handleChange("title", e.target.value, true)}
                  className={`h-10 text-sm ${editErrors.title ? "border-red-500 bg-red-50" : "border-gray-200"}`}
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
                    className={`h-12 pl-16 pr-4 text-lg font-bold text-right ${editErrors.amount ? "border-red-500 bg-red-50" : "border-gray-300"} hover:border-gray-400 transition-colors`}
                    min="0"
                    step="0.01"
                    dir="ltr"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold pointer-events-none">ج.م</div>
                </div>
                {editErrors.amount && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {editErrors.amount}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="h-9 text-sm border-gray-200"
              >
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  {arabicLabels.cancel}
                </div>
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
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
