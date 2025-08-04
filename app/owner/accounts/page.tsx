"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Eye, EyeOff, Plus, Users, UserPlus, Trash2, Save, X, Phone, Lock, DollarSign, Settings, Shield, ChevronDown, ChevronUp, Key } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { User } from "lucide-react"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from "chart.js"
import { Avatar } from "@/components/ui/avatar"
import { Tooltip } from "@/components/ui/tooltip"
ChartJS.register(ArcElement, ChartTooltip, Legend)

const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

interface Account {
  id: string
  username: string
  fullName: string
  isActive: boolean
  createdAt: string
  userPermissions?: string[]
  worker_id?: string
  permissions?: Permission[]
  phone?: string
  hourRate?: number
}

interface Permission {
  id: string
  name: string
  description?: string
  granted_at?: string
  granted_by?: string
  granted_by_name?: string
}

interface FormData {
  username: string
  fullName: string
  password: string
  phone: string
  hourRate: string
}

export default function AccountsPageFixed() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    username: "",
    fullName: "",
    password: "",
    phone: "",
    hourRate: "",
  })
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [allPermissions, setAllPermissions] = useState<any[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set())
  const [userPermissionsMap, setUserPermissionsMap] = useState<Map<string, Permission[]>>(new Map())

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("authToken")
  }

  // Fetch accounts from API
  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error("غير مصرح - يرجى تسجيل الدخول مرة أخرى")
        return
      }

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Accounts API response:", response)

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAccounts(result.data)
          // Fetch permissions for each user
          await fetchAllUserPermissions(result.data)
          toast.success(`تم تحميل ${result.data.length} حساب بنجاح`)
        } else {
          toast.error("فشل في تحميل الحسابات")
        }
      } else if (response.status === 401) {
        toast.error("انتهت صلاحية تسجيل الدخول - يرجى تسجيل الدخول مرة أخرى")
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "فشل في تحميل الحسابات")
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      toast.error("خطأ في الاتصال بالخادم")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch permissions for all users
  const fetchAllUserPermissions = async (users: Account[]) => {
    const permissionsMap = new Map<string, Permission[]>()
    
    try {
      // Fetch permissions for each user using the correct endpoints
      const token = getAuthToken()
      
      for (const user of users) {
        try {
          // Try the all-permissions endpoint first
          const response = await fetch(`${API_BASE_URL}/permissions/user/${user.id}/all-permissions`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              permissionsMap.set(user.id, result.data)
              continue
            }
          }

          // If that fails, try the regular permissions endpoint
          const altResponse = await fetch(`${API_BASE_URL}/permissions/user/${user.id}/permissions`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (altResponse.ok) {
            const altResult = await altResponse.json()
            if (altResult.success && altResult.data) {
              permissionsMap.set(user.id, altResult.data)
            } else {
              permissionsMap.set(user.id, [])
            }
          } else {
            permissionsMap.set(user.id, [])
          }
        } catch (error) {
          console.error(`Error fetching permissions for user ${user.id}:`, error)
          permissionsMap.set(user.id, [])
        }
      }
    } catch (error) {
      console.error("Error in fetchAllUserPermissions:", error)
      // Set empty permissions for all users if bulk fetch fails
      users.forEach(user => {
        permissionsMap.set(user.id, [])
      })
    }

    setUserPermissionsMap(permissionsMap)
  }

  // Fetch permissions for a specific user
  const fetchUserPermissions = async (userId: string) => {
    try {
      const token = getAuthToken()
      // Use the correct endpoint: /user/:userId/all-permissions
      const response = await fetch(`${API_BASE_URL}/permissions/user/${userId}/all-permissions`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const newMap = new Map(userPermissionsMap)
          newMap.set(userId, result.data)
          setUserPermissionsMap(newMap)
          return result.data
        }
      } else if (response.status === 404) {
        // Try alternative endpoint: /user/:userId/permissions
        const altResponse = await fetch(`${API_BASE_URL}/permissions/user/${userId}/permissions`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (altResponse.ok) {
          const altResult = await altResponse.json()
          if (altResult.success && altResult.data) {
            const newMap = new Map(userPermissionsMap)
            newMap.set(userId, altResult.data)
            setUserPermissionsMap(newMap)
            return altResult.data
          }
        }
      }
      return []
    } catch (error) {
      console.error(`Error fetching permissions for user ${userId}:`, error)
      return []
    }
  }

  // Toggle permissions expansion for a user
  const togglePermissions = async (userId: string) => {
    const newExpanded = new Set(expandedPermissions)
    
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
      // Fetch permissions if not already loaded
      if (!userPermissionsMap.has(userId) || userPermissionsMap.get(userId)?.length === 0) {
        await fetchUserPermissions(userId)
      }
    }
    
    setExpandedPermissions(newExpanded)
  }

  // Load accounts on component mount
  useEffect(() => {
    fetchAccounts()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Validate form data
  const validateForm = (): string | null => {
    if (!formData.username.trim()) return "اسم المستخدم مطلوب"
    if (!formData.fullName.trim()) return "الاسم الكامل مطلوب"
    if (!formData.password.trim()) return "كلمة المرور مطلوبة"
    if (formData.password.length < 6) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
    if (formData.hourRate && isNaN(Number(formData.hourRate))) return "معدل الساعة يجب أن يكون رقماً"
    if (formData.phone && formData.phone.length > 0 && formData.phone.length < 10) return "رقم الهاتف غير صحيح"
    return null
  }

  // Generate unique phone number to avoid conflicts
  const generateUniquePhone = () => {
    const timestamp = Date.now().toString().slice(-8)
    return `010${timestamp}`
  }

  // Create new account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsLoading(true)
    try {
      // Prepare data for API - match register DTO
      const userData = {
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        password: formData.password.trim(),
        ...(formData.phone.trim() ? { phone: formData.phone.trim() } : { phone: generateUniquePhone() }),
        ...(formData.hourRate ? { hourRate: Number(formData.hourRate) } : {}),
      }

      console.log("Sending to /auth/register:", userData)
      console.log("API URL:", `${API_BASE_URL}/auth/register`)

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("Success response:", result)

        if (result.success) {
          toast.success("تم إنشاء الحساب بنجاح")

          // Reset form
          setFormData({
            username: "",
            fullName: "",
            password: "",
            phone: "",
            hourRate: "",
          })
          setShowCreateForm(false)

          // Refresh accounts list
          await fetchAccounts()
        } else {
          toast.error(result.message || "فشل في إنشاء الحساب")
        }
      } else {
        const errorData = await response.json()
        let errorMessage = "فشل في إنشاء الحساب"
        if (response.status === 409) {
          if (errorData.message?.includes("username")) {
            errorMessage = "اسم المستخدم موجود بالفعل"
          } else if (errorData.message?.includes("phone")) {
            errorMessage = "رقم الهاتف موجود بالفعل - سيتم إنشاء رقم تلقائي"
            // Retry with generated phone number
            userData.phone = generateUniquePhone()
            const retryResponse = await fetch(`${API_BASE_URL}/auth/register`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(userData),
            })

            if (retryResponse.ok) {
              const retryResult = await retryResponse.json()
              if (retryResult.success) {
                toast.success(`تم إنشاء الحساب بنجاح برقم هاتف: ${userData.phone}`)
                setFormData({
                  username: "",
                  fullName: "",
                  password: "",
                  phone: "",
                  hourRate: "",
                })
                setShowCreateForm(false)
                await fetchAccounts()
                return
              }
            }
          }
        } else if (response.status === 400) {
          errorMessage = errorData.message || "بيانات غير صحيحة"
        }
        console.log("Parsed error data:", errorData)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error creating account:", error)
      toast.error("خطأ في الاتصال بالخادم")
    } finally {
      setIsLoading(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async (userId: string, username: string) => {
    if (!confirm(`هل أنت متأكد من حذف حساب "${username}"؟`)) {
      return
    }

    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error("غير مصرح - يرجى تسجيل الدخول مرة أخرى")
        return
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success(`تم حذف حساب "${username}" بنجاح`)
        await fetchAccounts()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "فشل في حذف الحساب")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("خطأ في الاتصال بالخادم")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all permissions for assign modal
  const fetchAllPermissions = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE_URL}/permissions`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.success) {
        setAllPermissions(data.data || [])
      } else {
        setAllPermissions([])
      }
    } catch (e) {
      setAllPermissions([])
    }
  }

  // Open assign modal
  const openAssignModal = (account: Account) => {
    setSelectedAccount(account)
    setSelectedPermissions(account.userPermissions || [])
    setShowAssignModal(true)
    setAssignError(null)
    setAssignSuccess(null)
    fetchAllPermissions()
  }

  // Handle permission selection
  const handlePermissionToggle = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    )
  }

  // Assign permissions to user
  const handleAssignPermissions = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return
    setAssignLoading(true)
    setAssignError(null)
    setAssignSuccess(null)
    try {
      const token = getAuthToken()
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || '{}')
      const grantedBy = currentUser.user_id || currentUser.id
      const res = await fetch(`${API_BASE_URL}/permissions/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedAccount.id,
          permissionIds: selectedPermissions,
          grantedBy,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAssignSuccess("تم تعيين الأذونات بنجاح")
        setShowAssignModal(false)
        fetchAccounts()
      } else {
        setAssignError(data.message || "فشل في تعيين الأذونات")
      }
    } catch (e: any) {
      setAssignError(e.message || "خطأ في الاتصال بالخادم")
    } finally {
      setAssignLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    try {
      return new Date(dateString).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "-"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            إدارة الحسابات
          </h1>
          <p className="text-gray-600 text-lg">إنشاء وإدارة حسابات المستخدمين</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">إجمالي الحسابات</p>
                  <p className="text-3xl font-bold">{accounts.length}</p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">الحسابات النشطة</p>
                  <p className="text-3xl font-bold">{accounts.filter((acc) => acc.isActive).length}</p>
                </div>
                <UserPlus className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">الحسابات المعطلة</p>
                  <p className="text-3xl font-bold">{accounts.filter((acc) => !acc.isActive).length}</p>
                </div>
                <X className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Create Account Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end"
        >
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 text-lg"
          >
            <Plus className="ml-2 h-5 w-5" />
            {showCreateForm ? "إلغاء" : "إنشاء حساب جديد"}
          </Button>
        </motion.div>

        {/* Create Account Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-800 flex items-center">
                    <UserPlus className="ml-2 h-6 w-6" />
                    إنشاء حساب جديد
                  </CardTitle>
                  <CardDescription>املأ البيانات التالية لإنشاء حساب مستخدم جديد</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAccount} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Username */}
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-lg font-semibold text-gray-700 flex items-center">
                          <User className="ml-2 h-5 w-5 text-blue-600" />
                          اسم المستخدم *
                        </Label>
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          placeholder="أدخل اسم المستخدم"
                          required
                          className="h-12 text-lg border-2 focus:border-blue-500"
                        />
                      </div>

                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-lg font-semibold text-gray-700 flex items-center">
                          <User className="ml-2 h-5 w-5 text-blue-600" />
                          الاسم الكامل *
                        </Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="أدخل الاسم الكامل"
                          required
                          className="h-12 text-lg border-2 focus:border-blue-500"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-lg font-semibold text-gray-700 flex items-center">
                          <Lock className="ml-2 h-5 w-5 text-blue-600" />
                          كلمة المرور *
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                            required
                            minLength={6}
                            className="h-12 text-lg border-2 focus:border-blue-500 pl-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-lg font-semibold text-gray-700 flex items-center">
                          <Phone className="ml-2 h-5 w-5 text-blue-600" />
                          رقم الهاتف (اختياري)
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="أدخل رقم الهاتف"
                          className="h-12 text-lg border-2 focus:border-blue-500"
                        />
                      </div>

                      {/* Hour Rate */}
                      <div className="space-y-2">
                        <Label htmlFor="hourRate" className="text-lg font-semibold text-gray-700 flex items-center">
                          <DollarSign className="ml-2 h-5 w-5 text-blue-600" />
                          معدل الساعة (اختياري)
                        </Label>
                        <Input
                          id="hourRate"
                          name="hourRate"
                          type="number"
                          value={formData.hourRate}
                          onChange={handleInputChange}
                          placeholder="أدخل معدل الساعة"
                          min="0"
                          step="0.01"
                          className="h-12 text-lg border-2 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                        className="px-6 py-3 text-lg"
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 text-lg"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                            جاري الإنشاء...
                          </>
                        ) : (
                          <>
                            <Save className="ml-2 h-5 w-5" />
                            إنشاء الحساب
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accounts Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-800 flex items-center">
                <Users className="ml-2 h-6 w-6" />
                قائمة الحسابات
              </CardTitle>
              <CardDescription>جميع حسابات المستخدمين المسجلة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="mr-3 text-lg">جاري التحميل...</span>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-500">لا توجد حسابات مسجلة</p>
                  <p className="text-gray-400">قم بإنشاء حساب جديد للبدء</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right font-bold">اسم المستخدم</TableHead>
                        <TableHead className="text-right font-bold">الاسم الكامل</TableHead>
                        <TableHead className="text-right font-bold">الحالة</TableHead>
                        <TableHead className="text-right font-bold">الأذونات</TableHead>
                        <TableHead className="text-right font-bold">تاريخ الإنشاء</TableHead>
                        <TableHead className="text-right font-bold">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((account) => {
                        const userPermissions = userPermissionsMap.get(account.id) || []
                        const isExpanded = expandedPermissions.has(account.id)
                        
                        return (
                          <React.Fragment key={account.id}>
                            <TableRow className="hover:bg-blue-50/50">
                              <TableCell className="font-medium">{account.username}</TableCell>
                              <TableCell>{account.fullName}</TableCell>
                              <TableCell>
                                <Badge variant={account.isActive ? "default" : "secondary"}>
                                  {account.isActive ? "نشط" : "معطل"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    <Shield className="ml-1 h-3 w-3" />
                                    {userPermissions.length} إذن
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePermissions(account.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(account.createdAt).toLocaleDateString("ar-EG")}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAccount(account.id, account.username)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAssignModal(account)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Settings className="h-4 w-4" /> أذونات
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            
                            {/* Expanded Permissions Row */}
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200"
                                  >
                                    <div className="p-4">
                                      <div className="flex items-center mb-3">
                                        <Key className="ml-2 h-5 w-5 text-blue-600" />
                                        <h4 className="text-lg font-semibold text-blue-800">أذونات المستخدم</h4>
                                        <Badge variant="outline" className="mr-2">
                                          {userPermissions.length} إذن
                                        </Badge>
                                      </div>
                                      
                                      {userPermissions.length === 0 ? (
                                        <div className="text-center py-6">
                                          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                          <p className="text-gray-500">لا توجد أذونات مخصصة لهذا المستخدم</p>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openAssignModal(account)}
                                            className="mt-2"
                                          >
                                            <Settings className="ml-2 h-4 w-4" />
                                            تعيين أذونات
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {userPermissions.map((permission) => (
                                            <Card key={permission.id} className="bg-white/60 border-blue-200">
                                              <CardContent className="p-3">
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                    <h5 className="font-semibold text-blue-900 text-sm">
                                                      {permission.name}
                                                    </h5>
                                                    {permission.description && (
                                                      <p className="text-xs text-gray-600 mt-1">
                                                        {permission.description}
                                                      </p>
                                                    )}
                                                    <div className="flex items-center mt-2 text-xs text-gray-500">
                                                      <span>منح في: {formatDate(permission.granted_at || '')}</span>
                                                    </div>
                                                  </div>
                                                  <Badge variant="secondary" className="text-xs">
                                                    <Shield className="ml-1 h-3 w-3" />
                                                    مفعل
                                                  </Badge>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Assign Permissions Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">تعيين الأذونات للمستخدم</h2>
              <form onSubmit={handleAssignPermissions} className="space-y-4">
                <div>
                  <div className="mb-2 font-medium">اختر الأذونات:</div>
                  <div className="max-h-48 overflow-y-auto border rounded p-2">
                    {allPermissions.length === 0 ? (
                      <div className="text-gray-500 text-center">لا توجد أذونات متاحة</div>
                    ) : (
                      allPermissions.map((perm: any) => (
                        <label key={perm.id} className="flex items-center space-x-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => handlePermissionToggle(perm.id)}
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          <span className="text-sm">{perm.name}</span>
                          {perm.description && <span className="text-xs text-gray-400 ml-2">({perm.description})</span>}
                        </label>
                      ))
                    )}
                  </div>
                </div>
                {assignError && <div className="text-red-600 font-bold">{assignError}</div>}
                {assignSuccess && <div className="text-green-600 font-bold">{assignSuccess}</div>}
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    type="button"
                    className="bg-gray-200 px-4 py-2 rounded"
                    onClick={() => setShowAssignModal(false)}
                    disabled={assignLoading}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    disabled={assignLoading}
                  >
                    {assignLoading ? 'جاري التعيين...' : 'تعيين الأذونات'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
