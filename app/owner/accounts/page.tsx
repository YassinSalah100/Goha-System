"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = "http://172.162.241.242:3000/api/v1"

interface Account {
  id?: string;
  user_id?: string;
  _id?: string;
  username?: string;
  full_name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  shift?: string;
  hour_rate?: number;
  hourRate?: number;
}

interface Message {
  type: "success" | "error" | null;
  text: string | null;
}

const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "", // Add phone field
    password: "",
    role: "cashier",
    shift: "morning",
    hour_rate: "", // Change to string for compatibility
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<Message>({
    type: null,
    text: null,
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`)

      if (response.ok) {
        const data = await response.json()
        console.log("Accounts API response:", data)

        // Handle the API response structure
        let accountsArray = []
        if (data.success && data.data) {
          if (Array.isArray(data.data)) {
            accountsArray = data.data
          } else if (data.data.users && Array.isArray(data.data.users)) {
            accountsArray = data.data.users
          }
        } else if (Array.isArray(data)) {
          accountsArray = data
        }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validateForm = () => {
    if (!form.username || !form.full_name || !form.email || !form.phone || !form.password || form.hour_rate === "") {
      setMessage({ type: "error", text: "الرجاء ملء جميع الحقول" })
      return false
    }
    if (form.password.length < 6) {
      setMessage({ type: "error", text: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل" })
      return false
    }
    if (isNaN(Number(form.hour_rate))) {
      setMessage({ type: "error", text: "معدل الساعة يجب أن يكون رقمًا" })
      return false
    }
    return true
  }

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setMessage({ type: null, text: null })

    try {
      console.log("Original form data:", form)

      // Map the form data to match API expectations - try multiple field name formats
      const apiData = {
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        fullName: form.full_name.trim(), // Add camelCase version
        name: form.full_name.trim(), // Add simple name version
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        shift: form.shift,
        hour_rate: Number(form.hour_rate),
        hourRate: Number(form.hour_rate), // Add camelCase version
      }

      console.log("Sending to API:", apiData)
      console.log("API URL:", `${API_BASE_URL}/users`)

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      if (response.ok) {
        const result = await response.json()
        console.log("Success response:", result)
        setMessage({ type: "success", text: "تم إنشاء الحساب بنجاح" })
        setForm({
          username: "",
          full_name: "",
          email: "",
          phone: "", // Add phone field
          password: "",
          role: "cashier",
          shift: "morning",
          hour_rate: "", // Reset to empty string
        })
        // Refresh the accounts list
        await fetchAccounts()
      } else {
        // Get the error response
        const errorText = await response.text()
        console.log("Error response text:", errorText)

        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          console.log("Could not parse error as JSON:", e)
        }

        console.log("Parsed error data:", errorData)

        let errorMessage = "حدث خطأ أثناء إنشاء الحساب"

        if (response.status === 409) {
          if (errorData.message) {
            if (errorData.message.toLowerCase().includes("username")) {
              errorMessage = "اسم المستخدم موجود مسبقاً"
            } else if (errorData.message.toLowerCase().includes("email")) {
              errorMessage = "البريد الإلكتروني موجود مسبقاً"
            } else if (errorData.message.toLowerCase().includes("phone")) {
              errorMessage = "رقم الهاتف موجود مسبقاً"
            } else if (errorData.message.includes("full_name") && errorData.message.includes("not-null")) {
              errorMessage = "خطأ في حقل الاسم الكامل - تأكد من ملء الحقل"
            } else {
              errorMessage = errorData.message
            }
          } else {
            errorMessage = "المستخدم موجود مسبقاً - جرب بيانات مختلفة"
          }
        } else if (response.status === 400) {
          if (errorData.message && errorData.message.includes("not-null")) {
            errorMessage = "يرجى ملء جميع الحقول المطلوبة"
          } else {
            errorMessage = errorData.message || "بيانات غير صحيحة - تحقق من جميع الحقول"
          }
        } else if (response.status === 500) {
          errorMessage = "خطأ في الخادم - حاول مرة أخرى لاحقاً"
        }

        setMessage({
          type: "error",
          text: errorMessage,
        })
      }
    } catch (error) {
      console.error("Network error:", error)
      setMessage({ type: "error", text: "حدث خطأ في الاتصال بالخادم - تحقق من الاتصال بالإنترنت" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">إدارة الحسابات</h1>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded-md ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-white shadow-md rounded-md p-5">
          <h2 className="text-lg font-semibold mb-4">إنشاء حساب جديد</h2>
          <form onSubmit={createAccount}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input type="text" id="username" name="username" value={form.username} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input type="text" id="full_name" name="full_name" value={form.full_name} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input type="email" id="email" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <Input type="password" id="password" name="password" value={form.password} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="role">الدور</Label>
                <Select onValueChange={(value) => setForm({ ...form, role: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر دور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">كاشير</SelectItem>
                    <SelectItem value="admin">مدير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="shift">الوردية</Label>
                <Select onValueChange={(value) => setForm({ ...form, shift: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر وردية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">صباحي</SelectItem>
                    <SelectItem value="evening">مسائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hour_rate">معدل الساعة</Label>
                <Input type="number" id="hour_rate" name="hour_rate" value={form.hour_rate} onChange={handleChange} />
              </div>
              <Button disabled={loading} type="submit">
                {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
              </Button>
            </div>
          </form>
        </div>

        {/* Accounts List Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">قائمة الحسابات</h2>
          <ul className="divide-y">
            {accounts.map((acc, index) => (
              <li key={acc.id || acc.user_id || acc._id || index} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{acc.full_name || acc.fullName || acc.username}</div>
                  <div className="text-sm text-muted-foreground">{acc.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {acc.role === "admin" ? "مدير" : "كاشير"} - {acc.shift === "morning" ? "صباحي" : "مسائي"}
                    {(acc.hour_rate || acc.hourRate) && ` - ${acc.hour_rate || acc.hourRate} د/ساعة`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AccountsPage
