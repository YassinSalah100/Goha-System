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
import { users } from "@/mock-data/users"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [shift, setShift] = useState("morning")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")

  // Load saved credentials if remember me was checked
  useEffect(() => {
    const savedCredentials = localStorage.getItem("savedCredentials")
    if (savedCredentials) {
      const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials)
      setUsername(savedUsername)
      setPassword(savedPassword)
      setRememberMe(true)
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Trim whitespace and convert to lowercase for comparison
    const trimmedUsername = username.trim().toLowerCase()
    const trimmedPassword = password.trim()

    // Find user in mock data with case-insensitive username comparison
    const user = users.find((u) => u.username.toLowerCase() === trimmedUsername && u.password === trimmedPassword)

    if (user) {
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem("savedCredentials", JSON.stringify({ username: trimmedUsername, password: trimmedPassword }))
      } else {
        localStorage.removeItem("savedCredentials")
      }

      // Store user info and shift in localStorage
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          ...user,
          shift,
          loginTime: new Date().toISOString(),
        }),
      )

      // Show success toast
      toast.success("تم تسجيل الدخول بنجاح", {
        description: `مرحباً ${user.name}!`,
      })

      // Redirect based on role
      switch (user.role) {
        case "cashier":
          router.push("/cashier")
          break
        case "admin":
          router.push("/admin")
          break
        case "owner":
          router.push("/owner")
          break
        default:
          setError("صلاحية المستخدم غير صحيحة")
      }
    } else {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة")
      toast.error("فشل تسجيل الدخول", {
        description: "يرجى التحقق من بيانات الدخول",
      })
    }

    setIsLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotPasswordEmail) {
      toast.error("يرجى إدخال البريد الإلكتروني")
      return
    }

    // Simulate password reset request
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)

    toast.success("تم إرسال رابط إعادة تعيين كلمة المرور", {
      description: "يرجى التحقق من بريدك الإلكتروني",
    })
    setShowForgotPassword(false)
  }

  // Quick login function for demo buttons
  const quickLogin = (role: string) => {
    const user = users.find((u) => u.role === role)
    if (user) {
      setUsername(user.username)
      setPassword(user.password)
      setError("")
    }
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
                  className="rounded-full relative z-10 border-4 border-white shadow-xl"
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
              <CardDescription className="text-base md:text-lg text-gray-600">
                نظام إدارة المطعم
              </CardDescription>
            </motion.div>
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

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
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

            {/* Quick Login Buttons for Mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mt-6 space-y-3"
            >
              <h4 className="font-semibold text-gray-700 text-center text-sm md:text-base">دخول سريع للتجربة:</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => quickLogin("cashier")}
                  className="w-full h-10 text-sm font-medium border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300"
                >
                  <User className="ml-2 h-4 w-4 text-orange-600" />
                  دخول كاشير
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => quickLogin("admin")}
                  className="w-full h-10 text-sm font-medium border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                >
                  <User className="ml-2 h-4 w-4 text-blue-600" />
                  دخول مدير
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => quickLogin("owner")}
                  className="w-full h-10 text-sm font-medium border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
                >
                  <User className="ml-2 h-4 w-4 text-purple-600" />
                  دخول مالك
                </Button>
              </div>
            </motion.div>

            {/* Demo Credentials */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="mt-6 p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <h4 className="font-semibold text-gray-700 mb-3 text-center text-sm md:text-base">
                بيانات تجريبية للدخول:
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs md:text-sm">
                <div className="bg-white p-2 md:p-3 rounded-lg border hover:border-orange-300 transition-colors">
                  <p className="font-medium text-orange-600">الكاشير:</p>
                  <p>
                    المستخدم: <span className="font-mono bg-gray-100 px-1 md:px-2 py-1 rounded text-xs">cashier</span> |
                    كلمة المرور:{" "}
                    <span className="font-mono bg-gray-100 px-1 md:px-2 py-1 rounded text-xs">password</span>
                  </p>
                </div>
                <div className="bg-white p-2 md:p-3 rounded-lg border hover:border-blue-300 transition-colors">
                  <p className="font-medium text-blue-600">المدير:</p>
                  <p>
                    المستخدم: <span className="font-mono bg-gray-100 px-1 md:px-2 py-1 rounded text-xs">admin</span> |
                    كلمة المرور:{" "}
                    <span className="font-mono bg-gray-100 px-1 md:px-2 py-1 rounded text-xs">password</span>
                  </p>
                </div>
                <div className="bg-white p-2 md:p-3 rounded-lg border hover:border-purple-300 transition-colors">
                  <p className="font-medium text-purple-600">المالك:</p>
                  <p>
                    المستخدم: <span className="font-mono bg-gray-100 px-1 md:px-2 py-1 rounded text-xs">owner</span> |
                    كلمة المرور:{" "}
                    <span className="font-mono bg-gray-100 px-1 md:px-2 py-1 rounded text-xs">password</span>
                  </p>
                </div>
              </div>
            </motion.div>
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
      </AnimatePresence>
    </div>
  )
}
