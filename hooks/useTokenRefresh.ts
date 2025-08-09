import { useEffect, useRef } from 'react'
import { AuthApiService } from '@/lib/services/auth-api'
import { toast } from 'sonner'

export function useTokenRefresh() {
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scheduleTokenRefresh = () => {
    const tokenExpiration = localStorage.getItem('tokenExpiration')
    
    if (!tokenExpiration) {
      return
    }

    const expirationTime = parseInt(tokenExpiration)
    const currentTime = Date.now()
    const timeUntilExpiration = expirationTime - currentTime
    
    // Refresh token 5 minutes before expiration
    const refreshTime = timeUntilExpiration - (5 * 60 * 1000)
    
    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('Refreshing token automatically...')
          const tokenData = await AuthApiService.refreshToken()
          
          // Update stored token and expiration
          localStorage.setItem('authToken', tokenData.token)
          const newExpirationTime = Date.now() + (tokenData.expiresIn * 1000)
          localStorage.setItem('tokenExpiration', newExpirationTime.toString())
          
          console.log('Token refreshed successfully')
          
          // Schedule next refresh
          scheduleTokenRefresh()
        } catch (error) {
          console.error('Token refresh failed:', error)
          toast.error('انتهت صلاحية تسجيل الدخول - يرجى تسجيل الدخول مرة أخرى')
          AuthApiService.clearAuthData()
          window.location.href = '/'
        }
      }, refreshTime)
    } else if (timeUntilExpiration <= 0) {
      // Token already expired
      AuthApiService.clearAuthData()
      window.location.href = '/'
    }
  }

  useEffect(() => {
    if (AuthApiService.isAuthenticated()) {
      scheduleTokenRefresh()
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  return { scheduleTokenRefresh }
}

export default useTokenRefresh
