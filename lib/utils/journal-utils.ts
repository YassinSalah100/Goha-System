// Utility functions for journal functionality
export const formatEgyptianCurrency = (amount: number): string => {
  // Ensure amount is a valid number
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0
  
  // Format with Egyptian locale and currency
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount)
}

export const validateExpenseForm = (formData: any): { isValid: boolean; errors: any } => {
  const errors: any = {}
  
  if (!formData.item?.trim()) {
    errors.item = "اسم المصروف مطلوب"
  }
  
  if (!formData.amount || formData.amount <= 0) {
    errors.amount = "يجب أن يكون المبلغ أكبر من صفر"
  }
  
  if (!formData.category?.trim()) {
    errors.category = "فئة المصروف مطلوبة"
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const calculateWorkHours = (startTime: string, endTime?: string): number => {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  return Math.max(hours, 0.25)
}

export const calculateSalary = (hours: number, hourlyRate: number): number => {
  return Math.round(hours * hourlyRate * 100) / 100
}
