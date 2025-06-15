import { create } from "zustand"

export interface Expense {
  id: string
  description: string
  amount: number
  timestamp: Date
}

export interface WorkerAttendance {
  id: string
  workerName: string
  hourlyRate: number
  arrivalTime: Date
  departureTime?: Date
  hoursWorked?: number
  dailyWage: number
  shift: "morning" | "evening"
  date: string
}

export interface DailyReport {
  id: string
  date: string
  shift: "morning" | "evening"
  createdBy: string
  revenues: {
    takeaway: number
    cafe: number
    ground: number
  }
  expenses: Expense[]
  totalRevenue: number
  totalExpenses: number
  totalWages: number
  netProfit: number
  createdAt: Date
}

interface DailyReportStore {
  reports: DailyReport[]
  workers: WorkerAttendance[]

  createDailyReport: (date: string, shift: "morning" | "evening", createdBy: string) => void
  addExpense: (reportId: string, expense: Omit<Expense, "id" | "timestamp">) => void
  updateRevenue: (reportId: string, type: "takeaway" | "cafe" | "ground", amount: number) => void
  addWorkerAttendance: (worker: Omit<WorkerAttendance, "id" | "dailyWage">) => void
  updateWorkerDeparture: (workerId: string, departureTime: Date) => void
  calculateTotals: (reportId: string) => void
}

export const useDailyReportStore = create<DailyReportStore>((set, get) => ({
  reports: [],
  workers: [],

  createDailyReport: (date, shift, createdBy) => {
    const newReport: DailyReport = {
      id: `report-${Date.now()}`,
      date,
      shift,
      createdBy,
      revenues: { takeaway: 0, cafe: 0, ground: 0 },
      expenses: [],
      totalRevenue: 0,
      totalExpenses: 0,
      totalWages: 0,
      netProfit: 0,
      createdAt: new Date(),
    }

    set((state) => ({
      reports: [...state.reports, newReport],
    }))
  },

  addExpense: (reportId, expenseData) => {
    const expense: Expense = {
      id: `expense-${Date.now()}`,
      ...expenseData,
      timestamp: new Date(),
    }

    set((state) => ({
      reports: state.reports.map((report) =>
        report.id === reportId ? { ...report, expenses: [...report.expenses, expense] } : report,
      ),
    }))

    get().calculateTotals(reportId)
  },

  updateRevenue: (reportId, type, amount) => {
    set((state) => ({
      reports: state.reports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              revenues: { ...report.revenues, [type]: amount },
            }
          : report,
      ),
    }))

    get().calculateTotals(reportId)
  },

  addWorkerAttendance: (workerData) => {
    const worker: WorkerAttendance = {
      id: `worker-${Date.now()}`,
      ...workerData,
      dailyWage: 0,
    }

    set((state) => ({
      workers: [...state.workers, worker],
    }))
  },

  updateWorkerDeparture: (workerId, departureTime) => {
    set((state) => ({
      workers: state.workers.map((worker) => {
        if (worker.id === workerId) {
          const hoursWorked = (departureTime.getTime() - worker.arrivalTime.getTime()) / (1000 * 60 * 60)
          const dailyWage = hoursWorked * worker.hourlyRate

          return {
            ...worker,
            departureTime,
            hoursWorked: Math.round(hoursWorked * 100) / 100,
            dailyWage: Math.round(dailyWage * 100) / 100,
          }
        }
        return worker
      }),
    }))
  },

  calculateTotals: (reportId) => {
    set((state) => ({
      reports: state.reports.map((report) => {
        if (report.id === reportId) {
          const totalRevenue = Object.values(report.revenues).reduce((sum, amount) => sum + amount, 0)
          const totalExpenses = report.expenses.reduce((sum, expense) => sum + expense.amount, 0)
          const reportWorkers = state.workers.filter((w) => w.date === report.date && w.shift === report.shift)
          const totalWages = reportWorkers.reduce((sum, worker) => sum + worker.dailyWage, 0)
          const netProfit = totalRevenue - totalExpenses - totalWages

          return {
            ...report,
            totalRevenue,
            totalExpenses,
            totalWages,
            netProfit,
          }
        }
        return report
      }),
    }))
  },
}))
