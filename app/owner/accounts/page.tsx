"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectItem, SelectTrigger, SelectContent } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

export default function OwnerAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    role: "cashier",
    shift: "morning",
    hour_rate: 0,
  })

  useEffect(() => {
    // Load accounts from API instead of localStorage
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`)
      if (response.ok) {
        const data = await response.json() 
        // Ensure data is an array
        const accountsArray = Array.isArray(data) ? data : (data.users || data.data || [])
        setAccounts(accountsArray)
      } else {
        console.error("Failed to fetch accounts:", response.status)
        // Fallback to localStorage if API fails
        const stored = JSON.parse(localStorage.getItem("accounts") || "[]")
        setAccounts(stored)
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      // Fallback to localStorage if API is not available
      const stored = JSON.parse(localStorage.getItem("accounts") || "[]")
      setAccounts(stored)
    }
  }

  const handleChange = (e: any) => {
    const { name, value, type } = e.target
    const processedValue = type === 'number' ? Number(value) || 0 : value
    
    setForm({ ...form, [name]: processedValue })
    // Clear any previous messages when user starts typing
    if (message) setMessage(null)
  }

  const validateForm = () => {
    if (!form.username.trim()) {
      setMessage({ type: "error", text: "اسم المستخدم مطلوب" })
      return false
    }
    if (!form.full_name.trim()) {
      setMessage({ type: "error", text: "الاسم الكامل مطلوب" })
      return false
    }
    if (!form.email.trim()) {
      setMessage({ type: "error", text: "البريد الإلكتروني مطلوب" })
      return false
    }
    if (!form.password.trim()) {
      setMessage({ type: "error", text: "كلمة المرور مطلوبة" })
      return false
    }
    if (form.password.length < 6) {
      setMessage({ type: "error", text: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" })
      return false
    }
    if (typeof form.hour_rate !== 'number' || form.hour_rate < 0) {
      setMessage({ type: "error", text: "معدل الساعة يجب أن يكون رقم موجب" })
      return false
    }
    return true
  }

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setMessage(null)

    try {
      console.log("Sending data to API:", form)
      
      // Map the form data to match API expectations
      const apiData = {
        username: form.username,
        fullName: form.full_name, // Try fullName instead of full_name
        email: form.email,
        password: form.password,
        role: form.role,
        shift: form.shift,
        hour_rate: Number(form.hour_rate) || 0, // Try underscore version
        hourRate: Number(form.hour_rate) || 0, // Try camelCase version
        hourly_rate: Number(form.hour_rate) || 0, // Try full word version
      }
      
      console.log("Mapped API data:", apiData)
      console.log("Form hour_rate value:", form.hour_rate, "Type:", typeof form.hour_rate)
      console.log("JSON being sent:", JSON.stringify(apiData))
      
      // Try both JSON and FormData approaches
      let response
      
      // First try JSON
      response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      })
      
      // If JSON fails with hour_rate error, try FormData
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.message?.includes("hour_rate")) {
          console.log("Trying FormData approach...")
          const formData = new FormData()
          formData.append('username', form.username)
          formData.append('fullName', form.full_name)
          formData.append('email', form.email)
          formData.append('password', form.password)
          formData.append('role', form.role)
          formData.append('shift', form.shift)
          formData.append('hour_rate', String(form.hour_rate))
          
          response = await fetch(`${API_BASE_URL}/users`, {
            method: "POST",
            body: formData,
          })
        }
      }

      if (response.ok) {
        const newAccount = await response.json()
        setMessage({ type: "success", text: "تم إنشاء الحساب بنجاح" })
        setForm({
          username: "",
          full_name: "",
          email: "",
          password: "",
          role: "cashier",
          shift: "morning",
          hour_rate: 0,
        })
        // Refresh the accounts list
        await fetchAccounts()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        
        let errorMessage = "حدث خطأ أثناء إنشاء الحساب"
        
        if (response.status === 409) {
          if (errorData.message?.includes("username")) {
            errorMessage = "اسم المستخدم موجود مسبقاً"
          } else if (errorData.message?.includes("email")) {
            errorMessage = "البريد الإلكتروني موجود مسبقاً"
          } else if (errorData.message?.includes("full_name")) {
            errorMessage = "الاسم الكامل مطلوب"
          } else {
            errorMessage = "المستخدم موجود مسبقاً"
          }
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (response.status === 400) {
          errorMessage = "بيانات غير صحيحة"
        } else if (response.status === 500) {
          errorMessage = "خطأ في الخادم"
        }
        
        setMessage({ 
          type: "error", 
          text: errorMessage 
        })
      }
    } catch (error) {
      console.error("Error creating account:", error)
      setMessage({ type: "error", text: "حدث خطأ في الاتصال" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>إنشاء حساب جديد</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={createAccount} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">اسم المستخدم</label>
              <Input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="أدخل اسم المستخدم"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">الاسم الكامل</label>
              <Input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="أدخل الاسم الكامل"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">البريد الإلكتروني</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@example.com"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">كلمة المرور</label>
              <Input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">معدل الساعة (بالدينار)</label>
              <Input
                name="hour_rate"
                type="number"
                value={form.hour_rate}
                onChange={handleChange}
                placeholder="0"
                required
                disabled={loading}
                min={0}
                step={0.5}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">الدور</label>
                <Select value={form.role} onValueChange={value => setForm(f => ({ ...f, role: value }))} disabled={loading}>
                  <SelectTrigger>{form.role === "admin" ? "مدير" : "كاشير"}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير</SelectItem>
                    <SelectItem value="cashier">كاشير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">الوردية</label>
                <Select value={form.shift} onValueChange={value => setForm(f => ({ ...f, shift: value }))} disabled={loading}>
                  <SelectTrigger>{form.shift === "morning" ? "صباحي" : "مسائي"}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">صباحي</SelectItem>
                    <SelectItem value="night">مسائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء الحساب'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>الحسابات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              لا توجد حسابات بعد
            </div>
          ) : (
            <ul className="divide-y">
              {accounts.map((acc) => (
                <li key={acc.id || acc._id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{acc.full_name || acc.username}</div>
                    <div className="text-sm text-muted-foreground">{acc.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {acc.role === "admin" ? "مدير" : "كاشير"} - {acc.shift === "morning" ? "صباحي" : "مسائي"}
                      {acc.hour_rate && ` - ${acc.hour_rate} د/ساعة`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 