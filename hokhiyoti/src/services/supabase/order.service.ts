import { supabase } from '../../lib/supabase'
import { applyCursorFilter, fetchAllWithCursor } from '../../lib/cursor-pagination'
import type { PaginationCursor } from '../../types/pagination.types'
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
  const rawStatus = (row.order_status as string) || (row.status as string) || 'Confirmed'

  let status: OrderStatus = 'Confirmed'
  if (['Confirmed', 'confirmed', 'lead_created', 'customer_contacted', 'processing', 'pending'].includes(rawStatus)) {
    status = 'Confirmed'
  } else if (['Paid', 'paid', 'packed', 'shipped'].includes(rawStatus)) {
    status = 'Paid'
  } else if (['Completed', 'completed', 'delivered'].includes(rawStatus)) {
    status = 'Completed'
  } else if (['Cancelled', 'cancelled', 'rejected', 'archived'].includes(rawStatus)) {
    status = 'Cancelled'
  } else {
    status = rawStatus as OrderStatus
  }

  const orderId = row.order_id || row.order_number || `HOK-${row.id ? String(row.id).slice(0, 4) : '1042'}`
  const sellingPrice = Number(row.selling_price ?? row.product_price ?? row.total_amount ?? 0)
  const commissionRate = Number(row.commission_rate ?? row.commission_percentage ?? DEFAULT_COMMISSION_FALLBACK)

  let commissionAmount = Number(row.commission_amount ?? 0)
  if (status === 'Cancelled') {
    commissionAmount = 0
  } else if (commissionAmount === 0 && sellingPrice > 0) {
    commissionAmount = Math.round(sellingPrice * (commissionRate / 100))
  }

  const sellerEarnings = sellingPrice - commissionAmount

  return {
    id: row.id,
    orderId,
    orderNumber: row.order_number || orderId,
    productId: row.product_id,
    productName: row.product_name,
    sellingPrice,
    productPrice: sellingPrice,
    commissionRate,
    commissionPercentage: commissionRate,
    commissionAmount,
    sellerEarnings,
    customerName: row.customer_name || 'WhatsApp Customer',
    customerPhone: row.customer_phone || '',
    customerEmail: row.customer_email || undefined,
    customerAddress: row.customer_address || undefined,
    selectedColour: row.selected_colour || undefined,
    selectedSize: row.selected_size || undefined,
    productUrl: row.product_url || undefined,
    customerDetails: typeof row.customer_details === 'object' ? row.customer_details : {},
    status,
    commissionStatus: status === 'Completed' ? 'earned' : status === 'Cancelled' ? 'cancelled' : 'pending',
    paymentStatus: status === 'Paid' || status === 'Completed' ? 'paid' : 'pending',
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
    status: (row.status as OrderStatus) || 'Confirmed',
    changedBy: row.changed_by || 'Admin',
    note: row.note || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  }
}

function deriveCommissionStatus(status: OrderStatus): CommissionStatus {
  switch (status) {
    case 'Confirmed':
    case 'confirmed':
    case 'Paid':
    case 'paid':
      return 'pending'
    case 'Completed':
    case 'completed':
      return 'earned'
    case 'Cancelled':
    case 'cancelled':
    case 'rejected':
      return 'cancelled'
    default:
      return 'none'
  }
}

let cachedCommissionPct: number | null = null

export type GetOrdersParams = {
  includeArchived?: boolean
  tab?: 'active' | 'archived' | 'followup'
  status?: OrderStatus
  search?: string
  limit?: number
  cursor?: PaginationCursor | null
}

export const supabaseOrderService = {
  async getCommissionPercentage(bypassCache = false): Promise<number> {
    if (cachedCommissionPct !== null && !bypassCache) {
      return cachedCommissionPct
    }
    try {
      const { data, error } = await supabase
        .from('marketplace_settings')
        .select('commission_percentage, default_commission_percentage')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !data) {
        return DEFAULT_COMMISSION_FALLBACK
      }
      const pct = data.commission_percentage ?? data.default_commission_percentage
      const finalPct = pct != null ? Number(pct) : DEFAULT_COMMISSION_FALLBACK
      cachedCommissionPct = finalPct
      return finalPct
    } catch {
      return DEFAULT_COMMISSION_FALLBACK
    }
  },

  async setCommissionPercentage(percentage: number): Promise<void> {
    cachedCommissionPct = percentage
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
   * Create an order record when customer initiates WhatsApp purchase flow.
   * Default status: Confirmed.
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const commissionRate = input.commissionRate ?? input.commissionPercentage ?? (await this.getCommissionPercentage(true))
    const sellingPrice = input.sellingPrice ?? input.productPrice
    const status: OrderStatus = input.status || 'Confirmed'
    const commissionAmount = status === 'Cancelled' ? 0 : Math.round(sellingPrice * (commissionRate / 100))
    const sellerEarnings = sellingPrice - commissionAmount

    const generatedFallbackId = `HOK-${Math.floor(1000 + Math.random() * 9000)}`
    const orderIdToUse = input.orderId || generatedFallbackId

    const dbStatus: OrderStatus = status

    const row: Record<string, unknown> = {
      product_id: input.productId,
      product_name: input.productName,
      product_price: sellingPrice,
      selling_price: sellingPrice,
      commission_rate: commissionRate,
      commission_percentage: commissionRate,
      commission_amount: commissionAmount,
      seller_earnings: sellerEarnings,
      customer_name: input.customerName || 'WhatsApp Customer',
      customer_phone: input.customerPhone || '',
      customer_email: input.customerEmail || null,
      customer_address: input.customerAddress || null,
      selected_colour: input.selectedColour || null,
      selected_size: input.selectedSize || null,
      product_url: input.productUrl || null,
      customer_details: input.customerDetails || {},
      order_status: dbStatus,
      commission_status: status === 'Completed' ? 'earned' : status === 'Cancelled' ? 'cancelled' : 'pending',
      payment_status: status === 'Paid' || status === 'Completed' ? 'paid' : 'pending',
      total_amount: sellingPrice,
      whatsapp_message_sent: true,
      whatsapp_message_at: new Date().toISOString(),
      order_id: orderIdToUse,
      order_number: orderIdToUse,
    }

    // Tier 1: Try SECURITY DEFINER RPC first (works for anonymous users and returns exact DB row with sequence order_id)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_public_order', { order_data: row })
      if (!rpcError && rpcData) {
        console.log('Order created via RPC successfully:', rpcData)
        return rowToOrder(rpcData)
      }
    } catch {
      // Fall through to next tier
    }

    // Tier 2: Try standard insert with .select().single() (works for authenticated admins)
    const { data: selectData, error: selectError } = await supabase.from('orders').insert(row).select().single()
    if (!selectError && selectData) {
      return rowToOrder(selectData)
    }

    // Tier 3: Try insert without .select() (works for anonymous users when RLS permits INSERT but denies SELECT)
    const { error: insertError } = await supabase.from('orders').insert(row)
    if (!insertError) {
      console.log('Order inserted successfully (without returning SELECT):', orderIdToUse)
      return rowToOrder({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        ...row,
        order_status: status,
      })
    }

    // Tier 4: Fallback retry with core columns if optional columns are pending in DB schema cache
    const coreRow: Record<string, unknown> = {
      product_id: input.productId,
      product_name: input.productName,
      product_price: sellingPrice,
      customer_name: input.customerName || 'WhatsApp Customer',
      customer_phone: input.customerPhone || '',
      selected_colour: input.selectedColour || null,
      selected_size: input.selectedSize || null,
      product_url: input.productUrl || null,
      order_status: dbStatus,
      whatsapp_message_sent: true,
      whatsapp_message_at: new Date().toISOString(),
    }
    const { error: coreError } = await supabase.from('orders').insert(coreRow)
    if (coreError) {
      console.error('Supabase order creation failed completely:', coreError)
      console.error('Order payload attempted:', coreRow)
      throw new Error(`Failed to create order: ${coreError.message}`)
    }

    console.log('Order inserted successfully with core payload:', orderIdToUse)
    return rowToOrder({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      ...row,
      order_status: status,
    })
  },

  async getOrders(params?: GetOrdersParams | boolean, limit?: number, cursor?: PaginationCursor | null): Promise<Order[]> {
    const opts: GetOrdersParams =
      typeof params === 'boolean'
        ? { includeArchived: params, limit, cursor }
        : { ...(params || {}), limit: params?.limit ?? limit, cursor: params?.cursor ?? cursor }

    console.log('Fetching orders with params:', opts)

    let query = supabase.from('orders').select('*')

    if (opts.tab === 'archived' || opts.includeArchived) {
      if (opts.tab === 'archived') {
        query = query.eq('order_status', 'archived')
      } else if (!opts.includeArchived) {
        query = query.neq('order_status', 'archived')
      }
    } else {
      query = query.neq('order_status', 'archived')
    }

    if (opts.status) {
      const st = opts.status
      query = query.or(`order_status.eq.${st},order_status.eq.${st.toLowerCase()}`)
    }

    const search = opts.search?.trim()
    if (search) {
      query = query.or(
        `order_id.ilike.%${search}%,order_number.ilike.%${search}%,product_name.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%`
      )
    }

    query = applyCursorFilter(query, opts.cursor)
    query = query.order('created_at', { ascending: false }).order('id', { ascending: false })

    if (opts.limit !== undefined) {
      query = query.limit(opts.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      throw new Error(`Failed to fetch orders: ${error.message}. This might be a database permission issue. Run the SQL fix scripts in the supabase folder.`)
    }
    
    console.log('Fetched orders:', data?.length || 0)
    return (data || []).map(rowToOrder)
  },

  /**
   * Update order status.
   * Confirmed = customer confirmed order.
   * Paid = payment received.
   * Completed = order completed.
   * Cancelled = order cancelled (commission = ₹0).
   */
  async updateOrderStatus(id: string, status: OrderStatus, adminNote?: string): Promise<void> {
    // Normalize status to Title Case for consistency
    const normalizedStatus = this._normalizeStatus(status)

    // Fetch existing order details by primary key UUID `id` to preserve historical commission snapshot
    const { data: existing } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()

    const sellingPrice = Number(existing?.selling_price ?? existing?.product_price ?? existing?.total_amount ?? 0)
    const commissionRate = Number(existing?.commission_rate ?? existing?.commission_percentage ?? DEFAULT_COMMISSION_FALLBACK)

    const isCancelled = normalizedStatus === 'Cancelled'
    const commissionAmount = isCancelled ? 0 : Math.round(sellingPrice * (commissionRate / 100))
    const sellerEarnings = sellingPrice - commissionAmount

    const commissionStatus = deriveCommissionStatus(normalizedStatus)
    const paymentStatus = normalizedStatus === 'Paid' || normalizedStatus === 'Completed' ? 'paid' : 'pending'

    const updateData: Record<string, unknown> = {
      order_status: normalizedStatus,
      commission_amount: commissionAmount,
      seller_earnings: sellerEarnings,
      commission_status: commissionStatus,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    }

    if (adminNote !== undefined) {
      updateData.admin_note = adminNote
    }

    // Tier 1: Try SECURITY DEFINER RPC `update_order_status_admin`
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('update_order_status_admin', {
        p_order_id: id,
        p_status: normalizedStatus,
        p_admin_note: adminNote || null,
      })

      if (!rpcError && rpcResult) {
        if (typeof rpcResult === 'object' && (rpcResult as { success?: boolean; error?: string }).success === false) {
          throw new Error(`Status update rejected: ${(rpcResult as { error?: string }).error || 'Unknown RPC error'}`)
        }
        return
      }
    } catch (rpcErr) {
      if (rpcErr instanceof Error && !rpcErr.message.includes('Could not find the function')) {
        throw rpcErr
      }
    }

    // Tier 2: Try SECURITY DEFINER RPC `bulk_update_order_status` (pre-existing in schema)
    try {
      const { error: bulkErr } = await supabase.rpc('bulk_update_order_status', {
        p_order_ids: [id],
        p_status: normalizedStatus,
        p_admin_note: adminNote || null,
      })

      if (!bulkErr) {
        return
      }
    } catch {
      // Fall through to standard update
    }

    // Tier 3: Standard Supabase .update() with .select() to verify row modification
    const { data: updatedRows, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()

    if (updateError) {
      const errMsg = updateError.message || updateError.details || updateError.hint || updateError.code || JSON.stringify(updateError)
      throw new Error(`Database update failed: ${errMsg}`)
    }

    if (!updatedRows || updatedRows.length === 0) {
      throw new Error(`Order status update failed: 0 rows updated for ID ${id}. Verify RLS database permissions.`)
    }

    // Insert timeline entry (best effort)
    try {
      await supabase.from('order_timeline').insert({
        order_id: id,
        status: normalizedStatus,
        changed_by: 'Admin',
        note: adminNote || null,
      })
    } catch {
      // Best effort — timeline table may not exist
    }
  },

  /** Normalize any status variant to Title Case */
  _normalizeStatus(status: OrderStatus | string): OrderStatus {
    const s = String(status).toLowerCase()
    if (['confirmed', 'lead_created', 'customer_contacted', 'processing', 'pending'].includes(s)) return 'Confirmed'
    if (['paid', 'packed', 'shipped'].includes(s)) return 'Paid'
    if (['completed', 'delivered'].includes(s)) return 'Completed'
    if (['cancelled', 'rejected', 'archived'].includes(s)) return 'Cancelled'
    return 'Confirmed'
  },

  /**
   * Get the timeline for a specific order (status history).
   * Per-order volume is small; no pagination needed.
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
   * Fetch seller payout orders with cursor pagination.
   * Only returns orders with active commission lifecycle.
   */
  async getPayouts(
    limit?: number,
    cursor?: PaginationCursor | null,
    paymentStatus?: PaymentStatus | 'all'
  ): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select('*')
      .neq('order_status', 'archived')
      .neq('commission_status', 'none')

    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus)
    }

    query = applyCursorFilter(query, cursor)
    query = query.order('created_at', { ascending: false }).order('id', { ascending: false })

    if (limit !== undefined) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(rowToOrder)
  },

  /**
   * Commission history — cursor-paginated audit trail of commission-bearing orders.
   */
  async getCommissionHistory(
    limit?: number,
    cursor?: PaginationCursor | null,
    commissionStatus?: CommissionStatus | 'all'
  ): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select('*')
      .neq('commission_status', 'none')

    if (commissionStatus && commissionStatus !== 'all') {
      query = query.eq('commission_status', commissionStatus)
    }

    query = applyCursorFilter(query, cursor)
    query = query.order('created_at', { ascending: false }).order('id', { ascending: false })

    if (limit !== undefined) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(rowToOrder)
  },

  /** Load all payout records via cursor pages (for CSV export — no OFFSET). */
  async getAllPayoutsForExport(): Promise<Order[]> {
    return fetchAllWithCursor(
      (cursor, pageSize) => this.getPayouts(pageSize, cursor),
      100
    )
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
   * Get payout summary statistics via indexed SQL aggregation (no full-table scan in app).
   */
  async getPayoutSummary(): Promise<PayoutSummary> {
    const empty: PayoutSummary = {
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

    try {
      const { data, error } = await supabase.rpc('get_payout_summary')
      if (!error && data) {
        const row = Array.isArray(data) ? data[0] : data
        if (row) {
          return {
            pendingAmount: Number(row.pending_amount || 0),
            totalSellerEarnings: Number(row.total_seller_earnings || 0),
            totalCommission: Number(row.total_commission || 0),
            paidAmount: Number(row.paid_amount || 0),
            processingAmount: Number(row.processing_amount || 0),
            pendingCommission: Number(row.pending_commission || 0),
            earnedCommission: Number(row.earned_commission || 0),
            cancelledCommission: Number(row.cancelled_commission || 0),
            rejectedCommission: Number(row.rejected_commission || 0),
          }
        }
      }
    } catch {
      // Fall through to client-side aggregation below
    }

    // Fallback: cursor-paginated aggregation (no OFFSET)
    const summary = { ...empty }
    let cursor: PaginationCursor | null = null
    const pageSize = 200

    for (;;) {
      const page = await this.getPayouts(pageSize, cursor)
      if (page.length === 0) break

      for (const order of page) {
        const earnings = order.sellerEarnings
        const commission = order.commissionAmount
        const commStatus = order.commissionStatus

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

          if (order.paymentStatus === 'processing') {
            summary.processingAmount += earnings
          }
        }
      }

      if (page.length < pageSize) break
      const last = page[page.length - 1]
      if (!last) break
      cursor = { createdAt: last.createdAt, id: last.id }
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

  async archiveOrder(id: string): Promise<void> {
    await this.updateOrderStatus(id, 'archived')
  },

  async restoreOrder(id: string): Promise<void> {
    await this.updateOrderStatus(id, 'lead_created')
  },

  async deleteOrderPermanent(id: string): Promise<void> {
    try {
      await supabase.from('seller_payouts').delete().eq('order_id', id)
    } catch {}
    try {
      await supabase.from('order_timeline').delete().eq('order_id', id)
    } catch {}
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Safe delete for Cancelled orders only.
   * Enforces DB-level and service-level check: order_status must be 'Cancelled'.
   */
  async deleteCancelledOrder(id: string): Promise<{ success: boolean; message: string }> {
    // 1. Service-level verification: check existing order status in database
    const { data: existing, error: fetchErr } = await supabase
      .from('orders')
      .select('id, order_id, order_number, order_status')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr) {
      const msg = fetchErr.message || fetchErr.details || fetchErr.hint || JSON.stringify(fetchErr)
      throw new Error(`Failed to check order status: ${msg}`)
    }

    if (!existing) {
      throw new Error(`Order not found with ID ${id}`)
    }

    const rawStatus = (existing.order_status as string) || ''
    const normalized = this._normalizeStatus(rawStatus as OrderStatus)
    if (normalized !== 'Cancelled') {
      throw new Error(`Cannot delete order: Status is '${normalized}'. Only Cancelled orders can be deleted.`)
    }

    const displayId = existing.order_id || existing.order_number || `HOK-${id.slice(0, 4)}`

    // Tier 1: Try SECURITY DEFINER RPC `delete_cancelled_order_admin`
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_cancelled_order_admin', {
        p_order_id: id,
      })

      if (!rpcError && rpcResult) {
        if (typeof rpcResult === 'object' && (rpcResult as { success?: boolean; error?: string }).success === false) {
          throw new Error((rpcResult as { error?: string }).error || 'Database rejected deletion.')
        }
        const rpcMessage = typeof rpcResult === 'object' && (rpcResult as { message?: string }).message
        return {
          success: true,
          message: rpcMessage || `Order ${displayId} deleted successfully.`,
        }
      }

      if (rpcError && !rpcError.message.includes('Could not find the function')) {
        throw new Error(rpcError.message || rpcError.details || rpcError.hint || JSON.stringify(rpcError))
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('Could not find the function')) {
        throw err
      }
    }

    // Tier 2: Direct Supabase DELETE guarded by eq('order_status', 'Cancelled') and RLS
    try {
      await supabase.from('seller_payouts').delete().eq('order_id', id)
    } catch {}
    try {
      await supabase.from('order_timeline').delete().eq('order_id', id)
    } catch {}

    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('order_status', 'Cancelled')

    if (deleteError) {
      const msg = deleteError.message || deleteError.details || deleteError.hint || deleteError.code || JSON.stringify(deleteError)
      throw new Error(`Failed to delete cancelled order: ${msg}`)
    }

    return {
      success: true,
      message: `Order ${displayId} deleted successfully.`,
    }
  },

  async bulkArchiveOrders(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: 'archived', updated_at: new Date().toISOString() })
      .in('id', ids)
    if (error) throw error
  },

  async bulkRestoreOrders(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: 'lead_created', updated_at: new Date().toISOString() })
      .in('id', ids)
    if (error) throw error
  },

  async bulkDeleteOrdersPermanent(ids: string[]): Promise<void> {
    try {
      await supabase.from('seller_payouts').delete().in('order_id', ids)
    } catch {}
    try {
      await supabase.from('order_timeline').delete().in('order_id', ids)
    } catch {}
    const { error } = await supabase.from('orders').delete().in('id', ids)
    if (error) throw error
  },

  /**
   * Calculate monthly commission dashboard metrics for owner:
   * - Confirmed sales: total value of orders with status Confirmed, Paid, or Completed
   * - Completed sales: total value of Completed orders
   * - Your commission: commission generated from Completed orders
   * - Paid to you: amount of commission manually marked as already paid to owner
   * - Remaining: Your commission - Paid to you
   */
  async getCommissionDashboard(year?: number, month?: number): Promise<{
    monthYearLabel: string
    confirmedSales: number
    completedSales: number
    yourCommission: number
    paidToYou: number
    remaining: number
  }> {
    const currentDate = new Date()
    const targetYear = year ?? currentDate.getFullYear()
    const targetMonth = month ?? (currentDate.getMonth() + 1)

    const dateObj = new Date(targetYear, targetMonth - 1, 1)
    const monthYearLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' })

    const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0).toISOString()
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999).toISOString()

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const orders = ordersData ? ordersData.map(rowToOrder) : []

    let confirmedSales = 0
    let completedSales = 0
    let yourCommission = 0

    for (const o of orders) {
      const s = String(o.status).toLowerCase()
      if (['confirmed', 'paid', 'completed'].includes(s)) {
        confirmedSales += o.sellingPrice
      }
      if (s === 'completed') {
        completedSales += o.sellingPrice
        yourCommission += o.commissionAmount
      }
    }

    const { data: paymentsData } = await supabase
      .from('commission_payments')
      .select('amount, payment_date')

    let paidToYou = 0
    if (paymentsData) {
      for (const p of paymentsData) {
        paidToYou += Number(p.amount || 0)
      }
    }

    const remaining = yourCommission - paidToYou

    return {
      monthYearLabel,
      confirmedSales,
      completedSales,
      yourCommission,
      paidToYou,
      remaining,
    }
  },

  async getCommissionPayments(): Promise<Array<{
    id: string
    amount: number
    paymentDate: string
    notes?: string
    createdAt: string
  }>> {
    const { data, error } = await supabase
      .from('commission_payments')
      .select('*')
      .order('payment_date', { ascending: false })

    if (error || !data) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((r: any) => ({
      id: r.id,
      amount: Number(r.amount),
      paymentDate: r.payment_date || r.created_at,
      notes: r.notes || '',
      createdAt: r.created_at,
    }))
  },

  async addCommissionPayment(amount: number, notes?: string, paymentDate?: string): Promise<{
    id: string
    amount: number
    paymentDate: string
    notes?: string
    createdAt: string
  }> {
    const row = {
      amount,
      notes: notes || '',
      payment_date: paymentDate || new Date().toISOString(),
    }
    const { data, error } = await supabase.from('commission_payments').insert(row).select().single()
    if (error) throw error
    return {
      id: data.id,
      amount: Number(data.amount),
      paymentDate: data.payment_date,
      notes: data.notes,
      createdAt: data.created_at,
    }
  },

  async deleteCommissionPayment(id: string): Promise<void> {
    const { error } = await supabase.from('commission_payments').delete().eq('id', id)
    if (error) throw error
  },
}
