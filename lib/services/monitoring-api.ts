// Monitoring API Service
import { 
  Order, 
  CancelledOrder, 
  StockItem, 
  OrderStats, 
  DetailedShiftSummary,
  CashierActivity,
  CashierDto
} from '@/lib/types/monitoring'
import { AuthApiService } from './auth-api'

const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

// Utility function for API calls with error handling and authentication
const apiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  try {
    const authHeaders = AuthApiService.createAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      // Handle auth errors
      if (response.status === 401) {
        AuthApiService.clearAuthData()
        throw new Error('Unauthorized - please login again')
      }
      
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

  // Fetch low stock items - use correct endpoint or return empty array
  static async fetchLowStockItems(): Promise<StockItem[]> {
    try {
      // Try different possible endpoints for stock/inventory
      const possibleEndpoints = [
        '/stock-items/low-stock',
        '/inventory/low-stock', 
        '/stock/low-stock',
        '/stock-items',
        '/inventory',
        '/stock'
      ]

      for (const endpoint of possibleEndpoints) {
        try {
          const data = await apiRequest<any>(endpoint)
          if (data && (data.success || Array.isArray(data))) {
            const items = data.data || data
            if (Array.isArray(items)) {
              return items.filter(item => item.quantity <= (item.min_quantity || 10))
            }
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} not available`)
          continue
        }
      }

      console.log('No stock endpoints available, returning empty array')
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
      const possibleEndpoints = [
        '/shifts/summaries/all',
        '/shifts/summary',
        '/shifts/summaries',
        '/shifts'
      ]

      let allShifts: DetailedShiftSummary[] = []

      // Try each endpoint until we find one that works
      for (const endpoint of possibleEndpoints) {
        try {
          const data = await apiRequest<any>(endpoint)
          if (data && (data.success || Array.isArray(data))) {
            allShifts = data.data || data
            if (Array.isArray(allShifts) && allShifts.length > 0) {
              console.log(`Successfully fetched ${allShifts.length} shifts from ${endpoint}`)
              break
            }
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} not available, trying next...`)
          continue
        }
      }

      // If no summary endpoints work, try combining opened and closed shifts
      if (allShifts.length === 0) {
        try {
          const [openedShifts, closedShifts] = await Promise.all([
            this.fetchShiftsByStatus('opened'),
            this.fetchShiftsByStatus('closed')
          ])
          allShifts = [...openedShifts, ...closedShifts]
        } catch (error) {
          console.log('Failed to fetch shifts by status as well')
        }
      }

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

  // Generate cashier activities from shift summaries instead of orders
  static async fetchCashierActivities(): Promise<CashierActivity[]> {
    try {
      // Try to get shift summaries which should contain cashier information
      const today = new Date().toISOString().split('T')[0]
      let shiftsWithCashiers: DetailedShiftSummary[] = []

      // Get regular shifts since summary endpoints are failing
      const [openedShifts, closedShifts] = await Promise.all([
        this.fetchShiftsByStatus('opened'),
        this.fetchShiftsByStatus('closed')
      ])
      
      const todayShifts = [...openedShifts, ...closedShifts].filter(shift => 
        shift.start_time?.startsWith(today)
      )

      // For each shift, try to get its summary which should contain cashier info
      const shiftSummariesPromises = todayShifts.map(async (shift) => {
        try {
          const summaryData = await apiRequest<any>(`/shifts/summary/${shift.shift_id}`)
          return summaryData
        } catch (error) {
          return shift // fallback to original shift data
        }
      })

      shiftsWithCashiers = await Promise.all(shiftSummariesPromises)

      // Also get orders to calculate order statistics per cashier
      const orders = await this.fetchOrders()
      const todayOrders = orders.filter(order => 
        order.created_at?.startsWith(today)
      )

      const cashierMap = new Map<string, CashierActivity>()

      // First, extract cashiers from orders (most reliable source for cashier names)
      todayOrders.forEach(order => {
        // Handle clean architecture response structure
        const cashierId = order.cashier?.id || order.cashier?.user_id
        const cashierName = order.cashier?.fullName || order.cashier?.username || order.cashier?.full_name || 'غير محدد'
        const orderPrice = normalizePrice(order.total_price)
        
        if (cashierId) {
          if (!cashierMap.has(cashierId)) {
            cashierMap.set(cashierId, {
              cashierName,
              cashierId,
              ordersToday: 1,
              totalSales: orderPrice,
              lastOrderTime: order.created_at || '',
              isActive: false,
              orderTypes: {
                "dine-in": 0,
                takeaway: 0,
                delivery: 0,
                cafe: 0,
              },
              salesByType: {
                "dine-in": 0,
                takeaway: 0,
                delivery: 0,
                cafe: 0,
              },
            })
          } else {
            const activity = cashierMap.get(cashierId)!
            activity.ordersToday++
            activity.totalSales += orderPrice
            
            if (order.created_at && order.created_at > activity.lastOrderTime) {
              activity.lastOrderTime = order.created_at
            }
          }

          // Count order types and track sales by type
          const activity = cashierMap.get(cashierId)!
          if (order.order_type in activity.orderTypes) {
            activity.orderTypes[order.order_type as keyof typeof activity.orderTypes]++
            activity.salesByType[order.order_type as keyof typeof activity.salesByType] += orderPrice
          }
        }
      })

      // Then, update activity status based on shift information
      shiftsWithCashiers.forEach(shift => {        
        // If shift has cashiers array (from summary), use it
        if (shift.cashiers && Array.isArray(shift.cashiers)) {
          shift.cashiers.forEach(cashier => {            
            // Handle clean architecture structure - cashier.id vs user_id
            const cashierIdFromShift = cashier.user_id || cashier.id
            if (cashierIdFromShift && cashierMap.has(cashierIdFromShift)) {
              const activity = cashierMap.get(cashierIdFromShift)!
              activity.isActive = shift.status === 'opened'
              // Use the username from shift if available and different
              if (cashier.username && cashier.username !== 'غير محدد') {
                activity.cashierName = cashier.username
              }
            } else if (cashierIdFromShift) {
              // Add cashier from shift data if not found in orders
              const newActivity = {
                cashierName: cashier.username || 'غير محدد',
                cashierId: cashierIdFromShift,
                ordersToday: 0,
                totalSales: 0,
                lastOrderTime: shift.start_time || '',
                isActive: shift.status === 'opened',
                orderTypes: {
                  "dine-in": 0,
                  takeaway: 0,
                  delivery: 0,
                  cafe: 0,
                },
                salesByType: {
                  "dine-in": 0,
                  takeaway: 0,
                  delivery: 0,
                  cafe: 0,
                },
              }
              cashierMap.set(cashierIdFromShift, newActivity)
            }
          })
        } else {
          // If no cashiers array, try to match by shift and mark as active
          // This is less reliable but better than nothing
          cashierMap.forEach((activity, cashierId) => {
            if (shift.status === 'opened') {
              activity.isActive = true
            }
          })
        }
      })

      // Update activity status based on recent orders (last 2 hours)
      cashierMap.forEach((activity) => {
        const lastOrderTime = new Date(activity.lastOrderTime)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
        if (lastOrderTime > twoHoursAgo) {
          activity.isActive = true
        }
      })

      const activities = Array.from(cashierMap.values())

      return activities
    } catch (error) {
      console.error('Error generating cashier activities:', error)
      return []
    }
  }
}
