export type OrderStatus =
  | 'Confirmed'
  | 'Paid'
  | 'Completed'
  | 'Cancelled'
  | 'confirmed'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'lead_created'
  | 'customer_contacted'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'rejected'
  | 'archived'
  | 'pending'
  | 'processing'

export type CommissionStatus = 'none' | 'pending' | 'earned' | 'cancelled' | 'rejected' | 'paid'

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed'

export type PaymentMethod = 'UPI' | 'Bank Transfer' | 'Cash' | 'Other' | string

export type Order = {
  id: string
  orderId: string
  orderNumber?: string
  productId: string
  productName: string
  sellingPrice: number
  productPrice: number
  commissionRate: number
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
  orderId?: string
  productId: string
  productName: string
  productPrice: number
  sellingPrice?: number
  commissionRate?: number
  commissionPercentage?: number
  commissionAmount?: number
  sellerEarnings?: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string
  selectedColour?: string
  selectedSize?: string
  productUrl?: string
  customerDetails?: Record<string, unknown>
  status?: OrderStatus
}

export type CommissionPayment = {
  id: string
  amount: number
  paymentDate: string
  notes?: string
  createdAt: string
}

export type OwnerCommissionSummary = {
  monthYearLabel: string
  confirmedSales: number
  completedSales: number
  yourCommission: number
  paidToYou: number
  remaining: number
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
  pendingCommission: number
  earnedCommission: number
  cancelledCommission: number
  rejectedCommission: number
}

export type OrderStatusCounts = {
  confirmed: number
  paid: number
  completed: number
  cancelled: number
  total: number
}
