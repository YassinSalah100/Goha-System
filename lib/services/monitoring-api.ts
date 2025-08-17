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

  // Fetch shifts by status - using the correct available endpoint
  static async fetchShiftsByStatus(status: 'opened' | 'closed'): Promise<DetailedShiftSummary[]> {
    try {
      console.log(`Fetching shifts with status: ${status}`)
      const data = await AuthApiService.apiRequest<any>(`/shifts/status/${status}`)
      return data.shifts || data.data || data || []
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

  // Fetch detailed shift summaries - Now working with status endpoint
  static async fetchDetailedShiftSummaries(
    date?: string,
    shiftType?: string,
    status?: string
  ): Promise<DetailedShiftSummary[]> {
    try {
      console.log(`fetchDetailedShiftSummaries called with date: ${date}, type: ${shiftType}, status: ${status}`)
      
      // Get shifts by status using the available endpoint
      let allShifts: Array<{shift: any, fetchedStatus: string}> = []
      
      if (status && status !== 'all') {
        // Map 'active' to 'opened' for backend compatibility
        const mappedStatus = status === 'active' ? 'opened' : status
        console.log(`Fetching shifts with status: ${mappedStatus}`)
        const shifts = await this.fetchShiftsByStatus(mappedStatus as 'opened' | 'closed')
        allShifts = shifts.map(shift => ({ shift, fetchedStatus: mappedStatus }))
      } else {
        // Fetch both opened and closed shifts
        console.log('Fetching both opened and closed shifts')
        const [openedShifts, closedShifts] = await Promise.all([
          this.fetchShiftsByStatus('opened'),
          this.fetchShiftsByStatus('closed')
        ])
        allShifts = [
          ...openedShifts.map(shift => ({ shift, fetchedStatus: 'opened' })),
          ...closedShifts.map(shift => ({ shift, fetchedStatus: 'closed' }))
        ]
      }
      
      console.log(`Found ${allShifts.length} shifts from status endpoints`)
      
      if (allShifts.length === 0) {
        console.log('No shifts found')
        return []
      }
      
      // Extract shift IDs and fetch detailed information for each shift
      console.log(`Fetching details for ${allShifts.length} shifts`)
      
      const shiftDetailsPromises = allShifts.map(async ({ shift, fetchedStatus }) => {
        try {
          const details = await this.getShiftSummaryWithDetails(shift.shift_id)
          // Transform the data with the correct status
          return this.transformShiftData(details, fetchedStatus)
        } catch (error) {
          console.error(`Failed to fetch details for shift ${shift.shift_id}:`, error)
          return null
        }
      })
      
      const allShiftDetails = await Promise.all(shiftDetailsPromises)
      const validShifts = allShiftDetails.filter(shift => shift !== null) as DetailedShiftSummary[]
      
      // Apply filters
      let filteredShifts = validShifts
      
      // Filter by date
      if (date && date !== 'all') {
        filteredShifts = filteredShifts.filter(shift => 
          shift.start_time && shift.start_time.startsWith(date)
        )
      }
      
      // Filter by shift type
      if (shiftType && shiftType !== 'all') {
        filteredShifts = filteredShifts.filter(shift => shift.type === shiftType)
      }
      
      console.log(`Returning ${filteredShifts.length} filtered shifts`)
      return filteredShifts
      
    } catch (error) {
      console.error('Error fetching detailed shift summaries:', error)
      return []
    }
  }

  // Transform API response to match our interface
  private static transformShiftData(apiData: any, actualStatus?: string): DetailedShiftSummary {
    // Determine the correct status
    let shiftStatus: 'opened' | 'closed' | 'REQUESTED_CLOSE' = 'opened'
    
    if (actualStatus) {
      // Use the status from the endpoint we fetched from
      shiftStatus = actualStatus as 'opened' | 'closed' | 'REQUESTED_CLOSE'
    } else {
      // Fallback: check if end_time is significantly different from start_time
      // If they're the same or very close, it's likely still opened
      const startTime = new Date(apiData.start_time)
      const endTime = new Date(apiData.end_time)
      const timeDiff = Math.abs(endTime.getTime() - startTime.getTime())
      
      // If the time difference is less than 1 minute, consider it still opened
      shiftStatus = timeDiff > 60000 ? 'closed' : 'opened'
    }
    
    return {
      shift_id: apiData.shift_id,
      type: apiData.shift_type === 'morning' ? 'morning' : 'night',
      status: shiftStatus,
      start_time: apiData.start_time,
      end_time: shiftStatus === 'closed' ? apiData.end_time : null,
      opened_by: {
        worker_id: apiData.cashiers?.[0]?.user_id || '',
        full_name: apiData.cashiers?.[0]?.username || 'غير محدد'
      },
      closed_by: shiftStatus === 'closed' ? {
        worker_id: apiData.cashiers?.[0]?.user_id || '',
        full_name: apiData.cashiers?.[0]?.username || 'غير محدد'
      } : undefined,
      // Orders summary
      total_orders: apiData.total_orders || 0,
      total_sales: apiData.total_revenue || 0,
      orders_by_type: {
        "dine-in": Math.max(0, (apiData.total_orders || 0) - (apiData.total_cafe_orders || 0)),
        takeaway: 0, // Not provided in API
        delivery: 0, // Not provided in API
        cafe: apiData.total_cafe_orders || 0
      },
      orders_by_status: {
        pending: 0, // Not provided in API
        completed: apiData.total_orders || 0, // Assuming all orders are completed
        cancelled: 0 // Not provided in API
      },
      orders_by_payment: {
        cash: apiData.total_orders || 0, // Assuming all cash for now
        card: 0 // Not provided in API
      },
      average_order_value: (apiData.total_orders && apiData.total_orders > 0) 
        ? (apiData.total_revenue || 0) / apiData.total_orders 
        : 0,
      // Workers summary
      total_workers: apiData.workers?.length || 0,
      active_workers: apiData.workers?.filter((w: any) => w.is_active)?.length || 0,
      total_staff_cost: apiData.total_salaries || 0,
      workers: apiData.workers || [],
      // Expenses summary
      total_expenses: apiData.total_expenses || 0,
      expenses_count: apiData.expenses?.length || 0,
      expenses_by_category: {}, // Not provided in detail
      expenses: apiData.expenses || [],
      // Cashiers summary
      cashiers: apiData.cashiers || []
    }
  }

  // Fetch cashier activities - now using status endpoint
  static async fetchCashierActivities(): Promise<CashierActivity[]> {
    try {
      console.log('Fetching cashier activities from shift data')
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch both opened and closed shifts
      const [openedShifts, closedShifts] = await Promise.all([
        this.fetchShiftsByStatus('opened'),
        this.fetchShiftsByStatus('closed')
      ])
      
      // Create array with status tracking
      const shiftsWithStatus = [
        ...openedShifts.map(shift => ({ shift, status: 'opened' })),
        ...closedShifts.map(shift => ({ shift, status: 'closed' }))
      ]
      
      // Filter for today's shifts
      const todayShifts = shiftsWithStatus.filter(({ shift }) => 
        shift.start_time && shift.start_time.startsWith(today)
      )
      
      console.log(`Found ${todayShifts.length} shifts for today`)
      
      if (todayShifts.length === 0) {
        return []
      }
      
      // Get detailed information for each shift to extract cashier data
      const shiftDetailsPromises = todayShifts.map(async ({ shift, status: shiftStatus }) => {
        try {
          const details = await this.getShiftSummaryWithDetails(shift.shift_id)
          return { details, status: shiftStatus }
        } catch (error) {
          console.error(`Failed to get details for shift ${shift.shift_id}:`, error)
          return null
        }
      })
      
      const allShiftDetails = await Promise.all(shiftDetailsPromises)
      const validShiftDetails = allShiftDetails.filter(item => item !== null)
      
      // Extract cashier activities from shift details
      const cashierMap = new Map<string, CashierActivity>()
      
      validShiftDetails.forEach(({ details: shiftDetail, status: shiftStatus }) => {
        if (shiftDetail.cashiers && Array.isArray(shiftDetail.cashiers)) {
          shiftDetail.cashiers.forEach((cashier: any) => {
            const cashierId = cashier.user_id || cashier.id
            const cashierName = cashier.username || cashier.full_name || 'غير محدد'
            
            if (cashierId) {
              if (!cashierMap.has(cashierId)) {
                cashierMap.set(cashierId, {
                  cashierName,
                  cashierId,
                  ordersToday: shiftDetail.total_orders || 0,
                  totalSales: shiftDetail.total_revenue || 0,
                  lastOrderTime: shiftDetail.start_time || '',
                  isActive: shiftStatus === 'opened', // Active if shift status is opened
                  orderTypes: {
                    "dine-in": Math.max(0, (shiftDetail.total_orders || 0) - (shiftDetail.total_cafe_orders || 0)),
                    takeaway: 0,
                    delivery: 0,
                    cafe: shiftDetail.total_cafe_orders || 0,
                  },
                  salesByType: {
                    "dine-in": Math.max(0, (shiftDetail.total_revenue || 0) - (shiftDetail.cafe_revenue || 0)),
                    takeaway: 0,
                    delivery: 0,
                    cafe: shiftDetail.cafe_revenue || 0,
                  },
                })
              } else {
                // Aggregate data if cashier appears in multiple shifts
                const activity = cashierMap.get(cashierId)!
                activity.ordersToday += shiftDetail.total_orders || 0
                activity.totalSales += shiftDetail.total_revenue || 0
                activity.orderTypes.cafe += shiftDetail.total_cafe_orders || 0
                activity.orderTypes["dine-in"] += Math.max(0, (shiftDetail.total_orders || 0) - (shiftDetail.total_cafe_orders || 0))
                activity.salesByType.cafe += shiftDetail.cafe_revenue || 0
                activity.salesByType["dine-in"] += Math.max(0, (shiftDetail.total_revenue || 0) - (shiftDetail.cafe_revenue || 0))
                
                // Update activity status - active if any shift is opened
                if (shiftStatus === 'opened') {
                  activity.isActive = true
                }
              }
            }
          })
        }
      })
      
      const activities = Array.from(cashierMap.values())
      console.log(`Generated ${activities.length} cashier activities`)
      
      return activities.sort((a, b) => {
        // Sort by: active first, then by order count, then by name
        if (a.isActive && !b.isActive) return -1
        if (!a.isActive && b.isActive) return 1
        if (a.ordersToday !== b.ordersToday) return b.ordersToday - a.ordersToday
        return a.cashierName.localeCompare(b.cashierName)
      })
      
    } catch (error) {
      console.error('Error fetching cashier activities:', error)
      return []
    }
  }

  // Get shift summary with details by shiftId
  static async getShiftSummaryWithDetails(shiftId: string): Promise<any> {
    try {
      // Use the correct endpoint that you confirmed works
      const data = await AuthApiService.apiRequest<any>(`/shifts/summary/${shiftId}/details`)
      return data
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
