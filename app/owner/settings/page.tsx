"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Save, User, SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("account")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [settings, setSettings] = useState({
    account: {
      name: "",
      email: "",
      phone: "",
    },
    security: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorEnabled: false,
    },
    restaurant: {
      name: "مطعم دوار جحا",
      address: "123 شارع الرئيسي، القاهرة",
      phone: "0123456789",
      taxRate: 10,
      currency: "EGP",
      logo: "/images/logo.png",
    },
    system: {
      language: "ar",
      theme: "light",
      notifications: true,
      autoLogout: 30,
      printReceipts: true,
    },
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setCurrentUser(user)

      if (user.name) {
        setSettings((prev) => ({
          ...prev,
          account: {
            ...prev.account,
            name: user.name,
            email: `${user.username}@dawarjuha.com`,
            phone: "0123456789",
          },
        }))
      }
    }
  }, [])

  const handleSaveSettings = () => {
    // In a real app, this would save to a database
    setShowSuccessDialog(true)
  }

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">الإعدادات</h2>
        <p className="text-muted-foreground">Manage your account and system settings</p>
      </div>

      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="account">الحساب</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="restaurant">المطعم</TabsTrigger>
          <TabsTrigger value="system">النظام</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الحساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-10 w-10 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{settings.account.name}</h3>
                  <p className="text-muted-foreground">{currentUser.role}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={settings.account.name}
                    onChange={(e) => handleInputChange("account", "name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.account.email}
                    onChange={(e) => handleInputChange("account", "email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={settings.account.phone}
                    onChange={(e) => handleInputChange("account", "phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">الدور</Label>
                  <Input id="role" value={currentUser.role} disabled />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} className="bg-orange-600 hover:bg-orange-700">
                <Save className="mr-2 h-4 w-4" />
                حفظ التغييرات
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الأمان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">تغيير كلمة المرور</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={settings.security.currentPassword}
                      onChange={(e) => handleInputChange("security", "currentPassword", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={settings.security.newPassword}
                      onChange={(e) => handleInputChange("security", "newPassword", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={settings.security.confirmPassword}
                      onChange={(e) => handleInputChange("security", "confirmPassword", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">إعدادات الأمان الإضافية</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">المصادقة الثنائية</p>
                    <p className="text-sm text-muted-foreground">تفعيل المصادقة الثنائية لزيادة أمان حسابك</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) => handleInputChange("security", "twoFactorEnabled", checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} className="bg-orange-600 hover:bg-orange-700">
                <Save className="mr-2 h-4 w-4" />
                حفظ التغييرات
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="restaurant" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات المطعم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">اسم المطعم</Label>
                  <Input
                    id="restaurantName"
                    value={settings.restaurant.name}
                    onChange={(e) => handleInputChange("restaurant", "name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantPhone">رقم الهاتف</Label>
                  <Input
                    id="restaurantPhone"
                    value={settings.restaurant.phone}
                    onChange={(e) => handleInputChange("restaurant", "phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="restaurantAddress">العنوان</Label>
                  <Input
                    id="restaurantAddress"
                    value={settings.restaurant.address}
                    onChange={(e) => handleInputChange("restaurant", "address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">نسبة الضريبة (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.restaurant.taxRate}
                    onChange={(e) => handleInputChange("restaurant", "taxRate", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">العملة</Label>
                  <Input
                    id="currency"
                    value={settings.restaurant.currency}
                    onChange={(e) => handleInputChange("restaurant", "currency", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">شعار المطعم</h3>
                <div className="flex items-center gap-4">
                  <img
                    src={settings.restaurant.logo || "/placeholder.svg"}
                    alt="Restaurant Logo"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  <Button variant="outline">تغيير الشعار</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} className="bg-orange-600 hover:bg-orange-700">
                <Save className="mr-2 h-4 w-4" />
                حفظ التغييرات
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="m-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">اللغة</Label>
                    <select
                      id="language"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={settings.system.language}
                      onChange={(e) => handleInputChange("system", "language", e.target.value)}
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">المظهر</Label>
                    <select
                      id="theme"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={settings.system.theme}
                      onChange={(e) => handleInputChange("system", "theme", e.target.value)}
                    >
                      <option value="light">فاتح</option>
                      <option value="dark">داكن</option>
                      <option value="system">تلقائي (حسب النظام)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="autoLogout">وقت تسجيل الخروج التلقائي (دقائق)</Label>
                    <Input
                      id="autoLogout"
                      type="number"
                      min="5"
                      value={settings.system.autoLogout}
                      onChange={(e) => handleInputChange("system", "autoLogout", Number(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">خيارات إضافية</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">الإشعارات</p>
                        <p className="text-sm text-muted-foreground">تفعيل الإشعارات داخل النظام</p>
                      </div>
                      <Switch
                        checked={settings.system.notifications}
                        onCheckedChange={(checked) => handleInputChange("system", "notifications", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">طباعة الإيصالات تلقائياً</p>
                        <p className="text-sm text-muted-foreground">طباعة الإيصال تلقائياً عند إتمام الطلب</p>
                      </div>
                      <Switch
                        checked={settings.system.printReceipts}
                        onCheckedChange={(checked) => handleInputChange("system", "printReceipts", checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} className="bg-orange-600 hover:bg-orange-700">
                <Save className="mr-2 h-4 w-4" />
                حفظ التغييرات
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تم حفظ الإعدادات</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 p-2 flex items-center justify-center">
              <SettingsIcon className="h-8 w-8 text-green-600" />
            </div>
            <p>تم حفظ الإعدادات بنجاح.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)} className="bg-orange-600 hover:bg-orange-700">
              حسناً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
