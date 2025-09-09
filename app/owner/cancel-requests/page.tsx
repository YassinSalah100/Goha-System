"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Loader2, 
  User, 
  Phone, 
  Calendar, 
  Package,
  AlertCircle,
  ShoppingCart,
  FileText,
  ShoppingBag
} from "lucide-react"
import { AuthApiService } from "@/lib/services/auth-api"
import { OrderStatus, CancelRequestStatus } from "@/lib/types/enums"

interface CancelRequest {
  cancelled_order_id: string
  request_id?: string // Some backend versions may use different field names
  order: {
    order_id: string
    customer_name?: string
    customer_phone?: string
    order_type: string
    total_price: number
    created_at: string
    table_number?: string
    status: OrderStatus
  }
  cancelled_by: {
    user_id: string
    username?: string
    full_name?: string
  }
  // Add approval and rejection details
  approved_by?: {
    user_id: string
    full_name?: string
  }
  approved_at?: string
  rejected_at?: string
  rejected_by?: {
    user_id: string
    full_name?: string
  }
  rejection_reason?: string
  
  reason: string
  cancelled_at: string
  status: CancelRequestStatus
  order_items?: Array<{
    order_item_id: string
    product_size?: {
      product_name: string
      size_name?: string
      price: number
    }
    quantity: number
    unit_price: number
    extras?: Array<{
      name: string
      price: number
    }>
  }>
  // Track if we've already processed this request to avoid duplicates
  processed?: boolean
  // Flag to identify duplicate order IDs
  isDuplicate?: boolean
}

export default function CancelRequestsPage() {
  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  const [pendingCount, setPendingCount] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)
  const [rejectedCount, setRejectedCount] = useState(0)

  useEffect(() => {
    fetchCancelRequests()
  }, [])

  const fetchCancelRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🔍 Fetching cancelled orders...")
      
      // Fetch all cancelled orders
      const result = await AuthApiService.apiRequest<any>(`/cancelled-orders?page=1&limit=100`)
      
      if (result.success && result.data) {
        const allRequests = result.data.cancelled_orders || result.data || []
        
        // Group requests by order_id to identify duplicates
        const orderMap = new Map<string, CancelRequest[]>()
        
        // Fetch order details for each request
        const requestsWithDetails = await Promise.all(
          allRequests.map(async (req: any) => {
            try {
              // Fetch basic order details
              const orderResult = await AuthApiService.apiRequest<any>(`/orders/${req.order.order_id}`)
              
              let orderData = req.order
              let orderItems: any[] = []
              
              if (orderResult.success && orderResult.data) {
                orderData = orderResult.data.order || orderResult.data
                
                // Fetch order items
                try {
                  const itemsResult = await AuthApiService.apiRequest<any>(`/order-items/order/${req.order.order_id}`)
                  if (itemsResult.success && itemsResult.data) {
                    orderItems = Array.isArray(itemsResult.data) ? itemsResult.data : []
                  }
                } catch (itemsError) {
                  console.warn(`Failed to fetch items for order ${req.order.order_id}`)
                }
              }
              
              // Try to get the cashier info more reliably
              let cashierId = req.cancelled_by?.id || req.cancelled_by?.user_id || req.cancelled_by
              let cashierName = ''
              let cashierUsername = ''
              
              // If cancelled_by is an object with full_name or fullName
              if (typeof req.cancelled_by === 'object') {
                cashierName = req.cancelled_by.fullName || req.cancelled_by.full_name || req.cancelled_by.name || ''
                cashierUsername = req.cancelled_by.username || ''
              }
              
              // If no cashier name was found, try to get from order data
              if (!cashierName && orderData.cashier) {
                cashierName = orderData.cashier.full_name || orderData.cashier.name || ''
                cashierUsername = orderData.cashier.username || ''
              }
              
              const cancelRequest: CancelRequest = {
                cancelled_order_id: req.cancelled_order_id,
                order: {
                  order_id: orderData.order_id,
                  customer_name: orderData.customer_name || 'عميل غير محدد',
                  customer_phone: orderData.customer_phone || orderData.phone_number,
                  order_type: orderData.order_type,
                  total_price: Number(orderData.total_price || 0),
                  created_at: orderData.created_at,
                  table_number: orderData.table_number,
                  status: orderData.status as OrderStatus
                },
                cancelled_by: {
                  user_id: cashierId,
                  username: cashierUsername,
                  full_name: cashierName || 'كاشير غير محدد'
                },
                reason: req.reason || 'لا يوجد سبب محدد',
                cancelled_at: req.cancelled_at,
                status: (req.status || 'pending') as CancelRequestStatus,
                processed: false, // Initialize as not processed
                order_items: orderItems.map((item: any) => ({
                  order_item_id: item.order_item_id,
                  product_size: {
                    product_name: item.product_size?.product_name || 'منتج غير محدد',
                    size_name: item.product_size?.size_name || 'عادي',
                    price: Number(item.product_size?.price || item.unit_price || 0)
                  },
                  quantity: item.quantity || 1,
                  unit_price: Number(item.unit_price || 0),
                  extras: item.extras?.map((extra: any) => ({
                    name: extra.name || extra.extra_name,
                    price: Number(extra.price || 0)
                  })) || []
                }))
              }
              
              // Add to the order map to identify duplicates later
              const orderId = orderData.order_id
              if (!orderMap.has(orderId)) {
                orderMap.set(orderId, [])
              }
              orderMap.get(orderId)?.push(cancelRequest)
              
              return cancelRequest
            } catch (error) {
              console.warn(`Failed to fetch details for request ${req.cancelled_order_id}:`, error)
              return null
            }
          })
        )
        
        // Filter out failed requests
        const validRequests = requestsWithDetails.filter(req => req !== null) as CancelRequest[]
        
        // Mark duplicate orders (same order_id)
        validRequests.forEach(request => {
          const orderId = request.order.order_id
          const requestsForOrder = orderMap.get(orderId) || []
          
          // If there's more than one request for this order_id, mark as duplicate
          if (requestsForOrder.length > 1) {
            // Mark non-pending requests first
            const nonPendingRequests = requestsForOrder.filter(r => r.status !== CancelRequestStatus.PENDING)
            
            if (nonPendingRequests.length > 0) {
              // If there are non-pending requests, only keep the most recent one
              // Sort by cancelled_at date (newest first)
              const sortedNonPending = [...nonPendingRequests].sort((a, b) => 
                new Date(b.cancelled_at).getTime() - new Date(a.cancelled_at).getTime()
              )
              
              // The first one is not a duplicate, all others are
              sortedNonPending.forEach((req, index) => {
                if (req.cancelled_order_id === request.cancelled_order_id) {
                  request.isDuplicate = index > 0
                }
              })
            } else {
              // If all are pending, mark all but the newest as duplicates
              const sortedPending = [...requestsForOrder].sort((a, b) => 
                new Date(b.cancelled_at).getTime() - new Date(a.cancelled_at).getTime()
              )
              
              sortedPending.forEach((req, index) => {
                if (req.cancelled_order_id === request.cancelled_order_id) {
                  request.isDuplicate = index > 0
                }
              })
            }
          }
        })
        
        // Filter out duplicates for the displayed list and
        // explicitly filter out any requests for orders that already have approved requests
        const approvedOrderIds = new Set(
          validRequests
            .filter(req => {
              const status = String(req.status).toLowerCase();
              return status === 'approved' || status === 'cancelled' || status === 'cancelled_approved';
            })
            .map(req => req.order.order_id)
        );
        
        // For each approved order, mark all other requests for that order as duplicates
        validRequests.forEach(req => {
          if (approvedOrderIds.has(req.order.order_id) && 
              String(req.status).toLowerCase() !== 'approved' && 
              String(req.status).toLowerCase() !== 'cancelled' && 
              String(req.status).toLowerCase() !== 'cancelled_approved') {
            req.isDuplicate = true;
            req.processed = true;
          }
        });
        
        const filteredRequests = validRequests.filter(req => !req.isDuplicate)
        
        // Remove duplicates more aggressively - group by order_id and keep only one instance
        // If there's both an approved and a pending, keep only the approved
        const orderGroups = new Map<string, CancelRequest[]>();
        
        filteredRequests.forEach(req => {
          const orderId = req.order.order_id;
          if (!orderGroups.has(orderId)) {
            orderGroups.set(orderId, []);
          }
          orderGroups.get(orderId)?.push(req);
        });
        
        // For each order group, prioritize approved/rejected over pending
        const finalRequests: CancelRequest[] = [];
        
        orderGroups.forEach((requests, orderId) => {
          // Sort by status - approved first, then rejected, then pending
          requests.sort((a, b) => {
            const getStatusValue = (status: CancelRequestStatus | string) => {
              const statusStr = String(status).toLowerCase();
              if (statusStr === 'approved' || statusStr === 'cancelled' || statusStr === 'cancelled_approved') return 0;
              if (statusStr === 'rejected') return 1;
              return 2; // pending
            };
            
            return getStatusValue(a.status) - getStatusValue(b.status);
          });
          
          // Take the first one only (which is the approved/rejected if any)
          if (requests.length > 0) {
            finalRequests.push(requests[0]);
          }
        });
        
        // Sort by status for display - pending first, then approved, then rejected
        const sortedRequests = [...finalRequests].sort((a, b) => {
          const getStatusPriority = (status: CancelRequestStatus) => {
            if (status === CancelRequestStatus.PENDING) return 0
            if (status === CancelRequestStatus.APPROVED) return 1
            return 2 // REJECTED
          }
          return getStatusPriority(a.status) - getStatusPriority(b.status)
        })
        
        setCancelRequests(sortedRequests)
        
        // Calculate counts more accurately by checking string values
        const pendingCount = filteredRequests.filter(req => 
          req.status === CancelRequestStatus.PENDING || 
          String(req.status).toLowerCase() === 'pending'
        ).length;
        
        const approvedCount = filteredRequests.filter(req => 
          req.status === CancelRequestStatus.APPROVED || 
          String(req.status).toLowerCase() === 'approved' ||
          String(req.status).toLowerCase() === 'cancelled' ||  // Also count cancelled as approved
          String(req.status).toLowerCase() === 'cancelled_approved'
        ).length;
        
        const rejectedCount = filteredRequests.filter(req => 
          req.status === CancelRequestStatus.REJECTED ||
          String(req.status).toLowerCase() === 'rejected'
        ).length;
        
        // Update the counts
        setPendingCount(pendingCount)
        setApprovedCount(approvedCount)
        setRejectedCount(rejectedCount)
        
        console.log(`✅ Loaded ${filteredRequests.length} cancel requests (${pendingCount} pending, ${approvedCount} approved, ${rejectedCount} rejected)`)
        console.log(`ℹ️ Filtered out ${validRequests.length - filteredRequests.length} duplicate requests`)
      }
      
    } catch (error: any) {
      console.error("❌ Error fetching cancel requests:", error)
      setError(error.message || 'فشل في تحميل طلبات الإلغاء')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: CancelRequest) => {
    try {
      // If this request has already been processed, avoid duplicate processing
      if (request.processed) {
        console.warn("⚠️ This request has already been processed, skipping...")
        return
      }
      
      setProcessingId(request.cancelled_order_id)
      
      // Get current user
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const approvedBy = currentUser?.user_id || currentUser?.worker_id
      
      console.log(`✅ Approving cancel request: ${request.cancelled_order_id}`)
      
      // Approve the cancellation request
      const result = await AuthApiService.apiRequest<any>(
        `/cancelled-orders/${request.cancelled_order_id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({
            approved_by: approvedBy
          })
        }
      )
      
      if (result.success) {
        // Mark this request as processed to prevent duplicate actions
        const updatedRequest = {
          ...request,
          status: CancelRequestStatus.APPROVED,
          processed: true,
          approved_at: new Date().toISOString(),
          approved_by: {
            user_id: approvedBy,
            full_name: currentUser?.full_name || currentUser?.name || 'مدير'
          }
        }
        
        // Update local state
        setCancelRequests(prev => prev.map(req => 
          req.cancelled_order_id === request.cancelled_order_id 
            ? updatedRequest
            : req
        ))
        
        // Update counts immediately in the UI
        setPendingCount(prev => Math.max(0, prev - 1))
        setApprovedCount(prev => prev + 1)
        
        // Completely remove any duplicate requests for this order from the UI
        // We'll only keep the approved one
        const orderId = request.order.order_id;
        
        setCancelRequests(prev => {
          // Find all requests with this order ID
          const requestsForOrder = prev.filter(req => req.order.order_id === orderId);
          
          // If there's just one, update it normally
          if (requestsForOrder.length <= 1) {
            return prev.map(req => 
              req.cancelled_order_id === request.cancelled_order_id
                ? { ...req, status: CancelRequestStatus.APPROVED, processed: true }
                : req
            );
          }
          
          // If there are multiple, keep only the one we just approved and filter out others
          return prev
            .filter(req => req.order.order_id !== orderId || req.cancelled_order_id === request.cancelled_order_id)
            .map(req => 
              req.cancelled_order_id === request.cancelled_order_id
                ? { ...req, status: CancelRequestStatus.APPROVED, processed: true }
                : req
            );
        })
        
        console.log(`✅ Cancel request approved successfully`)
        
        // Show success message
        alert(`✅ تمت الموافقة على طلب الإلغاء بنجاح! تم إلغاء الطلب #${request.order.order_id.slice(-6)}.`)
        
        // Dispatch event to notify cashier page about approval
        const orderCancellationEvent = new CustomEvent("orderCancellationApproved", {
          detail: { 
            orderId: request.order.order_id,
            cancelRequestId: request.cancelled_order_id
          }
        })
        
        window.dispatchEvent(orderCancellationEvent)
        console.log(`🔔 Dispatched orderCancellationApproved event for order ${request.order.order_id}`)
        
        // Refresh data after a short delay
        setTimeout(fetchCancelRequests, 1500)
      } else {
        throw new Error(result.message || "فشل في الموافقة على الطلب")
      }
      
    } catch (error: any) {
      console.error("❌ Error approving request:", error)
      alert(`❌ فشل في قبول طلب الإلغاء: ${error.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (request: CancelRequest) => {
    try {
      setProcessingId(request.cancelled_order_id)
      
      // Get current user
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const rejectedBy = currentUser?.user_id || currentUser?.worker_id
      
      console.log(`❌ Rejecting cancel request: ${request.cancelled_order_id}`)
      
      // Call the reject endpoint
      const result = await AuthApiService.apiRequest<any>(
        `/cancelled-orders/${request.cancelled_order_id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({
            approved_by: rejectedBy,
            rejection_reason: "Order cancellation rejected by owner"
          })
        }
      )
      
      if (result.success) {
        // Update local state - order should be active again
        setCancelRequests(prev => prev.map(req => 
          req.cancelled_order_id === request.cancelled_order_id 
            ? { 
                ...req, 
                status: CancelRequestStatus.REJECTED,
                order: {
                  ...req.order,
                  status: OrderStatus.ACTIVE // Order becomes active again
                }
              }
            : req
        ))
        
        // Update counts
        setPendingCount(prev => prev - 1)
        setRejectedCount(prev => prev + 1)
        
        console.log(`✅ Cancel request rejected successfully - Order is now active again`)
        
        // Dispatch event to notify cashier page about rejection
        window.dispatchEvent(new CustomEvent("orderCancellationRejected", {
          detail: { orderId: request.order.order_id }
        }))
        
        // Show success message
        alert(`✅ تم رفض طلب الإلغاء بنجاح. الطلب #${request.order.order_id.slice(-6)} أصبح نشطاً مرة أخرى.`)
        
        // Refresh data to get latest status
        setTimeout(fetchCancelRequests, 1000)
        
      } else {
        throw new Error(result.message || "فشل في رفض طلب الإلغاء")
      }
      
    } catch (error: any) {
      console.error("❌ Error rejecting request:", error)
      alert(`❌ فشل في رفض طلب الإلغاء: ${error.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} جنيه`
  }

  const getStatusBadge = (request: CancelRequest) => {
    // Convert status to lowercase string for comparison
    const statusStr = String(request.status).toLowerCase();
    
    if (statusStr === 'pending') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />معلق</Badge>;
    }
    
    if (statusStr === 'approved' || statusStr === 'cancelled' || statusStr === 'cancelled_approved') {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />موافق عليه
          </Badge>
          {request.approved_at && (
            <div className="text-xs text-green-600 text-right">
              {new Date(request.approved_at).toLocaleDateString('ar-EG')}
            </div>
          )}
        </div>
      );
    }
    
    if (statusStr === 'rejected') {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />مرفوض
          </Badge>
          {request.rejected_at && (
            <div className="text-xs text-red-600 text-right">
              {new Date(request.rejected_at).toLocaleDateString('ar-EG')}
            </div>
          )}
        </div>
      );
    }
    
    return <Badge variant="outline">{request.status}</Badge>;
  }

  const getOrderTypeName = (type: string) => {
    const types: Record<string, string> = {
      'dine-in': 'صالة',
      'takeaway': 'تيك أواي', 
      'delivery': 'توصيل',
      'cafe': 'كافيه'
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل طلبات الإلغاء...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchCancelRequests}>
              <RefreshCw className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">طلبات إلغاء الطلبات</h1>
          <p className="text-gray-600">إدارة طلبات الإلغاء من الكاشيرين</p>
        </div>
        <Button onClick={fetchCancelRequests} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">طلبات معلقة</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">طلبات موافق عليها</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">طلبات مرفوضة</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            جميع طلبات الإلغاء ({cancelRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cancelRequests.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد طلبات إلغاء</h3>
              <p className="text-gray-600">لم يتم العثور على أي طلبات إلغاء حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cancelRequests.map((request) => {
                // Determine if this is a system cancellation by checking the reason
                const isSystemCancellation = request.reason.includes('automatically') || 
                                           request.reason.includes('CANCELLED automatically');
                
                // Create a more readable reason for system cancellations
                const displayReason = isSystemCancellation 
                  ? "تم إلغاء الطلب بواسطة الكاشير" 
                  : request.reason;
                
                return (
                <Card 
                  key={request.cancelled_order_id} 
                  className={`border ${
                    request.isDuplicate 
                      ? "border-amber-300 bg-amber-50" 
                      : "border-gray-200"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            طلب #{request.order.order_id.slice(-6)}
                          </h3>
                          {getStatusBadge(request.status)}
                          {request.isDuplicate && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              طلب مكرر
                            </Badge>
                          )}
                          {isSystemCancellation && (
                            <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">
                              <User className="w-3 h-3 mr-1" />
                              إلغاء الكاشير
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(request.cancelled_at).toLocaleDateString('ar-EG')}
                        </div>
                      </div>

                      {/* Order Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">العميل</p>
                            <p className="font-medium">{request.order.customer_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">نوع الطلب</p>
                            <p className="font-medium">{getOrderTypeName(request.order.order_type)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">المبلغ</p>
                            <p className="font-medium">{formatPrice(request.order.total_price)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Cancellation Details */}
                      <div className={`${
                        isSystemCancellation 
                          ? "bg-indigo-50 border-indigo-200" 
                          : "bg-red-50 border-red-200"
                      } p-3 rounded-lg border`}>
                        <div className="flex items-start gap-2">
                          {isSystemCancellation ? (
                            <FileText className="w-4 h-4 text-indigo-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              isSystemCancellation 
                                ? "text-indigo-700" 
                                : "text-red-700"
                            } mb-1`}>سبب الإلغاء:</p>
                            <p className={`text-sm ${
                              isSystemCancellation 
                                ? "text-indigo-600" 
                                : "text-red-600"
                            }`}>{displayReason}</p>
                            <p className={`text-xs ${
                              isSystemCancellation 
                                ? "text-indigo-500" 
                                : "text-red-500"
                            } mt-1`}>
                              طلب من: {request.cancelled_by.full_name || request.cancelled_by.username || "غير معروف"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Order Items - Enhanced Display */}
                      {request.order_items && request.order_items.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <ShoppingBag className="h-4 w-4" />
                            عناصر الطلب ({request.order_items.length})
                          </div>
                          
                          <div className="grid gap-3">
                            {request.order_items.map((item, index) => (
                              <div key={item.order_item_id || index} className="bg-gray-50 rounded-lg p-4 border">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 mb-1">
                                      {item.product_size?.product_name || 'منتج غير محدد'}
                                    </h5>
                                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                      {item.product_size?.size_name && (
                                        <span className="bg-blue-100 px-2 py-1 rounded">
                                          {item.product_size.size_name}
                                        </span>
                                      )}
                                      {item.extras && item.extras.length > 0 && (
                                        <span className="bg-green-100 px-2 py-1 rounded">
                                          +{item.extras.length} إضافات
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <div className="text-lg font-bold text-green-600">
                                      {formatPrice(item.quantity * item.unit_price)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {item.quantity} × {formatPrice(item.unit_price)}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Extras Details */}
                                {item.extras && item.extras.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="text-sm font-medium text-gray-700 mb-2">الإضافات:</div>
                                    <div className="grid gap-1">
                                      {item.extras.map((extra, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                          <span className="text-gray-600">+ {extra.name}</span>
                                          <span className="text-gray-800 font-medium">
                                            {extra.price ? formatPrice(extra.price) : 'مجاني'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {request.status === CancelRequestStatus.PENDING && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={() => handleApprove(request)}
                            disabled={processingId === request.cancelled_order_id || request.processed}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === request.cancelled_order_id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            موافقة
                          </Button>
                          <Button 
                            onClick={() => handleReject(request)}
                            disabled={processingId === request.cancelled_order_id || request.processed}
                            variant="destructive"
                          >
                            {processingId === request.cancelled_order_id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            رفض
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
