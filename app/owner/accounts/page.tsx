"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Eye, EyeOff, Plus, Users, UserPlus, Trash2, Save, X, Phone, Lock, DollarSign, Settings, Shield, AlertCircle } from "lucide-react"
import { User } from "lucide-react"
import { AuthApiService } from "@/lib/services/auth-api"
import { RegisterDto } from "@/lib/types/auth"

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

export default function Page() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    username: "",
    fullName: "",
    password: "",
    phone: "",
    hourRate: "",
  })
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [userPermissions, setUserPermissions] = useState<Permission[]>([])
  const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  // Permission checking function
  const hasPermission = (requiredPermissions: string[]): boolean => {
    // If user has OWNER_ACCESS, they can do anything
    if (currentUserPermissions.includes("OWNER_ACCESS")) {
      return true
    }
    
    // Check if user has any of the required permissions
    return requiredPermissions.some(perm => currentUserPermissions.includes(perm))
  }

  // Get current user's permissions
  const getCurrentUserPermissions = async () => {
    try {
      const currentUser = AuthApiService.getCurrentUser()
      if (!currentUser || !currentUser.id) {
        console.log("No current user found or missing ID")
        return
      }
      
      console.log("Current user:", currentUser)

      // First try the specific permissions endpoint
      try {
        const response = await AuthApiService.apiRequest<any>(`/permissions/user/${currentUser.id}/all-permissions`)
        
        if (response.success && response.data) {
          const permissionNames = response.data.map((p: Permission) => p.name)
          console.log("Permissions loaded:", permissionNames)
          
          // Make sure OWNER_ACCESS is included if the user is an owner
          if (currentUser.role === 'owner' && !permissionNames.includes('OWNER_ACCESS')) {
            permissionNames.push('OWNER_ACCESS')
          }
          
          setCurrentUserPermissions(permissionNames)
          return
        }
      } catch (specificError) {
        console.warn("Could not load from specific permissions endpoint:", specificError)
      }
      
      // Fallback: If the user is an owner, give OWNER_ACCESS permission
      if (currentUser.role === 'owner') {
        console.log("Setting OWNER_ACCESS because user is an owner")
        setCurrentUserPermissions(['OWNER_ACCESS'])
      }
    } catch (error) {
      console.error("Error fetching current user permissions:", error)
    }
  }

  // Fetch accounts from API
  const fetchAccounts = async () => {
    // Check if user has access permission OR is an owner
    if (!hasPermission(["access:users"]) && !AuthApiService.hasOwnerAccess()) {
      console.log("Permission check failed:", {
        hasAccessUsers: hasPermission(["access:users"]),
        hasOwnerAccess: AuthApiService.hasOwnerAccess(),
        currentPermissions: currentUserPermissions
      })
      toast.error("ليس لديك صلاحية للوصول إلى إدارة الحسابات")
      return
    }

    setIsLoading(true)
    try {
      console.log("Fetching accounts...")
      const response = await AuthApiService.apiRequest<any>('/users')
      
      if (response.success && response.data) {
        console.log(`Loaded ${response.data.length} accounts`)
        setAccounts(response.data)
        toast.success(`تم تحميل ${response.data.length} حساب بنجاح`)
      } else {
        console.error("Failed to load accounts:", response)
        toast.error("فشل في تحميل الحسابات")
      }
    } catch (error: any) {
      console.error("Error fetching accounts:", error)
      
      if (error.message?.includes('Unauthorized')) {
        toast.error("انتهت صلاحية تسجيل الدخول - يرجى تسجيل الدخول مرة أخرى")
      } else {
        toast.error("خطأ في الاتصال بالخادم")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all available permissions
  const fetchAllPermissions = async () => {
    try {
      const response = await AuthApiService.apiRequest<any>('/permissions')
      
      if (response.success && response.data) {
        setAllPermissions(response.data)
      }
    } catch (error) {
      console.error("Error fetching all permissions:", error)
    }
  }

  // Fetch permissions for a specific user
  const fetchUserPermissions = async (userId: string) => {
    try {
      const response = await AuthApiService.apiRequest<any>(`/permissions/user/${userId}/all-permissions`)

      if (response.success && response.data) {
        setUserPermissions(response.data)
        return response.data
      } else {
        // Try alternative endpoint
        try {
          const altResponse = await AuthApiService.apiRequest<any>(`/permissions/user/${userId}/permissions`)
          if (altResponse.success && altResponse.data) {
            setUserPermissions(altResponse.data)
            return altResponse.data
          }
        } catch (altError) {
          // Ignore alternative endpoint errors
        }
      }
      setUserPermissions([])
      return []
    } catch (error) {
      console.error(`Error fetching permissions for user ${userId}:`, error)
      setUserPermissions([])
      return []
    }
  }

  // Open permissions modal
  const openPermissionsModal = async (account: Account) => {
    if (!hasPermission(["permissions:assign"])) {
      toast.error("ليس لديك صلاحية لتعديل الأذونات")
      return
    }

    setSelectedAccount(account)
    setShowPermissionsModal(true)
    const userPerms = await fetchUserPermissions(account.id)
    const permissionIds = userPerms.map((p: Permission) => p.id)
    setSelectedPermissions(permissionIds)
  }

  // Load accounts on component mount
  useEffect(() => {
    const init = async () => {
      await getCurrentUserPermissions()
      await fetchAllPermissions()
      
      // Debug permissions
      console.log("Current user permissions:", currentUserPermissions)
      console.log("Has access:users permission:", hasPermission(["access:users"]))
      console.log("Has OWNER_ACCESS:", currentUserPermissions.includes("OWNER_ACCESS"))
      
      // Try to fetch accounts after permissions are loaded
      await fetchAccounts()
    }
    
    init()
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

    if (!hasPermission(["users:create"])) {
      toast.error("ليس لديك صلاحية لإنشاء حسابات جديدة")
      return
    }

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsLoading(true)
    try {
      // Prepare data for API - match register DTO
      const userData: RegisterDto = {
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim() || generateUniquePhone(),
        hourRate: formData.hourRate ? Number(formData.hourRate) : 0,
      }

      const result = await AuthApiService.register(userData)

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
    } catch (error: any) {
      console.error("Error creating account:", error)
      
      let errorMessage = "فشل في إنشاء الحساب"
      
      if (error.message?.includes("username")) {
        errorMessage = "اسم المستخدم موجود بالفعل"
      } else if (error.message?.includes("phone")) {
        errorMessage = "رقم الهاتف موجود بالفعل - سيتم إنشاء رقم تلقائي"
        // Retry with generated phone number
        try {
          const retryUserData: RegisterDto = {
            username: formData.username.trim(),
            fullName: formData.fullName.trim(),
            password: formData.password.trim(),
            phone: generateUniquePhone(),
            hourRate: formData.hourRate ? Number(formData.hourRate) : 0,
          }
          await AuthApiService.register(retryUserData)
          toast.success(`تم إنشاء الحساب بنجاح برقم هاتف: ${retryUserData.phone}`)
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
        } catch (retryError) {
          errorMessage = "فشل في إنشاء الحساب حتى مع رقم هاتف جديد"
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async (userId: string, username: string) => {
    if (!hasPermission(["users:delete"])) {
      toast.error("ليس لديك صلاحية لحذف الحسابات")
      return
    }

    if (!confirm(`هل أنت متأكد من حذف حساب "${username}"؟`)) {
      return
    }

    setIsLoading(true)
    try {
      await AuthApiService.apiRequest(`/users/${userId}`, {
        method: "DELETE",
      })

      toast.success(`تم حذف حساب "${username}" بنجاح`)
      await fetchAccounts()
    } catch (error: any) {
      console.error("Error deleting account:", error)
      
      if (error.message?.includes('Unauthorized')) {
        toast.error("غير مصرح - يرجى تسجيل الدخول مرة أخرى")
      } else {
        toast.error(error.message || "فشل في حذف الحساب")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle permission selection
  const handlePermissionToggle = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    )
  }

  // Assign permissions to user
  const handleAssignPermissions = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return

    if (!hasPermission(["permissions:assign"])) {
      toast.error("ليس لديك صلاحية لتعديل الأذونات")
      return
    }

    setIsLoading(true)
    try {
      const currentUser = AuthApiService.getCurrentUser()
      const grantedBy = currentUser?.id || ""

      const response = await AuthApiService.apiRequest<any>('/permissions/assign', {
        method: "POST",
        body: JSON.stringify({
          userId: selectedAccount.id,
          permissionIds: selectedPermissions,
          grantedBy,
        }),
      })

      if (response.success) {
        toast.success("تم تعيين الأذونات بنجاح")
        setShowPermissionsModal(false)
        fetchAccounts()
      } else {
        toast.error(response.message || "فشل في تعيين الأذونات")
      }
    } catch (error: any) {
      toast.error(error.message || "خطأ في الاتصال بالخادم")
    } finally {
      setIsLoading(false)
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
      })
    } catch {
      return "-"
    }
  }

  // Debug information
  const currentUser = AuthApiService.getCurrentUser()
  const isOwner = currentUser?.role === 'owner'
  const ownerAccessGranted = currentUserPermissions.includes('OWNER_ACCESS')
  const canAccessUsers = hasPermission(['access:users'])
  const apiHasOwnerAccess = AuthApiService.hasOwnerAccess()
  
  useEffect(() => {
    console.log('Debug Info:', {
      currentUser,
      currentUserPermissions,
      isOwner,
      ownerAccessGranted,
      canAccessUsers,
      apiHasOwnerAccess
    })
  }, [currentUserPermissions])

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            إدارة الحسابات
          </h1>
          <p className="text-gray-600 text-lg">إنشاء وإدارة حسابات المستخدمين</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700">إجمالي الحسابات</p>
                  <p className="text-3xl font-bold">{accounts.length}</p>
                </div>
                <Users className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700">الحسابات النشطة</p>
                  <p className="text-3xl font-bold">{accounts.filter((acc) => acc.isActive).length}</p>
                </div>
                <UserPlus className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700">الحسابات المعطلة</p>
                  <p className="text-3xl font-bold">{accounts.filter((acc) => !acc.isActive).length}</p>
                </div>
                <X className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Account Button */}
        {hasPermission(["users:create"]) && (
          <div className="flex justify-end">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="ml-2 h-5 w-5" />
              {showCreateForm ? "إلغاء" : "إنشاء حساب جديد"}
            </Button>
          </div>
        )}

        {/* Create Account Form */}
        {showCreateForm && (
          <div>
            <Card className="bg-white border-blue-200">
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
                        className="h-12 text-lg border focus:border-blue-500"
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
                        className="h-12 text-lg border focus:border-blue-500"
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
                          className="h-12 text-lg border focus:border-blue-500 pl-12"
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
                        className="h-12 text-lg border focus:border-blue-500"
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
                        className="h-12 text-lg border focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="px-6 py-2 text-lg"
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 text-lg"
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
          </div>
        )}

        {/* Accounts Table */}
        <div className="pt-4">
          <Card className="bg-white shadow">
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
                        const accountPermissions = account.permissions || []
                        
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
                                    {accountPermissions.length} إذن
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openPermissionsModal(account)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(account.createdAt)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {hasPermission(["users:delete"]) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteAccount(account.id, account.username)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {hasPermission(["permissions:assign"]) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openPermissionsModal(account)}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Settings className="h-4 w-4" /> أذونات
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Permissions Modal */}
        <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center">
                <Shield className="ml-2 h-5 w-5" />
                إدارة أذونات المستخدم
              </DialogTitle>
              <DialogDescription>
                {selectedAccount && (
                  <span>تعديل أذونات المستخدم: <strong>{selectedAccount.username}</strong></span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold">اختر الأذونات:</h3>
                <div className="max-h-60 overflow-y-auto border rounded p-4 space-y-2">
                  {allPermissions.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      لا توجد أذونات متاحة
                    </div>
                  ) : (
                    allPermissions.map((perm) => (
                      <div key={perm.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          id={`perm-${perm.id}`}
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`perm-${perm.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium text-sm">{perm.name}</div>
                          {perm.description && (
                            <div className="text-xs text-gray-500">{perm.description}</div>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPermissionsModal(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAssignPermissions}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ الأذونات
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
