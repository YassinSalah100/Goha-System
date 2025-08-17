// Monitoring API Service - Fixed for correct backend endpoints
import { 
  Order, 
  CancelledOrder, 
  StockItem, 
  OrderStats, 
  DetailedShiftSummary, 
  CashierActivity 
} from '@/lib/types/monitoring'
import { AuthApiService } from './auth-api'

// Price normalization utility
export function normalizePrice(price: string | number): number {
  if (typeof price === 'number') {
    return price
  }
  
  if (typeof price === 'string') {
    const cleaned = price.replace(/[^\d.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  
  return 0
}

// Format price for display
export function formatPrice(price: number | string): string {
  const normalized = normalizePrice(price)
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  }).format(normalized)
}

export class MonitoringApiService {
  // Fetch live orders - using correct endpoint structure
  static async fetchOrders(page: number = 1, limit: number = 100): Promise<Order[]> {
    try {
      // Try without pagination first, then with if that fails
      try {
        const data = await AuthApiService.apiRequest<any>(`/orders/except-cafe`)
        return data.data?.orders || data.data || []
      } catch (noPaginationError) {
        // If that fails, try with minimal pagination parameters
        const data = await AuthApiService.apiRequest<any>(`/orders/except-cafe?page=1&limit=10`)
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
        const statsData = await AuthApiService.apiRequest<any>('/orders/stats')
        
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
          const data = await AuthApiService.apiRequest<any>(endpoint)
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

  // Fetch shifts by status - Backend doesn't have status-based endpoints
  static async fetchShiftsByStatus(status: 'opened' | 'closed'): Promise<DetailedShiftSummary[]> {
    try {
      console.log(`Cannot fetch shifts by status: ${status} - endpoint not available`)
      console.log('Available endpoints: GET /:id (individual shift), PATCH /:id/type (update type)')
      return []
    } catch (error) {
      console.error(`Error fetching ${status} shifts:`, error)
      return []
    }
  }

  // Fetch shifts by date - Backend doesn't have bulk endpoints
  static async fetchShiftsByDate(date: string): Promise<DetailedShiftSummary[]> {
    try {
      console.log(`Cannot fetch shifts by date: ${date} - bulk endpoints not available`)
      console.log('Available endpoints: GET /:id (individual shift), PATCH /:id/type (update type)')
      return []
    } catch (error) {
      console.error('Error fetching shifts by date:', error)
      return []
    }
  }

  // Fetch detailed shift summaries - Backend doesn't have bulk endpoints
  static async fetchDetailedShiftSummaries(
    date?: string,
    shiftType?: string,
    status?: string
  ): Promise<DetailedShiftSummary[]> {
    try {
      console.log(`fetchDetailedShiftSummaries called with date: ${date}, type: ${shiftType}, status: ${status}`)
      console.log('Backend does not have bulk shift summary endpoints available')
      console.log('Available endpoints: GET /:id (individual shift), PATCH /:id/type (update type)')
      
      // Return empty array since the backend doesn't support listing all shifts
      // Individual shifts can only be fetched by ID using GET /:id
      return []
    } catch (error) {
      console.error('Error fetching detailed shift summaries:', error)
      return []
    }
  }

  // Fetch cashier activities - Backend doesn't have bulk shift endpoints
  static async fetchCashierActivities(): Promise<CashierActivity[]> {
    try {
      console.log('Backend does not have bulk shift endpoints for cashier activities')
      console.log('Available endpoints: GET /:id (individual shift), PATCH /:id/type (update type)')
      
      // Return empty array since we can't get bulk shift data
      return []
    } catch (error) {
      console.error('Error fetching cashier activities:', error)
      return []
    }
  }

  // Get shift summary with details by shiftId
  static async getShiftSummaryWithDetails(shiftId: string): Promise<any> {
    try {
      // Use the actual available endpoint GET /:id
      const data = await AuthApiService.apiRequest<any>(`/shifts/${shiftId}`)
      return data.data || data
    } catch (error) {
      console.error('Error fetching shift summary with details:', error)
      throw error
    }
  }

  // Delete shift by id
  static async deleteShift(shiftId: string): Promise<any> {
    try {
      const data = await AuthApiService.apiRequest<any>(`/shifts/${shiftId}`, { method: 'DELETE' })
      return data
    } catch (error) {
      console.error('Error deleting shift:', error)
      throw error
    }
  }

  // Helper method to filter shifts
  private static filterShifts(
    shifts: DetailedShiftSummary[], 
    shiftType?: string, 
    status?: string
  ): DetailedShiftSummary[] {
    console.log(`Filtering shifts - type: ${shiftType}, status: ${status}`)
    let filtered = shifts

    if (shiftType && shiftType !== 'all') {
      filtered = filtered.filter(shift => shift.type === shiftType)
      console.log(`After type filter: ${filtered.length} shifts`)
    }

    if (status && status !== 'all') {
      // Handle different status names - map 'active' to 'opened'
      // The backend only supports 'opened' and 'closed' status values
      if (status === 'active') {
        console.log('Mapping "active" status to "opened" for backend compatibility')
        filtered = filtered.filter(shift => shift.status === 'opened')
      } else {
        filtered = filtered.filter(shift => shift.status === status)
      }
      console.log(`After status filter: ${filtered.length} shifts`)
    }

    return filtered
  }
}
