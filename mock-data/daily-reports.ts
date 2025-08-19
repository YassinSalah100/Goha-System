export interface Expense {
  type: string
  amount: number
  description: string
}

export interface DailyReport {
  id: string
  date: string
  shift: "morning" | "evening"
  totalRevenue: number
  takeawayRevenue: number
  cafeRevenue: number
  groundRevenue: number
  netRevenue: number
  wages: number
  expenses: Expense[]
}

export const dailyReports: DailyReport[] = [
  {
    id: "RPT001",
    date: "2025-08-19",
    shift: "morning",
    totalRevenue: 450.75,
    takeawayRevenue: 180.30,
    cafeRevenue: 170.45,
    groundRevenue: 100.00,
    netRevenue: 320.75,
    wages: 80.00,
    expenses: [
      { type: "مواد خام", amount: 30.00, description: "قهوة وسكر" },
      { type: "صيانة", amount: 20.00, description: "إصلاح ماكينة القهوة" }
    ]
  },
  {
    id: "RPT002",
    date: "2025-08-19",
    shift: "evening",
    totalRevenue: 520.25,
    takeawayRevenue: 200.50,
    cafeRevenue: 219.75,
    groundRevenue: 100.00,
    netRevenue: 385.25,
    wages: 90.00,
    expenses: [
      { type: "تنظيف", amount: 25.00, description: "مواد تنظيف" },
      { type: "مواد خام", amount: 20.00, description: "حليب ومعجنات" }
    ]
  },
  {
    id: "RPT003",
    date: "2025-08-18",
    shift: "morning",
    totalRevenue: 380.50,
    takeawayRevenue: 150.20,
    cafeRevenue: 130.30,
    groundRevenue: 100.00,
    netRevenue: 270.50,
    wages: 75.00,
    expenses: [
      { type: "مواد خام", amount: 25.00, description: "سكر وشاي" },
      { type: "كهرباء", amount: 10.00, description: "فاتورة كهرباء" }
    ]
  },
  {
    id: "RPT004",
    date: "2025-08-18",
    shift: "evening",
    totalRevenue: 475.80,
    takeawayRevenue: 190.30,
    cafeRevenue: 185.50,
    groundRevenue: 100.00,
    netRevenue: 350.80,
    wages: 85.00,
    expenses: [
      { type: "مواد خام", amount: 30.00, description: "قهوة وحليب" },
      { type: "تنظيف", amount: 10.00, description: "أكياس قمامة" }
    ]
  },
  {
    id: "RPT005",
    date: "2025-08-17",
    shift: "morning",
    totalRevenue: 420.00,
    takeawayRevenue: 165.00,
    cafeRevenue: 155.00,
    groundRevenue: 100.00,
    netRevenue: 305.00,
    wages: 80.00,
    expenses: [
      { type: "مواد خام", amount: 25.00, description: "دقيق وزبدة" },
      { type: "صيانة", amount: 10.00, description: "تنظيف الأجهزة" }
    ]
  }
]
