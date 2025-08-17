// Centralized Enum Definitions for Order Management System

export enum OrderStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PENDING_CANCELLATION = 'pending_cancellation',
  CANCELLED_APPROVED = 'cancelled_approved'
}

export enum OrderType {
  DINE_IN = 'dine-in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
  CAFE = 'cafe'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MOBILE = 'mobile'
}

export enum CancelRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Note: ShiftStatus and ShiftType are defined in monitoring.ts
// to avoid conflicts - they use different backend values

export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  CASHIER = 'cashier',
  MANAGER = 'manager'
}
