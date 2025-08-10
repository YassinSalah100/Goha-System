"use client"

import { useState, useEffect } from "react"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { motion } from "framer-motion"

type HeaderProps = {
  title: string
}

export function Header({ title }: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!currentUser) return null

  const getInitials = (name: string | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getShiftText = (shift: string | undefined) => {
    if (!shift) return ""
    return shift === "morning" ? "الوردية الصباحية (8ص - 8م)" : "الوردية المسائية (8م - 8ص)"
  }

  return (
    <header className="border-b bg-gradient-to-r from-white via-orange-50/30 to-white p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Logo and Title Section */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Title and Info */}
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-1">
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-orange-700 to-red-600 bg-clip-text text-transparent">
                  {title}
                </h1>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <span className="font-medium text-gray-600">{formatDate(currentTime)}</span>
                <span className="text-orange-500 font-bold">•</span>
                <span className="font-medium text-gray-600">{formatTime(currentTime)}</span>
                {/* Only show shift information for cashier role */}
                {currentUser.role === "cashier" && currentUser.shift && (
                  <Badge variant="outline" className="capitalize ml-1 md:mr-2 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 transition-colors font-medium text-xs">
                    {getShiftText(currentUser.shift.type || currentUser.shift.shift_type)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Search, Notifications, and User Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="البحث..." className="w-[180px] lg:w-[200px] pl-8" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative hover:bg-orange-50 hover:border-orange-300 transition-colors">
                <Bell className="h-4 w-4" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold shadow-lg"
                >
                  3
                </motion.span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">طلب جديد تم استلامه</span>
                  <span className="text-xs text-muted-foreground">تم استلام الطلب رقم #1234</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">تنبيه المخزون</span>
                  <span className="text-xs text-muted-foreground">كمية الجبن منخفضة</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">طلب موافقة على إنهاء الوردية</span>
                  <span className="text-xs text-muted-foreground">أحمد طلب إنهاء الوردية</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(currentUser.full_name || currentUser.fullName || currentUser.name || currentUser.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block font-medium">
                  {currentUser.full_name || currentUser.fullName || currentUser.name || currentUser.username}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
              <DropdownMenuItem>الإعدادات</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">تسجيل الخروج</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
