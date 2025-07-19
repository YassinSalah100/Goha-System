"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  AlertTriangle,
  Coffee,
  BookOpen,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

type SidebarProps = {
  role: "cashier" | "admin" | "owner"
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const navItems = {
    cashier: [
      { name: "لوحة التحكم", icon: Home, path: "/cashier" },
      { name: "المبيعات والطلبات", icon: ShoppingCart, path: "/cashier/sales" },
      { name: "طلبات الكافية", icon: Coffee, path: "/cashier/cafe-orders" },
      { name: "الطلبات المحفوظة", icon: Package, path: "/cashier/orders" },
      { name: "دفتر اليومية", icon: BookOpen, path: "/cashier/journal" },
      { name: "طلبات الإلغاء", icon: AlertTriangle, path: "/cashier/cancel-requests" },
      { name: "إنهاء الوردية", icon: LogOut, path: "/cashier/end-shift" },
    ],
    admin: [
      { name: "لوحة التحكم", icon: Home, path: "/admin" },
      { name: "طلبات الإلغاء", icon: ShoppingCart, path: "/admin/cancel-requests" },
      { name: "موافقات الورديات", icon: Users, path: "/admin/shift-approvals" },
      { name: "إدارة المخزون", icon: Package, path: "/admin/inventory" },
      { name: "التقرير اليومي", icon: BarChart, path: "/admin/daily-report" },
      { name: "إدارة العاملين", icon: Users, path: "/admin/workers" },
    ],
    owner: [
      { name: "لوحة التحكم", icon: Home, path: "/owner" },
      { name: "المراقبة المباشرة", icon: BarChart, path: "/owner/monitoring" },
      { name: "التقارير", icon: BarChart, path: "/owner/reports" },
      { name: "إدارة المنتجات", icon: Package, path: "/owner/products" },
      { name: "إدارة المخزون", icon: Package, path: "/owner/stock" },
      { name: "الإعدادات", icon: Settings, path: "/owner/settings" },
      { name: "إدارة الحسابات", icon: Users, path: "/owner/accounts" },
      { name: "العاملين", icon: Users, path: "/owner/workers" },
      { name: "الأذونات", icon: Settings, path: "/owner/permissions" },
    ],
  }

  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "{}") : {}

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setCollapsed(!collapsed)
    }
  }

  const sidebarVariants = {
    expanded: { width: 250 },
    collapsed: { width: 80 },
  }

  const sidebarContent = (
    <>
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between", "p-4 border-b")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="شعار مطعم دوار جحا" width={40} height={40} priority className="rounded-full" />
            <span className="font-bold text-lg text-orange-700">مطعم دوار جحا</span>
          </div>
        )}
        {collapsed && (
          <Image src="/images/logo.png" alt="شعار مطعم دوار جحا" width={40} height={40} priority className="rounded-full" />
        )}
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1 p-2">
        {navItems[role].map((item) => (
          <Button
            key={item.path}
            variant={pathname === item.path ? "secondary" : "ghost"}
            className={cn("justify-start", collapsed ? "w-full px-2" : "w-full")}
            onClick={() => {
              router.push(item.path)
              if (isMobile) setMobileOpen(false)
            }}
          >
            <item.icon className={cn("h-5 w-5", pathname === item.path ? "text-orange-600" : "")} />
            {!collapsed && <span className="mr-2">{item.name}</span>}
          </Button>
        ))}
      </div>

      <div className="mt-auto p-2 border-t">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between", "p-2")}>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{currentUser.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {currentUser.role === "cashier" ? "كاشير" : currentUser.role === "admin" ? "مدير" : "مالك"}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="fixed top-4 left-4 z-50 lg:hidden">
          <Menu size={24} />
        </Button>

        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}

        <motion.div
          className="fixed top-0 left-0 z-50 h-full bg-white shadow-lg"
          initial={{ x: -250 }}
          animate={{ x: mobileOpen ? 0 : -250 }}
          transition={{ duration: 0.2 }}
          style={{ width: 250 }}
        >
          {sidebarContent}
        </motion.div>
      </>
    )
  }

  return (
    <motion.div
      className="h-screen border-r bg-white shadow-sm"
      initial="expanded"
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.2 }}
    >
      {sidebarContent}
    </motion.div>
  )
}
