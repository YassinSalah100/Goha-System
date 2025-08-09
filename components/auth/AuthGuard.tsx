import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthApiService } from '@/lib/services/auth-api'
import { toast } from 'sonner'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string[]
  fallbackPath?: string
}

export function AuthGuard({ 
  children, 
  requiredRole = [], 
  fallbackPath = '/' 
}: AuthGuardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user has valid token and user data
        const isAuth = AuthApiService.isAuthenticated()
        
        if (!isAuth) {
          setIsAuthenticated(false)
          toast.error('يرجى تسجيل الدخول للمتابعة')
          router.push(fallbackPath)
          return
        }

        setIsAuthenticated(true)

        // Check role authorization if required
        if (requiredRole.length > 0) {
          const userRole = AuthApiService.getUserRole()
          const hasRequiredRole = requiredRole.includes(userRole || '')
          
          if (!hasRequiredRole) {
            setIsAuthorized(false)
            toast.error('غير مصرح لك بالوصول إلى هذه الصفحة')
            router.push(fallbackPath)
            return
          }
        }

        setIsAuthorized(true)

        // Validate token with backend
        try {
          await AuthApiService.getProfile()
        } catch (error: any) {
          if (error.message?.includes('Unauthorized')) {
            console.log('Token expired or invalid, clearing auth data')
            AuthApiService.clearAuthData()
            setIsAuthenticated(false)
            toast.error('انتهت صلاحية تسجيل الدخول - يرجى تسجيل الدخول مرة أخرى')
            router.push(fallbackPath)
            return
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
        router.push(fallbackPath)
      }
    }

    checkAuth()
  }, [router, requiredRole, fallbackPath])

  // Show loading while checking authentication
  if (isAuthenticated === null || (requiredRole.length > 0 && isAuthorized === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated or authorized
  if (!isAuthenticated || (requiredRole.length > 0 && !isAuthorized)) {
    return null
  }

  return <>{children}</>
}

export default AuthGuard
