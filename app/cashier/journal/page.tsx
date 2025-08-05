"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatEgyptianCurrency, validateExpenseForm, calculateWorkHours, calculateSalary } from "@/lib/utils"
import { generateDailyReport, ReportData } from "@/lib/utils"
import { JournalDailyReportDialog } from "@/components/reports/DailyReportDialog"
import { 
  Plus, 
  Minus, 
  Trash2, 
  Edit, 
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
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Coffee,
  Lightbulb,
  Wrench,
  Home,
  Truck,
  Phone,
  Car,
  MoreVertical,
  FileText,
  BarChart3
} from "lucide-react"

const API_BASE_URL = "http://20.77.41.130:3000/api/v1"

// Simple expense categories
const expenseCategories = [
  { value: "food_supplies", label: "مواد غذائية", icon: ShoppingCart, color: "bg-green-500" },
  { value: "beverages", label: "مشروبات", icon: Coffee, color: "bg-blue-500" },
  { value: "utilities", label: "مرافق", icon: Lightbulb, color: "bg-yellow-500" },
  { value: "maintenance", label: "صيانة", icon: Wrench, color: "bg-red-500" },
  { value: "cleaning", label: "تنظيف", icon: Home, color: "bg-purple-500" },
  { value: "delivery", label: "توصيل", icon: Truck, color: "bg-orange-500" },
  { value: "packaging", label: "تغليف", icon: Package, color: "bg-indigo-500" },
  { value: "communication", label: "اتصالات", icon: Phone, color: "bg-pink-500" },
  { value: "fuel", label: "وقود", icon: Car, color: "bg-gray-500" },
  { value: "other", label: "أخرى", icon: MoreVertical, color: "bg-slate-500" }
]

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
  category: string
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
    shiftWorkerId: string;
    candidates: Worker[];
    onSelect: (workerId: string) => void;
  } | null>(null)

  // Form state for adding expenses
  const [expenseForm, setExpenseForm] = useState({
    category: "",
    item: "",
    amount: "",
    description: ""
  })
  const [formErrors, setFormErrors] = useState<any>({})
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  // Report state
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // API utility functions
  const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
    try {
      console.log(`Making request to: ${url}`, options)
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      })
      console.log(`Response from ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })
      const responseData = await response.json()
      console.log(`Response data from ${url}:`, responseData)
      if (!response.ok) {
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
      const responseData = await fetchWithErrorHandling(`${API_BASE_URL}/workers/${workerId}`)
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
      const responseData = await fetchWithErrorHandling(`${API_BASE_URL}/workers`)
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
      const responseData = await fetchWithErrorHandling(`${API_BASE_URL}/shift-workers/shift/${activeShift.shift_id}`)
      const workers = Array.isArray(responseData.success ? responseData.data : responseData)
        ? responseData.success ? responseData.data : responseData
        : []

      // Fetch fresh worker data directly from API to ensure we have the latest
      const workersResponse = await fetchWithErrorHandling(`${API_BASE_URL}/workers`)
      const freshWorkers = workersResponse.success && Array.isArray(workersResponse.data) 
        ? workersResponse.data 
        : []
      
      // Update our available workers with fresh data
      let workersList = [...availableWorkers]
      if (freshWorkers.length > 0) {
        workersList = freshWorkers
        console.log(`✓ Fetched ${freshWorkers.length} workers directly from API`)
        freshWorkers.forEach((w: Worker, i: number) => {
          console.log(`Worker ${i+1}: ${w.full_name} (ID: ${w.worker_id}, Rate: ${w.base_hourly_rate})`)
        })
      } else {
        console.log("Using existing available workers for matching:", workersList.length)
      }

      // Debug: Let's see what the raw data looks like
      console.log("First shift worker raw data:", workers[0])
      if (workers.length > 1) {
        console.log("Second shift worker raw data:", workers[1])
      }

      // Extract workers from the API response
      const enrichedWorkers = await Promise.all(
        workers.map(async (sw: any) => {
          try {
            // Debug the raw shift worker data to understand what properties are available
            console.log(`Raw shift worker data structure:`, 
              Object.keys(sw).map(key => `${key}: ${typeof sw[key]}`).join(', '),
              sw.worker ? `Worker object properties: ${Object.keys(sw.worker).join(', ')}` : 'No worker object'
            );
            
            // Extract worker_id if available
            const workerId = sw.worker_id || "unknown";
            
            // For debugging purposes, log all available worker IDs
            console.log("Available worker IDs:", workersList.map(w => w.worker_id).join(", "));
            
            const standardizedSW: ShiftWorker = {
              shift_worker_id: sw.shift_worker_id || sw.id,
              worker_id: sw.worker_id || "unknown",
              shift_id: sw.shift_id || sw.shift?.shift_id || activeShift.shift_id,
              hourly_rate: Number(sw.hourly_rate) || 0,
              start_time: sw.start_time,
              end_time: sw.end_time,
              hours_worked: sw.hours_worked,
              calculated_salary: sw.calculated_salary,
              is_active: sw.end_time === null,
              created_at: sw.created_at || new Date().toISOString(),
            }

            // Enhanced worker matching with multiple fallback strategies
            let matchingWorker = workersList.find((worker) => worker.worker_id === sw.worker_id)
            
            // If no direct match and we have embedded worker data, try with embedded ID
            if (!matchingWorker && sw.worker && sw.worker.worker_id) {
              matchingWorker = workersList.find((worker) => worker.worker_id === sw.worker.worker_id)
            }

            // If we still don't have a match, try name-based matching as a fallback
            if (!matchingWorker && sw.worker && sw.worker.full_name && workersList.length > 0) {
              matchingWorker = workersList.find((worker) => 
                worker.full_name && 
                sw.worker.full_name && 
                worker.full_name.trim().toLowerCase() === sw.worker.full_name.trim().toLowerCase()
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
                  const shiftWorkerLookupResponse = await fetchWithErrorHandling(`${API_BASE_URL}/shift-workers/lookup/${sw.shift_worker_id}`)
                  if (shiftWorkerLookupResponse.success && shiftWorkerLookupResponse.data && shiftWorkerLookupResponse.data.worker_id) {
                    console.log(`✓ Found worker_id ${shiftWorkerLookupResponse.data.worker_id} for shift_worker_id ${sw.shift_worker_id}`)
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

            // Try to match by hourly rate for all workers, not just when worker_id is unknown
            // This is more reliable when the API doesn't return worker objects
            if (!matchingWorker && sw.hourly_rate && workersList.length > 0) {
              // Convert hourly rate to number for comparison
              const hourlyRate = parseFloat(sw.hourly_rate);
              console.log(`Looking for workers with hourly rate ${hourlyRate}`);
              
              // Find workers with matching hourly rate
              const candidateWorkers = workersList.filter(worker => {
                const workerRate = worker.base_hourly_rate || 0;
                const matches = Math.abs(workerRate - hourlyRate) < 0.01;
                console.log(`Worker ${worker.full_name} has rate ${workerRate}, match: ${matches}`);
                return worker.base_hourly_rate && matches;
              });
              
              if (candidateWorkers.length === 1) {
                matchingWorker = candidateWorkers[0];
                console.log(`✓ Matched by unique hourly rate: ${sw.hourly_rate} -> ${matchingWorker.full_name}`);
                // Update the worker_id to fix the issue
                standardizedSW.worker_id = matchingWorker.worker_id;
              } else if (candidateWorkers.length > 1) {
                // If we have multiple workers with the same hourly rate, we need more sophisticated matching
                console.log(`⚠ Multiple workers (${candidateWorkers.length}) found with rate ${sw.hourly_rate}, trying additional matching strategies`);
                
                // Strategy 1: Check if any worker_id matches part of the shift_worker_id
                const idSuffix = sw.shift_worker_id.slice(-6).toLowerCase();
                let exactMatch = candidateWorkers.find(worker => 
                  worker.worker_id && worker.worker_id.toLowerCase().includes(idSuffix)
                );
                
                if (exactMatch) {
                  matchingWorker = exactMatch;
                  console.log(`✓ Found match among candidates by ID suffix: ${exactMatch.full_name}`);
                  standardizedSW.worker_id = matchingWorker.worker_id;
                } else {
                  // Strategy 2: Check if any worker's name appears in any order metadata
                  exactMatch = candidateWorkers.find(worker =>
                    sw.metadata && 
                    typeof sw.metadata === 'string' && 
                    worker.full_name && 
                    sw.metadata.toLowerCase().includes(worker.full_name.toLowerCase())
                  );
                  
                  if (exactMatch) {
                    matchingWorker = exactMatch;
                    console.log(`✓ Found match through metadata: ${exactMatch.full_name}`);
                    standardizedSW.worker_id = matchingWorker.worker_id;
                  } else {
                    // Strategy 3: Try to see if the shift_worker was previously assigned to a specific worker
                    // by checking previous assignments in our worker history
                    const shiftWorkerHistory = localStorage.getItem(`shift_worker_${sw.shift_worker_id}`);
                    if (shiftWorkerHistory) {
                      try {
                        const historyData = JSON.parse(shiftWorkerHistory);
                        if (historyData && historyData.worker_id) {
                          exactMatch = candidateWorkers.find(w => w.worker_id === historyData.worker_id);
                          if (exactMatch) {
                            matchingWorker = exactMatch;
                            console.log(`✓ Found match from local history: ${exactMatch.full_name}`);
                            standardizedSW.worker_id = matchingWorker.worker_id;
                          }
                        }
                      } catch (e) {
                        console.warn("Error parsing shift worker history:", e);
                      }
                    }
                    
                    if (!matchingWorker) {
                      console.log(`⚠ Could not automatically determine correct worker among multiple with rate ${sw.hourly_rate}`);
                      
                      // If we've already tried all automatic matching strategies and failed,
                      // provide UI for manual selection by setting ambiguousWorkers state
                      // This will trigger a dialog for the user to select the correct worker
                      if (candidateWorkers.length > 1) {
                        setAmbiguousWorkers({
                          shiftWorkerId: sw.shift_worker_id,
                          candidates: candidateWorkers,
                          onSelect: (selectedWorkerId) => {
                            console.log(`User manually selected worker ${selectedWorkerId} for shift worker ${sw.shift_worker_id}`);
                            
                            // Save this selection for future reference
                            try {
                              localStorage.setItem(`shift_worker_${sw.shift_worker_id}`, JSON.stringify({
                                worker_id: selectedWorkerId,
                                worker_name: candidateWorkers.find(w => w.worker_id === selectedWorkerId)?.full_name,
                                hourly_rate: sw.hourly_rate,
                                assigned_at: new Date().toISOString(),
                                manually_selected: true
                              }));
                            } catch (e) {
                              console.warn("Could not save manual worker selection:", e);
                            }
                            
                            // Refresh data to update UI with the manual selection
                            fetchShiftWorkers();
                            
                            // Clear the dialog
                            setAmbiguousWorkers(null);
                          }
                        });
                      }
                      
                      // Log candidates for debugging
                      candidateWorkers.forEach(w => 
                        console.log(`- Candidate: ${w.full_name}, ID: ${w.worker_id}, Rate: ${w.base_hourly_rate}`)
                      );
                    }
                  }
                }
              } else {
                console.log(`⚠ No workers found with rate ${sw.hourly_rate}`);
              }
            }
            
            // Try one more matching strategy: compare the last digits of shift_worker_id with worker names
            // This helps when workers have been previously assigned and their shift_worker_id is in their name
            if (!matchingWorker && sw.shift_worker_id && workersList.length > 0) {
              const lastSixChars = sw.shift_worker_id.slice(-6).toLowerCase();
              const matchingWorkerByIdSuffix = workersList.find(worker => 
                worker.full_name && worker.full_name.toLowerCase().includes(lastSixChars)
              );
              
              if (matchingWorkerByIdSuffix) {
                matchingWorker = matchingWorkerByIdSuffix;
                console.log(`✓ Matched by ID suffix in name: ${lastSixChars} -> ${matchingWorker.full_name}`);
                standardizedSW.worker_id = matchingWorker.worker_id;
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
                console.log(`✓ Using embedded worker data for ${sw.worker.full_name} (ID: ${standardizedSW.worker.worker_id})`)
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
                const idSuffix = sw.shift_worker_id ? sw.shift_worker_id.slice(-6) : "unknown";
                const placeholderName = `موظف ${idSuffix}`;
                
                standardizedSW.worker = {
                  worker_id: sw.worker_id || `placeholder_${sw.shift_worker_id}`,
                  full_name: placeholderName,
                  status: "موظف",
                  base_hourly_rate: standardizedSW.hourly_rate,
                }
                standardizedSW.worker_name = placeholderName // Set worker_name for easy access
                console.log(`⚠ No worker info available for shift worker ${sw.shift_worker_id}, using placeholder: ${placeholderName}`)
              }
            }

            return standardizedSW
          } catch (error) {
            console.error("Error processing shift worker:", sw, error)
            return null
          }
        })
      )

      const validWorkers = enrichedWorkers.filter((sw: ShiftWorker | null): sw is ShiftWorker => sw !== null)

      setShiftWorkers(validWorkers)
      
      // Convert to simple staff format for components with strict ID preservation
      const convertedStaff: StaffMember[] = validWorkers.map((sw: ShiftWorker) => {
        // Enhanced worker name resolution with multiple fallback strategies
        let workerName = sw.worker?.full_name || 
                         sw.worker_name || 
                         (sw as any).full_name || 
                         (sw as any).name
        
        // If still no name or it's a placeholder, try to construct from available data
        if (!workerName || workerName.includes('موظف')) {
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
            const savedAssociation = localStorage.getItem(`shift_worker_${sw.shift_worker_id}`);
            if (savedAssociation) {
              const workerData = JSON.parse(savedAssociation);
              if (workerData && workerData.worker_name) {
                console.log(`Found saved worker name in local storage: ${workerData.worker_name}`);
                workerName = workerData.worker_name;
              }
            }
          } catch (e) {
            console.warn("Error retrieving worker name from local storage:", e);
          }
        }
        
          // Final fallback to a more descriptive placeholder
          if (!workerName || workerName.includes('موظف') || workerName.includes('undefined') || workerName.includes('unknown')) {
            // Try one more time to match by hourly rate
            const hourlyRate = parseFloat(String(sw.hourly_rate)) || 0;
            let matchFound = false;
            
            if (hourlyRate > 0 && workersList.length > 0) {
              // Look for a worker with matching hourly rate - last resort
              const matchingWorkers = workersList.filter(worker => {
                const workerRate = worker.base_hourly_rate || 0;
                return Math.abs(workerRate - hourlyRate) < 0.01;
              });
              
              if (matchingWorkers.length === 1) {
                // Only use if exactly one worker matches to avoid confusion
                console.log(`✓ Last chance match by unique hourly rate: ${matchingWorkers[0].full_name}`);
                workerName = matchingWorkers[0].full_name;
                matchFound = true;
              } else if (matchingWorkers.length > 1) {
                // For multiple matches, try to find the one that was most recently assigned
                console.log(`Found ${matchingWorkers.length} workers with rate ${hourlyRate}, checking assignment history`);
                
                // Check local storage for assignment history
                try {
                  const shiftWorkerHistory = localStorage.getItem(`shift_worker_${sw.shift_worker_id}`);
                  if (shiftWorkerHistory) {
                    const historyData = JSON.parse(shiftWorkerHistory);
                    if (historyData && historyData.worker_id) {
                      const exactMatch = matchingWorkers.find(w => w.worker_id === historyData.worker_id);
                      if (exactMatch) {
                        workerName = exactMatch.full_name;
                        matchFound = true;
                        console.log(`✓ Found exact match from history: ${exactMatch.full_name}`);
                      }
                    }
                  }
                } catch (e) {
                  console.warn("Error checking assignment history:", e);
                }
              }
            }
            
            // If still no match, use the placeholder with ID suffix
            if (!matchFound) {
              // Get the last 6 characters of shift_worker_id for consistent naming
              const idSuffix = sw.shift_worker_id ? sw.shift_worker_id.slice(-6) : "unknown";
              workerName = `موظف ${idSuffix}`;
              
              // If we have available workers, try one more time to find a match by ID suffix
              if (workersList.length > 0) {
                for (const worker of workersList) {
                  if (worker.full_name && (
                      worker.full_name.includes(idSuffix) || 
                      (worker.worker_id && worker.worker_id.includes(idSuffix))
                    )) {
                    console.log(`Found potential name match: ${worker.full_name} for ID suffix ${idSuffix}`);
                    workerName = worker.full_name;
                    break;
                  }
                }
              }
            }
          }          console.log(`Converting staff member: ${workerName} (ID: ${sw.shift_worker_id}, Worker ID: ${sw.worker_id})`)
                  return {
          id: sw.shift_worker_id, // Use shift_worker_id as the unique identifier
          name: workerName,
          position: sw.worker?.status || "موظف",
          startTime: sw.start_time,
          endTime: sw.end_time,
          hourlyRate: sw.worker?.base_hourly_rate || sw.hourly_rate,
          status: sw.is_active ? "present" : "ended",
          // Add original worker_id for reference
          workerId: sw.worker_id
        }
      })
      setStaff(convertedStaff)
      
      console.log("Final converted staff with proper IDs:", convertedStaff.map(s => ({
        name: s.name,
        id: s.id,
        workerId: s.workerId,
        status: s.status
      })))
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
      const responseData = await fetchWithErrorHandling(`${API_BASE_URL}/expenses`)
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
    if (!currentUser || !activeShift) {
      throw new Error("لا يوجد مستخدم أو وردية نشطة")
    }

    setIsLoading(true)
    try {
      const created_by = ensureValidId(currentUser.worker_id, "معرف المستخدم")
      const shift_id = ensureValidId(activeShift.shift_id, "معرف الوردية")

      const payload: any = {
        title: expenseData.item.trim(),
        description: expenseData.description?.trim() || undefined,
        amount: expenseData.amount,
        created_by: created_by,
        shift_id: shift_id,
        category: expenseData.category
      }

      await fetchWithErrorHandling(`${API_BASE_URL}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      fetchExpenses()
    } catch (error: any) {
      throw new Error(error.message || "خطأ في إضافة المصروف")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    setDeletingExpense(expenseId)
    try {
      await fetchWithErrorHandling(`${API_BASE_URL}/expenses/${expenseId}`, {
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
    if (!activeShift || !currentUser) {
      throw new Error("لا توجد وردية نشطة")
    }

    // Check if worker is already assigned using strict worker_id matching
    const isAlreadyAssigned = shiftWorkers.some((sw) => 
      sw.worker_id === workerId && sw.is_active
    )
    
    if (isAlreadyAssigned) {
      throw new Error("هذا الموظف مسجل حضوره بالفعل في الوردية")
    }

    // Double-check with staff list to prevent UI inconsistencies
    const isInStaffList = staff.some((s) => 
      s.workerId === workerId && s.status === "present"
    )
    
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

      const payload = {
        worker_id: workerId,
        shift_id: activeShift.shift_id,
        hourly_rate: hourlyRate,
        start_time: new Date().toISOString(),
        status: "ACTIVE",
        is_active: true,
      }

      console.log(`Assigning worker ${selectedWorker.full_name} (ID: ${workerId}) to shift`)

      const response = await fetchWithErrorHandling(`${API_BASE_URL}/shift-workers`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      
      // If we have a successful response with shift_worker_id, save this worker association
      // to local storage for future reference when matching
      if (response && response.data && response.data.shift_worker_id) {
        try {
          const shiftWorkerId = response.data.shift_worker_id;
          localStorage.setItem(`shift_worker_${shiftWorkerId}`, JSON.stringify({
            worker_id: workerId,
            worker_name: selectedWorker.full_name,
            hourly_rate: hourlyRate,
            assigned_at: new Date().toISOString()
          }));
          console.log(`✓ Saved worker association for future matching: ${selectedWorker.full_name} -> ${shiftWorkerId}`);
        } catch (storageError) {
          console.warn("Could not save worker association to local storage:", storageError);
        }
      }

      console.log(`✓ Worker ${selectedWorker.full_name} successfully assigned to shift`)
      await fetchShiftWorkers()
    } catch (error: any) {
      throw new Error(error.message || "خطأ في تسجيل الحضور")
    } finally {
      setAssigningWorker(null)
    }
  }

  const handleEndShift = async (staffId: string) => {
    setEndingWorker(staffId)
    try {
      await fetchWithErrorHandling(`${API_BASE_URL}/shift-workers/end-time`, {
        method: "PATCH",
        body: JSON.stringify({
          shift_worker_id: staffId,
          end_time: new Date().toISOString(),
        }),
      })
      await fetchShiftWorkers()
    } catch (error: any) {
      throw new Error(error.message || "خطأ في إنهاء الوردية")
    } finally {
      setEndingWorker(null)
    }
  }

  // Helper function to check if we have any placeholder worker names
  const hasPlaceholderNames = () => {
    return staff.some(member => 
      member.name.includes('موظف #') || 
      member.name.includes('جاري التحميل')
    )
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Fetch available workers first to ensure we have the latest worker data
      await fetchAvailableWorkers()
      // Then fetch other data
      await Promise.all([fetchExpenses(), fetchShiftWorkers()])
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Form handling functions
  const handleFormChange = (field: string, value: string) => {
    setExpenseForm(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev: any) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    
    // Validate form
    const validation = validateExpenseForm({
      item: expenseForm.item,
      amount: parseFloat(expenseForm.amount) || 0,
      category: expenseForm.category,
      description: expenseForm.description
    })
    
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      setMessage({ text: "يرجى تصحيح الأخطاء في النموذج", type: 'error' })
      return
    }

    try {
      await handleAddExpense({
        item: expenseForm.item,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description || undefined
      })
      
      // Clear form on success
      setExpenseForm({
        category: "",
        item: "",
        amount: "",
        description: ""
      })
      setFormErrors({})
      setMessage({ text: "تم إضافة المصروف بنجاح ✓", type: 'success' })
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ text: error.message || "خطأ في إضافة المصروف", type: 'error' })
    }
  }

  // Report generation function
  const handleGenerateReport = async () => {
    console.log('Report generation started with data:', {
      expensesCount: expenses?.length || 0,
      workersCount: shiftWorkers?.length || 0,
      activeShiftId: activeShift?.shift_id
    })

    setIsGeneratingReport(true)
    try {
      // Prepare shift data
      const shiftData = activeShift ? {
        startTime: activeShift.start_time || new Date().toISOString(),
        endTime: activeShift.is_closed ? new Date().toISOString() : undefined,
        cashierName: currentUser?.full_name || 'غير محدد',
        totalHours: activeShift.start_time ? 
          calculateWorkHours(activeShift.start_time, activeShift.is_closed ? new Date().toISOString() : undefined) : 0
      } : {
        startTime: new Date().toISOString(),
        endTime: undefined,
        cashierName: currentUser?.full_name || 'غير محدد',
        totalHours: 0
      }

      // Prepare expenses data
      console.log('Report Generation Debug:', {
        expensesCount: expenses?.length || 0,
        expensesRaw: expenses,
        workersCount: shiftWorkers?.length || 0,
        workersRaw: shiftWorkers
      })

      const expensesData = (expenses || []).map(expense => ({
        id: expense.expense_id,
        category: expense.category || 'other',
        item: expense.title,
        amount: expense.amount,
        description: expense.description,
        timestamp: expense.created_at
      }))

      console.log('Mapped expenses data:', expensesData)

      // Prepare workers data
      const workersData = shiftWorkers.map(worker => ({
        id: worker.worker_id,
        name: worker.worker_name || worker.worker?.full_name || 'موظف غير محدد',
        hours: worker.hours_worked || calculateWorkHours(worker.start_time, worker.end_time),
        hourlyRate: worker.hourly_rate || 0,
        totalSalary: worker.calculated_salary || calculateSalary(
          worker.hours_worked || calculateWorkHours(worker.start_time, worker.end_time),
          worker.hourly_rate || 0
        ),
        status: worker.is_active ? 'present' : 'absent'
      }))

      // Generate report
      const report = generateDailyReport(expensesData, workersData, shiftData)
      setReportData(report)
      setShowReportDialog(true)
    } catch (error) {
      console.error("Error generating report:", error)
      setMessage({ text: "خطأ في إنشاء التقرير", type: 'error' })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  useEffect(() => {
    getCurrentUser()
    fetchAvailableWorkers()
  }, [])

  useEffect(() => {
    if (activeShift) {
      fetchExpenses()
      // Always try to fetch shift workers, regardless of availableWorkers state
      fetchShiftWorkers()
    }
  }, [activeShift, availableWorkers])

  // Calculate totals for the converted expenses
  const mappedExpenses = expenses.map(expense => ({
    id: expense.expense_id,
    item: expense.title,
    amount: expense.amount,
    category: expense.category || "أخرى",
    description: expense.description,
    time: new Date(expense.created_at).toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    date: new Date(expense.created_at).toISOString().split('T')[0]
  }))

  const totalExpenses = mappedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalStaffCost = staff.reduce((total, member) => {
    const hours = calculateWorkHours(member.startTime, member.endTime)
    return total + calculateSalary(hours, member.hourlyRate)
  }, 0)
  const activeStaffCount = staff.filter(member => member.status === "present").length

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              يومية المصروفات والموظفين
            </h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="flex items-center gap-2"
                variant="outline"
              >
                {isGeneratingReport ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {isGeneratingReport ? "جاري الإنشاء..." : "تقرير اليومية"}
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="ghost"
                size="sm"
                className={hasPlaceholderNames() ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : ""}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {hasPlaceholderNames() && !isRefreshing ? "تحديث الأسماء" : ""}
              </Button>
            </div>
          </div>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('ar-EG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">الكاشير: </span>
              <span className="font-medium">{currentUser?.full_name || "غير محدد"}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              activeShift ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
            }`}>
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
                className="w-full"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  إضافة مصروف جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                {message && (
                  <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                    <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category">الفئة *</Label>
                    <Select 
                      value={expenseForm.category} 
                      onValueChange={(value) => handleFormChange('category', value)}
                    >
                      <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="اختر فئة المصروف" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="item">اسم المصروف *</Label>
                    <Input
                      id="item"
                      value={expenseForm.item}
                      onChange={(e) => handleFormChange('item', e.target.value)}
                      placeholder="مثال: قهوة، سكر، مناديل"
                      className={formErrors.item ? 'border-red-500' : ''}
                    />
                    {formErrors.item && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.item}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="amount">المبلغ (جنيه) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenseForm.amount}
                      onChange={(e) => handleFormChange('amount', e.target.value)}
                      placeholder="0.00"
                      className={formErrors.amount ? 'border-red-500' : ''}
                    />
                    {formErrors.amount && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.amount}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">ملاحظات (اختياري)</Label>
                    <Textarea
                      id="description"
                      value={expenseForm.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
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

            {/* Assign Staff Section */}
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
                    <AlertDescription>
                      يجب فتح وردية أولاً لتسجيل حضور الموظفين
                    </AlertDescription>
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
                        .filter(worker => !staff.some(s => s.workerId === worker.worker_id && s.status === "present"))
                        .map((worker) => (
                          <div key={worker.worker_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{worker.full_name}</p>
                              <p className="text-sm text-gray-600">{worker.status}</p>
                              <p className="text-xs text-gray-500">{formatEgyptianCurrency(worker.base_hourly_rate)}/ساعة</p>
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
          </div>

          {/* Right Column - Lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expenses List */}
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
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{expense.item}</h4>
                              <Badge className="bg-gray-100 text-gray-800">
                                {expense.category}
                              </Badge>
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
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
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

            {/* Staff Management */}
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
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <h4 className="font-medium text-gray-900">{member.name}</h4>
                                <p className="text-sm text-gray-600">{member.position}</p>
                                <Badge className={
                                  member.status === "present" ? "bg-green-100 text-green-800" :
                                  member.status === "ended" ? "bg-blue-100 text-blue-800" :
                                  "bg-red-100 text-red-800"
                                }>
                                  {member.status === "present" ? "حاضر" :
                                   member.status === "ended" ? "انتهت المناوبة" :
                                   "غائب"}
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
