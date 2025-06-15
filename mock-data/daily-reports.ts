export type DailyReport = {
  id: string
  date: string
  shift: "morning" | "evening"
  expenses: {
    id: string
    description: string
    amount: number
  }[]
  takeawayRevenue: number
  cafeRevenue: number
  groundRevenue: number
  totalRevenue: number
  wages: number
  netRevenue: number
  createdBy: string
}

export const dailyReports: DailyReport[] = [
  {
    id: "report-1",
    date: "2023-06-10",
    shift: "morning",
    expenses: [
      {
        id: "exp-1",
        description: "Ingredients purchase",
        amount: 200,
      },
      {
        id: "exp-2",
        description: "Cleaning supplies",
        amount: 50,
      },
    ],
    takeawayRevenue: 500,
    cafeRevenue: 300,
    groundRevenue: 800,
    totalRevenue: 1300, // takeaway + ground
    wages: 264, // sum of worker wages
    netRevenue: 786, // totalRevenue - (expenses + wages)
    createdBy: "admin",
  },
  {
    id: "report-2",
    date: "2023-06-10",
    shift: "evening",
    expenses: [
      {
        id: "exp-3",
        description: "Urgent repair",
        amount: 100,
      },
    ],
    takeawayRevenue: 600,
    cafeRevenue: 400,
    groundRevenue: 900,
    totalRevenue: 1500, // takeaway + ground
    wages: 264, // sum of worker wages
    netRevenue: 1136, // totalRevenue - (expenses + wages)
    createdBy: "admin",
  },
]
