"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, Clock, DollarSign, User, Search } from "lucide-react"
import { workers as workersData, type Worker } from "@/mock-data/workers"
import { motion } from "framer-motion"

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(workersData)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("workers")
  const [showAddWorkerDialog, setShowAddWorkerDialog] = useState(false)
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [newWorker, setNewWorker] = useState({
    name: "",
    position: "",
    hourlyRate: 0,
    phone: "",
  })
  const [attendance, setAttendance] = useState({
    date: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
    }
  }, [])

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.position.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddWorker = () => {
    const newWorkerId = `worker-${workers.length + 1}`
    const workerToAdd: Worker = {
      id: newWorkerId,
      name: newWorker.name,
      position: newWorker.position,
      hourlyRate: newWorker.hourlyRate,
      phone: newWorker.phone,
      joinDate: new Date().toISOString().split("T")[0],
      attendance: [],
    }

    setWorkers([...workers, workerToAdd])
    setShowAddWorkerDialog(false)
    setNewWorker({
      name: "",
      position: "",
      hourlyRate: 0,
      phone: "",
    })
  }

  const handleAddAttendance = () => {
    if (!selectedWorker) return

    const checkInTime = new Date(`${attendance.date}T${attendance.checkIn}:00`)
    const checkOutTime = new Date(`${attendance.date}T${attendance.checkOut}:00`)

    // Calculate hours worked
    const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

    // Calculate wage
    const wage = hoursWorked * selectedWorker.hourlyRate

    const newAttendance = {
      date: attendance.date,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      hoursWorked,
      wage,
    }

    setWorkers(
      workers.map((worker) => {
        if (worker.id === selectedWorker.id) {
          return {
            ...worker,
            attendance: [...worker.attendance, newAttendance],
          }
        }
        return worker
      }),
    )

    setShowAttendanceDialog(false)
    setAttendance({
      date: new Date().toISOString().split("T")[0],
      checkIn: "",
      checkOut: "",
    })
  }

  const openAttendanceDialog = (worker: Worker) => {
    setSelectedWorker(worker)
    setShowAttendanceDialog(true)
  }

  const calculateTotalHours = (worker: Worker) => {
    return worker.attendance.reduce((sum, record) => sum + record.hoursWorked, 0)
  }

  const calculateTotalWages = (worker: Worker) => {
    return worker.attendance.reduce((sum, record) => sum + record.wage, 0)
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">إدارة العاملين</h2>
          <p className="text-muted-foreground">Manage workers, attendance, and wages</p>
        </div>
        <Button onClick={() => setShowAddWorkerDialog(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" />
          إضافة عامل جديد
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>العاملين</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="بحث عن عامل..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="workers" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="workers">العاملين</TabsTrigger>
              <TabsTrigger value="attendance">الحضور والأجور</TabsTrigger>
            </TabsList>

            <TabsContent value="workers" className="m-0">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="h-10 px-4 text-left align-middle font-medium">الاسم</th>
                        <th className="h-10 px-4 text-left align-middle font-medium">الوظيفة</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">الأجر بالساعة</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">رقم الهاتف</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">تاريخ الانضمام</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            لا يوجد عاملين مطابقين
                          </td>
                        </tr>
                      ) : (
                        filteredWorkers.map((worker) => (
                          <motion.tr
                            key={worker.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="p-4 align-middle">{worker.name}</td>
                            <td className="p-4 align-middle">{worker.position}</td>
                            <td className="p-4 align-middle text-center">${worker.hourlyRate.toFixed(2)}</td>
                            <td className="p-4 align-middle text-center">{worker.phone}</td>
                            <td className="p-4 align-middle text-right">{worker.joinDate}</td>
                            <td className="p-4 align-middle text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAttendanceDialog(worker)}
                                className="h-8"
                              >
                                <Clock className="mr-2 h-3 w-3" />
                                تسجيل حضور
                              </Button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="m-0">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="h-10 px-4 text-left align-middle font-medium">الاسم</th>
                        <th className="h-10 px-4 text-left align-middle font-medium">الوظيفة</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">إجمالي الساعات</th>
                        <th className="h-10 px-4 text-center align-middle font-medium">إجمالي الأجور</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">آخر حضور</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            لا يوجد عاملين مطابقين
                          </td>
                        </tr>
                      ) : (
                        filteredWorkers.map((worker) => {
                          const lastAttendance =
                            worker.attendance.length > 0 ? worker.attendance[worker.attendance.length - 1] : null

                          return (
                            <motion.tr
                              key={worker.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-t hover:bg-muted/50"
                            >
                              <td className="p-4 align-middle">{worker.name}</td>
                              <td className="p-4 align-middle">{worker.position}</td>
                              <td className="p-4 align-middle text-center">
                                {calculateTotalHours(worker).toFixed(1)} ساعة
                              </td>
                              <td className="p-4 align-middle text-center">
                                ${calculateTotalWages(worker).toFixed(2)}
                              </td>
                              <td className="p-4 align-middle text-right">
                                {lastAttendance ? lastAttendance.date : "لا يوجد"}
                              </td>
                              <td className="p-4 align-middle text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWorker(worker)
                                    setActiveTab("details")
                                  }}
                                  className="h-8"
                                >
                                  عرض التفاصيل
                                </Button>
                              </td>
                            </motion.tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="m-0">
              {selectedWorker && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" onClick={() => setActiveTab("attendance")}>
                      العودة للقائمة
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openAttendanceDialog(selectedWorker)}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      تسجيل حضور جديد
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>معلومات العامل</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-lg">{selectedWorker.name}</h3>
                              <p className="text-muted-foreground">{selectedWorker.position}</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">الأجر بالساعة</p>
                              <p className="font-medium">${selectedWorker.hourlyRate.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                              <p className="font-medium">{selectedWorker.phone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">تاريخ الانضمام</p>
                              <p className="font-medium">{selectedWorker.joinDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">إجمالي الساعات</p>
                              <p className="font-medium">{calculateTotalHours(selectedWorker).toFixed(1)} ساعة</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>ملخص الأجور</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                              <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-lg">${calculateTotalWages(selectedWorker).toFixed(2)}</h3>
                              <p className="text-muted-foreground">إجمالي الأجور</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">هذا الأسبوع:</span>
                              <span className="font-medium">
                                $
                                {selectedWorker.attendance
                                  .filter((a) => {
                                    const date = new Date(a.date)
                                    const now = new Date()
                                    const weekStart = new Date(now)
                                    weekStart.setDate(now.getDate() - now.getDay())
                                    return date >= weekStart
                                  })
                                  .reduce((sum, a) => sum + a.wage, 0)
                                  .toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">هذا الشهر:</span>
                              <span className="font-medium">
                                $
                                {selectedWorker.attendance
                                  .filter((a) => {
                                    const date = new Date(a.date)
                                    const now = new Date()
                                    return (
                                      date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                                    )
                                  })
                                  .reduce((sum, a) => sum + a.wage, 0)
                                  .toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>سجل الحضور</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedWorker.attendance.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">لا يوجد سجل حضور</div>
                      ) : (
                        <div className="rounded-md border">
                          <table className="w-full caption-bottom text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="h-10 px-4 text-left align-middle font-medium">التاريخ</th>
                                <th className="h-10 px-4 text-center align-middle font-medium">وقت الحضور</th>
                                <th className="h-10 px-4 text-center align-middle font-medium">وقت الانصراف</th>
                                <th className="h-10 px-4 text-center align-middle font-medium">عدد الساعات</th>
                                <th className="h-10 px-4 text-right align-middle font-medium">الأجر</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...selectedWorker.attendance]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((record, index) => (
                                  <tr key={index} className="border-t hover:bg-muted/50">
                                    <td className="p-4 align-middle">{record.date}</td>
                                    <td className="p-4 align-middle text-center">{formatTime(record.checkIn)}</td>
                                    <td className="p-4 align-middle text-center">{formatTime(record.checkOut)}</td>
                                    <td className="p-4 align-middle text-center">{record.hoursWorked.toFixed(1)}</td>
                                    <td className="p-4 align-middle text-right">${record.wage.toFixed(2)}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Worker Dialog */}
      <Dialog open={showAddWorkerDialog} onOpenChange={setShowAddWorkerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة عامل جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={newWorker.name}
                onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                placeholder="أدخل اسم العامل"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">الوظيفة</Label>
              <Input
                id="position"
                value={newWorker.position}
                onChange={(e) => setNewWorker({ ...newWorker, position: e.target.value })}
                placeholder="أدخل المسمى الوظيفي"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hourlyRate">الأجر بالساعة</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">$</span>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-7"
                  value={newWorker.hourlyRate}
                  onChange={(e) => setNewWorker({ ...newWorker, hourlyRate: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={newWorker.phone}
                onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                placeholder="أدخل رقم الهاتف"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWorkerDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAddWorker}
              disabled={!newWorker.name || !newWorker.position || newWorker.hourlyRate <= 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Attendance Dialog */}
      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل حضور: {selectedWorker?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={attendance.date}
                onChange={(e) => setAttendance({ ...attendance, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="checkIn">وقت الحضور</Label>
                <Input
                  id="checkIn"
                  type="time"
                  value={attendance.checkIn}
                  onChange={(e) => setAttendance({ ...attendance, checkIn: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkOut">وقت الانصراف</Label>
                <Input
                  id="checkOut"
                  type="time"
                  value={attendance.checkOut}
                  onChange={(e) => setAttendance({ ...attendance, checkOut: e.target.value })}
                />
              </div>
            </div>
            {attendance.checkIn && attendance.checkOut && (
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">ساعات العمل:</p>
                    <p className="text-lg font-bold">
                      {(
                        (new Date(`${attendance.date}T${attendance.checkOut}:00`).getTime() -
                          new Date(`${attendance.date}T${attendance.checkIn}:00`).getTime()) /
                        (1000 * 60 * 60)
                      ).toFixed(1)}{" "}
                      ساعة
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">الأجر:</p>
                    <p className="text-lg font-bold text-green-600">
                      $
                      {(
                        ((new Date(`${attendance.date}T${attendance.checkOut}:00`).getTime() -
                          new Date(`${attendance.date}T${attendance.checkIn}:00`).getTime()) /
                          (1000 * 60 * 60)) *
                        (selectedWorker?.hourlyRate || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttendanceDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAddAttendance}
              disabled={!attendance.date || !attendance.checkIn || !attendance.checkOut}
              className="bg-orange-600 hover:bg-orange-700"
            >
              تسجيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
