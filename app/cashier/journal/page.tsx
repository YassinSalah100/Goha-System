"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatEgyptianCurrency, validateExpenseForm, calculateWorkHours, calculateSalary } from "@/lib/utils"
import { generateDailyReport, type ReportData } from "@/lib/utils"
import { JournalDailyReportDialog } from "@/components/reports/DailyReportDialog"
import {
  Plus,
  Trash2,
  Eye,
  Calendar,
  Receipt,
  Users,
  Clock,
  DollarSign,
  UserCheck,
  UserX,
  RefreshCw,
  Loader2,
  AlertTriangle,
  FileText,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthApiService } from "@/lib/services/auth-api"
import { API_CONFIG } from "@/lib/config"

// Categories are no longer used as they're not included in the DTO

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
  if (!token) {
    console.warn("No access token found for API request")
    return {}
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

// Worker status enum matching the backend exactly
export enum WorkerStatus {
  ADMIN = "admin",
  CASHIER = "cashier",
  CHEF = "chef",
  WAITER = "waiter",
  DELIVERY = "delivery",
  KITCHEN = "kitchen",
  STEAWER = "steawer",
  KITCHEN_ASSISTANT = "kitchen_assistant",
}

// directAssignWorker function will be declared after fetchWithErrorHandling definition

interface Worker {
  worker_id: string
  full_name: string
  status: string
  base_hourly_rate: number
}

interface Shift {
  shift_id: string
  type: string
  status?: string
  start_time?: string
  opened_by?: string
  is_closed?: boolean
}

interface Expense {
  expense_id: string
  title: string
  description?: string
  amount: number
  category?: string
  shift: Shift
  created_by: Worker
  created_at: string
}

interface ExpenseData {
  item: string
  amount: number
  description?: string
}

interface StaffMember {
  id: string
  name: string
  position: string
  avatar?: string
  startTime: string
  endTime?: string
  hourlyRate: number
  status: "present" | "absent" | "ended"
  workerId?: string // Add worker ID for reference
}

interface ShiftWorker {
  shift_worker_id: string
  worker_id: string
  shift_id: string
  hourly_rate: number
  start_time: string
  end_time?: string
  hours_worked?: number
  calculated_salary?: number
  is_active: boolean
  created_at: string
  worker?: Worker
  worker_name?: string
  worker_status?: string
  worker_base_hourly_rate?: number
}

interface CurrentUser {
  worker_id: string
  full_name: string
  status: string
  shift?: Shift
}

export default function JournalPage() {
  const { toast } = useToast() // Add the toast hook
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([])
  const [shiftWorkers, setShiftWorkers] = useState<ShiftWorker[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [loadingShift, setLoadingShift] = useState(true)
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [assigningWorker, setAssigningWorker] = useState<string | null>(null)
  const [endingWorker, setEndingWorker] = useState<string | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null)
  // Added state for handling ambiguous worker matches
  const [ambiguousWorkers, setAmbiguousWorkers] = useState<{
    shiftWorkerId: string
    candidates: Worker[]
    onSelect: (workerId: string) => void
  } | null>(null)

  // Form state for adding expenses
  const [expenseForm, setExpenseForm] = useState({
    item: "",
    amount: "",
    description: "",
  })
  const [formErrors, setFormErrors] = useState<any>({})
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  // Report state
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  // Permissions state
  const [canAccessExpenses, setCanAccessExpenses] = useState(false)
  const [canAccessShiftWorkers, setCanAccessShiftWorkers] = useState(false)
  const [hasAnyJournalAccess, setHasAnyJournalAccess] = useState(false)

  // API utility functions
  const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
    try {
      console.log(`Making request to: ${url}`, options)

      // Clone options to prevent mutation issues
      const requestOptions = { ...options }

      // Process request body for date formatting and validation
      if (requestOptions.body && typeof requestOptions.body === "string") {
        try {
          const bodyData = JSON.parse(requestOptions.body)

          // Check if request has special date handling header
          const dateFormat =
            requestOptions.headers &&
            typeof requestOptions.headers === "object" &&
            "X-Date-Format" in requestOptions.headers
              ? requestOptions.headers["X-Date-Format"]
              : null

          // Special handling for dates based on header
          if (dateFormat === "iso") {
            console.log("Using ISO date format as specified in header")
            // Keep ISO strings as they are - they will be parsed by class-transformer on the backend
          } else {
            // Default behavior: convert Date objects to ISO strings
            for (const key in bodyData) {
              if (bodyData[key] instanceof Date) {
                console.log(`Converting Date object in field "${key}" to ISO string`)
                bodyData[key] = bodyData[key].toISOString()
              }

              // Handle nested date objects
              if (bodyData[key] && typeof bodyData[key] === "object" && !(bodyData[key] instanceof Array)) {
                for (const nestedKey in bodyData[key]) {
                  if (bodyData[key][nestedKey] instanceof Date) {
                    console.log(`Converting nested Date object in "${key}.${nestedKey}" to ISO string`)
                    bodyData[key][nestedKey] = bodyData[key][nestedKey].toISOString()
                  }
                }
              }
            }
          }

          console.log(`Processed request body:`, bodyData)

          // Re-stringify the transformed data
          requestOptions.body = JSON.stringify(bodyData)
        } catch (e) {
          // If parsing fails, keep the original body
          console.warn("Could not process request body:", e)
        }
      }

      const response = await fetch(url, {
        ...requestOptions,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...AuthApiService.createAuthHeaders(),
          ...requestOptions.headers,
        },
      })

      console.log(`Response from ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      // Get response data
      let responseData
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
      } else {
        const text = await response.text()
        try {
          // Try to parse as JSON anyway
          responseData = JSON.parse(text)
        } catch (e) {
          // If not valid JSON, create a simple object
          responseData = {
            message: text,
            success: response.ok,
          }
        }
      }

      console.log(`Response data from ${url}:`, responseData)

      if (!response.ok) {
        // Enhanced error logging
        if (responseData.errors) {
          console.error(`Validation errors:`, responseData.errors)

          // Log detailed information about each validation error
          responseData.errors.forEach((error: any, index: number) => {
            console.error(`Validation error ${index + 1}:`, error)
            console.error(`- Property: ${error.property || "unknown"}`)
            console.error(`- Value: ${error.value !== undefined ? JSON.stringify(error.value) : "undefined"}`)

            if (error.constraints) {
              Object.entries(error.constraints).forEach(([key, value]) => {
                console.error(`- Constraint (${key}): ${value}`)
              })
            }
          })

          // Create a readable error message from validation errors
          const errorMessage = responseData.errors
            .map((error: any) => {
              const property = error.property || "unknown"
              const constraints = error.constraints ? Object.values(error.constraints).join(", ") : "invalid value"
              return `${property}: ${constraints}`
            })
            .join("; ")

          throw new Error(errorMessage || responseData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        const errorMessage =
          responseData.message ||
          responseData.error ||
          responseData.details ||
          `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      return responseData
    } catch (error) {
      console.error(`API Error for ${url}:`, error)
      throw error
    }
  }

  // Create a backup method for worker assignment
  const directAssignWorker = async (workerId: string, shiftId: string, hourlyRate: number, validStatus: string) => {
    const url = `${API_CONFIG.BASE_URL}/shift-workers`
    const currentDate = new Date()

    const payload = {
      worker_id: workerId,
      shift_id: shiftId,
      hourly_rate: hourlyRate,
      status: validStatus,
      start_time: currentDate,
    }

    console.log("Attempting direct worker assignment with payload:", payload)

    // Use fetchWithErrorHandling for consistent error handling and auth
    try {
      const result = await fetchWithErrorHandling(url, {
        method: "POST",
        headers: {
          "X-Date-Format": "iso",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("Successfully assigned worker using direct method")
      return result
    } catch (error) {
      console.error("Direct assign worker failed:", error)
      throw error
    }
  }

  const ensureValidId = (id: any, fieldName: string): string => {
    if (!id || id === "undefined" || id === "null") {
      throw new Error(`${fieldName} مفقود`)
    }
    const idStr = String(id).trim()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (uuidRegex.test(idStr)) {
      return idStr
    }
    return idStr
  }

  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser")
      if (userData) {
        const user = JSON.parse(userData)
        const mappedUser = {
          worker_id: user.user_id || user.worker_id,
          full_name: user.full_name,
          status: user.role || user.status,
        }
        setCurrentUser(mappedUser)
        if (user.shift) {
          const mappedShift = {
            shift_id: user.shift.shift_id,
            type: user.shift.type || user.shift.shift_type,
            status: user.shift.status || "OPEN",
            start_time: user.shift.start_time,
            opened_by: user.shift.opened_by,
            is_closed: user.shift.is_closed || false,
          }
          setActiveShift(mappedShift)
          setLoadingShift(false)
          return
        }
      }
    } catch (error) {
      console.error("Error getting current user:", error)
    } finally {
      setLoadingShift(false)
    }
  }

  const fetchWorkerDetails = async (workerId: string): Promise<Worker | null> => {
    try {
      const responseData = await fetchWithErrorHandling(`${API_CONFIG.BASE_URL}/workers/${workerId}`)
      if (responseData.success && responseData.data) {
        return responseData.data
      } else if (responseData.worker_id) {
        return responseData as Worker
      }
      return null
    } catch (error) {
      console.error(`Error fetching worker ${workerId}:`, error)
      return null
    }
  }

  const fetchAvailableWorkers = async () => {
    setLoadingWorkers(true)
    try {
      const responseData = await fetchWithErrorHandling(`${API_CONFIG.BASE_URL}/workers`)
      let workers = []
      if (responseData.success && Array.isArray(responseData.data)) {
        workers = responseData.data
      } else if (Array.isArray(responseData)) {
        workers = responseData
      } else if (responseData.data && Array.isArray(responseData.data)) {
        workers = responseData.data
      }
      setAvailableWorkers(Array.isArray(workers) ? workers : [])
    } catch (error) {
      console.error("Error fetching workers:", error)
      setAvailableWorkers([])
    } finally {
      setLoadingWorkers(false)
    }
  }

  const fetchShiftWorkers = async () => {
    if (!activeShift) return
    try {
      const responseData = await fetchWithErrorHandling(
        `${API_CONFIG.BASE_URL}/shift-workers/shift/${activeShift.shift_id}`,
      )
      const workers = Array.isArray(responseData.success ? responseData.data : responseData)
        ? responseData.success
          ? responseData.data
          : responseData
        : []

      // Fetch fresh worker data directly from API to ensure we have the latest
      const workersResponse = await fetchWithErrorHandling(`${API_CONFIG.BASE_URL}/workers`)
      const freshWorkers = workersResponse.success && Array.isArray(workersResponse.data) ? workersResponse.data : []

      // Update our workers list for matching, but avoid updating state if unnecessary
      let workersList = [...availableWorkers]
      if (freshWorkers.length > 0) {
        workersList = freshWorkers
        console.log(`✓ Fetched ${freshWorkers.length} workers directly from API`)
        freshWorkers.forEach((w: Worker, i: number) => {
          console.log(`Worker ${i + 1}: ${w.full_name} (ID: ${w.worker_id}, Rate: ${w.base_hourly_rate})`)
        })

        // Only update availableWorkers state if it's actually different
        // Compare worker IDs to check for differences
        const currentIds = new Set(availableWorkers.map((w) => w.worker_id))
        const newIds = new Set(freshWorkers.map((w) => w.worker_id))

        // Check if the sets are different sizes or have different members
        let needsUpdate = currentIds.size !== newIds.size
        if (!needsUpdate) {
          // Check if all current IDs are in the new set
          for (const id of currentIds) {
            if (!newIds.has(id)) {
              needsUpdate = true
              break
            }
          }
        }

        // Only update state if there's an actual difference
        if (needsUpdate) {
          console.log("Updating available workers state with fresh data")
          setAvailableWorkers(freshWorkers)
        } else {
          console.log("No change in worker data, skipping state update")
        }
      } else {
        console.log("Using existing available workers for matching:", workersList.length)
      }

      // Debug: Let's see what the raw data looks like
      console.log("Raw shift workers data:", workers)
      console.log("Available workers for matching:", workersList)

      if (workers.length > 0) {
        console.log("First shift worker raw data:", workers[0])
        if (workers.length > 1) {
          console.log("Second shift worker raw data:", workers[1])
        }
      }

      // Extract workers from the API response
      const enrichedWorkers = await Promise.all(
        workers.map(async (sw: any) => {
          try {
            // Debug the raw shift worker data to understand what properties are available
            console.log(
              `Raw shift worker data structure:`,
              Object.keys(sw)
                .map((key) => `${key}: ${typeof sw[key]}`)
                .join(", "),
              sw.worker ? `Worker object properties: ${Object.keys(sw.worker).join(", ")}` : "No worker object",
            )

            // Extract worker_id if available
            const workerId = sw.worker_id || "unknown"

            // For debugging purposes, log all available worker IDs
            console.log("Available worker IDs:", workersList.map((w) => w.worker_id).join(", "))

            // First check if we have a saved worker mapping in localStorage
            let savedWorkerId = null
            try {
              const savedWorkerMapping = localStorage.getItem(`shift_worker_${sw.shift_worker_id}`)
              if (savedWorkerMapping) {
                const savedMapping = JSON.parse(savedWorkerMapping)
                if (savedMapping && savedMapping.worker_id) {
                  savedWorkerId = savedMapping.worker_id
                  console.log(
                    `Found saved worker mapping for shift worker ${sw.shift_worker_id} -> worker ${savedMapping.worker_id} (${savedMapping.worker_name || "unknown name"})`,
                  )
                }
              }
            } catch (e) {
              console.warn("Error reading saved worker mapping:", e)
            }

            const standardizedSW: ShiftWorker = {
              shift_worker_id: sw.shift_worker_id || sw.id,
              worker_id: savedWorkerId || sw.worker_id || "unknown", // Use saved mapping if available
              shift_id: sw.shift_id || sw.shift?.shift_id || activeShift.shift_id,
              hourly_rate: Number(sw.hourly_rate) || 0,
              start_time: sw.start_time,
              end_time: sw.end_time,
              hours_worked: sw.hours_worked,
              calculated_salary: sw.calculated_salary,
              is_active: sw.end_time === null,
              created_at: sw.created_at || new Date().toISOString(),
            } // Enhanced worker matching with multiple fallback strategies
            // Step 1: Check if we have a saved worker association in localStorage (already used for worker_id)
            let matchingWorker = null

            // If we have a saved worker ID, use that to find the matching worker
            if (standardizedSW.worker_id !== "unknown") {
              matchingWorker = workersList.find((worker) => worker.worker_id === standardizedSW.worker_id)
              if (matchingWorker) {
                console.log(`✓ Matched using saved worker mapping: ${matchingWorker.full_name}`)
              }
            }

            // Step 2: Try direct ID matching if no match yet
            if (!matchingWorker) {
              matchingWorker = workersList.find((worker) => worker.worker_id === sw.worker_id)
              if (matchingWorker) {
                console.log(`✓ Matched by direct worker_id: ${matchingWorker.full_name}`)
              }
            }

            // Step 3: If no direct match and we have embedded worker data, try with embedded ID
            if (!matchingWorker && sw.worker && sw.worker.worker_id) {
              matchingWorker = workersList.find((worker) => worker.worker_id === sw.worker.worker_id)
              if (matchingWorker) {
                console.log(`✓ Matched by embedded worker_id: ${matchingWorker.full_name}`)
              }
            }

            // Step 4: If we still don't have a match, try name-based matching as a fallback
            if (!matchingWorker && sw.worker && sw.worker.full_name && workersList.length > 0) {
              matchingWorker = workersList.find(
                (worker) =>
                  worker.full_name &&
                  sw.worker.full_name &&
                  worker.full_name.trim().toLowerCase() === sw.worker.full_name.trim().toLowerCase(),
              )
              if (matchingWorker) {
                console.log(`✓ Matched by name: ${sw.worker.full_name} -> ${matchingWorker.full_name}`)
              }
            }

            // If still no match and we have a valid worker_id, try to fetch individual worker details
            if (!matchingWorker && sw.worker_id && sw.worker_id !== "unknown") {
              console.log(`Attempting to fetch individual worker details for worker_id ${sw.worker_id}`)
              matchingWorker = await fetchWorkerDetails(sw.worker_id)

              if (!matchingWorker && sw.shift_worker_id) {
                // Try one more lookup - check if the shift_worker_id is associated with any worker
                console.log(`Trying to lookup worker by shift_worker_id ${sw.shift_worker_id}`)
                try {
                  // Look for workers who might have this shift worker assigned to them
                  const shiftWorkerLookupResponse = await fetchWithErrorHandling(
                    `${API_CONFIG.BASE_URL}/shift-workers/lookup/${sw.shift_worker_id}`,
                  )
                  if (
                    shiftWorkerLookupResponse.success &&
                    shiftWorkerLookupResponse.data &&
                    shiftWorkerLookupResponse.data.worker_id
                  ) {
                    console.log(
                      `✓ Found worker_id ${shiftWorkerLookupResponse.data.worker_id} for shift_worker_id ${sw.shift_worker_id}`,
                    )
                    // Update the worker_id in our data
                    standardizedSW.worker_id = shiftWorkerLookupResponse.data.worker_id
                    // Now fetch the worker details
                    matchingWorker = await fetchWorkerDetails(shiftWorkerLookupResponse.data.worker_id)
                  }
                } catch (lookupError) {
                  console.warn(`Error looking up worker by shift_worker_id: ${lookupError}`)
                }
              }
            }

            // Step 5: Try to match by hourly rate for all workers
            // This is reliable when the API doesn't return worker objects but does return rates
            if (!matchingWorker && sw.hourly_rate && workersList.length > 0) {
              // Convert hourly rate to number for comparison
              const hourlyRate = Number.parseFloat(sw.hourly_rate)
              console.log(`Looking for workers with hourly rate ${hourlyRate}`)

              // Find workers with matching hourly rate
              const candidateWorkers = workersList.filter((worker) => {
                const workerRate = worker.base_hourly_rate || 0
                // Use a stricter match - exact match is better
                const exactMatch = Math.abs(workerRate - hourlyRate) < 0.01
                if (exactMatch) {
                  console.log(`Worker ${worker.full_name} has matching rate ${workerRate}`)
                }
                return worker.base_hourly_rate && exactMatch
              })

              if (candidateWorkers.length === 1) {
                matchingWorker = candidateWorkers[0]
                console.log(`✓ Matched by unique hourly rate: ${sw.hourly_rate} -> ${matchingWorker.full_name}`)
                // Update the worker_id to fix the issue
                standardizedSW.worker_id = matchingWorker.worker_id

                // Save this association for future reference
                try {
                  localStorage.setItem(
                    `shift_worker_${sw.shift_worker_id}`,
                    JSON.stringify({
                      worker_id: matchingWorker.worker_id,
                      worker_name: matchingWorker.full_name,
                      hourly_rate: sw.hourly_rate,
                      matched_by: "unique_hourly_rate",
                      timestamp: new Date().toISOString(),
                    }),
                  )
                } catch (e) {
                  console.error("Error saving shift worker association:", e)
                }
              } else if (candidateWorkers.length > 1) {
                // If we have multiple workers with the same hourly rate, we need more sophisticated matching
                console.log(
                  `⚠ Multiple workers (${candidateWorkers.length}) found with rate ${sw.hourly_rate}, trying additional matching strategies`,
                )

                // Strategy 1: Check if any worker_id matches part of the shift_worker_id
                const idSuffix = sw.shift_worker_id.slice(-6).toLowerCase()
                let exactMatch = candidateWorkers.find(
                  (worker) => worker.worker_id && worker.worker_id.toLowerCase().includes(idSuffix),
                )

                if (exactMatch) {
                  matchingWorker = exactMatch
                  console.log(`✓ Found match among candidates by ID suffix: ${exactMatch.full_name}`)
                  standardizedSW.worker_id = matchingWorker.worker_id
                } else {
                  // Strategy 2: Check if any worker's name appears in any order metadata
                  exactMatch = candidateWorkers.find(
                    (worker) =>
                      sw.metadata &&
                      typeof sw.metadata === "string" &&
                      worker.full_name &&
                      sw.metadata.toLowerCase().includes(worker.full_name.toLowerCase()),
                  )

                  if (exactMatch) {
                    matchingWorker = exactMatch
                    console.log(`✓ Found match through metadata: ${exactMatch.full_name}`)
                    standardizedSW.worker_id = matchingWorker.worker_id
                  } else {
                    // Strategy 3: Try to see if the shift_worker was previously assigned to a specific worker
                    // by checking previous assignments in our worker history
                    const shiftWorkerHistory = localStorage.getItem(`shift_worker_${sw.shift_worker_id}`)
                    if (shiftWorkerHistory) {
                      try {
                        const historyData = JSON.parse(shiftWorkerHistory)
                        if (historyData && historyData.worker_id) {
                          exactMatch = candidateWorkers.find((w) => w.worker_id === historyData.worker_id)
                          if (exactMatch) {
                            matchingWorker = exactMatch
                            console.log(`✓ Found match from local history: ${exactMatch.full_name}`)
                            standardizedSW.worker_id = matchingWorker.worker_id
                          }
                        }
                      } catch (e) {
                        console.warn("Error parsing shift worker history:", e)
                      }
                    }

                    if (!matchingWorker) {
                      console.log(
                        `⚠ Could not automatically determine correct worker among multiple with rate ${sw.hourly_rate}`,
                      )

                      // If we've already tried all automatic matching strategies and failed,
                      // provide UI for manual selection by setting ambiguousWorkers state
                      // This will trigger a dialog for the user to select the correct worker
                      if (candidateWorkers.length > 1) {
                        setAmbiguousWorkers({
                          shiftWorkerId: sw.shift_worker_id,
                          candidates: candidateWorkers,
                          onSelect: (selectedWorkerId) => {
                            console.log(
                              `User manually selected worker ${selectedWorkerId} for shift worker ${sw.shift_worker_id}`,
                            )

                            // Save this selection for future reference
                            try {
                              localStorage.setItem(
                                `shift_worker_${sw.shift_worker_id}`,
                                JSON.stringify({
                                  worker_id: selectedWorkerId,
                                  worker_name: candidateWorkers.find((w) => w.worker_id === selectedWorkerId)
                                    ?.full_name,
                                  hourly_rate: sw.hourly_rate,
                                  assigned_at: new Date().toISOString(),
                                  manually_selected: true,
                                }),
                              )
                            } catch (e) {
                              console.warn("Could not save manual worker selection:", e)
                            }

                            // Refresh data to update UI with the manual selection
                            fetchShiftWorkers()

                            // Clear the dialog
                            setAmbiguousWorkers(null)
                          },
                        })
                      }

                      // Log candidates for debugging
                      candidateWorkers.forEach((w) =>
                        console.log(`- Candidate: ${w.full_name}, ID: ${w.worker_id}, Rate: ${w.base_hourly_rate}`),
                      )
                    }
                  }
                }
              } else {
                console.log(`⚠ No workers found with rate ${sw.hourly_rate}`)
              }
            }

            // Try one more matching strategy: compare the last digits of shift_worker_id with worker names
            // This helps when workers have been previously assigned and their shift_worker_id is in their name
            if (!matchingWorker && sw.shift_worker_id && workersList.length > 0) {
              const lastSixChars = sw.shift_worker_id.slice(-6).toLowerCase()
              const matchingWorkerByIdSuffix = workersList.find(
                (worker) => worker.full_name && worker.full_name.toLowerCase().includes(lastSixChars),
              )

              if (matchingWorkerByIdSuffix) {
                matchingWorker = matchingWorkerByIdSuffix
                console.log(`✓ Matched by ID suffix in name: ${lastSixChars} -> ${matchingWorker.full_name}`)
                standardizedSW.worker_id = matchingWorker.worker_id
              }
            }

            if (matchingWorker) {
              standardizedSW.worker = matchingWorker
              standardizedSW.worker_name = matchingWorker.full_name // Set worker_name for easy access
              console.log(`✓ Successfully matched shift worker ${sw.shift_worker_id} with ${matchingWorker.full_name}`)
            } else {
              // Priority 1: Use embedded worker data if available
              if (sw.worker && sw.worker.full_name) {
                standardizedSW.worker = {
                  worker_id: sw.worker.worker_id || sw.worker_id || `embedded_${sw.shift_worker_id}`,
                  full_name: sw.worker.full_name,
                  status: sw.worker.status || "موظف",
                  base_hourly_rate: sw.worker.base_hourly_rate || standardizedSW.hourly_rate,
                }
                standardizedSW.worker_name = sw.worker.full_name // Set worker_name for easy access
                console.log(
                  `✓ Using embedded worker data for ${sw.worker.full_name} (ID: ${standardizedSW.worker.worker_id})`,
                )
              }
              // Priority 2: Try to get worker info from the direct properties
              else if (sw.worker_name || sw.full_name) {
                const workerName = sw.worker_name || sw.full_name
                standardizedSW.worker = {
                  worker_id: sw.worker_id || `direct_${sw.shift_worker_id}`,
                  full_name: workerName,
                  status: sw.worker_status || "موظف",
                  base_hourly_rate: sw.worker_base_hourly_rate || standardizedSW.hourly_rate,
                }
                standardizedSW.worker_name = workerName // Set worker_name for easy access
                console.log(`✓ Using direct worker properties for ${workerName}`)
              }
              // Last resort: Create a placeholder
              else {
                // Always use shift_worker_id for placeholder creation (more reliable)
                // Take the last 6 characters of the shift_worker_id
                const idSuffix = sw.shift_worker_id ? sw.shift_worker_id.slice(-6) : "unknown"

                // Check if we can find a worker with matching hourly rate as a last resort
                let potentialMatch = null
                if (sw.hourly_rate) {
                  const hourlyRate = Number.parseFloat(sw.hourly_rate)
                  potentialMatch = workersList.find((w) => Math.abs((w.base_hourly_rate || 0) - hourlyRate) < 0.01)
                }

                // If we found a potential match by hourly rate, use that name
                if (potentialMatch) {
                  console.log(
                    `✓ Using worker name from rate match: ${potentialMatch.full_name} (rate: ${potentialMatch.base_hourly_rate})`,
                  )
                  standardizedSW.worker = {
                    worker_id: potentialMatch.worker_id,
                    full_name: potentialMatch.full_name,
                    status: potentialMatch.status || "موظف",
                    base_hourly_rate: potentialMatch.base_hourly_rate,
                  }
                  standardizedSW.worker_name = potentialMatch.full_name

                  // Save this association for future use
                  try {
                    localStorage.setItem(
                      `shift_worker_${sw.shift_worker_id}`,
                      JSON.stringify({
                        worker_id: potentialMatch.worker_id,
                        worker_name: potentialMatch.full_name,
                        hourly_rate: sw.hourly_rate,
                        matched_by: "hourly_rate",
                        timestamp: new Date().toISOString(),
                      }),
                    )
                  } catch (e) {
                    console.error("Error saving shift worker association:", e)
                  }
                } else {
                  // If no match, use a better placeholder with hourly rate info
                  const hourlyInfo = sw.hourly_rate ? ` (${sw.hourly_rate}/hr)` : ""
                  const placeholderName = `موظف #${idSuffix}${hourlyInfo}`

                  standardizedSW.worker = {
                    worker_id: sw.worker_id || `placeholder_${sw.shift_worker_id}`,
                    full_name: placeholderName,
                    status: "موظف",
                    base_hourly_rate: standardizedSW.hourly_rate,
                  }
                  standardizedSW.worker_name = placeholderName // Set worker_name for easy access
                  console.log(
                    `⚠ No worker info available for shift worker ${sw.shift_worker_id}, using placeholder: ${placeholderName}`,
                  )
                }
              }
            }

            return standardizedSW
          } catch (error) {
            console.error("Error processing shift worker:", sw, error)
            return null
          }
        }),
      )

      const validWorkers = enrichedWorkers.filter((sw: ShiftWorker | null): sw is ShiftWorker => sw !== null)

      setShiftWorkers(validWorkers)

      // Convert to simple staff format for components with strict ID preservation
      const convertedStaff: StaffMember[] = validWorkers.map((sw: ShiftWorker) => {
        // Enhanced worker name resolution with multiple fallback strategies
        let workerName = sw.worker?.full_name || sw.worker_name || (sw as any).full_name || (sw as any).name

        // If still no name or it's a placeholder, try to construct from available data
        if (!workerName || workerName.includes("موظف")) {
          // Try to extract from any nested properties
          if (sw.worker && sw.worker.full_name) {
            workerName = sw.worker.full_name
          } else if ((sw as any).worker_name) {
            workerName = (sw as any).worker_name
          } else if ((sw as any).full_name) {
            workerName = (sw as any).full_name
          }

          // Check local storage for previously saved worker association
          try {
            const savedAssociation = localStorage.getItem(`shift_worker_${sw.shift_worker_id}`)
            if (savedAssociation) {
              const workerData = JSON.parse(savedAssociation)
              if (workerData && workerData.worker_name) {
                console.log(`Found saved worker name in local storage: ${workerData.worker_name}`)
                workerName = workerData.worker_name
              }
            }
          } catch (e) {
            console.warn("Error retrieving worker name from local storage:", e)
          }
        }

        // Final fallback to a more descriptive placeholder
        if (
          !workerName ||
          workerName.includes("موظف") ||
          workerName.includes("undefined") ||
          workerName.includes("unknown")
        ) {
          // Try one more time to match by hourly rate
          const hourlyRate = Number.parseFloat(String(sw.hourly_rate)) || 0
          let matchFound = false

          if (hourlyRate > 0 && workersList.length > 0) {
            // Look for a worker with matching hourly rate - last resort
            const matchingWorkers = workersList.filter((worker) => {
              const workerRate = worker.base_hourly_rate || 0
              return Math.abs(workerRate - hourlyRate) < 0.01
            })

            if (matchingWorkers.length === 1) {
              // Only use if exactly one worker matches to avoid confusion
              console.log(`✓ Last chance match by unique hourly rate: ${matchingWorkers[0].full_name}`)
              workerName = matchingWorkers[0].full_name
              matchFound = true
            } else if (matchingWorkers.length > 1) {
              // For multiple matches, try to find the one that was most recently assigned
              console.log(
                `Found ${matchingWorkers.length} workers with rate ${hourlyRate}, checking assignment history`,
              )

              // Check local storage for assignment history
              try {
                const shiftWorkerHistory = localStorage.getItem(`shift_worker_${sw.shift_worker_id}`)
                if (shiftWorkerHistory) {
                  const historyData = JSON.parse(shiftWorkerHistory)
                  if (historyData && historyData.worker_id) {
                    const exactMatch = matchingWorkers.find((w) => w.worker_id === historyData.worker_id)
                    if (exactMatch) {
                      workerName = exactMatch.full_name
                      matchFound = true
                      console.log(`✓ Found exact match from history: ${exactMatch.full_name}`)
                    }
                  }
                }
              } catch (e) {
                console.warn("Error checking assignment history:", e)
              }
            }
          }

          // If still no match, use the placeholder with ID suffix
          if (!matchFound) {
            // Get the last 6 characters of shift_worker_id for consistent naming
            const idSuffix = sw.shift_worker_id ? sw.shift_worker_id.slice(-6) : "unknown"
            workerName = `موظف ${idSuffix}`

            // If we have available workers, try one more time to find a match by ID suffix
            if (workersList.length > 0) {
              for (const worker of workersList) {
                if (
                  worker.full_name &&
                  (worker.full_name.includes(idSuffix) || (worker.worker_id && worker.worker_id.includes(idSuffix)))
                ) {
                  console.log(`Found potential name match: ${worker.full_name} for ID suffix ${idSuffix}`)
                  workerName = worker.full_name
                  break
                }
              }
            }
          }
        }
        console.log(`Converting staff member: ${workerName} (ID: ${sw.shift_worker_id}, Worker ID: ${sw.worker_id})`)
        return {
          id: sw.shift_worker_id, // Use shift_worker_id as the unique identifier
          name: workerName,
          position: sw.worker?.status || "موظف",
          startTime: sw.start_time,
          endTime: sw.end_time,
          hourlyRate: sw.worker?.base_hourly_rate || sw.hourly_rate,
          status: sw.is_active ? "present" : "ended",
          // Add original worker_id for reference
          workerId: sw.worker_id,
        }
      })
      setStaff(convertedStaff)

      console.log(
        "Final converted staff with proper IDs:",
        convertedStaff.map((s) => ({
          name: s.name,
          id: s.id,
          workerId: s.workerId,
          status: s.status,
        })),
      )
    } catch (error) {
      console.error("Error fetching shift workers:", error)
      setShiftWorkers([])
      setStaff([])
    }
  }

  const fetchExpenses = async () => {
    if (!activeShift) {
      setExpenses([])
      return
    }

    setLoadingExpenses(true)
    try {
      const responseData = await fetchWithErrorHandling(`${API_CONFIG.BASE_URL}/expenses`)
      let expensesData = []

      if (Array.isArray(responseData)) {
        expensesData = responseData
      } else if (responseData.data && Array.isArray(responseData.data)) {
        expensesData = responseData.data
      } else if (responseData.success && responseData.data) {
        expensesData = Array.isArray(responseData.data) ? responseData.data : [responseData.data]
      }

      const filteredExpenses = expensesData.filter((expense: any) => {
        if (expense.shift && expense.shift.shift_id) {
          return expense.shift.shift_id === activeShift.shift_id
        }
        if (expense.shift_id) {
          return expense.shift_id === activeShift.shift_id
        }
        return false
      })

      setExpenses(filteredExpenses)
    } catch (error) {
      console.error("Error fetching expenses:", error)
      setExpenses([])
    } finally {
      setLoadingExpenses(false)
    }
  }

  const handleAddExpense = async (expenseData: ExpenseData) => {
    if (!canAccessExpenses) {
      throw new Error("لا تمتلك صلاحية إضافة المصروفات")
    }
    if (!currentUser || !activeShift) {
      throw new Error("لا يوجد مستخدم أو وردية نشطة")
    }

    setIsLoading(true)
    try {
      // Validate required fields on the client side before sending
      if (!expenseData.item) {
        throw new Error("اسم المصروف مطلوب")
      }

      if (!expenseData.amount || expenseData.amount <= 0) {
        throw new Error("يجب أن يكون المبلغ أكبر من صفر")
      }

      const created_by = ensureValidId(currentUser.worker_id, "معرف المستخدم")
      const shift_id = ensureValidId(activeShift.shift_id, "معرف الوردية")

      // Ensure exact field names required by the DTO
      const payload = {
        shift_id: shift_id,
        created_by: created_by,
        title: expenseData.item.trim(),
        description: expenseData.description?.trim() || undefined,
        amount: Number(expenseData.amount),
      }

      console.log("Sending expense payload:", payload)

      // Try the API request
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/expenses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...AuthApiService.createAuthHeaders(),
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("API error response:", errorData)

          // Extract validation errors if available
          if (errorData.errors) {
            const errorMessages = errorData.errors
              .map((error: any) => {
                const property = error.property
                const constraints = Object.values(error.constraints || {}).join(", ")
                return `${property}: ${constraints}`
              })
              .join("; ")

            throw new Error(errorMessages || errorData.message || "خطأ في إضافة المصروف")
          }

          throw new Error(errorData.message || `خطأ: ${response.status}`)
        }

        const responseData = await response.json()
        console.log("Expense added successfully:", responseData)
      } catch (apiError) {
        console.error("API error:", apiError)
        throw apiError
      }

      // Refresh expenses
      await fetchExpenses()
    } catch (error: any) {
      console.error("Error adding expense:", error)
      throw new Error(error.message || "خطأ في إضافة المصروف")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!canAccessExpenses) {
      throw new Error("لا تمتلك صلاحية حذف المصروفات")
    }
    setDeletingExpense(expenseId)
    try {
      await fetchWithErrorHandling(`${API_CONFIG.BASE_URL}/expenses/${expenseId}`, {
        method: "DELETE",
      })
      setExpenses(expenses.filter((e) => e.expense_id !== expenseId))
    } catch (error: any) {
      throw new Error(error.message || "خطأ في حذف المصروف")
    } finally {
      setDeletingExpense(null)
    }
  }

  const assignWorkerToShift = async (workerId: string) => {
    if (!canAccessShiftWorkers) {
      throw new Error("لا تمتلك صلاحية تسجيل حضور الموظفين")
    }
    if (!activeShift || !currentUser) {
      throw new Error("لا توجد وردية نشطة")
    }

    // Check if worker is already assigned using strict worker_id matching
    const isAlreadyAssigned = shiftWorkers.some((sw) => sw.worker_id === workerId && sw.is_active)

    if (isAlreadyAssigned) {
      throw new Error("هذا الموظف مسجل حضوره بالفعل في الوردية")
    }

    // Double-check with staff list to prevent UI inconsistencies
    const isInStaffList = staff.some((s) => s.workerId === workerId && s.status === "present")

    if (isInStaffList) {
      throw new Error("هذا الموظف موجود بالفعل في قائمة الحاضرين")
    }

    setAssigningWorker(workerId)
    try {
      const selectedWorker = availableWorkers.find((w) => w.worker_id === workerId)

      if (!selectedWorker) {
        throw new Error("الموظف المحدد غير موجود")
      }

      const hourlyRate = selectedWorker.base_hourly_rate

      if (!hourlyRate || hourlyRate <= 0) {
        throw new Error("يجب تحديد أجر/ساعة صحيح للموظف")
      }

      // Use the worker's current status from the worker object, or default to WAITER
      let workerStatus = selectedWorker.status

      // Make sure it's a valid enum value
      if (!Object.values(WorkerStatus).includes(workerStatus as any)) {
        // Default to WAITER if invalid status
        workerStatus = WorkerStatus.WAITER
      }

      let success = false
      let errorMessage = ""

      // Try the correct endpoint directly
      try {
        console.log("Assigning worker using shift-workers endpoint")

        // Backend expects special handling for Date objects with class-transformer
        // Create a properly formatted JSON structure for the worker assignment
        const currentDate = new Date()
        const payload = {
          worker_id: workerId,
          shift_id: activeShift.shift_id,
          hourly_rate: hourlyRate,
          status: workerStatus,
          start_time: currentDate,
        }

        console.log("Worker assignment payload:", payload)

        // Add a custom header to indicate this needs special date handling
        const result = await fetchWithErrorHandling(`${API_CONFIG.BASE_URL}/shift-workers`, {
          method: "POST",
          headers: {
            "X-Date-Format": "iso",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        console.log("✅ Worker assigned successfully:", result)
        success = true
      } catch (error1) {
        console.error("❌ Primary assignment method failed:", error1)
        errorMessage = error1 instanceof Error ? error1.message : "Primary assignment failed"

        // Fallback: Try directAssignWorker with explicit status
        try {
          await directAssignWorker(workerId, activeShift.shift_id, hourlyRate, workerStatus)
          success = true
          console.log("✅ Worker assigned using direct method")
        } catch (error2) {
          console.error("❌ All assignment methods failed")
          errorMessage = error2 instanceof Error ? error2.message : "All assignment methods failed"
        }
      }

      if (success) {
        toast({
          title: "تم تسجيل الحضور",
          description: `تم تسجيل حضور ${selectedWorker.full_name} بنجاح`,
        })

        // Refresh data
        await fetchShiftWorkers()
      } else {
        toast({
          title: "خطأ",
          description: errorMessage || "فشل تسجيل الحضور",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error assigning worker:", error)
      toast({
        title: "خطأ",
        description: error.message || "خطأ في تسجيل الحضور",
        variant: "destructive",
      })
    } finally {
      setAssigningWorker(null)
    }
  }

  const handleEndShift = async (staffId: string) => {
    if (!canAccessShiftWorkers) {
      toast({
        title: "خطأ",
        description: "لا تمتلك صلاحية إنهاء مناوبة الموظفين",
        variant: "destructive",
      })
      return
    }
    setEndingWorker(staffId)
    try {
      // Format according to UpdateShiftWorkerEndDto
      await fetchWithErrorHandling(`${API_CONFIG.BASE_URL}/shift-workers/end-time`, {
        method: "PATCH",
        body: JSON.stringify({
          shift_worker_id: staffId,
          end_time: new Date().toISOString(),
        }),
      })

      // Show success notification
      toast({
        title: "تم إنهاء المناوبة",
        description: "تم إنهاء مناوبة الموظف بنجاح",
      })

      await fetchShiftWorkers()
    } catch (error: any) {
      console.error("Error ending worker shift:", error)
      toast({
        title: "خطأ",
        description: error.message || "خطأ في إنهاء المناوبة",
        variant: "destructive",
      })
    } finally {
      setEndingWorker(null)
    }
  }

  // Helper function to check if we have any placeholder worker names
  // Memoize the result to avoid recalculating on every render
  const hasPlaceholderNames = React.useCallback(() => {
    // Count of potential placeholders for debugging
    let placeholderCount = 0

    const result = staff.some((member) => {
      const isPlaceholder =
        member.name.includes("موظف") ||
        member.name.includes("جاري التحميل") ||
        member.name.includes("unknown") ||
        member.name.includes("placeholder") ||
        member.name.includes("#") ||
        !member.workerId ||
        member.workerId === "unknown"

      if (isPlaceholder) placeholderCount++
      return isPlaceholder
    })

    if (result) {
      console.log(`Found ${placeholderCount} placeholder worker names that need refreshing`)
    }

    return result
  }, [staff])

  // Use a ref to track refresh timer
  const refreshTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleRefresh = async () => {
    // Prevent multiple rapid refreshes
    if (isRefreshing) {
      console.log("Refresh already in progress, skipping")
      return
    }

    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    setIsRefreshing(true)
    try {
      // Clear any placeholder names if needed by removing problematic associations
      if (hasPlaceholderNames()) {
        console.log("Detected placeholder names, clearing problematic worker associations")

        // Get all keys from localStorage that match our pattern
        const keysToCheck = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith("shift_worker_")) {
            keysToCheck.push(key)
          }
        }

        // Find associations with placeholder names
        for (const key of keysToCheck) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || "{}")
            if (
              data.worker_name &&
              (data.worker_name.includes("موظف") ||
                data.worker_name.includes("unknown") ||
                data.worker_name.includes("placeholder"))
            ) {
              console.log(`Removing problematic worker association: ${key}`)
              localStorage.removeItem(key)
            }
          } catch (e) {
            console.warn(`Error processing localStorage key ${key}:`, e)
          }
        }
      }

      // Fetch available workers first to ensure we have the latest worker data
      await fetchAvailableWorkers()
      // Then fetch other data with a slight delay to prevent race conditions
      await new Promise((resolve) => setTimeout(resolve, 300))
      await Promise.all([fetchExpenses(), fetchShiftWorkers()])
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)

      // Set a cooldown period before allowing another refresh
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null
      }, 1500)
    }
  }

  // Form handling functions
  const handleFormChange = (field: string, value: string) => {
    setExpenseForm((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev: any) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Basic validation before sending to validateExpenseForm
    if (!expenseForm.item?.trim()) {
      setFormErrors({ item: "اسم المصروف مطلوب" })
      setMessage({ text: "يرجى إدخال اسم المصروف", type: "error" })
      return
    }

    if (!expenseForm.amount || Number.parseFloat(expenseForm.amount) <= 0) {
      setFormErrors({ amount: "يجب أن يكون المبلغ أكبر من صفر" })
      setMessage({ text: "يرجى إدخال مبلغ صحيح", type: "error" })
      return
    }

    // Formal validation using the utility function
    const validation = validateExpenseForm({
      item: expenseForm.item,
      amount: Number.parseFloat(expenseForm.amount) || 0,
      description: expenseForm.description,
    })

    if (!validation.isValid) {
      setFormErrors(validation.errors)
      setMessage({ text: "يرجى تصحيح الأخطاء في النموذج", type: "error" })
      return
    }

    try {
      console.log("Submitting expense form with data:", {
        item: expenseForm.item,
        amount: Number.parseFloat(expenseForm.amount),
        description: expenseForm.description || undefined,
      })

      await handleAddExpense({
        item: expenseForm.item,
        amount: Number.parseFloat(expenseForm.amount),
        description: expenseForm.description || undefined,
      })

      // Clear form on success
      setExpenseForm({
        item: "",
        amount: "",
        description: "",
      })
      setFormErrors({})
      setMessage({ text: "تم إضافة المصروف بنجاح ✓", type: "success" })

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error("Error submitting expense form:", error)
      setMessage({ text: error.message || "خطأ في إضافة المصروف", type: "error" })
    }
  }

  // Report generation function
  const handleGenerateReport = async () => {
    console.log("Report generation started with data:", {
      expensesCount: expenses?.length || 0,
      workersCount: shiftWorkers?.length || 0,
      activeShiftId: activeShift?.shift_id,
    })

    setIsGeneratingReport(true)
    try {
      // Prepare shift data
      const shiftData = activeShift
        ? {
            startTime: activeShift.start_time || new Date().toISOString(),
            endTime: activeShift.is_closed ? new Date().toISOString() : undefined,
            cashierName: currentUser?.full_name || "غير محدد",
            totalHours: activeShift.start_time
              ? calculateWorkHours(activeShift.start_time, activeShift.is_closed ? new Date().toISOString() : undefined)
              : 0,
          }
        : {
            startTime: new Date().toISOString(),
            endTime: undefined,
            cashierName: currentUser?.full_name || "غير محدد",
            totalHours: 0,
          }

      // Prepare expenses data
      console.log("Report Generation Debug:", {
        expensesCount: expenses?.length || 0,
        expensesRaw: expenses,
        workersCount: shiftWorkers?.length || 0,
        workersRaw: shiftWorkers,
      })

      const expensesData = (expenses || []).map((expense) => ({
        id: expense.expense_id,
        item: expense.title,
        amount: Number(expense.amount) || 0, // Convert to number here too!
        description: expense.description,
        timestamp: expense.created_at,
      }))

      console.log("Mapped expenses data:", expensesData)

      // Prepare workers data
      const workersData = shiftWorkers.map((worker) => ({
        id: worker.worker_id,
        name: worker.worker_name || worker.worker?.full_name || "موظف غير محدد",
        hours: worker.hours_worked || calculateWorkHours(worker.start_time, worker.end_time),
        hourlyRate: worker.hourly_rate || 0,
        totalSalary:
          worker.calculated_salary ||
          calculateSalary(
            worker.hours_worked || calculateWorkHours(worker.start_time, worker.end_time),
            worker.hourly_rate || 0,
          ),
        status: worker.is_active ? "present" : "absent",
      }))

      // Generate report
      const report = generateDailyReport(expensesData, workersData, shiftData)
      setReportData(report)
      setShowReportDialog(true)
    } catch (error) {
      console.error("Error generating report:", error)
      setMessage({ text: "خطأ في إنشاء التقرير", type: "error" })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  useEffect(() => {
    getCurrentUser()
    fetchAvailableWorkers()
    // derive permissions once we are on client
    try {
      const perms = AuthApiService.getCashierPermissions()
      setCanAccessExpenses(perms.canAccessExpenses)
      setCanAccessShiftWorkers(perms.canAccessShiftWorkers)
      setHasAnyJournalAccess(perms.canAccessExpenses || perms.canAccessShiftWorkers)
    } catch (e) {
      console.warn("Error determining permissions", e)
    }
  }, [])

  useEffect(() => {
    if (activeShift) {
      fetchExpenses()
      // Fetch shift workers when activeShift changes, but not when availableWorkers changes
      fetchShiftWorkers()
    }
  }, [activeShift]) // Removed availableWorkers from dependencies

  // Automatically update report data when expenses change
  useEffect(() => {
    // Only update if we have a report dialog open and the necessary data
    if (showReportDialog && expenses.length >= 0 && activeShift && currentUser) {
      console.log("Expenses changed, updating report data automatically...")

      // Prepare updated expenses data for report
      const updatedExpensesData = expenses.map((expense: any) => ({
        id: expense.expense_id,
        item: expense.title,
        amount: Number(expense.amount) || 0,
        description: expense.description,
        time: new Date(expense.created_at).toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }))

      // Prepare shift data
      const shiftData = {
        startTime: activeShift.start_time || new Date().toISOString(),
        endTime: activeShift.is_closed ? new Date().toISOString() : undefined,
        cashierName: currentUser.full_name || "غير محدد",
        totalHours: activeShift.start_time
          ? calculateWorkHours(activeShift.start_time, activeShift.is_closed ? new Date().toISOString() : undefined)
          : 0,
      }

      // Prepare workers data
      const workersData = (shiftWorkers || []).map((worker) => ({
        name: worker.worker?.full_name || "غير محدد",
        position: "موظف",
        startTime: worker.start_time || new Date().toISOString(),
        endTime: worker.end_time,
        hourlyRate: worker.worker?.base_hourly_rate || 0,
        status: worker.is_active ? "present" : "absent",
      }))

      try {
        // Generate updated report
        const updatedReport = generateDailyReport(updatedExpensesData, workersData, shiftData)
        setReportData(updatedReport)
        console.log("✅ Report data updated automatically. New total expenses:", updatedReport.summary.totalExpenses)
      } catch (error) {
        console.error("Error updating report data:", error)
      }
    }
  }, [expenses, activeShift, currentUser, shiftWorkers, showReportDialog])

  // Calculate totals for the converted expenses
  const mappedExpenses = expenses.map((expense) => ({
    id: expense.expense_id,
    item: expense.title,
    amount: Number(expense.amount) || 0, // Ensure it's a number
    description: expense.description,
    time: new Date(expense.created_at).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: new Date(expense.created_at).toISOString().split("T")[0],
  }))

  const totalExpenses = mappedExpenses.reduce((sum, expense) => {
    console.log(`Adding expense: ${expense.item} - Amount: ${expense.amount} (type: ${typeof expense.amount})`)
    return sum + expense.amount
  }, 0)

  console.log(`Total expenses calculated: ${totalExpenses} from ${mappedExpenses.length} expenses`)
  console.log("All mapped expenses:", mappedExpenses)
  const totalStaffCost = staff.reduce((total, member) => {
    const hours = calculateWorkHours(member.startTime, member.endTime)
    return total + calculateSalary(hours, member.hourlyRate)
  }, 0)
  const activeStaffCount = staff.filter((member) => member.status === "present").length

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">يومية المصروفات والموظفين</h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || !hasAnyJournalAccess}
                className="flex items-center gap-2 bg-transparent"
                variant="outline"
              >
                {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {isGeneratingReport ? "جاري الإنشاء..." : hasAnyJournalAccess ? "تقرير اليومية" : "لا صلاحية"}
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant={hasPlaceholderNames() ? "default" : "ghost"}
                size="sm"
                className={hasPlaceholderNames() ? "bg-yellow-500 text-white hover:bg-yellow-600" : ""}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                {hasPlaceholderNames() && !isRefreshing ? "تحديث أسماء الموظفين" : ""}
              </Button>
            </div>
          </div>
          <p className="text-gray-600">
            {new Date().toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">الكاشير: </span>
              <span className="font-medium">{currentUser?.full_name || "غير محدد"}</span>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                activeShift ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {activeShift ? `${activeShift.type} - نشطة` : "لا توجد وردية"}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">المصروفات اليوم</p>
                  <p className="text-xl font-bold text-blue-600">{formatEgyptianCurrency(totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">تكلفة الموظفين</p>
                  <p className="text-xl font-bold text-green-600">{formatEgyptianCurrency(totalStaffCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">الموظفين الحاضرين</p>
                  <p className="text-xl font-bold text-purple-600">{activeStaffCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-center">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full bg-transparent"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                تحديث البيانات
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Forms */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Expense Form */}
            {canAccessExpenses ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    إضافة مصروف جديد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {message && (
                    <Alert
                      className={`mb-4 ${message.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}
                    >
                      <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
                        {message.text}
                      </AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="item">اسم المصروف *</Label>
                      <Input
                        id="item"
                        value={expenseForm.item}
                        onChange={(e) => handleFormChange("item", e.target.value)}
                        placeholder="مثال: قهوة، سكر، مناديل"
                        className={formErrors.item ? "border-red-500" : ""}
                      />
                      {formErrors.item && <p className="text-sm text-red-500 mt-1">{formErrors.item}</p>}
                    </div>

                    <div>
                      <Label htmlFor="amount">المبلغ (جنيه) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenseForm.amount}
                        onChange={(e) => handleFormChange("amount", e.target.value)}
                        placeholder="0.00"
                        className={formErrors.amount ? "border-red-500" : ""}
                      />
                      {formErrors.amount && <p className="text-sm text-red-500 mt-1">{formErrors.amount}</p>}
                    </div>

                    <div>
                      <Label htmlFor="description">ملاحظات (اختياري)</Label>
                      <Textarea
                        id="description"
                        value={expenseForm.description}
                        onChange={(e) => handleFormChange("description", e.target.value)}
                        placeholder="تفاصيل إضافية عن المصروف..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة المصروف
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">لا تمتلك صلاحية إضافة المصروفات</CardTitle>
                </CardHeader>
              </Card>
            )}

            {/* Assign Staff Section */}
            {canAccessShiftWorkers ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    تسجيل حضور الموظفين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!activeShift ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>يجب فتح وردية أولاً لتسجيل حضور الموظفين</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {loadingWorkers ? (
                        <div className="text-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-500">جاري التحميل...</p>
                        </div>
                      ) : (
                        availableWorkers
                          .filter(
                            (worker) => !staff.some((s) => s.workerId === worker.worker_id && s.status === "present"),
                          )
                          .map((worker) => (
                            <div
                              key={worker.worker_id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{worker.full_name}</p>
                                <p className="text-sm text-gray-600">{worker.status}</p>
                                <p className="text-xs text-gray-500">
                                  {formatEgyptianCurrency(worker.base_hourly_rate)}/ساعة
                                </p>
                              </div>
                              <Button
                                size="sm"
                                disabled={assigningWorker === worker.worker_id}
                                onClick={() => assignWorkerToShift(worker.worker_id)}
                              >
                                {assigningWorker === worker.worker_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    حضور
                                  </>
                                )}
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">لا تمتلك صلاحية إدارة حضور الموظفين</CardTitle>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Right Column - Lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expenses List */}
            {canAccessExpenses ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      مصروفات اليوم ({mappedExpenses.length})
                    </CardTitle>
                    <div className="bg-blue-50 px-3 py-1 rounded-lg">
                      <span className="text-blue-700 font-semibold">
                        الإجمالي: {formatEgyptianCurrency(totalExpenses)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingExpenses ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                      <p className="text-gray-500">جاري التحميل...</p>
                    </div>
                  ) : mappedExpenses.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">لا توجد مصروفات اليوم</h3>
                      <p className="text-gray-400">ابدأ بإضافة أول مصروف لهذا اليوم</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mappedExpenses.map((expense) => (
                        <div key={expense.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-2">
                                <h4 className="font-medium text-gray-900">{expense.item}</h4>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Receipt className="w-4 h-4" />
                                  <span className="font-semibold text-green-600">
                                    {formatEgyptianCurrency(expense.amount)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{expense.time}</span>
                                </div>
                              </div>

                              {expense.description && (
                                <p className="text-sm text-gray-500 mt-2">{expense.description}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 bg-transparent"
                                disabled={deletingExpense === expense.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Staff Management */}
            {canAccessShiftWorkers ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      إدارة الموظفين ({activeStaffCount} حاضر)
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
                                  <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                                  <AvatarFallback className="bg-blue-100 text-blue-600">
                                    {member.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>

                                <div>
                                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                                  <p className="text-sm text-gray-600">{member.position}</p>
                                  <Badge
                                    className={
                                      member.status === "present"
                                        ? "bg-green-100 text-green-800"
                                        : member.status === "ended"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {member.status === "present"
                                      ? "حاضر"
                                      : member.status === "ended"
                                        ? "انتهت المناوبة"
                                        : "غائب"}
                                  </Badge>
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
                                  بداية:{" "}
                                  {new Date(member.startTime).toLocaleTimeString("ar-EG", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {member.endTime && (
                                    <span className="block">
                                      نهاية:{" "}
                                      {new Date(member.endTime).toLocaleTimeString("ar-EG", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                </div>

                                {member.status === "present" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 text-red-600 hover:text-red-800 hover:bg-red-50 bg-transparent"
                                    disabled={endingWorker === member.id}
                                    onClick={() => handleEndShift(member.id)}
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
            ) : null}
          </div>
        </div>
      </div>

      {/* Journal Daily Report Dialog */}
      <JournalDailyReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        reportData={reportData}
        isLoading={isGeneratingReport}
      />
    </div>
  )
}
