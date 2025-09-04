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
      // Fetch both regular orders and cafe orders to include everything
      let regularOrders: any[] = [];
      let cafeOrders: any[] = [];
      
      try {
        // Fetch regular orders
        const regularData = await AuthApiService.apiRequest<any>(`/orders/except-cafe`)
        regularOrders = regularData.data?.orders || regularData.data || []
        
        // Fetch cafe orders
        const cafeData = await AuthApiService.apiRequest<any>(`/orders/shift-cafe`)
        cafeOrders = cafeData.data?.orders || cafeData.data || []
      } catch (noPaginationError) {
        // If that fails, try with minimal pagination parameters
        try {
          const regularData = await AuthApiService.apiRequest<any>(`/orders/except-cafe?page=1&limit=100`)
          regularOrders = regularData.data?.orders || regularData.data || []
          
          const cafeData = await AuthApiService.apiRequest<any>(`/orders/shift-cafe/`)
          cafeOrders = cafeData.data?.orders || cafeData.data || []
        } catch (error) {
          console.error('Error fetching orders with pagination:', error)
        }
      }
      
      // Combine regular and cafe orders
      const combinedOrders = [...regularOrders, ...cafeOrders];
      
      // For cafe orders, ensure they have the correct order_type
      const processedOrders = combinedOrders.map(order => {
        // If this is from cafe endpoint and doesn't have order_type set to 'cafe', fix it
        if (cafeOrders.some(cafeOrder => cafeOrder.order_id === order.order_id) && 
            order.order_type !== 'cafe') {
          return { ...order, order_type: 'cafe' };
        }
        return order;
      });
      
      return processedOrders;
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

  // Fetch shifts by status - using the correct backend endpoint
  static async fetchShiftsByStatus(status: 'opened' | 'closed'): Promise<DetailedShiftSummary[]> {
    try {
      console.log(`Fetching shifts with status: ${status}`)
      
      // Use the correct endpoint that you specified: /shifts/status/:status
      const endpoint = `/shifts/status/${status}`
      console.log(`Using endpoint: ${endpoint}`)
      
      const data = await AuthApiService.apiRequest<any>(endpoint)
      console.log(`Raw data from ${endpoint}:`, data)
      
      // Handle the API response format
      let shifts = Array.isArray(data) ? data : (data.shifts || data.data || [])
      
      if (!Array.isArray(shifts)) {
        console.log('No shifts array found in response')
        return []
      }
      
      console.log(`Found ${shifts.length} shifts with status: ${status}`)
      
      return shifts.map((shift: any) => this.transformShiftToDetailedSummary(shift, status))
    } catch (error) {
      console.error(`Error fetching ${status} shifts:`, error)
      return []
    }
  }

  // Transform the API response format to DetailedShiftSummary
  static transformShiftToDetailedSummary(shift: any, fetchedStatus: string): DetailedShiftSummary {
    // Handle user data from the shift response
    let openedBy = null
    let closedBy = null
    
    // Try different ways to get the user who opened the shift
    if (shift.opened_by) {
      if (typeof shift.opened_by === 'object' && shift.opened_by !== null) {
        openedBy = {
          worker_id: shift.opened_by.id || shift.opened_by.user_id || shift.opened_by.worker_id,
          full_name: shift.opened_by.fullName || 
                    shift.opened_by.full_name || 
                    shift.opened_by.username || 
                    shift.opened_by.name ||
                    'غير محدد'
        }
      } else if (typeof shift.opened_by === 'string') {
        openedBy = {
          worker_id: shift.opened_by,
          full_name: `User ${shift.opened_by.slice(-6)}`
        }
      }
    } else if (shift.user) {
      // Sometimes the user info is in a 'user' field
      if (typeof shift.user === 'object' && shift.user !== null) {
        openedBy = {
          worker_id: shift.user.id || shift.user.user_id,
          full_name: shift.user.fullName || 
                    shift.user.full_name || 
                    shift.user.username || 
                    shift.user.name ||
                    'غير محدد'
        }
      }
    } else if (shift.cashier) {
      // Sometimes the cashier info is in a 'cashier' field
      if (typeof shift.cashier === 'object' && shift.cashier !== null) {
        openedBy = {
          worker_id: shift.cashier.id || shift.cashier.user_id,
          full_name: shift.cashier.fullName || 
                    shift.cashier.full_name || 
                    shift.cashier.username || 
                    shift.cashier.name ||
                    'غير محدد'
        }
      }
    }
    
    // Handle closed_by user data if shift is closed
    if (shift.closed_by) {
      if (typeof shift.closed_by === 'object' && shift.closed_by !== null) {
        closedBy = {
          worker_id: shift.closed_by.id || shift.closed_by.user_id || shift.closed_by.worker_id,
          full_name: shift.closed_by.fullName || 
                    shift.closed_by.full_name || 
                    shift.closed_by.username || 
                    shift.closed_by.name ||
                    'غير محدد'
        }
      } else if (typeof shift.closed_by === 'string') {
        closedBy = {
          worker_id: shift.closed_by,
          full_name: `User ${shift.closed_by.slice(-6)}`
        }
      }
    }
    
    // Determine actual shift status
    let actualStatus: 'opened' | 'closed' | 'REQUESTED_CLOSE' = fetchedStatus as any
    
    // Check various status indicators
    if (shift.status) {
      if (shift.status === 'closed' || shift.status === 'CLOSED') {
        actualStatus = 'closed'
      } else if (shift.status === 'opened' || shift.status === 'OPENED' || shift.status === 'active') {
        actualStatus = 'opened'
      }
    }
    
    // Also check is_closed boolean flag
    if (typeof shift.is_closed === 'boolean') {
      actualStatus = shift.is_closed ? 'closed' : 'opened'
    }
    
    // Check if end_time indicates a closed shift
    if (shift.end_time && shift.start_time && shift.end_time !== shift.start_time) {
      const startTime = new Date(shift.start_time).getTime()
      const endTime = new Date(shift.end_time).getTime()
      // If there's more than 1 minute difference, consider it closed
      if (Math.abs(endTime - startTime) > 60000) {
        actualStatus = 'closed'
      }
    }
    
    // Make sure we have values for cafe orders and revenue
    const cafeOrders = shift.total_cafe_orders || shift.orders_by_type?.cafe || 0;
    const cafeRevenue = shift.cafe_revenue || 0;
    
    return {
      shift_id: shift.shift_id || shift.id,
      type: shift.shift_type || shift.type || 'morning',
      status: actualStatus,
      start_time: shift.start_time || shift.created_at,
      end_time: actualStatus === 'closed' ? (shift.end_time || shift.closed_at) : null,
      opened_by: openedBy,
      closed_by: actualStatus === 'closed' ? closedBy : undefined,
      // Set default values for missing financial data - will be populated when detailed data is fetched
      total_orders: shift.total_orders || 0,
      total_sales: shift.total_sales || shift.total_revenue || 0,
      total_workers: shift.total_workers || (shift.shiftWorkers?.length) || 0,
      active_workers: shift.active_workers || (shift.shiftWorkers?.filter((w: any) => !w.end_time)?.length) || 0,
      total_expenses: shift.total_expenses || 0,
      expenses_count: shift.expenses_count || (shift.expenses?.length) || 0,
      total_staff_cost: shift.total_staff_cost || 0,
      orders_by_type: {
        "dine-in": shift.orders_by_type?.["dine-in"] || 0,
        takeaway: shift.orders_by_type?.takeaway || 0,
        delivery: shift.orders_by_type?.delivery || 0,
        cafe: cafeOrders
      },
      orders_by_status: {
        completed: shift.orders_by_status?.completed || shift.total_orders || 0,
        pending: shift.orders_by_status?.pending || 0,
        cancelled: shift.orders_by_status?.cancelled || 0
      },
      orders_by_payment: {
        cash: shift.orders_by_payment?.cash || shift.total_orders || 0,
        card: shift.orders_by_payment?.card || 0
      },
      average_order_value: (shift.total_orders && shift.total_orders > 0) 
        ? (shift.total_sales || shift.total_revenue || 0) / shift.total_orders 
        : 0,
      workers: shift.workers || shift.shiftWorkers || [],
      expenses_by_category: shift.expenses_by_category || {},
      expenses: shift.expenses || []
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

  // Fetch detailed shift summaries - Using the correct status endpoint
  static async fetchDetailedShiftSummaries(
    date?: string,
    shiftType?: string,
    status?: string
  ): Promise<DetailedShiftSummary[]> {
    try {
      console.log(`fetchDetailedShiftSummaries called with date: ${date}, type: ${shiftType}, status: ${status}`)
      
      // Get shifts by status using the correct backend endpoint
      let allShifts: DetailedShiftSummary[] = []
      
      if (status && status !== 'all' && status !== 'active') {
        // Fetch specific status
        const mappedStatus = status === 'active' ? 'opened' : status
        console.log(`Fetching shifts with specific status: ${mappedStatus}`)
        allShifts = await this.fetchShiftsByStatus(mappedStatus as 'opened' | 'closed')
      } else {
        // Fetch both opened and closed shifts to show ALL shifts
        console.log('Fetching ALL shifts (both opened and closed)')
        const [openedShifts, closedShifts] = await Promise.all([
          this.fetchShiftsByStatus('opened'),
          this.fetchShiftsByStatus('closed')
        ])
        allShifts = [...openedShifts, ...closedShifts]
      }
      
      console.log(`Found ${allShifts.length} shifts from status endpoints`)
      
      if (allShifts.length === 0) {
        console.log('No shifts found')
        return []
      }
      
      // For each shift, try to get more detailed information if available
      const enhancedShifts = await Promise.all(
        allShifts.map(async (shift) => {
          try {
            // Try to get detailed information for better data
            const details = await this.getShiftSummaryWithDetails(shift.shift_id)
            // Merge the detailed data with the basic shift data
            return this.mergeShiftWithDetails(shift, details)
          } catch (error) {
            console.log(`Could not fetch details for shift ${shift.shift_id}, using basic data:`, error.message)
            // Return the basic shift data if detailed fetch fails
            return shift
          }
        })
      )
      
      // Apply filters
      let filteredShifts = enhancedShifts
      
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
      
      // Sort shifts by start_time (newest first)
      filteredShifts.sort((a, b) => {
        const dateA = new Date(a.start_time || '').getTime()
        const dateB = new Date(b.start_time || '').getTime()
        return dateB - dateA // Newest first
      })
      
      console.log(`Returning ${filteredShifts.length} filtered shifts`)
      return filteredShifts
      
    } catch (error) {
      console.error('Error fetching detailed shift summaries:', error)
      return []
    }
  }

  // Helper method to merge basic shift data with detailed data
  private static mergeShiftWithDetails(basicShift: DetailedShiftSummary, detailedData: any): DetailedShiftSummary {
    // Make sure we have values for cafe orders and revenue
    const cafeOrders = detailedData.total_cafe_orders || detailedData.orders_by_type?.cafe || 0;
    const cafeRevenue = detailedData.cafe_revenue || 0;
    
    // Ensure we're adding cafe orders to the total if needed
    const totalOrders = Math.max(
      basicShift.total_orders,
      detailedData.total_orders || 0
    );
    
    // Ensure we're adding cafe revenue to the total
    const totalSales = Math.max(
      basicShift.total_sales,
      detailedData.total_revenue || 0
    );
    
    return {
      ...basicShift,
      // Update with detailed financial data if available
      total_orders: totalOrders,
      total_sales: totalSales,
      total_expenses: detailedData.total_expenses || basicShift.total_expenses,
      total_staff_cost: detailedData.total_salaries || basicShift.total_staff_cost,
      workers: detailedData.workers || basicShift.workers,
      expenses: detailedData.expenses || basicShift.expenses,
      // Keep the user info from basic shift (which should have correct names)
      opened_by: basicShift.opened_by,
      closed_by: basicShift.closed_by,
      // Make sure cafe orders are included
      orders_by_type: {
        ...basicShift.orders_by_type,
        cafe: Math.max(basicShift.orders_by_type.cafe, cafeOrders)
      }
    }
  }

  // Transform API response to match our interface (kept for compatibility)
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

  // Fetch cashier activities - using the correct status endpoint
  static async fetchCashierActivities(): Promise<CashierActivity[]> {
    try {
      console.log('Fetching cashier activities from shift data')
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch both opened and closed shifts using the correct endpoint
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
      const shiftData = await AuthApiService.apiRequest<any>(`/shifts/summary/${shiftId}/details`)
      
      // Also fetch cafe orders specifically for this shift to include in the counts
      try {
        const cafeOrdersData = await AuthApiService.apiRequest<any>(`/orders/shift-cafe/${shiftId}`)
        const cafeOrders = cafeOrdersData.data || [];
        
        // If we got cafe orders, update the shift data to include them
        if (Array.isArray(cafeOrders) && cafeOrders.length > 0) {
          // Calculate cafe total revenue
          const cafeRevenue = cafeOrders.reduce((sum: number, order: any) => {
            const orderTotal = typeof order.total_price === 'string' 
              ? parseFloat(order.total_price) 
              : (order.total_price || 0);
            return sum + orderTotal;
          }, 0);
          
          // Update the shift data
          return {
            ...shiftData,
            total_cafe_orders: cafeOrders.length,
            cafe_revenue: cafeRevenue,
            // Add cafe orders to order types
            orders_by_type: {
              ...(shiftData.orders_by_type || {}),
              cafe: cafeOrders.length
            },
            // Ensure the total orders includes cafe orders
            total_orders: (shiftData.total_orders || 0) + cafeOrders.length,
            // Update total revenue to include cafe revenue
            total_revenue: (shiftData.total_revenue || 0) + cafeRevenue
          };
        }
      } catch (error) {
        console.error('Error fetching cafe orders for shift:', error);
        // Continue with the original shift data if cafe orders fetch fails
      }
      
      return shiftData;
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