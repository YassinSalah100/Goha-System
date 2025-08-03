// Monitoring Page Types
export interface OrderItem {
  order_item_id: string
  quantity: number
  unit_price: string | number
  notes?: string
  product_size?: {
    product_name: string
    size_name: string
    price: string | number
  }
  extras?: Array<{
    name?: string
    price?: string | number
  }>
}

export interface Order {
  order_id: string
  customer_name: string
  order_type: "dine-in" | "takeaway" | "delivery" | "cafe"
  phone_number?: string
  total_price: string | number
  status: "pending" | "active" | "completed" | "cancelled"
  payment_method: "cash" | "card"
  created_at: string
  updated_at?: string
  items?: OrderItem[]
  table_number?: string
  cashier?: {
    user_id?: string
    id?: string  // Alternative field name
    full_name?: string
    fullName?: string  // Alternative field name
    username?: string
  }
  shift?: {
    shift_id: string
    shift_name?: string
    shift_type?: "morning" | "night"
    start_time?: string
    status?: "opened" | "closed"
  }
}

export interface CancelledOrder {
  cancelled_order_id: string
  original_order_id: string
  cancellation_reason: string
  cancelled_by: string
  cancelled_at: string
  order?: Order
}

export interface CashierActivity {
  cashierName: string
  cashierId: string
  ordersToday: number
  totalSales: number
  lastOrderTime: string
  isActive: boolean
  orderTypes: {
    "dine-in": number
    takeaway: number
    delivery: number
    cafe: number
  }
  salesByType: {
    "dine-in": number
    takeaway: number
    delivery: number
    cafe: number
  }
}

export interface StockItem {
  stock_item_id: string
  name: string
  quantity: number
  min_quantity: number
  unit: string
  type: string
  last_updated: string
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByType: {
    "dine-in": number
    takeaway: number
    delivery: number
  }
  ordersByStatus: {
    pending: number
    completed: number
    cancelled: number
  }
  ordersByPayment: {
    cash: number
    card: number
  }
}

export interface ShiftWorker {
  shift_worker_id: string
  worker: {
    worker_id: string
    full_name: string
    status: string
  }
  hourly_rate: number
  start_time: string
  end_time: string | null
  hours_worked: number
  calculated_salary: number
  is_active: boolean
}

export interface ShiftExpense {
  expense_id: string
  title: string
  amount: number
  category: string
  created_at: string
  created_by: {
    worker_id: string
    full_name: string
  }
}

export interface CashierDto {
  id?: string        // Clean architecture uses 'id'
  user_id?: string   // Alternative field name  
  username: string
  fullName?: string  // Clean architecture uses 'fullName'
  full_name?: string // Alternative field name
}

export interface DetailedShiftSummary {
  shift_id: string
  type: "morning" | "night"
  status: "opened" | "closed" | "REQUESTED_CLOSE"
  start_time: string
  end_time: string | null
  opened_by: {
    worker_id: string
    full_name: string
  }
  closed_by?: {
    worker_id: string
    full_name: string
  }
  // Orders summary
  total_orders: number
  total_sales: number
  orders_by_type: {
    "dine-in": number
    takeaway: number
    delivery: number
    cafe: number
  }
  orders_by_status: {
    pending: number
    completed: number
    cancelled: number
  }
  orders_by_payment: {
    cash: number
    card: number
  }
  average_order_value: number
  // Workers summary
  total_workers: number
  active_workers: number
  total_staff_cost: number
  workers: ShiftWorker[]
  // Expenses summary
  total_expenses: number
  expenses_count: number
  expenses_by_category: {
    [key: string]: number
  }
  expenses: ShiftExpense[]
  // Cashiers summary
  cashiers?: CashierDto[]
}

export interface TodayStats {
  totalOrders: number
  totalSales: number
  completedOrders: number
  pendingOrders: number
  activeCashiers: number
  ordersByType: {
    "dine-in": number
    takeaway: number
    delivery: number
    cafe: number
  }
  salesByType: {
    "dine-in": number
    takeaway: number
    delivery: number
    cafe: number
  }
}

export interface MonitoringFilters {
  selectedDate: string
  selectedShiftType: string
  selectedShiftStatus: string
}
