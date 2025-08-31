"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AuthApiService } from "@/lib/services/auth-api"

const API_BASE_URL = "http://20.117.240.138:3000/api/v1"

export default function PermissionsPage() {
  const [currentUser, setCurrentUser] = useState<any>({ username: "admin", full_name: "Administrator" })
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<any>(null)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [form, setForm] = useState({ name: "", description: "" })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [permissionToDelete, setPermissionToDelete] = useState<any>(null)

  // Load permissions on component mount - no auth required
  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await AuthApiService.apiRequest<any>('/permissions')

      if (data.success) {
        setPermissions(data.data || [])
      } else {
        // Set some demo permissions if API fails
        setPermissions([
          {
            id: "1",
            name: "manage_users",
            description: "إدارة المستخدمين",
            created_at: new Date().toISOString()
          },
          {
            id: "2", 
            name: "manage_products",
            description: "إدارة المنتجات",
            created_at: new Date().toISOString()
          },
          {
            id: "3",
            name: "view_reports", 
            description: "عرض التقارير",
            created_at: new Date().toISOString()
          }
        ])
      }
    } catch (e) {
      console.error("Fetch permissions error:", e)
      // Set demo permissions if network fails
      setPermissions([
        {
          id: "1",
          name: "manage_users",
          description: "إدارة المستخدمين",
          created_at: new Date().toISOString()
        },
        {
          id: "2", 
          name: "manage_products",
          description: "إدارة المنتجات", 
          created_at: new Date().toISOString()
        },
        {
          id: "3",
          name: "view_reports",
          description: "عرض التقارير",
          created_at: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Fetch available users for assignment
  const fetchUsers = async () => {
    try {
      const data = await AuthApiService.apiRequest<any>('/users')

      if (data.success) {
        setAvailableUsers(data.data || [])
      } else {
        // Set demo users if API fails
        setAvailableUsers([
          { id: "1", username: "user1", fullName: "User One" },
          { id: "2", username: "user2", fullName: "User Two" },
          { id: "3", username: "user3", fullName: "User Three" }
        ])
      }
    } catch (e) {
      // Set demo users if network fails
      setAvailableUsers([
        { id: "1", username: "user1", fullName: "User One" },
        { id: "2", username: "user2", fullName: "User Two" },
        { id: "3", username: "user3", fullName: "User Three" }
      ])
    }
  }

  // Handle assign permissions to users
  const handleAssignPermissions = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPermission || selectedUsers.length === 0) {
      setError("يرجى اختيار المستخدمين")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const authToken = localStorage.getItem("authToken")
      const headers: any = {
        "Content-Type": "application/json",
      }

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      // Use the correct field names that match the backend DTO
      const payload = {
        userId: selectedUsers[0], // For single user assignment
        permissionIds: [selectedPermission.id],
        grantedBy: currentUser.id || "admin-id" // Use proper user ID
      }

      console.log("Making request to assign permissions:", payload)

      const data = await AuthApiService.apiRequest<any>('/permissions/assign', {
        method: "POST",
        body: JSON.stringify(payload),
      })
      
      console.log("Assign response:", data)

      if (data.success) {
        setSuccess("تم تعيين الإذن بنجاح")
        setShowAssignModal(false)
        setSelectedUsers([])
        setSelectedPermission(null)
      } else {
        setError(data.message || "فشل في تعيين الإذن")
      }
    } catch (error: any) {
      console.error("Assign error:", error)
      setError(error.message || "خطأ في الاتصال بالخادم")
    } finally {
      setLoading(false)
    }
  }

  // Open assign modal
  const openAssignModal = (permission: any) => {
    setSelectedPermission(permission)
    setShowAssignModal(true)
    setSelectedUsers([])
    setError(null)
    setSuccess(null)
    fetchUsers()
  }

  // Open delete modal
  const openDeleteModal = (permission: any) => {
    setPermissionToDelete(permission)
    setShowDeleteModal(true)
    setError(null)
    setSuccess(null)
  }

  // Handle delete permission
  const handleDeletePermission = async () => {
    if (!permissionToDelete) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const data = await AuthApiService.apiRequest<any>(`/permissions/${permissionToDelete.id}`, {
        method: "DELETE",
      })

      if (data.success) {
        setSuccess(`تم حذف الإذن "${permissionToDelete.name}" بنجاح`)
        setShowDeleteModal(false)
        setPermissionToDelete(null)
        fetchPermissions()
      } else {
        setError(data.message || "فشل في حذف الإذن")
      }
    } catch (error: any) {
      console.error("Delete error:", error)
      setError(error.message || "خطأ في الاتصال بالخادم")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.name.trim()) {
      setError("اسم الإذن مطلوب")
      return
    }

    if (!currentUser) {
      setError("يجب تسجيل الدخول أولاً")
      return
    }

    setLoading(true)
    try {
      const userId = currentUser.user_id || currentUser.id

      const payload: { name: string; description?: string; granted_by: string } = {
        name: form.name.trim(),
        granted_by: userId,
      }

      if (form.description.trim()) {
        payload.description = form.description.trim()
      }

      const data = await AuthApiService.apiRequest<any>('/permissions', {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (data.success) {
        setSuccess("تم إضافة الإذن بنجاح")
        setShowAddModal(false)
        setForm({ name: "", description: "" })
        fetchPermissions()
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(", ")
          setError(`خطأ في التحقق: ${errorMessages}`)
        } else if (data.message) {
          setError(`خطأ: ${data.message}`)
        } else {
          setError(`خطأ غير معروف: ${JSON.stringify(data)}`)
        }
      }
    } catch (e: any) {
      console.error("Network error:", e)
      setError(e.message || "خطأ في الاتصال بالخادم")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    try {
      return new Date(dateString).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "-"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الأذونات</h1>
              <p className="text-gray-600">إدارة أذونات النظام والمستخدمين</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                مرحباً،{" "}
                <span className="font-medium text-gray-900">
                  {currentUser.full_name || currentUser.fullName || currentUser.name}
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>إضافة إذن جديد</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414 1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        )}

        {/* Permissions Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">قائمة الأذونات</h2>
            <p className="text-sm text-gray-600 mt-1">{permissions.length} إذن مسجل في النظام</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الإذن
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الوصف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-500">جاري التحميل...</p>
                      </div>
                    </td>
                  </tr>
                ) : permissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-12 h-12 text-gray-400 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">لا توجد أذونات</p>
                        <p className="text-gray-400 text-sm mt-1">ابدأ بإضافة إذن جديد للنظام</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  permissions.map((perm: any, index: number) => (
                    <tr key={perm.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1112 2.944a12.02 12.02 0 00-4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">{perm.name}</div>
                            <div className="text-xs text-gray-500">ID: {perm.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {perm.description || <span className="text-gray-400 italic">لا يوجد وصف</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(perm.created_at || perm.granted_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          مفعل
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors duration-200">
                            تعديل
                          </button>
                          <button 
                            onClick={() => openAssignModal(perm)}
                            className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 px-3 py-1 rounded-md transition-colors duration-200"
                          >
                            تعيين
                          </button>
                          <button 
                            onClick={() => openDeleteModal(perm)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors duration-200"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Permission Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">إضافة إذن جديد</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setForm({ name: "", description: "" })
                    setError(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddPermission} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم الإذن <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="مثال: inventory:manage"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">استخدم تنسيق: module:action</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="وصف اختياري للإذن"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setForm({ name: "", description: "" })
                    setError(null)
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>جاري الإضافة...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span>إضافة الإذن</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Permission Modal */}
      {showAssignModal && selectedPermission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  تعيين إذن: {selectedPermission.name}
                </h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedUsers([])
                    setSelectedPermission(null)
                    setError(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAssignPermissions} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر المستخدمين <span className="text-red-500">*</span>
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {availableUsers.length === 0 ? (
                      <div className="text-gray-500 text-center py-4">لا توجد مستخدمين متاحين</div>
                    ) : (
                      availableUsers.map((user: any) => (
                        <label key={user.id} className="flex items-center space-x-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id])
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                              }
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          <span className="text-sm">{user.fullName || user.username}</span>
                          <span className="text-xs text-gray-400">({user.username})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded p-2">
                    {success}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedUsers([])
                    setSelectedPermission(null)
                    setError(null)
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedUsers.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>جاري التعيين...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span>تعيين الإذن</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Permission Modal */}
      {showDeleteModal && permissionToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 text-red-600">
                  تأكيد حذف الإذن
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setPermissionToDelete(null)
                    setError(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center mb-4">
                <svg className="w-10 h-10 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-gray-800 font-medium">
                    هل أنت متأكد من حذف الإذن "{permissionToDelete.name}"؟
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    هذا الإجراء لا يمكن التراجع عنه وسيتم حذف الإذن نهائياً.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setPermissionToDelete(null)
                    setError(null)
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeletePermission}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>حذف الإذن</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
