"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Clock, 
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { AuthApiService } from "@/lib/services/auth-api"

// API URL
const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

interface Shift {
  id: string;
  cashier_id: string;
  cashier_name: string;
  status: string;
  type: string;
  started_at: string;
  closing_requested_at?: string;
  closed_at?: string;
  notes?: string;
  admin_notes?: string;
  total_sales: number;
  cash_sales: number;
  card_sales: number;
  online_sales: number;
  total_expenses: number;
  cash_drawer_amount: number;
  transactions_count: number;
  orders?: string[];
}

export default function ShiftApprovalsPage() {
  const [pendingShifts, setPendingShifts] = useState<Shift[]>([]);
  const [completedShifts, setCompletedShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingShift, setProcessingShift] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check permissions
    const userHasPermission = AuthApiService.hasPermission(['OWNER_ACCESS', 'shift:approve']);
    setHasPermission(userHasPermission);

    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      setCurrentUser(user);
    }

    if (userHasPermission) {
      fetchShifts();
    } else {
      setLoading(false);
      toast.error("ليس لديك صلاحية للوصول إلى هذه الصفحة");
    }
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      
      // Get token
      const token = AuthApiService.getAuthToken();
      if (!token) {
        toast.error("جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى");
        return;
      }

      // Fetch shifts with close-requested status
      const response = await fetch(`${API_BASE_URL}/shifts/close-requested`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setPendingShifts(data.data);
      } else {
        toast.error("خطأ في تحميل بيانات الورديات");
      }

      // Also fetch recently completed shifts (closed ones)
      const closedResponse = await fetch(`${API_BASE_URL}/shifts/status/CLOSED?limit=5`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (closedResponse.ok) {
        const closedData = await closedResponse.json();
        if (closedData.success && Array.isArray(closedData.data)) {
          setCompletedShifts(closedData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast.error("حدث خطأ أثناء تحميل الورديات");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveShift = async (shiftId: string) => {
    if (!hasPermission) {
      toast.error("ليس لديك صلاحية للموافقة على إغلاق الورديات");
      return;
    }

    try {
      setProcessingShift(shiftId);
      
      // Get token
      const token = AuthApiService.getAuthToken();
      if (!token) {
        toast.error("جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى");
        return;
      }

      // Approve shift close
      const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}/approve-close`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          admin_notes: "تمت الموافقة على إغلاق الوردية من قبل " + (currentUser?.name || "المدير")
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success("تمت الموافقة على إغلاق الوردية بنجاح");
        // Refresh data
        fetchShifts();
      } else {
        toast.error(data.message || "خطأ في الموافقة على إغلاق الوردية");
      }
    } catch (error) {
      console.error("Error approving shift:", error);
      toast.error("حدث خطأ أثناء الموافقة على إغلاق الوردية");
    } finally {
      setProcessingShift(null);
    }
  };

  const handleRejectShift = async (shiftId: string) => {
    // This functionality would need to be added in the backend
    toast.info("لم يتم تنفيذ وظيفة رفض إغلاق الوردية بعد");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const durationMs = endTime - startTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}س ${minutes}د`;
  };

  const getShiftTypeText = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MORNING': return 'صباحية';
      case 'EVENING': return 'مسائية';
      case 'NIGHT': return 'ليلية';
      default: return type;
    }
  };

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">غير مصرح بالوصول</h3>
          <p className="text-muted-foreground">ليس لديك الصلاحيات اللازمة لعرض هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">طلبات إنهاء الورديات</h2>
        <p className="text-muted-foreground">مراجعة والموافقة على طلبات إنهاء الورديات من الكاشيير</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-2" />
            <span className="text-muted-foreground">جاري تحميل البيانات...</span>
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>طلبات إنهاء الورديات المعلقة</CardTitle>
                <Button variant="outline" onClick={fetchShifts} className="flex items-center gap-1">
                  <span>تحديث</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingShifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg">لا توجد طلبات إنهاء ورديات معلقة</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingShifts.map((shift) => (
                    <motion.div
                      key={shift.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">
                              طلب إنهاء وردية - {shift.cashier_name}
                            </h3>
                            <Badge variant="outline">
                              {shift.status === "CLOSE_REQUESTED" ? "معلق" : shift.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            وردية {getShiftTypeText(shift.type)} • {formatDate(shift.started_at)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleApproveShift(shift.id)} 
                            className="bg-green-600 hover:bg-green-700"
                            disabled={processingShift === shift.id}
                          >
                            {processingShift === shift.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            موافقة
                          </Button>
                          <Button 
                            onClick={() => handleRejectShift(shift.id)} 
                            variant="destructive"
                            disabled={processingShift === shift.id}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            رفض
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">تفاصيل الوردية</h4>
                          <div className="bg-gray-50 p-4 rounded-md space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">وقت البدء:</span>
                              <span>{formatDateTime(shift.started_at)}</span>
                            </div>
                            {shift.closing_requested_at && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">وقت طلب الإنهاء:</span>
                                <span>{formatDateTime(shift.closing_requested_at)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">المدة:</span>
                              <span>{calculateDuration(shift.started_at, shift.closing_requested_at || '')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">عدد المعاملات:</span>
                              <span>{shift.transactions_count}</span>
                            </div>
                            {shift.notes && (
                              <div className="pt-2">
                                <p className="text-sm text-muted-foreground mb-1">ملاحظات الكاشير:</p>
                                <p className="text-sm bg-white p-2 rounded border">{shift.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">ملخص المبيعات</h4>
                          <div className="bg-gray-50 p-4 rounded-md space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                                <span className="text-muted-foreground">إجمالي المبيعات:</span>
                              </div>
                              <span className="font-medium">{formatCurrency(shift.total_sales)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">مبيعات نقدية:</span>
                              <span>{formatCurrency(shift.cash_sales)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">مبيعات بطاقة:</span>
                              <span>{formatCurrency(shift.card_sales)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">مبيعات إلكترونية:</span>
                              <span>{formatCurrency(shift.online_sales)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">إجمالي المصروفات:</span>
                              <span>{formatCurrency(shift.total_expenses)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-medium">
                              <span>رصيد الدرج النقدي:</span>
                              <span className="text-green-600">{formatCurrency(shift.cash_drawer_amount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>سجل الورديات المغلقة مؤخراً</CardTitle>
            </CardHeader>
            <CardContent>
              {completedShifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">لا توجد ورديات مغلقة مؤخراً</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الكاشير</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">نوع الوردية</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">تاريخ البدء</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">تاريخ الإغلاق</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">إجمالي المبيعات</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">المعاملات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {completedShifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{shift.cashier_name}</td>
                          <td className="px-4 py-2 text-sm">{getShiftTypeText(shift.type)}</td>
                          <td className="px-4 py-2 text-sm">{formatDateTime(shift.started_at)}</td>
                          <td className="px-4 py-2 text-sm">{shift.closed_at ? formatDateTime(shift.closed_at) : '-'}</td>
                          <td className="px-4 py-2 text-sm font-medium">{formatCurrency(shift.total_sales)}</td>
                          <td className="px-4 py-2 text-sm text-center">{shift.transactions_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
