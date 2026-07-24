export type OrderStatus =
  | 'lead_created'
  | 'customer_contacted'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'rejected'
  | 'archived'
  // Legacy statuses kept for backward compatibility with existing DB rows
  | 'pending'
  | 'processing'

export type CommissionStatus = 'none' | 'pending' | 'earned' | 'cancelled' | 'rejected' | 'paid'

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed'

export type PaymentMethod = 'UPI' | 'Bank Transfer' | 'Cash' | 'Other' | string

export type Order = {
  id: string
  orderNumber?: string
  productId: string
  productName: string
  productPrice: number
  commissionPercentage: number
  commissionAmount: number
  sellerEarnings: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string
  selectedColour?: string
  selectedSize?: string
  productUrl?: string
  customerDetails?: Record<string, unknown>
  status: OrderStatus
  commissionStatus: CommissionStatus
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  referenceNumber?: string
  paidAt?: string
  notes?: string
  adminNote?: string
  createdAt: string
  updatedAt: string
}

export type CreateOrderInput = {
  productId: string
  productName: string
  productPrice: number
  commissionPercentage: number
  commissionAmount: number
  sellerEarnings: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string
  selectedColour?: string
  selectedSize?: string
  productUrl?: string
  customerDetails?: Record<string, unknown>
}

export type OrderTimeline = {
  id: string
  orderId: string
  status: OrderStatus
  changedBy: string
  note?: string
  createdAt: string
}

export type PayoutSummary = {
  pendingAmount: number
  totalSellerEarnings: number
  totalCommission: number
  paidAmount: number
  processingAmount: number
  // New commission breakdown
  pendingCommission: number
  earnedCommission: number
  cancelledCommission: number
  rejectedCommission: number
}

export type OrderStatusCounts = {
  leadsCreated: number
  customerContacted: number
  confirmed: number
  packed: number
  shipped: number
  delivered: number
  cancelled: number
  rejected: number
  archived: number
  total: number
}
