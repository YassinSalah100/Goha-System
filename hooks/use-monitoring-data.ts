// Custom hook for monitoring data management
import { useState, useEffect, useCallback } from 'react'
import { 
  Order, 
  CancelledOrder, 
  StockItem, 
  OrderStats, 
  DetailedShiftSummary,
  CashierActivity,
  TodayStats,
  MonitoringFilters
} from '@/lib/types/monitoring'
import { MonitoringApiService } from '@/lib/services/monitoring-api'

export function useMonitoringData() {
  // State
  const [liveOrders, setLiveOrders] = useState<Order[]>([])
  const [cancelledOrders, setCancelledOrders] = useState<CancelledOrder[]>([])
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [shiftSummaries, setShiftSummaries] = useState<DetailedShiftSummary[]>([])
  const [cashierActivities, setCashierActivities] = useState<CashierActivity[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalOrders: 0,
    totalSales: 0,
    completedOrders: 0,
    pendingOrders: 0,
    activeCashiers: 0,
    ordersByType: {
      "dine-in": 0,
      takeaway: 0,
      delivery: 0,
      cafe: 0
    },
    salesByType: {
      "dine-in": 0,
      takeaway: 0,
      delivery: 0,
      cafe: 0
    }
  })

  // Loading states
  const [loading, setLoading] = useState({
    orders: false,
    stats: false,
    shifts: false,
    stock: false,
    cancelled: false,
    cashiers: false,
  })

  // Filters
  const [filters, setFilters] = useState<MonitoringFilters>({
    selectedDate: new Date().toISOString().split('T')[0],
    selectedShiftType: 'all',
    selectedShiftStatus: 'all',
  })

  const [error, setError] = useState<string | null>(null)

  // Calculate today stats from current data
  const calculateTodayStats = useCallback((orders: Order[], cashiers: CashierActivity[]) => {
    const today = new Date().toISOString().split('T')[0]
    const todayOrders = orders.filter(order => order.created_at.startsWith(today))
    
    // Initialize order type counters
    const ordersByType = {
      "dine-in": 0,
      takeaway: 0,
      delivery: 0,
      cafe: 0
    }
    
    const salesByType = {
      "dine-in": 0,
      takeaway: 0,
      delivery: 0,
      cafe: 0
    }
    
    // Count orders and sales by type
    todayOrders.forEach(order => {
      const orderType = order.order_type?.toLowerCase() || 'dine-in'
      const price = typeof order.total_price === 'string' 
        ? parseFloat(order.total_price) 
        : order.total_price || 0
      
      if (ordersByType[orderType as keyof typeof ordersByType] !== undefined) {
        ordersByType[orderType as keyof typeof ordersByType]++
        salesByType[orderType as keyof typeof salesByType] += price
      }
    })
    
    const stats: TodayStats = {
      totalOrders: todayOrders.length,
      totalSales: todayOrders.reduce((sum, order) => {
        const price = typeof order.total_price === 'string' 
          ? parseFloat(order.total_price) 
          : order.total_price
        return sum + (price || 0)
      }, 0),
      completedOrders: todayOrders.filter(order => order.status === 'completed').length,
      pendingOrders: todayOrders.filter(order => order.status === 'pending').length,
      activeCashiers: cashiers.filter(cashier => cashier.isActive).length,
      ordersByType,
      salesByType
    }
    
    setTodayStats(stats)
  }, [])

  // Fetch live orders
  const fetchLiveOrders = useCallback(async () => {
    setLoading(prev => ({ ...prev, orders: true }))
    try {
      const orders = await MonitoringApiService.fetchOrders()
      setLiveOrders(orders)
      setError(null)
    } catch (error) {
      console.error('Error fetching live orders:', error)
      setError('خطأ في تحميل الطلبات المباشرة')
    } finally {
      setLoading(prev => ({ ...prev, orders: false }))
    }
  }, [])

  // Fetch order statistics
  const fetchOrderStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }))
    try {
      const stats = await MonitoringApiService.fetchOrderStats()
      setOrderStats(stats)
      setError(null)
    } catch (error) {
      console.error('Error fetching order stats:', error)
      setError('خطأ في تحميل إحصائيات الطلبات')
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }, [])

  // Fetch cancelled orders
  const fetchCancelledOrders = useCallback(async () => {
    setLoading(prev => ({ ...prev, cancelled: true }))
    try {
      const cancelled = await MonitoringApiService.fetchCancelledOrders()
      setCancelledOrders(cancelled)
      setError(null)
    } catch (error) {
      console.error('Error fetching cancelled orders:', error)
      setError('خطأ في تحميل الطلبات الملغية')
    } finally {
      setLoading(prev => ({ ...prev, cancelled: false }))
    }
  }, [])

  // Fetch low stock items
  const fetchLowStockItems = useCallback(async () => {
    setLoading(prev => ({ ...prev, stock: true }))
    try {
      const stockItems = await MonitoringApiService.fetchLowStockItems()
      setLowStockItems(stockItems)
      setError(null)
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      setError('خطأ في تحميل المخزون المنخفض')
    } finally {
      setLoading(prev => ({ ...prev, stock: false }))
    }
  }, [])

  // Fetch shift summaries

  const fetchShiftSummaries = useCallback(async () => {
    setLoading(prev => ({ ...prev, shifts: true }))
    try {
      const shifts = await MonitoringApiService.fetchDetailedShiftSummaries(
        filters.selectedDate,
        filters.selectedShiftType,
        filters.selectedShiftStatus
      )
      setShiftSummaries(shifts)
      setError(null)
    } catch (error) {
      console.error('Error fetching shift summaries:', error)
      setError('خطأ في تحميل ملخصات الورديات')
    } finally {
      setLoading(prev => ({ ...prev, shifts: false }))
    }
  }, [filters])

  // Fetch details for a single shift
  const fetchShiftSummaryDetails = useCallback(async (shiftId: string) => {
    try {
      const details = await MonitoringApiService.getShiftSummaryWithDetails(shiftId)
      return details
    } catch (error) {
      setError('خطأ في تحميل تفاصيل الوردية')
      throw error
    }
  }, [])

  // Delete a shift
  const deleteShift = useCallback(async (shiftId: string) => {
    try {
      await MonitoringApiService.deleteShift(shiftId)
      // Refresh shift summaries after deletion
      await fetchShiftSummaries()
      setError(null)
    } catch (error) {
      setError('خطأ في حذف الوردية')
      throw error
    }
  }, [fetchShiftSummaries])

  // Fetch cashier activities
  const fetchCashierActivities = useCallback(async () => {
    setLoading(prev => ({ ...prev, cashiers: true }))
    try {
      const activities = await MonitoringApiService.fetchCashierActivities()
      setCashierActivities(activities)
      setError(null)
    } catch (error) {
      console.error('Error fetching cashier activities:', error)
      setError('خطأ في تحميل نشاط الكاشيرين')
    } finally {
      setLoading(prev => ({ ...prev, cashiers: false }))
    }
  }, [])

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchLiveOrders(),
      fetchOrderStats(),
      fetchCancelledOrders(),
      fetchLowStockItems(),
      fetchShiftSummaries(),
      fetchCashierActivities(),
    ])
  }, [
    fetchLiveOrders,
    fetchOrderStats,
    fetchCancelledOrders,
    fetchLowStockItems,
    fetchShiftSummaries,
    fetchCashierActivities,
  ])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MonitoringFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Effect to calculate today stats when data changes
  useEffect(() => {
    calculateTodayStats(liveOrders, cashierActivities)
  }, [liveOrders, cashierActivities, calculateTodayStats])

  // Effect to refresh shift summaries when filters change
  useEffect(() => {
    fetchShiftSummaries()
  }, [fetchShiftSummaries])

  // Initial data load and auto-refresh setup
  useEffect(() => {
    // Initial load
    refreshAllData()
    
    // Set up auto-refresh every 30 seconds for shift summaries to catch new shifts
    const autoRefreshInterval = setInterval(() => {
      console.log('Auto-refreshing shift summaries to catch new shifts...')
      fetchShiftSummaries()
      fetchCashierActivities()
    }, 30000) // 30 seconds
    
    return () => {
      clearInterval(autoRefreshInterval)
    }
  }, []) // Only run on mount

  return {
    // Data
    liveOrders,
    cancelledOrders,
    lowStockItems,
    orderStats,
    shiftSummaries,
    cashierActivities,
    todayStats,
    
    // Loading states
    loading,
    
    // Error state
    error,
    
    // Filters
    filters,
    updateFilters,
    
    // Actions
    refreshAllData,
    fetchLiveOrders,
    fetchOrderStats,
    fetchCancelledOrders,
    fetchLowStockItems,
    fetchShiftSummaries,
    fetchCashierActivities,
  fetchShiftSummaryDetails,
  deleteShift,
  }
}
