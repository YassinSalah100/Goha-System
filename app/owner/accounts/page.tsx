"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Eye, EyeOff, Plus, Users, UserPlus, Trash2, Save, X, Phone, Lock, DollarSign, Settings, Shield, ChevronDown, ChevronUp, Key, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { User } from "lucide-react"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from "chart.js"
import { Avatar } from "@/components/ui/avatar"
import { Tooltip } from "@/components/ui/tooltip"
import { AuthApiService, PERMISSIONS } from "@/lib/services/auth-api"
import { RegisterDto } from "@/lib/types/auth"
ChartJS.register(ArcElement, ChartTooltip, Legend)

const API_BASE_URL = "http://20.117.240.138:3000/api/v1"

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
  const [userPermissionsCounts, setUserPermissionsCounts] = useState<{[userId: string]: number}>({})
  const [loadingPermissionsCounts, setLoadingPermissionsCounts] = useState(false)
  const [isRevokeMode, setIsRevokeMode] = useState(false)

  // Permission checking function
  const hasPermission = (requiredPermissions: string[]): boolean => {
    // If user has OWNER_ACCESS, they can do anything
    if (currentUserPermissions.includes(PERMISSIONS.OWNER_ACCESS)) {
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
          if (currentUser.role === 'owner' && !permissionNames.includes(PERMISSIONS.OWNER_ACCESS)) {
            permissionNames.push(PERMISSIONS.OWNER_ACCESS)
          }
          
          setCurrentUserPermissions(permissionNames)
        }
      } catch (error) {
        console.log("Error fetching permissions, using role-based fallback")
        // If permission-specific API fails, use role-based permissions from user object
        if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
          setCurrentUserPermissions(currentUser.permissions)
        } else if (currentUser.role === 'owner') {
          setCurrentUserPermissions([PERMISSIONS.OWNER_ACCESS])
        } else {
          setCurrentUserPermissions([])
        }
      }
    } catch (error) {
      console.error("Error getting current user permissions:", error)
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

  // Fetch all accounts
  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await AuthApiService.apiRequest<any>('/users')
      
      if (response.success && response.data) {
        setAccounts(response.data)
        
        // Load permissions counts for all accounts
        setLoadingPermissionsCounts(true)
        for (const account of response.data) {
          try {
            console.log(`🔍 Fetching permissions count for ${account.username}...`)
            const count = await fetchUserPermissionsCount(account.id)
            console.log(`📊 ${account.username} has ${count} permissions`)
          } catch (error) {
            console.error(`Error fetching permissions for ${account.username}:`, error)
          }
        }
        setLoadingPermissionsCounts(false)
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      
      // Check for specific authentication error
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        toast.error("غير مصرح - يرجى تسجيل الدخول مرة أخرى")
      } else {
        toast.error("حدث خطأ أثناء تحميل الحسابات")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch permissions for a specific user
  const fetchUserPermissions = async (userId: string) => {
    try {
      console.log(`🔍 Fetching permissions for user: ${userId}`)
      const token = localStorage.getItem('authToken')
      
      // Direct API call to fetch permissions
      const response = await fetch(`${API_BASE_URL}/permissions/user/${userId}/all-permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      console.log(`📋 Permissions response for user ${userId}:`, data)

      if (data.success && data.data) {
        // Filter out revoked permissions - only return active ones
        const activePermissions = Array.isArray(data.data) 
          ? data.data.filter((perm: any) => perm.is_revoked !== true)
          : []
        
        console.log(`📋 User ${userId} active permissions (${activePermissions.length}):`, activePermissions)
        setUserPermissions(activePermissions)
        return activePermissions
      } else {
        // Try alternative endpoint
        try {
          const altResponse = await fetch(`${API_BASE_URL}/permissions/user/${userId}/permissions`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          const altData = await altResponse.json()
          console.log(`📋 Alternative permissions response for user ${userId}:`, altData)
          
          if (altData.success && altData.data && altData.data.permissions) {
            const activePermissions = Array.isArray(altData.data.permissions) 
              ? altData.data.permissions.filter((perm: any) => perm.is_revoked !== true)
              : []
            
            setUserPermissions(activePermissions)
            return activePermissions
          }
        } catch (altError) {
          console.error(`Error fetching permissions from alternative endpoint for user ${userId}:`, altError)
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

  // Fetch permissions count for each user
  const fetchUserPermissionsCount = async (userId: string): Promise<number> => {
    try {
      console.log(`🔍 Fetching permissions count for user: ${userId}`)
      const token = localStorage.getItem('authToken')
      
      // Direct API call to fetch permissions
      const response = await fetch(`${API_BASE_URL}/permissions/user/${userId}/all-permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success && data.data) {
        // Filter out revoked permissions - only count active ones
        const activePermissions = Array.isArray(data.data) 
          ? data.data.filter((perm: any) => perm.is_revoked !== true)
          : []
        
        const count = activePermissions.length
        console.log(`📊 User ${userId} has ${count} ACTIVE permissions (${data.data.length} total, ${data.data.length - count} revoked)`)
        
        // Update counts in state
        setUserPermissionsCounts(prev => ({
          ...prev,
          [userId]: count
        }))
        
        return count
      }
      
      // Try alternative endpoint
      try {
        const altResponse = await fetch(`${API_BASE_URL}/permissions/user/${userId}/permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const altData = await altResponse.json()
        
        if (altData.success && altData.data && altData.data.permissions) {
          const activePermissions = Array.isArray(altData.data.permissions) 
            ? altData.data.permissions.filter((perm: any) => perm.is_revoked !== true)
            : []
          
          const count = activePermissions.length
          console.log(`📊 User ${userId} has ${count} ACTIVE permissions (from alternative endpoint):`, activePermissions)
          
          // Update counts in state
          setUserPermissionsCounts(prev => ({
            ...prev,
            [userId]: count
          }))
          
          return count
        }
      } catch (altError) {
        console.warn(`⚠️ Alternative endpoint failed for user ${userId}:`, altError)
      }
      
      // No permissions or failed response
      console.log(`❌ No permissions found for user ${userId}`)
      setUserPermissionsCounts(prev => ({
        ...prev,
        [userId]: 0
      }))
      return 0
    } catch (error) {
      console.error(`💥 Error fetching permissions count for user ${userId}:`, error)
      
      // Set count to 0 on error
      setUserPermissionsCounts(prev => ({
        ...prev,
        [userId]: 0
      }))
      return 0
    }
  }

  // Open permissions modal
  const openPermissionsModal = async (account: Account) => {
    if (!hasPermission([PERMISSIONS.PERMISSIONS_ASSIGN])) {
      toast.error("ليس لديك صلاحية لتعديل الأذونات")
      return
    }

    setSelectedAccount(account)
    setShowPermissionsModal(true)
    setIsRevokeMode(false) // Reset to assign mode
    const userPerms = await fetchUserPermissions(account.id)
    
    // Reset permission selection
    setSelectedPermissions([])
  }

  // Handle input change for form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await getCurrentUserPermissions()
      await fetchAllPermissions()
      
      // Debug permissions
      console.log("Current user permissions:", currentUserPermissions)
      console.log("Has access:users permission:", hasPermission([PERMISSIONS.USERS_READ]))
      console.log("Has OWNER_ACCESS:", currentUserPermissions.includes(PERMISSIONS.OWNER_ACCESS))
      
      // Load accounts
      await fetchAccounts()
    }

    loadData()
  }, [])

  // Generate a random phone number for automatic assignment when not provided
  const generateUniquePhone = () => {
    const prefix = "5" // Saudi mobile prefix
    const randomNum = Math.floor(10000000 + Math.random() * 90000000) // 8 digits
    return `${prefix}${randomNum}`
  }

  // Create a new account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasPermission([PERMISSIONS.USERS_CREATE])) {
      toast.error("ليس لديك صلاحية لإنشاء حسابات")
      return
    }

    setIsLoading(true)
    try {
      // Validate input
      if (formData.username.trim().length < 3) {
        toast.error("اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
        return
      }

      if (formData.password.trim().length < 6) {
        toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
        return
      }

      if (formData.fullName.trim().length < 3) {
        toast.error("الاسم الكامل يجب أن يكون 3 أحرف على الأقل")
        return
      }

      // Prepare data (phone is auto-generated if not provided)
      const userData: RegisterDto = {
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim() || generateUniquePhone(),
        hourRate: formData.hourRate ? Number(formData.hourRate) : 0,
      }

      const response = await AuthApiService.register(userData)
      toast.success("تم إنشاء الحساب بنجاح")
      
      // Reset form and hide it
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
      
      // Handle case when phone number is already taken
      if (error.message?.includes('phone') && error.message?.includes('taken')) {
        console.log("Phone number taken, retrying with new number...")
        
        try {
          // Retry with a new random phone number
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
    if (!hasPermission([PERMISSIONS.USERS_DELETE])) {
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

  // Assign or revoke permissions to user
  const handleAssignPermissions = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return

    if (!hasPermission([PERMISSIONS.PERMISSIONS_ASSIGN])) {
      toast.error("ليس لديك صلاحية لتعديل الأذونات")
      return
    }

    // Validate that at least one permission is selected
    if (selectedPermissions.length === 0) {
      toast.error(isRevokeMode ? "يرجى اختيار إذن واحد على الأقل لإلغائه" : "يرجى اختيار إذن واحد على الأقل لتعيينه")
      return
    }

    setIsLoading(true)
    try {
      const currentUser = AuthApiService.getCurrentUser()
      const grantedBy = currentUser?.id || ""
      const token = localStorage.getItem('authToken')

      if (isRevokeMode) {
        // Revoke permissions
        toast.loading(`جاري إلغاء ${selectedPermissions.length} إذن...`)
        console.log(`🔄 REVOKING ${selectedPermissions.length} permissions for user ${selectedAccount.username}`, {
          userId: selectedAccount.id,
          permissionIds: selectedPermissions,
        })
        
        // Use direct fetch for API call
        const revokeResponse = await fetch(`${API_BASE_URL}/permissions/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: selectedAccount.id,
            permissionIds: selectedPermissions,
          })
        })
        
        const response = await revokeResponse.json()
        console.log(`✅ REVOKE direct API response:`, response)

        if (response.success) {
          toast.dismiss()
          toast.success(`تم إلغاء ${selectedPermissions.length} إذن بنجاح`)
          setShowPermissionsModal(false)
          
          // Clear the permissions count for this user immediately
          setUserPermissionsCounts(prev => ({
            ...prev,
            [selectedAccount.id]: 0
          }))
          
          // Verify the revoke worked by checking current permissions
          console.log(`🔍 VERIFYING revoke for user ${selectedAccount.username}...`)
          
          // Direct API call to verify permissions
          const verifyResponse = await fetch(`${API_BASE_URL}/permissions/user/${selectedAccount.id}/all-permissions`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          const verifyData = await verifyResponse.json()
          console.log('Verification response:', verifyData)
          
          // Count only active permissions (not revoked)
          const activePermissions = verifyData.data?.filter((p: any) => p.is_revoked !== true) || []
          const currentCount = activePermissions.length
          console.log(`📊 VERIFICATION: User ${selectedAccount.username} now has ${currentCount} active permissions`)
          
          // Update the count with verified value
          setUserPermissionsCounts(prev => ({
            ...prev,
            [selectedAccount.id]: currentCount
          }))
          
          await fetchAccounts()
          // Reset selections
          setSelectedPermissions([])
          setIsRevokeMode(false)
        } else {
          toast.dismiss()
          console.error(`❌ REVOKE failed:`, response)
          toast.error(response.message || "فشل في إلغاء الأذونات")
        }
      } else {
        // Assign permissions
        toast.loading(`جاري تعيين ${selectedPermissions.length} إذن...`)
        console.log(`🔄 ASSIGNING ${selectedPermissions.length} permissions for user ${selectedAccount.username}`)
        
        // Use direct fetch for API call
        const assignResponse = await fetch(`${API_BASE_URL}/permissions/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: selectedAccount.id,
            permissionIds: selectedPermissions,
            grantedBy,
          })
        })
        
        const response = await assignResponse.json()
        console.log('Direct API assign response:', response)

        if (response.success) {
          toast.dismiss()
          toast.success(`تم تعيين ${selectedPermissions.length} إذن بنجاح`)
          setShowPermissionsModal(false)
          
          // Verify assign worked
          console.log(`🔍 VERIFYING assign for user ${selectedAccount.username}...`)
          const verifyResponse = await fetch(`${API_BASE_URL}/permissions/user/${selectedAccount.id}/all-permissions`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          const verifyData = await verifyResponse.json()
          
          // Count only active permissions (not revoked)
          const activePermissions = verifyData.data?.filter((p: any) => p.is_revoked !== true) || []
          const currentCount = activePermissions.length
          console.log(`📊 VERIFICATION: User ${selectedAccount.username} now has ${currentCount} active permissions`)
          
          // Update the count with verified value
          setUserPermissionsCounts(prev => ({
            ...prev,
            [selectedAccount.id]: currentCount
          }))
          
          await fetchAccounts()
          // Reset selections
          setSelectedPermissions([])
        } else {
          toast.dismiss()
          toast.error(response.message || "فشل في تعيين الأذونات")
        }
      }
    } catch (error: any) {
      toast.dismiss()
      console.error('Permission operation error:', error)
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
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "-"
    }
  }

  // Test function to manually verify permissions
  const testUserPermissions = async (userId: string, username: string) => {
    console.log(`🧪 TESTING permissions for user: ${username} (${userId})`)
    
    try {
      const response = await AuthApiService.apiRequest<any>(`/permissions/user/${userId}/all-permissions`)
      console.log(`🧪 RAW RESPONSE for ${username}:`, response)
      
      if (response.success && response.data) {
        const allPermissions = response.data
        const activePermissions = allPermissions.filter((perm: any) => perm.is_revoked !== true)
        const revokedPermissions = allPermissions.filter((perm: any) => perm.is_revoked === true)
        
        console.log(`🧪 ${username} ALL permissions (${allPermissions.length} total):`, allPermissions)
        console.log(`✅ ${username} ACTIVE permissions (${activePermissions.length}):`, activePermissions)
        console.log(`❌ ${username} REVOKED permissions (${revokedPermissions.length}):`, revokedPermissions)
        
        console.log(`📊 SUMMARY for ${username}:`)
        console.log(`   Total: ${allPermissions.length}`)
        console.log(`   Active: ${activePermissions.length}`)
        console.log(`   Revoked: ${revokedPermissions.length}`)
        
        // Update the permissions count for this user
        setUserPermissionsCounts(prev => ({
          ...prev,
          [userId]: activePermissions.length
        }))
        
        toast.success(`تم التحقق من أذونات ${username}: ${activePermissions.length} أذن نشط، ${revokedPermissions.length} أذن ملغي`)
      } else {
        console.log(`❌ No permissions data found for ${username}`)
        toast.error(`لا توجد بيانات أذونات متاحة لـ ${username}`)
      }
    } catch (error) {
      console.error(`Error testing permissions for ${username}:`, error)
      toast.error(`خطأ في فحص أذونات ${username}`)
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
                            placeholder="أدخل كلمة المرور"
                            required
                            className="h-12 text-lg border-2 focus:border-blue-500 pl-12"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 left-0 px-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-500" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-500" />
                            )}
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
                      <div className="space-y-2 md:col-span-2">
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

                    <div className="flex justify-end space-x-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                        className="px-6 py-2 text-lg border-2 hover:bg-gray-50"
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2 text-lg"
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-2xl text-gray-800 flex items-center">
                <Users className="ml-2 h-6 w-6 text-blue-600" />
                قائمة الحسابات
                <Badge variant="outline" className="mr-4 bg-blue-50 text-blue-600 border-blue-200">
                  {accounts.length} حساب
                </Badge>
              </CardTitle>
              <CardDescription>إدارة حسابات المستخدمين والأذونات</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                  <span className="mr-4 text-gray-600 text-lg">جاري التحميل...</span>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-blue-50 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Users className="h-14 w-14 text-blue-400" />
                  </div>
                  <p className="text-2xl text-gray-600 mb-2">لا توجد حسابات مسجلة</p>
                  <p className="text-gray-500">قم بإنشاء حساب جديد للبدء</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-100">
                        <TableHead className="text-right font-bold text-gray-700 py-4">اسم المستخدم</TableHead>
                        <TableHead className="text-right font-bold text-gray-700 py-4">الاسم الكامل</TableHead>
                        <TableHead className="text-right font-bold text-gray-700 py-4">الحالة</TableHead>
                        <TableHead className="text-right font-bold text-gray-700 py-4">الأذونات</TableHead>
                        <TableHead className="text-right font-bold text-gray-700 py-4">تاريخ الإنشاء</TableHead>
                        <TableHead className="text-right font-bold text-gray-700 py-4">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((account, index) => {
                        // Get the actual permissions count from our loaded state
                        const actualPermissionsCount = userPermissionsCounts[account.id] || 0
                        
                        return (
                          <TableRow key={account.id} className={`hover:bg-blue-50/50 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <TableCell className="font-medium text-gray-800 py-4">
                              <div className="flex items-center">
                                <div className="bg-blue-100 rounded-full p-2 ml-2">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                {account.username}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">{account.fullName}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={account.isActive ? "default" : "secondary"}
                                className={account.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-600"}
                              >
                                {account.isActive ? "نشط" : "معطل"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                              >
                                <Shield className="ml-1 h-3 w-3" />
                                {loadingPermissionsCounts ? "..." : actualPermissionsCount} إذن
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{formatDate(account.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => testUserPermissions(account.id, account.username)}
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 px-3 py-1 rounded-full"
                                >
                                  <Key className="h-4 w-4 ml-1" />
                                  فحص
                                </Button>
                                {hasPermission([PERMISSIONS.PERMISSIONS_ASSIGN]) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openPermissionsModal(account)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 px-3 py-1 rounded-full"
                                  >
                                    <Shield className="h-4 w-4 ml-1" />
                                    أذونات
                                  </Button>
                                )}
                                {hasPermission([PERMISSIONS.USERS_DELETE]) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAccount(account.id, account.username)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-3 py-1 rounded-full"
                                  >
                                    <Trash2 className="h-4 w-4 ml-1" />
                                    حذف
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Permissions Modal */}
        <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
          <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-2xl border-2 border-blue-100">
            <DialogHeader className="border-b border-gray-100 pb-4">
              <DialogTitle className="text-xl font-bold flex items-center text-gray-800">
                <div className="bg-blue-600 rounded-full p-2 ml-2">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                إدارة أذونات المستخدم
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedAccount && (
                  <span>تعديل أذونات المستخدم: <strong className="text-blue-600">{selectedAccount.username}</strong></span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Mode Toggle */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Button
                  type="button"
                  variant={!isRevokeMode ? "default" : "outline"}
                  onClick={() => {
                    setIsRevokeMode(false)
                    // When switching to assign mode, reset selections
                    if (isRevokeMode) {
                      setSelectedPermissions([])
                    }
                  }}
                  className={!isRevokeMode ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  تعيين أذونات
                </Button>
                <Button
                  type="button"
                  variant={isRevokeMode ? "default" : "outline"}
                  onClick={() => {
                    setIsRevokeMode(true)
                    // When switching to revoke mode, only select permissions the user already has
                    const userPermissionIds = userPermissions.map(p => p.id)
                    setSelectedPermissions(userPermissionIds)
                  }}
                  className={isRevokeMode ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  إلغاء أذونات
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 flex items-center">
                  <Settings className="h-4 w-4 ml-2 text-blue-600" />
                  {isRevokeMode ? "اختر الأذونات لإلغائها:" : "اختر الأذونات لتعيينها:"}
                </h3>
                <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-xl p-4 space-y-2 bg-gray-50">
                  {allPermissions.length === 0 ? (
                    <div className="text-center text-gray-500 py-6">
                      <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-yellow-600" />
                      </div>
                      <p className="text-lg">لا توجد أذونات متاحة</p>
                    </div>
                  ) : isRevokeMode && userPermissions.length === 0 ? (
                    <div className="text-center text-gray-500 py-6">
                      <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                        <Shield className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-lg">لا توجد أذونات مُعينة لهذا المستخدم</p>
                      <p className="text-sm text-gray-400 mt-2">قم بالتبديل إلى وضع "تعيين أذونات" لإضافة أذونات جديدة</p>
                    </div>
                  ) : (
                    allPermissions.map((perm) => {
                      const isUserPermission = userPermissions.some(up => up.id === perm.id)
                      const shouldShow = isRevokeMode ? isUserPermission : true
                      
                      if (!shouldShow) return null
                      
                      return (
                        <div key={perm.id} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                          isRevokeMode 
                            ? 'hover:bg-red-50 border-transparent hover:border-red-200' 
                            : 'hover:bg-blue-50 border-transparent hover:border-blue-200'
                        }`}>
                          <input
                            type="checkbox"
                            id={`perm-${perm.id}`}
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => handlePermissionToggle(perm.id)}
                            className={`h-4 w-4 rounded border-gray-300 focus:ring-2 ${
                              isRevokeMode 
                                ? 'text-red-600 focus:ring-red-500' 
                                : 'text-blue-600 focus:ring-blue-500'
                            }`}
                          />
                          <label htmlFor={`perm-${perm.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium text-sm text-gray-800 flex items-center">
                              {perm.name}
                              {!isRevokeMode && isUserPermission && (
                                <Badge variant="outline" className="mr-2 text-xs bg-green-50 text-green-700 border-green-200">
                                  مُعين
                                </Badge>
                              )}
                            </div>
                            {perm.description && (
                              <div className="text-xs text-gray-500 mt-1">{perm.description}</div>
                            )}
                          </label>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setShowPermissionsModal(false)}
                className="rounded-xl border-2 hover:bg-gray-50"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAssignPermissions}
                disabled={isLoading || selectedPermissions.length === 0}
                className={`rounded-xl shadow-lg ${
                  isRevokeMode 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                } ${selectedPermissions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    {isRevokeMode ? "إلغاء الأذونات" : "حفظ الأذونات"}
                    {selectedPermissions.length > 0 && (
                      <Badge variant="secondary" className="mr-2 bg-white/20 text-white border-white/30">
                        {selectedPermissions.length}
                      </Badge>
                    )}
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
