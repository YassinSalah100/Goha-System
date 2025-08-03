// Monitoring API Service
import { 
  Order, 
  CancelledOrder, 
  StockItem, 
  OrderStats, 
  DetailedShiftSummary,
  CashierActivity
} from '@/lib/types/monitoring'

const API_BASE_URL = "http://192.168.1.14:3000/api/v1"

// Utility function for API calls with error handling
const apiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      // Remove credentials to avoid CORS issues with wildcard origin
      // credentials: 'include',
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error)
    throw error
  }
}

// Price normalization utilities
export const normalizePrice = (price: string | number): number => {
  if (typeof price === "string") {
    return Number.parseFloat(price) || 0
  }
  return Number(price) || 0
}

export const formatPrice = (price: string | number): string => {
  return `ج.م${normalizePrice(price).toLocaleString("ar-EG", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}

// API Services
export class MonitoringApiService {
  // Fetch live orders - using correct endpoint structure
  static async fetchOrders(page: number = 1, limit: number = 100): Promise<Order[]> {
    try {
      // Try without pagination first, then with if that fails
      try {
        const data = await apiRequest<any>(`/orders/except-cafe`)
        return data.data?.orders || data.data || []
      } catch (noPaginationError) {
        // If that fails, try with minimal pagination parameters
        console.log('Trying with pagination parameters')
        const data = await apiRequest<any>(`/orders/except-cafe?page=1&limit=10`)
        return data.data?.orders || data.data || []
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return []
    }
  }

  // Fetch order statistics - using correct endpoint structure  
  static async fetchOrderStats(): Promise<OrderStats | null> {
    try {
      // Try to get stats from dedicated endpoint first
      try {
        const statsData = await apiRequest<any>('/orders/stats')
        
        if (statsData.success && statsData.data) {
          const data = statsData.data
          return {
            totalOrders: data.totalOrders || 0,
            totalRevenue: normalizePrice(data.totalRevenue) || 0,
            averageOrderValue: normalizePrice(data.averageOrderValue) || 0,
            ordersByType: data.ordersByType || {
              "dine-in": 0,
              takeaway: 0,
              delivery: 0,
            },
            ordersByStatus: data.ordersByStatus || {
              pending: 0,
              completed: 0,
              cancelled: 0,
            },
            ordersByPayment: data.ordersByPayment || {
              cash: 0,
              card: 0,
            },
          }
        }
      } catch (statsError) {
        console.log('Stats endpoint unavailable, calculating from orders')
      }

      // Fallback: calculate from orders
      const orders = await this.fetchOrders()
      const today = new Date().toISOString().split('T')[0]
      
      const todayOrders = orders.filter(order => 
        order.created_at?.startsWith(today)
      )

      const stats: OrderStats = {
        totalOrders: todayOrders.length,
        totalRevenue: todayOrders.reduce((sum, order) => 
          sum + normalizePrice(order.total_price), 0
        ),
        averageOrderValue: 0,
        ordersByType: {
          "dine-in": 0,
          takeaway: 0,
          delivery: 0,
        },
        ordersByStatus: {
          pending: 0,
          completed: 0,
          cancelled: 0,
        },
        ordersByPayment: {
          cash: 0,
          card: 0,
        },
      }

      // Calculate averages and breakdowns
      stats.averageOrderValue = stats.totalOrders > 0 
        ? stats.totalRevenue / stats.totalOrders 
        : 0

      todayOrders.forEach(order => {
        // Count by type
        if (order.order_type in stats.ordersByType) {
          stats.ordersByType[order.order_type as keyof typeof stats.ordersByType]++
        }

        // Count by status
        if (order.status in stats.ordersByStatus) {
          stats.ordersByStatus[order.status as keyof typeof stats.ordersByStatus]++
        }

        // Count by payment method
        if (order.payment_method in stats.ordersByPayment) {
          stats.ordersByPayment[order.payment_method as keyof typeof stats.ordersByPayment]++
        }
      })

      return stats
    } catch (error) {
      console.error('Error calculating order stats:', error)
      return null
    }
  }

  // Fetch cancelled orders - these don't exist in your backend, removing
  static async fetchCancelledOrders(): Promise<CancelledOrder[]> {
    try {
      // Since there's no cancelled orders endpoint, return empty array
      console.log('Cancelled orders endpoint not available in backend')
      return []
    } catch (error) {
      console.error('Error fetching cancelled orders:', error)
      return []
    }
  }

  // Fetch low stock items - these don't exist in your backend, removing  
  static async fetchLowStockItems(): Promise<StockItem[]> {
    try {
      // Since there's no stock items endpoint, return empty array
      console.log('Stock items endpoint not available in backend')
      return []
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      return []
    }
  }

  // Fetch shifts by status - using correct endpoint structure
  static async fetchShiftsByStatus(status: 'opened' | 'closed'): Promise<DetailedShiftSummary[]> {
    try {
      const data = await apiRequest<any>(`/shifts/status/${status}`)
      return data.shifts || data.data || data || []
    } catch (error) {
      console.error(`Error fetching ${status} shifts:`, error)
      return []
    }
  }

  // Fetch shifts by date - try multiple endpoints
  static async fetchShiftsByDate(date: string): Promise<DetailedShiftSummary[]> {
    try {
      // Try the summary endpoint first
      try {
        const summaryData = await apiRequest<any>(`/shifts/summary/by-date?date=${date}`)
        return summaryData.shifts || summaryData.data || summaryData || []
      } catch (summaryError) {
        console.log('Summary endpoint failed, trying regular shifts by date')
      }

      // If summary fails, try to get regular shifts and transform them
      try {
        const data = await apiRequest<any>(`/shifts/by-date?date=${date}`)
        return data.shifts || data.data || data || []
      } catch (regularError) {
        console.log('Regular shifts by date also failed')
        return []
      }
    } catch (error) {
      console.error('Error fetching shifts by date:', error)
      return []
    }
  }

  // Fetch detailed shift summaries - using working endpoints
  static async fetchDetailedShiftSummaries(
    date?: string,
    shiftType?: string,
    status?: string
  ): Promise<DetailedShiftSummary[]> {
    try {
      // Try different approaches based on what's available
      
      // If date and shift_type are specified, use the summary endpoint
      if (date && date !== 'all' && shiftType && shiftType !== 'all') {
        try {
          const summaryData = await apiRequest<any>(`/shifts/summary/by-date?date=${date}&shift_type=${shiftType}`)
          if (summaryData && Array.isArray(summaryData)) {
            return this.filterShifts(summaryData, shiftType, status)
          }
        } catch (summaryError) {
          console.log('Summary by date endpoint failed, trying alternatives')
        }
      }

      // Fallback: combine opened and closed shifts
      const [openedShifts, closedShifts] = await Promise.all([
        this.fetchShiftsByStatus('opened'),
        this.fetchShiftsByStatus('closed')
      ])

      const allShifts = [...openedShifts, ...closedShifts]
      return this.filterShifts(allShifts, shiftType, status)
    } catch (error) {
      console.error('Error fetching detailed shift summaries:', error)
      return []
    }
  }

  // Helper method to filter shifts
  private static filterShifts(
    shifts: DetailedShiftSummary[], 
    shiftType?: string, 
    status?: string
  ): DetailedShiftSummary[] {
    let filtered = shifts

    if (shiftType && shiftType !== 'all') {
      filtered = filtered.filter(shift => shift.type === shiftType)
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(shift => shift.status === status)
    }

    return filtered
  }

  // Generate cashier activities from orders
  static async fetchCashierActivities(): Promise<CashierActivity[]> {
    try {
      // Use the simple orders endpoint without pagination
      const orders = await this.fetchOrders()
      const today = new Date().toISOString().split('T')[0]
      
      const todayOrders = orders.filter(order => 
        order.created_at?.startsWith(today)
      )

      const cashierMap = new Map<string, CashierActivity>()

      todayOrders.forEach(order => {
        const cashierName = order.cashier?.full_name || 'غير محدد'
        const cashierId = order.cashier?.user_id || 'unknown'

        if (!cashierMap.has(cashierId)) {
          cashierMap.set(cashierId, {
            cashierName,
            cashierId,
            ordersToday: 0,
            totalSales: 0,
            lastOrderTime: order.created_at || '',
            isActive: false,
            orderTypes: {
              "dine-in": 0,
              takeaway: 0,
              delivery: 0,
              cafe: 0,
            },
          })
        }

        const activity = cashierMap.get(cashierId)!
        activity.ordersToday++
        activity.totalSales += normalizePrice(order.total_price)
        
        if (order.created_at && order.created_at > activity.lastOrderTime) {
          activity.lastOrderTime = order.created_at
        }

        // Count order types
        if (order.order_type in activity.orderTypes) {
          activity.orderTypes[order.order_type as keyof typeof activity.orderTypes]++
        }

        // Consider active if last order was within 2 hours
        const lastOrderTime = new Date(activity.lastOrderTime)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
        activity.isActive = lastOrderTime > twoHoursAgo
      })

      return Array.from(cashierMap.values())
    } catch (error) {
      console.error('Error generating cashier activities:', error)
      return []
    }
  }
}
