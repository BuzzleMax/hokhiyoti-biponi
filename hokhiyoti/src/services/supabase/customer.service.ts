import { supabase } from '../../lib/supabase'
import type { CustomerProfile } from '../../types/customer.types'
import type { PaginationCursor } from '../../types/pagination.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCustomer(row: any): CustomerProfile {
  return {
    customerKey: row.customer_key,
    customerName: row.customer_name || undefined,
    customerPhone: row.customer_phone || undefined,
    customerEmail: row.customer_email || undefined,
    orderCount: Number(row.order_count || 0),
    lastOrderAt: row.last_order_at || new Date().toISOString(),
    totalSpent: Number(row.total_spent || 0),
  }
}

export const supabaseCustomerService = {
  /**
   * Cursor-paginated customer list derived from orders.
   * Uses the customer_profiles view (created_at DESC, customer_key DESC).
   */
  async getCustomers(
    limit?: number,
    cursor?: PaginationCursor | null
  ): Promise<CustomerProfile[]> {
    let query = supabase
      .from('customer_profiles')
      .select('customer_key, customer_name, customer_phone, customer_email, order_count, last_order_at, total_spent')

    if (cursor) {
      const { createdAt, id } = cursor
      query = query.or(
        `last_order_at.lt."${createdAt}",and(last_order_at.eq."${createdAt}",customer_key.lt."${id}")`
      )
    }

    query = query.order('last_order_at', { ascending: false }).order('customer_key', { ascending: false })

    if (limit !== undefined) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Customer profiles query warning:', error)
      return []
    }

    return (data || []).map(rowToCustomer)
  },

  /**
   * Search customers by name, phone, or email (server-side ilike, cursor-paginated).
   */
  async searchCustomers(
    search: string,
    limit?: number,
    cursor?: PaginationCursor | null
  ): Promise<CustomerProfile[]> {
    const q = search.trim()
    if (!q) return this.getCustomers(limit, cursor)

    let query = supabase
      .from('customer_profiles')
      .select('customer_key, customer_name, customer_phone, customer_email, order_count, last_order_at, total_spent')
      .or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_email.ilike.%${q}%`)

    if (cursor) {
      const { createdAt, id } = cursor
      query = query.or(
        `last_order_at.lt."${createdAt}",and(last_order_at.eq."${createdAt}",customer_key.lt."${id}")`
      )
    }

    query = query.order('last_order_at', { ascending: false }).order('customer_key', { ascending: false })

    if (limit !== undefined) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Customer search query warning:', error)
      return []
    }

    return (data || []).map(rowToCustomer)
  },
}
