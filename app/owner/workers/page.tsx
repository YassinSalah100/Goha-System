"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { Loader2, CheckCircle, XCircle, User,DollarSign, Phone, Briefcase, Users, Plus, RefreshCw, Trash2,} from "lucide-react"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

const arabicLabels = {
  create_worker: "إضافة عامل جديد",
  full_name: "الاسم الكامل",
  hourly_rate: "الأجر بالساعة (جنيه مصري)",
  worker_role: "نوع الوظيفة",
  phone: "رقم الهاتف (اختياري)",
  submit: "حفظ العامل",
  success: "تمت إضافة العامل بنجاح",
  delete_success: "تم حذف العامل بنجاح",
  fail: "حدث خطأ أثناء الإضافة",
  delete_fail: "حدث خطأ أثناء حذف العامل",
  validation_error: "يرجى التحقق من البيانات المدخلة",
  phone_format: "يرجى إدخال رقم هاتف صحيح",
  required_field: "هذا الحقل مطلوب",
  positive_number: "يجب أن يكون الرقم أكبر من صفر",
  workers_list: "قائمة العمال",
  no_workers: "لا توجد عمال مسجلين",
  loading_workers: "جاري تحميل العمال...",
  refresh: "تحديث",
  delete: "حذف",
  delete_confirm_title: "تأكيد الحذف",
  delete_confirm_message: "هل أنت متأكد من حذف هذا العامل؟ لا يمكن التراجع عن هذا الإجراء.",
  cancel: "إلغاء",
  confirm_delete: "نعم، احذف",
  deleting: "جاري الحذف...",
}

const workerRoleOptions = [
  { value: "admin", label: "مدير", color: "bg-purple-100 text-purple-800" },
  { value: "cashier", label: "كاشير", color: "bg-green-100 text-green-800" },
  { value: "chef", label: "طباخ رئيسي", color: "bg-red-100 text-red-800" },
  { value: "waiter", label: "نادل", color: "bg-blue-100 text-blue-800" },
  { value: "delivery", label: "موصل", color: "bg-yellow-100 text-yellow-800" },
  { value: "kitchen", label: "مطبخ", color: "bg-orange-100 text-orange-800" },
  { value: "steawer", label: "ستيوارد", color: "bg-indigo-100 text-indigo-800" },
  { value: "kitchen_assistant", label: "مساعد مطبخ", color: "bg-gray-100 text-gray-800" },
]

interface FormData {
  full_name: string
  base_hourly_rate: string
  status: string
  phone: string
}

interface Worker {
  worker_id: string
  full_name: string
  status: string
  base_hourly_rate: number
  phone?: string
  is_active: boolean
  joined_at: string
}

interface FormErrors {
  full_name?: string
  base_hourly_rate?: string
  phone?: string
  status?: string
}

export default function WorkerManagementPage() {
  const [form, setForm] = useState<FormData>({
    full_name: "",
    base_hourly_rate: "",
    status: "",
    phone: "",
  })

  const [workers, setWorkers] = useState<Worker[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [msgType, setMsgType] = useState<"success" | "error">("success")
  const [loading, setLoading] = useState(false)
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [deletingWorker, setDeletingWorker] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!form.full_name.trim()) {
      newErrors.full_name = arabicLabels.required_field
    }

    if (!form.base_hourly_rate.trim()) {
      newErrors.base_hourly_rate = arabicLabels.required_field
    } else {
      const rate = Number.parseFloat(form.base_hourly_rate)
      if (isNaN(rate) || rate <= 0) {
        newErrors.base_hourly_rate = arabicLabels.positive_number
      }
    }

    if (!form.status) {
      newErrors.status = arabicLabels.required_field
    }

    // Validate phone format if provided
    if (form.phone.trim()) {
      const phoneRegex = /^\+?[0-9]{8,15}$/
      const cleanPhone = form.phone.replace(/[\s\-()]/g, "")
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = arabicLabels.phone_format
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value })
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined })
    }
  }

  const fetchWorkers = async () => {
    setLoadingWorkers(true)
    try {
      const res = await fetch(`${API_BASE_URL}/workers`, {
        headers: { Accept: "application/json" },
      })
      const responseData = await res.json()

      if (res.ok && responseData.success) {
        setWorkers(responseData.data || [])
      }
    } catch (error) {
      console.error("Error fetching workers:", error)
    } finally {
      setLoadingWorkers(false)
    }
  }

  const handleDeleteWorker = async (workerId: string, workerName: string) => {
    setDeletingWorker(workerId)
    try {
      const res = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      })

      const responseData = await res.json()

      if (res.ok && responseData.success) {
        setMsg(`${arabicLabels.delete_success}: ${workerName}`)
        setMsgType("success")
        // Remove worker from local state
        setWorkers(workers.filter((w) => w.worker_id !== workerId))
      } else {
        throw new Error(responseData.message || arabicLabels.delete_fail)
      }
    } catch (error: any) {
      console.error("Error deleting worker:", error)
      setMsg(error.message || arabicLabels.delete_fail)
      setMsgType("error")
    } finally {
      setDeletingWorker(null)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setErrors({})

    if (!validateForm()) {
      setMsg(arabicLabels.validation_error)
      setMsgType("error")
      return
    }

    setLoading(true)

    try {
      const payload: any = {
        full_name: form.full_name.trim(),
        status: form.status,
        base_hourly_rate: Number.parseFloat(form.base_hourly_rate),
      }

      if (form.phone.trim()) {
        let formattedPhone = form.phone.replace(/[\s\-()]/g, "")
        if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+" + formattedPhone
        }
        payload.phone = formattedPhone
      }

      const res = await fetch(`${API_BASE_URL}/workers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      if (!res.ok) {
        if (responseData.message) {
          throw new Error(responseData.message)
        } else if (responseData.errors && Array.isArray(responseData.errors)) {
          const backendErrors: FormErrors = {}
          responseData.errors.forEach((error: any) => {
            if (error.param) {
              backendErrors[error.param as keyof FormErrors] = error.msg
            }
          })
          setErrors(backendErrors)
          throw new Error(arabicLabels.validation_error)
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
      }

      if (responseData.success) {
        setMsg(arabicLabels.success)
        setMsgType("success")
        setForm({ full_name: "", base_hourly_rate: "", status: "", phone: "" })
        // Refresh workers list
        fetchWorkers()
      } else {
        throw new Error(responseData.message || arabicLabels.fail)
      }
    } catch (error: any) {
      console.error("Error creating worker:", error)
      setMsg(error.message || arabicLabels.fail)
      setMsgType("error")
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (status: string) => {
    const role = workerRoleOptions.find((r) => r.value === status)
    return role ? role.label : status
  }

  const getRoleColor = (status: string) => {
    const role = workerRoleOptions.find((r) => r.value === status)
    return role ? role.color : "bg-gray-100 text-gray-800"
  }

  const formatEgyptianCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            إدارة العمال
          </h1>
          <p className="text-gray-600">إضافة وإدارة العمال في النظام</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Worker Form */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                {arabicLabels.create_worker}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {msg && (
                <Alert
                  className={`mb-6 ${msgType === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                >
                  <div className="flex items-center gap-2">
                    {msgType === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <AlertDescription className={msgType === "success" ? "text-green-800" : "text-red-800"}>
                      {msg}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {arabicLabels.full_name}
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    className={`${errors.full_name ? "border-red-500 focus:border-red-500" : ""}`}
                    placeholder="أدخل الاسم الكامل"
                    required
                  />
                  {errors.full_name && <p className="text-sm text-red-600">{errors.full_name}</p>}
                </div>

                {/* Worker Role */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {arabicLabels.worker_role}
                  </Label>
                  <Select value={form.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger className={`${errors.status ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="اختر نوع الوظيفة" />
                    </SelectTrigger>
                    <SelectContent>
                      {workerRoleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${option.color.split(" ")[0]}`}></div>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
                </div>

                {/* Hourly Rate */}
                <div className="space-y-2">
                  <Label htmlFor="base_hourly_rate" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {arabicLabels.hourly_rate}
                  </Label>
                  <div className="relative">
                    <Input
                      id="base_hourly_rate"
                      type="number"
                      value={form.base_hourly_rate}
                      onChange={(e) => handleChange("base_hourly_rate", e.target.value)}
                      className={`${errors.base_hourly_rate ? "border-red-500 focus:border-red-500" : ""} pl-12`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">ج.م</div>
                  </div>
                  {errors.base_hourly_rate && <p className="text-sm text-red-600">{errors.base_hourly_rate}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {arabicLabels.phone}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={`${errors.phone ? "border-red-500 focus:border-red-500" : ""}`}
                    placeholder="+201021407665"
                  />
                  {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                  <p className="text-xs text-gray-500">مثال: +201021407665 أو 01021407665</p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الحفظ...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {arabicLabels.submit}
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Workers List */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {arabicLabels.workers_list}
                </div>
                <Button
                  onClick={fetchWorkers}
                  disabled={loadingWorkers}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingWorkers ? "animate-spin" : ""}`} />
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {loadingWorkers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="mr-2 text-gray-600">{arabicLabels.loading_workers}</span>
                </div>
              ) : workers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{arabicLabels.no_workers}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {workers.map((worker) => (
                    <div
                      key={worker.worker_id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{worker.full_name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(worker.status)}>{getRoleLabel(worker.status)}</Badge>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                                disabled={deletingWorker === worker.worker_id}
                              >
                                {deletingWorker === worker.worker_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{arabicLabels.delete_confirm_title}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {arabicLabels.delete_confirm_message}
                                  <br />
                                  <strong>{worker.full_name}</strong> - {getRoleLabel(worker.status)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{arabicLabels.cancel}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteWorker(worker.worker_id, worker.full_name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {arabicLabels.confirm_delete}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-medium text-green-600">
                            {formatEgyptianCurrency(worker.base_hourly_rate)}/ساعة
                          </span>
                        </div>

                        {worker.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{worker.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span>انضم في: {new Date(worker.joined_at).toLocaleDateString("ar-EG")}</span>
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
    </div>
  )
}
