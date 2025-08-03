"use client"
import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { validateExpenseForm } from "@/lib/journal-utils"

interface ExpenseFormProps {
  onAddExpense: (expense: ExpenseData) => Promise<void>
  isLoading: boolean
}

interface ExpenseData {
  item: string
  amount: number
  category: string
  description?: string
}

interface FormErrors {
  item?: string
  amount?: string
  category?: string
}

const expenseCategories = [
  "مواد أولية",
  "مصروفات إدارية",
  "صيانة",
  "نظافة",
  "مرافق",
  "أخرى"
]

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, isLoading }) => {
  const [formData, setFormData] = useState<ExpenseData>({
    item: "",
    amount: 0,
    category: "",
    description: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateExpenseForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    try {
      await onAddExpense(formData)
      setFormData({
        item: "",
        amount: 0,
        category: "",
        description: ""
      })
      setErrors({})
    } catch (error) {
      console.error("Error adding expense:", error)
    }
  }

  const handleInputChange = (field: keyof ExpenseData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          إضافة مصروف جديد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item">اسم المصروف</Label>
              <Input
                id="item"
                value={formData.item}
                onChange={(e) => handleInputChange("item", e.target.value)}
                placeholder="مثال: قهوة، سكر، مناديل"
                className={errors.item ? "border-red-500" : ""}
              />
              {errors.item && <p className="text-red-500 text-sm mt-1">{errors.item}</p>}
            </div>

            <div>
              <Label htmlFor="amount">المبلغ (جنيه)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="category">الفئة</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="اختر فئة المصروف" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <Label htmlFor="description">ملاحظات (اختياري)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="تفاصيل إضافية عن المصروف..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جارٍ الإضافة...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                إضافة المصروف
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
