"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, DollarSign, Users, FileText, Printer, Calculator } from "lucide-react"
import { useDailyReportStore } from "@/store/dailyReportStore"
import { useToast } from "@/hooks/use-toast"

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedShift, setSelectedShift] = useState<"morning" | "evening">("morning")
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [newExpense, setNewExpense] = useState({ description: "", amount: 0 })
  const [newWorker, setNewWorker] = useState({
    workerName: "",
    hourlyRate: 0,
    arrivalTime: new Date(),
    shift: "morning" as "morning" | "evening",
    date: selectedDate,
  })
  const [revenues, setRevenues] = useState({
    takeaway: 0,
    cafe: 0,
    ground: 0,
  })

  const { toast } = useToast()
  const { reports, workers, addExpense, updateRevenue, addWorkerAttendance, updateWorkerDeparture, createDailyReport } =
    useDailyReportStore()

  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
    }
  }, [])

  const currentReport = reports.find((r) => r.date === selectedDate && r.shift === selectedShift)
  const currentWorkers = workers.filter((w) => w.date === selectedDate && w.shift === selectedShift)
  const totalWages = currentWorkers.reduce((sum, w) => sum + w.dailyWage, 0)

  const handleCreateReport = () => {
    if (!currentReport) {
      createDailyReport(selectedDate, selectedShift, currentUser?.name || "")
      toast({
        title: "تم إنشاء التقرير اليومي",
        description: "تم إنشاء التقرير بنجاح",
      })
    }
  }

  const handleAddExpense = () => {
    if (!currentReport) {
      handleCreateReport()
      return
    }

    if (!newExpense.description || newExpense.amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع بيانات المصروف",
        variant: "destructive",
      })
      return
    }

    addExpense(currentReport.id, newExpense)
    setNewExpense({ description: "", amount: 0 })
    setShowExpenseModal(false)
    toast({
      title: "تم إضافة المصروف",
      description: "تم إضافة المصروف بنجاح",
    })
  }

  const handleAddWorker = () => {
    if (!newWorker.workerName || newWorker.hourlyRate <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع بيانات العامل",
        variant: "destructive",
      })
      return
    }

    addWorkerAttendance({
      ...newWorker,
      shift: selectedShift,
      date: selectedDate,
    })
    setNewWorker({
      workerName: "",
      hourlyRate: 0,
      arrivalTime: new Date(),
      shift: selectedShift,
      date: selectedDate,
    })
    setShowWorkerModal(false)
    toast({
      title: "تم إضافة العامل",
      description: "تم إضافة العامل بنجاح",
    })
  }

  const handleWorkerDeparture = (workerId: string) => {
    updateWorkerDeparture(workerId, new Date())
    toast({
      title: "تم تسجيل الانصراف",
      description: "تم تسجيل انصراف العامل بنجاح",
    })
  }

  const handleRevenueUpdate = (type: "takeaway" | "cafe" | "ground", value: number) => {
    if (!currentReport) {
      handleCreateReport()
      return
    }

    setRevenues((prev) => ({ ...prev, [type]: value }))
    updateRevenue(currentReport.id, type, value)
  }

  const handlePrintReport = () => {
    window.print()
    toast({
      title: "طباعة التقرير",
      description: "تم إرسال التقرير للطباعة",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">التقرير اليومي</h2>
            <p className="text-gray-600">إدارة التقرير اليومي والمصروفات والعمالة</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrintReport}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer size={20} />
            <span>طباعة التقرير</span>
          </motion.button>
        </div>

        {/* Date and Shift Selection */}
        <div className="flex space-x-4 space-x-reverse mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الوردية</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as "morning" | "evening")}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="morning">صباحية</option>
              <option value="evening">مسائية</option>
            </select>
          </div>
        </div>
      </div>

      {!currentReport ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-xl shadow-sm"
        >
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">لا يوجد تقرير لهذا التاريخ والوردية</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateReport}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
          >
            إنشاء تقرير جديد
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2 space-x-reverse">
              <DollarSign size={20} />
              <span>الإيرادات</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تيك أواي</label>
                <input
                  type="number"
                  value={revenues.takeaway}
                  onChange={(e) => handleRevenueUpdate("takeaway", Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كافيه</label>
                <input
                  type="number"
                  value={revenues.cafe}
                  onChange={(e) => handleRevenueUpdate("cafe", Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأرضية</label>
                <input
                  type="number"
                  value={revenues.ground}
                  onChange={(e) => handleRevenueUpdate("ground", Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-700">إجمالي الإيرادات:</span>
                  <span className="font-bold text-green-800 text-lg">
                    {revenues.takeaway + revenues.cafe + revenues.ground} ج.م
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2 space-x-reverse">
                <Minus size={20} />
                <span>المصروفات</span>
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExpenseModal(true)}
                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
              >
                <Plus size={16} />
              </motion.button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentReport.expenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm">{expense.description}</span>
                  <span className="font-medium text-red-600">{expense.amount} ج.م</span>
                </div>
              ))}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-red-700">إجمالي المصروفات:</span>
                <span className="font-bold text-red-800 text-lg">
                  {currentReport.expenses.reduce((sum, e) => sum + e.amount, 0)} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Workers Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2 space-x-reverse">
                <Users size={20} />
                <span>العمالة</span>
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWorkerModal(true)}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
              </motion.button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-right p-3">اسم العامل</th>
                    <th className="text-right p-3">الأجر/ساعة</th>
                    <th className="text-right p-3">وقت الحضور</th>
                    <th className="text-right p-3">وقت الانصراف</th>
                    <th className="text-right p-3">ساعات العمل</th>
                    <th className="text-right p-3">الأجر اليومي</th>
                    <th className="text-right p-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWorkers.map((worker) => (
                    <tr key={worker.id} className="border-b">
                      <td className="p-3 font-medium">{worker.workerName}</td>
                      <td className="p-3">{worker.hourlyRate} ج.م</td>
                      <td className="p-3">{formatTime(worker.arrivalTime)}</td>
                      <td className="p-3">{worker.departureTime ? formatTime(worker.departureTime) : "-"}</td>
                      <td className="p-3">{worker.hoursWorked || 0} ساعة</td>
                      <td className="p-3 font-bold text-green-600">{worker.dailyWage} ج.م</td>
                      <td className="p-3">
                        {!worker.departureTime && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleWorkerDeparture(worker.id)}
                            className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors"
                          >
                            انصراف
                          </motion.button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-700">إجمالي الأجور:</span>
                <span className="font-bold text-blue-800 text-lg">{totalWages} ج.م</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2 space-x-reverse">
              <Calculator size={20} />
              <span>الملخص النهائي</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-medium">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-800">
                  {revenues.takeaway + revenues.cafe + revenues.ground} ج.م
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 font-medium">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-red-800">
                  {currentReport.expenses.reduce((sum, e) => sum + e.amount, 0)} ج.م
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-700 font-medium">إجمالي الأجور</p>
                <p className="text-2xl font-bold text-blue-800">{totalWages} ج.م</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-amber-700 font-medium">الصافي</p>
                <p className="text-2xl font-bold text-amber-800">
                  {revenues.takeaway +
                    revenues.cafe +
                    revenues.ground -
                    (currentReport.expenses.reduce((sum, e) => sum + e.amount, 0) + totalWages)}{" "}
                  ج.م
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowExpenseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-96 max-w-[90vw]"
            >
              <h3 className="text-lg font-bold mb-4">إضافة مصروف</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وصف المصروف</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="أدخل وصف المصروف"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex space-x-3 space-x-reverse mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddExpense}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
                >
                  إضافة
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Worker Modal */}
      <AnimatePresence>
        {showWorkerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowWorkerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-96 max-w-[90vw]"
            >
              <h3 className="text-lg font-bold mb-4">إضافة عامل</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم العامل</label>
                  <input
                    type="text"
                    value={newWorker.workerName}
                    onChange={(e) => setNewWorker({ ...newWorker, workerName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="أدخل اسم العامل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الأجر بالساعة</label>
                  <input
                    type="number"
                    value={newWorker.hourlyRate}
                    onChange={(e) => setNewWorker({ ...newWorker, hourlyRate: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وقت الحضور</label>
                  <input
                    type="time"
                    value={formatTime(newWorker.arrivalTime)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":")
                      const newTime = new Date()
                      newTime.setHours(Number.parseInt(hours), Number.parseInt(minutes))
                      setNewWorker({ ...newWorker, arrivalTime: newTime })
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-3 space-x-reverse mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddWorker}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
                >
                  إضافة
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowWorkerModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
