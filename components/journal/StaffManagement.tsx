"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatEgyptianCurrency, calculateWorkHours, calculateSalary } from "@/lib/utils"
import { Users, Clock, DollarSign, UserCheck, UserX } from "lucide-react"

interface StaffMember {
  id: string
  name: string
  position: string
  avatar?: string
  startTime: string
  endTime?: string
  hourlyRate: number
  status: "present" | "absent" | "ended"
}

interface StaffManagementProps {
  staff: StaffMember[]
  onEndShift: (staffId: string) => Promise<void>
  isLoading: boolean
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  staff,
  onEndShift,
  isLoading
}) => {
  const activeStaff = staff.filter(member => member.status === "present")
  const totalStaffCost = staff.reduce((total, member) => {
    const hours = calculateWorkHours(member.startTime, member.endTime)
    return total + calculateSalary(hours, member.hourlyRate)
  }, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">حاضر</Badge>
      case "ended":
        return <Badge className="bg-blue-100 text-blue-800">انتهت المناوبة</Badge>
      case "absent":
        return <Badge className="bg-red-100 text-red-800">غائب</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">غير محدد</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            إدارة الموظفين ({activeStaff.length} حاضر)
          </CardTitle>
          <div className="bg-green-50 px-3 py-1 rounded-lg">
            <span className="text-green-700 font-semibold">
              التكلفة: {formatEgyptianCurrency(totalStaffCost)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {staff.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">لا يوجد موظفين مسجلين</h3>
            <p className="text-gray-400">سيتم عرض الموظفين الحاضرين هنا</p>
          </div>
        ) : (
          <div className="space-y-4">
            {staff.map((member) => {
              const workHours = calculateWorkHours(member.startTime, member.endTime)
              const dailySalary = calculateSalary(workHours, member.hourlyRate)

              return (
                <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.position}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(member.status)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{workHours.toFixed(1)} ساعة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-green-600">
                            {formatEgyptianCurrency(dailySalary)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        بداية: {new Date(member.startTime).toLocaleTimeString('ar-EG', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {member.endTime && (
                          <span className="block">
                            نهاية: {new Date(member.endTime).toLocaleTimeString('ar-EG', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>

                      {member.status === "present" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => onEndShift(member.id)}
                          disabled={isLoading}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          إنهاء المناوبة
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
