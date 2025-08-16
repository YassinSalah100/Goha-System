"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, User, Lock, Clock, LogIn, KeyRound, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { AuthApiService } from "@/lib/services/auth-api"
import { LoginDto, CurrentUser, AuthResponseDto } from "@/lib/types/auth"

const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [shift, setShift] = useState("morning")
  const [selectedRole, setSelectedRole] = useState("owner")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [loggedInUser, setLoggedInUser] = useState<any>(null)

  // Load saved credentials if remember me was checked
  useEffect(() => {
    const savedCredentials = localStorage.getItem("savedCredentials")
    if (savedCredentials) {
      const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials)
      setUsername(savedUsername)
      setPassword(savedPassword)
      setRememberMe(true)
    }

    // Check if user is already logged in
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const user = JSON.parse(currentUser)
      setLoggedInUser(user)
    }
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        handleLogin(e as any)
      }
      if (e.key === "Escape") {
        setShowForgotPassword(false)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [username, password, shift])

  // Check if user has active shift session
  const checkActiveShift = async (userId: string, authToken: string) => {
    try {
      // Temporarily store the token for the API call
      const previousToken = localStorage.getItem('authToken')
      localStorage.setItem('authToken', authToken)
      
      const response = await AuthApiService.apiRequest<any>(`/shifts/cashier/${userId}`)

      // Restore previous token state
      if (previousToken) {
        localStorage.setItem('authToken', previousToken)
      } else {
        localStorage.removeItem('authToken')
      }

      if (response.success && response.data && response.data.length > 0) {
        // Find TRULY active shift - handle backend that sets end_time = start_time for new shifts
        const activeShift = response.data.find(
          (shift: any) =>
            !shift.is_closed &&
            (shift.status === "ACTIVE" ||
              shift.status === "active" ||
              shift.status === "open" ||
              shift.status === "OPEN" ||
              shift.status === "Open") &&
            // If end_time equals start_time, it's a newly created active shift
            (!shift.end_time || shift.end_time === shift.start_time),
        )
        console.log("Found truly active shift:", activeShift)
        return activeShift
      }
      return null
    } catch (error) {
      console.error("Error checking active shift:", error)
      return null
    }
  }

  // Create new shift session
  const createShiftSession = async (userId: string, shiftType: string, authToken: string) => {
    // Temporarily store the token for the API call
    const previousToken = localStorage.getItem('authToken')
    localStorage.setItem('authToken', authToken)
    
    try {
      // Try different enum values until one works
      const possibleShiftTypes = [
        shiftType.toLowerCase(), // morning, evening
        shiftType.toUpperCase(), // MORNING, EVENING
        shiftType.charAt(0).toUpperCase() + shiftType.slice(1), // Morning, Evening
        shiftType === "morning" ? "day" : "night", // day, night
        shiftType === "morning" ? "AM" : "PM", // AM, PM
      ]

      console.log("Trying different shift type values:", possibleShiftTypes)

      for (const tryShiftType of possibleShiftTypes) {
        const payload = {
          opened_by: userId,
          shift_type: tryShiftType,
          workers: [],
        }

        console.log(`Attempting shift creation with shift_type: "${tryShiftType}"`)

        try {
          const result = await AuthApiService.apiRequest<any>('/shifts', {
            method: "POST",
            body: JSON.stringify(payload),
          })

          console.log(`SUCCESS with shift_type: "${tryShiftType}"`, result)
          if (result.success && result.data) {
            return result.data
          }
        } catch (error: any) {
          console.log(`FAILED with shift_type: "${tryShiftType}"`, error.message)

          // If this is the last attempt, throw the error
          if (tryShiftType === possibleShiftTypes[possibleShiftTypes.length - 1]) {
            throw new Error(error.message || `Backend error: ${error.status || 'Unknown'}`)
          }
        }
      }

      return null
    } catch (error) {
      console.error("Error creating shift session:", error)
      throw error
    } finally {
      // Restore previous token state
      if (previousToken) {
        localStorage.setItem('authToken', previousToken)
      } else {
        localStorage.removeItem('authToken')
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("Attempting login with:", { username, selectedRole })

      // Create login DTO matching backend expectations
      const loginPayload: LoginDto = {
        username: username.trim(),
        password: password.trim(),
      }

      console.log("Login payload:", loginPayload)

      // Use the AuthApiService for login
  const authData: AuthResponseDto = await AuthApiService.login(loginPayload)
      console.log("Login success response:", authData)

  const userData = authData.user as any // cast to allow dynamic permission handling
      const authToken = authData.token

      if (!userData) {
        throw new Error("No user data in response")
      }

      // Handle both id and user_id fields from backend
      const userId = userData.user_id || userData.id
      if (!userId) {
        throw new Error("Invalid user data: Missing user ID")
      }

      // Handle both fullName and full_name fields from backend
      const fullName = userData.full_name || userData.fullName || userData.username
      if (!fullName && !userData.username) {
        throw new Error("Invalid user data: Missing name")
      }

      let activeShift = null

      // Attempt to fetch server-side permissions if empty
  if (Array.isArray(userData.permissions) && userData.permissions.length === 0) {
        try {
          const profile = await AuthApiService.getProfile()
          if (profile?.data?.user?.permissions?.length) {
            userData.permissions = profile.data.user.permissions
            console.log('Updated permissions from profile endpoint:', userData.permissions)
          }
        } catch (permErr) {
          console.warn('Could not fetch profile for permissions', permErr)
        }
      }

      // Ensure cashier permissions injected client-side (for UI) even if backend missing
      if (selectedRole === 'cashier') {
        userData.permissions = userData.permissions || []
        if (!userData.permissions.includes('access:cashier')) {
          userData.permissions.push('access:cashier')
        }
        if (!userData.permissions.includes('cashier:access')) {
          userData.permissions.push('cashier:access')
        }
      }

  const hasCashierPerm = selectedRole !== 'cashier' || (Array.isArray(userData.permissions) && userData.permissions.some((p: string) => p === 'access:cashier' || p === 'cashier:access' || p === 'OWNER_ACCESS'))

      if (selectedRole === 'cashier' && !hasCashierPerm) {
        throw new Error('المستخدم لا يمتلك صلاحية الكاشير (access:cashier). اطلب من المسؤول منحه الصلاحية.')
      }

      if (selectedRole === 'cashier' && hasCashierPerm) {
        console.log("Processing cashier login - checking for active shift session...")
        try {
          // Use the new AuthApiService method for shift management
          activeShift = await AuthApiService.ensureActiveShift()
          
          if (activeShift) {
            toast.success("وردية نشطة", { 
              description: `تم العثور على وردية ${activeShift.shift_type || 'نشطة'}` 
            })
          } else {
            // No active shift found - create one automatically for cashier
            console.log("No active shift found - creating new shift for cashier")
            activeShift = await AuthApiService.createShiftForCurrentUser()
            
            if (activeShift) {
              toast.success("وردية جديدة", { 
                description: `تم إنشاء وردية ${activeShift.shift_type || 'جديدة'} بنجاح` 
              })
            } else {
              toast.warning('تعذر إنشاء وردية جديدة', { 
                description: 'سيتم المتابعة بدون وردية' 
              })
            }
          }
        } catch (shiftError: any) {
          console.error("Shift management failed:", shiftError)
          
          // Handle specific error cases
          if (shiftError.message.includes('403')) {
            toast.warning('تعذر إدارة الورديات', { 
              description: 'يرجى التأكد من صلاحيات الكاشير' 
            })
          } else if (shiftError.message.includes('409')) {
            // Conflict - shift already exists, try to get current shift
            try {
              activeShift = await AuthApiService.getCurrentShift()
              if (activeShift) {
                toast.success("وردية موجودة", { 
                  description: `تم العثور على وردية ${activeShift.shift_type || 'نشطة'}` 
                })
              }
            } catch (getCurrentError) {
              console.warn('Could not get current shift after 409:', getCurrentError)
            }
          } else {
            toast.warning('تعذر إنشاء وردية جديدة', { 
              description: 'سيتم المتابعة بدون وردية' 
            })
          }
        }
      }

      // Clear any existing user data
      AuthApiService.clearAuthData()

      // Store user data in the EXACT format your cashier page expects
      const userToStore: CurrentUser = {
        user_id: userId,
        id: userId, // Add both formats
        full_name: fullName,
        fullName: fullName, // Add both formats
        username: userData.username || username,
        name: fullName, // Add this for cashier pages
        role: selectedRole as 'owner' | 'admin' | 'cashier',
        permissions: userData.userPermissions || [], // Add user permissions
        shift: activeShift
          ? {
              shift_id: activeShift.shift_id,
              type: activeShift.shift_type.toLowerCase(),
              start_time: activeShift.start_time,
              status: "active", // Your cashier pages check for "active" status
              is_active: true,
              is_closed: false,
              opened_by: activeShift.opened_by,
              shift_type: activeShift.shift_type,
              workers: activeShift.workers || [],
              shift_name: activeShift.shift_type.toLowerCase(), // Add this for orders page
              // Store the raw shift data exactly as your cashier pages expect
              ...activeShift,
              end_time: null, // Override the backend's end_time
            }
          : null,
        loginTime: new Date().toISOString(),
      }

      // Store user data and tokens
      try {
        console.log("Storing user data for owner:", userToStore)
        localStorage.setItem("currentUser", JSON.stringify(userToStore))
        
        // Ensure token is stored properly
        if (authToken && typeof authToken === 'string') {
          localStorage.setItem("authToken", authToken)
          console.log("Token stored successfully for owner:", authToken.substring(0, 20) + "...")
        } else {
          console.error("Invalid token format:", authToken)
          throw new Error("Invalid authentication token received")
        }
        
        if (authData.expiresIn) {
          // Convert seconds to milliseconds for expiration time
          const expirationTime = Date.now() + (authData.expiresIn * 1000)
          localStorage.setItem("tokenExpiration", expirationTime.toString())
        }

        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem(
            "savedCredentials",
            JSON.stringify({
              username: username,
              password: password,
            }),
          )
        } else {
          localStorage.removeItem("savedCredentials")
        }
      } catch (storageError) {
        console.error("Failed to store user data:", storageError)
        throw new Error("Failed to store user data")
      }

      setLoggedInUser(userToStore)

      // Show success toast
      toast.success("تم تسجيل الدخول بنجاح", {
        description: `مرحباً ${userToStore.full_name}!`,
      })

      console.log("Final user data stored:", userToStore)

      // Redirect based on selected role
      console.log("Redirecting based on selected role:", selectedRole)
      
      // Verify data is actually stored before redirect
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const storedToken = localStorage.getItem("authToken")
      console.log("Verification - Stored user:", storedUser)
      console.log("Verification - Stored token:", storedToken ? "Present" : "Missing")

      switch (selectedRole) {
        case "cashier":
          if (activeShift) {
            console.log("Redirecting to cashier page with active shift:", userToStore.shift)
            router.push("/cashier/sales")
          } else {
            // Go to a safe landing page prompting to start shift later
            router.push("/cashier/")
          }
          break
        case "admin":
          console.log("Redirecting to admin page")
          router.push("/admin/")
          break
        case "owner":
          console.log("Redirecting to owner page")
          // Use window.location.replace with trailing slash
          setTimeout(() => {
            console.log("Executing owner page redirect with trailing slash")
            window.location.replace("/owner/")
          }, 100)
          break
        default:
          console.log("Redirecting to default owner page")
          router.push("/owner/")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      
      let errorMessage = "اسم المستخدم أو كلمة المرور غير صحيحة"

      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = "اسم المستخدم أو كلمة المرور غير صحيحة"
        AuthApiService.clearAuthData()
      } else if (error.message?.includes('400')) {
        errorMessage = "بيانات تسجيل الدخول غير صحيحة"
      } else if (error.message?.includes('403')) {
        errorMessage = "غير مصرح لهذا المستخدم بالدخول كـ " + selectedRole
      } else if (error.message?.includes('500')) {
        errorMessage = "خطأ في الخادم - حاول مرة أخرى لاحقاً"
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      toast.error("فشل تسجيل الدخول", {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotPasswordEmail) {
      toast.error("يرجى إدخال البريد الإلكتروني")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const result = await response.json()
      if (response.ok && result.success) {
        toast.success("تم إرسال رابط إعادة تعيين كلمة المرور", {
          description: "يرجى التحقق من بريدك الإلكتروني",
        })
        setShowForgotPassword(false)
      } else {
        toast.error("فشل في إرسال رابط إعادة التعيين", {
          description: result.message || "يرجى التحقق من البريد الإلكتروني والمحاولة مرة أخرى",
        })
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      toast.error("حدث خطأ في الاتصال", {
        description: "يرجى المحاولة مرة أخرى لاحقاً",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    AuthApiService.clearAuthData()
    setLoggedInUser(null)
    setUsername("")
    setPassword("")
    setError("")
    toast.success("تم تسجيل الخروج بنجاح")
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-300 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-32 h-32 bg-amber-300 rounded-full blur-xl animate-pulse delay-100"></div>
        <div className="absolute bottom-20 left-32 w-24 h-24 bg-yellow-300 rounded-full blur-xl animate-pulse delay-200"></div>
        <div className="absolute bottom-32 right-10 w-28 h-28 bg-orange-300 rounded-full blur-xl animate-pulse delay-300"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 pt-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <Image
                  src="/images/logo.png"
                  alt="شعار مطعم دوار جحا"
                  width={100}
                  height={100}
                  priority
                  className="rounded-full relative z-10 border-4 border-white shadow-xl object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                مطعم دوار جحا
              </CardTitle>
              <CardDescription className="text-base md:text-lg text-gray-600">نظام إدارة المطعم</CardDescription>
            </motion.div>

            {/* User Info Display */}
            {loggedInUser && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="px-6 md:px-8 pb-4"
              >
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(loggedInUser.full_name || loggedInUser.fullName || loggedInUser.name || loggedInUser.username)
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {loggedInUser.full_name ||
                            loggedInUser.fullName ||
                            loggedInUser.name ||
                            loggedInUser.username}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {loggedInUser.username} •{" "}
                          {loggedInUser.role === "cashier"
                            ? "كاشير"
                            : loggedInUser.role === "admin"
                              ? "مدير"
                              : loggedInUser.role === "owner"
                                ? "مالك"
                                : "مستخدم"}
                        </p>
                        {loggedInUser.shift && loggedInUser.role === "cashier" && (
                          <p className="text-xs text-green-600 font-medium">
                            وردية {loggedInUser.shift.type === "morning" ? "صباحية" : "مسائية"} نشطة
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          آخر تسجيل دخول: {new Date(loggedInUser.loginTime).toLocaleString("ar-EG")}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 bg-transparent"
                    >
                      تسجيل الخروج
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </CardHeader>

          <CardContent className="px-6 md:px-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="username" className="text-base md:text-lg font-semibold text-gray-700">
                  اسم المستخدم
                </Label>
                <div className="relative group">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    id="username"
                    placeholder="أدخل اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-12 pr-12 text-base md:text-lg border-2 focus:border-orange-500 transition-all duration-300"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-base md:text-lg font-semibold text-gray-700">
                    كلمة المرور
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12 pl-12 text-base md:text-lg border-2 focus:border-orange-500 transition-all duration-300"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </motion.div>

              {/* Only show shift selection for cashier role */}
              {selectedRole === "cashier" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="space-y-3"
                >
                  <Label className="text-base md:text-lg font-semibold text-gray-700 flex items-center">
                    <Clock className="ml-2 h-5 w-5 text-orange-600" />
                    نوع الوردية
                  </Label>
                  <RadioGroup defaultValue="morning" value={shift} onValueChange={setShift} className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 bg-gradient-to-r from-orange-50 to-amber-50 p-3 md:p-4 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 cursor-pointer"
                    >
                      <RadioGroupItem value="morning" id="morning" className="text-orange-600" />
                      <Label htmlFor="morning" className="text-base md:text-lg cursor-pointer font-medium">
                        الوردية الصباحية (8:00 ص - 8:00 م)
                      </Label>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 cursor-pointer"
                    >
                      <RadioGroupItem value="evening" id="evening" className="text-blue-600" />
                      <Label htmlFor="evening" className="text-base md:text-lg cursor-pointer font-medium">
                        الوردية المسائية (8:00 م - 8:00 ص)
                      </Label>
                    </motion.div>
                  </RadioGroup>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="space-y-3"
              >
                <Label className="text-base md:text-lg font-semibold text-gray-700 flex items-center">
                  <User className="ml-2 h-5 w-5 text-orange-600" />
                  نوع الوصول
                </Label>
                <RadioGroup
                  defaultValue="owner"
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  className="space-y-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-3 bg-gradient-to-r from-orange-50 to-amber-50 p-3 md:p-4 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 cursor-pointer"
                  >
                    <RadioGroupItem value="cashier" id="cashier" className="text-orange-600" />
                    <Label htmlFor="cashier" className="text-base md:text-lg cursor-pointer font-medium">
                      كاشير - إدارة المبيعات والطلبات
                    </Label>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 cursor-pointer"
                  >
                    <RadioGroupItem value="admin" id="admin" className="text-blue-600" />
                    <Label htmlFor="admin" className="text-base md:text-lg cursor-pointer font-medium">
                      مدير - إدارة العمال والمخزون
                    </Label>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-violet-50 p-3 md:p-4 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 cursor-pointer"
                  >
                    <RadioGroupItem value="owner" id="owner" className="text-purple-600" />
                    <Label htmlFor="owner" className="text-base md:text-lg cursor-pointer font-medium">
                      مالك - إدارة شاملة للنظام
                    </Label>
                  </motion.div>
                </RadioGroup>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  تذكر بيانات الدخول
                </Label>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-red-50 border-2 border-red-200 text-red-700 p-3 md:p-4 rounded-xl text-center font-medium text-sm md:text-base flex items-center justify-center space-x-2"
                  >
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 md:h-14 text-base md:text-lg font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                        جاري تسجيل الدخول...
                      </>
                    ) : (
                      <>
                        <LogIn className="ml-2 h-5 w-5" />
                        تسجيل الدخول
                        <span className="text-xs opacity-50 mr-2">(Ctrl + Enter)</span>
                      </>
                    )}
                  </div>
                </Button>
              </motion.div>
            </form>


          </CardContent>

          <CardFooter className="flex justify-center text-xs md:text-sm text-gray-500 pb-6">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.5 }}>
              © {new Date().getFullYear()} مطعم دوار جحا - جميع الحقوق محفوظة
            </motion.p>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Forgot Password Dialog */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">إعادة تعيين كلمة المرور</h3>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="أدخل البريد الإلكتروني"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="h-12 pr-12 text-base border-2 focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                      جاري الإرسال...
                    </div>
                  ) : (
                    "إرسال رابط إعادة التعيين"
                  )}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>؛
    </div>
  )
}