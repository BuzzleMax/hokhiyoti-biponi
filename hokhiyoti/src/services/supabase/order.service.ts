import { supabase } from '../../lib/supabase'
import type {
  Order,
  CreateOrderInput,
  OrderStatus,
  CommissionStatus,
  PaymentStatus,
  PayoutSummary,
  OrderTimeline,
} from '../../types/order.types'

const DEFAULT_COMMISSION_FALLBACK = 10

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(row: any): Order {
  // Normalize legacy statuses to new values
  let status: OrderStatus = (row.order_status as OrderStatus) || (row.status as OrderStatus) || 'lead_created'
  if (status === 'pending') status = 'lead_created'
  if (status === 'processing') status = 'confirmed'

  return {
    id: row.id,
    orderNumber: row.order_number || undefined,
    productId: row.product_id,
    productName: row.product_name,
    productPrice: Number(row.product_price),
    commissionPercentage: Number(row.commission_percentage ?? DEFAULT_COMMISSION_FALLBACK),
    commissionAmount: Number(row.commission_amount ?? 0),
    sellerEarnings: Number(row.seller_earnings ?? row.product_price),
    customerName: row.customer_name || undefined,
    customerPhone: row.customer_phone || undefined,
    customerEmail: row.customer_email || undefined,
    customerAddress: row.customer_address || undefined,
    selectedColour: row.selected_colour || undefined,
    selectedSize: row.selected_size || undefined,
    productUrl: row.product_url || undefined,
    customerDetails: typeof row.customer_details === 'object' ? row.customer_details : {},
    status,
    commissionStatus: (row.commission_status as CommissionStatus) || 'none',
    paymentStatus: (row.payment_status as PaymentStatus) || 'pending',
    paymentMethod: row.payment_method || undefined,
    referenceNumber: row.reference_number || undefined,
    paidAt: row.paid_at || undefined,
    notes: row.notes || undefined,
    adminNote: row.admin_note || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTimeline(row: any): OrderTimeline {
  return {
    id: row.id,
    orderId: row.order_id,
    status: (row.status as OrderStatus) || 'lead_created',
    changedBy: row.changed_by || 'Admin',
    note: row.note || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  }
}

/**
 * Derive the commission_status from a given order status.
 * This is the single source of truth for the commission lifecycle.
 */
function deriveCommissionStatus(status: OrderStatus): CommissionStatus {
  switch (status) {
    case 'confirmed':
    case 'packed':
    case 'shipped':
      return 'pending'
    case 'delivered':
      return 'earned'
    case 'cancelled':
      return 'cancelled'
    case 'rejected':
      return 'rejected'
    default:
      // lead_created, customer_contacted, pending (legacy)
      return 'none'
  }
}

export const supabaseOrderService = {
  /**
   * Fetch the current marketplace commission percentage from marketplace_settings.
   * Falls back to 10% if not set.
   */
  async getCommissionPercentage(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('marketplace_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !data) {
        return DEFAULT_COMMISSION_FALLBACK
      }
      const pct = data.commission_percentage ?? data.default_commission_percentage
      return pct != null ? Number(pct) : DEFAULT_COMMISSION_FALLBACK
    } catch {
      return DEFAULT_COMMISSION_FALLBACK
    }
  },

  /**
   * Update the marketplace commission percentage in marketplace_settings.
   */
  async setCommissionPercentage(percentage: number): Promise<void> {
    const { data: existing } = await supabase
      .from('marketplace_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('marketplace_settings')
        .update({
          commission_percentage: percentage,
          default_commission_percentage: percentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('marketplace_settings')
        .insert({
          commission_percentage: percentage,
          default_commission_percentage: percentage,
        })
      if (error) throw error
    }
  },

  /**
   * Create a new ORDER LEAD.
   * Status = lead_created. Commission = none. Revenue = 0.
   * Commission is NOT counted until admin confirms the order.
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const row = {
      product_id: input.productId,
      product_name: input.productName,
      product_price: input.productPrice,
      commission_percentage: input.commissionPercentage,
      commission_amount: input.commissionAmount,
      seller_earnings: input.sellerEarnings,
      customer_name: input.customerName || 'WhatsApp Customer',
      customer_phone: input.customerPhone || '',
      customer_email: input.customerEmail || null,
      customer_address: input.customerAddress || null,
      selected_colour: input.selectedColour || null,
      selected_size: input.selectedSize || null,
      product_url: input.productUrl || null,
      customer_details: input.customerDetails || {},
      order_status: 'lead_created',
      commission_status: 'none',  // Commission NOT counted yet
      payment_status: 'pending',
      total_amount: input.productPrice,
      whatsapp_message_sent: true,
      whatsapp_message_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('orders').insert(row).select().single()
    if (error) throw error

    // Create initial timeline entry for the lead
    try {
      await supabase.from('order_timeline').insert({
        order_id: data.id,
        status: 'lead_created',
        changed_by: 'Customer (WhatsApp)',
        note: 'Order lead created when customer clicked Buy',
      })
    } catch {
      // Timeline insert failure should not block order creation
    }

    return rowToOrder(data)
  },

  /**
   * Fetch all orders (admin panel), most recent first.
   */
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(rowToOrder)
  },

  /**
   * Update order status — handles the FULL commission lifecycle.
   *
   * confirmed  → commission_status = pending  (create seller_payout)
   * delivered  → commission_status = earned
   * cancelled  → commission_status = cancelled (remove from revenue)
   * rejected   → commission_status = rejected  (remove from revenue)
   * others     → commission_status = none (lead_created, customer_contacted)
   *            or pending (packed, shipped)
   */
  async updateOrderStatus(id: string, status: OrderStatus, adminNote?: string): Promise<void> {
    const commissionStatus = deriveCommissionStatus(status)

    const updateData: Record<string, unknown> = {
      order_status: status,
      commission_status: commissionStatus,
      updated_at: new Date().toISOString(),
    }

    if (adminNote !== undefined) {
      updateData.admin_note = adminNote
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    // Insert timeline entry
    try {
      await supabase.from('order_timeline').insert({
        order_id: id,
        status,
        changed_by: 'Admin',
        note: adminNote || null,
      })
    } catch {
      // Timeline insert failure should not block status update
    }

    // Manage seller_payouts based on commission lifecycle
    if (status === 'confirmed') {
      // Order confirmed — create or update seller_payout as pending
      try {
        // Fetch the order to get amounts
        const { data: orderRow } = await supabase
          .from('orders')
          .select('product_id, product_name, seller_earnings, commission_amount, commission_percentage')
          .eq('id', id)
          .single()

        if (orderRow) {
          // Upsert seller_payout: delete existing then insert fresh to avoid duplicates
          await supabase.from('seller_payouts').delete().eq('order_id', id)
          await supabase.from('seller_payouts').insert({
            order_id: id,
            product_id: orderRow.product_id,
            product_name: orderRow.product_name,
            seller_amount: orderRow.seller_earnings,
            commission_amount: orderRow.commission_amount,
            commission_percentage: orderRow.commission_percentage,
            payment_status: 'pending',
          })
        }
      } catch {
        // seller_payouts sync is best-effort
      }
    } else if (status === 'cancelled' || status === 'rejected') {
      // Remove seller_payout entry — commission is cancelled
      try {
        await supabase.from('seller_payouts').delete().eq('order_id', id)
      } catch {
        // Best-effort
      }
    }
  },

  /**
   * Get the timeline for a specific order (status history).
   */
  async getOrderTimeline(orderId: string): Promise<OrderTimeline[]> {
    const { data, error } = await supabase
      .from('order_timeline')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map(rowToTimeline)
  },

  /**
   * Fetch seller payouts/orders.
   */
  async getPayouts(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(rowToOrder)
  },

  /**
   * Update payout payment status (admin action).
   */
  async updatePayoutPaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    paymentDetails?: {
      paymentMethod?: string
      referenceNumber?: string
      notes?: string
    }
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    }

    if (paymentStatus === 'paid') {
      updateData.paid_at = new Date().toISOString()
      updateData.commission_status = 'paid'
    } else if (paymentStatus === 'pending') {
      updateData.paid_at = null
    }

    if (paymentDetails?.paymentMethod !== undefined) {
      updateData.payment_method = paymentDetails.paymentMethod
    }
    if (paymentDetails?.referenceNumber !== undefined) {
      updateData.reference_number = paymentDetails.referenceNumber
    }
    if (paymentDetails?.notes !== undefined) {
      updateData.notes = paymentDetails.notes
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    // Sync seller_payouts table as well
    try {
      const payoutUpdate: Record<string, unknown> = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      }
      if (paymentStatus === 'paid') payoutUpdate.paid_at = new Date().toISOString()
      if (paymentDetails?.paymentMethod) payoutUpdate.payment_method = paymentDetails.paymentMethod
      if (paymentDetails?.referenceNumber) payoutUpdate.reference_number = paymentDetails.referenceNumber
      if (paymentDetails?.notes) payoutUpdate.notes = paymentDetails.notes

      await supabase.from('seller_payouts').update(payoutUpdate).eq('order_id', id)
    } catch {
      // Ignore if sync error
    }
  },

  /**
   * Get payout summary statistics.
   * Only counts orders where commission is active (not 'none').
   */
  async getPayoutSummary(): Promise<PayoutSummary> {
    const { data, error } = await supabase
      .from('orders')
      .select('seller_earnings, commission_amount, payment_status, commission_status, order_status')

    if (error) throw error

    const summary: PayoutSummary = {
      pendingAmount: 0,
      totalSellerEarnings: 0,
      totalCommission: 0,
      paidAmount: 0,
      processingAmount: 0,
      pendingCommission: 0,
      earnedCommission: 0,
      cancelledCommission: 0,
      rejectedCommission: 0,
    }

    for (const row of data || []) {
      const earnings = Number(row.seller_earnings) || 0
      const commission = Number(row.commission_amount) || 0
      const commStatus: CommissionStatus = (row.commission_status as CommissionStatus) || 'none'

      // Only include in totals if commission is active
      if (commStatus !== 'none') {
        summary.totalSellerEarnings += earnings
        summary.totalCommission += commission

        if (commStatus === 'pending') {
          summary.pendingCommission += commission
          summary.pendingAmount += earnings
        } else if (commStatus === 'earned') {
          summary.earnedCommission += commission
        } else if (commStatus === 'paid') {
          summary.earnedCommission += commission
          summary.paidAmount += earnings
        } else if (commStatus === 'cancelled') {
          summary.cancelledCommission += commission
        } else if (commStatus === 'rejected') {
          summary.rejectedCommission += commission
        }

        if (row.payment_status === 'processing') {
          summary.processingAmount += earnings
        }
      }
    }

    return summary
  },

  /**
   * Export payouts as CSV string.
   */
  exportPayoutsCSV(orders: Order[]): string {
    const headers = [
      'Order ID',
      'Date',
      'Product Name',
      'Product Price (₹)',
      'Commission %',
      'Commission Amount (₹)',
      'Seller Earnings (₹)',
      'Customer',
      'Order Status',
      'Commission Status',
      'Payment Status',
      'Payment Method',
      'Reference Number',
      'Paid At',
      'Notes',
    ]

    const rows = orders.map((order) => [
      order.orderNumber || order.id,
      new Date(order.createdAt).toLocaleDateString('en-IN'),
      order.productName,
      order.productPrice.toString(),
      order.commissionPercentage.toString(),
      order.commissionAmount.toString(),
      order.sellerEarnings.toString(),
      order.customerName || 'WhatsApp Customer',
      order.status,
      order.commissionStatus,
      order.paymentStatus,
      order.paymentMethod || '',
      order.referenceNumber || '',
      order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : '',
      order.notes || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return csvContent
  },
}
