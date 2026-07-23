import { supabase } from '../../lib/supabase'
import type { AnalyticsOverview } from '../../types/analytics.types'

/**
 * Determines whether an order's revenue/commission should be counted
 * based on the marketplace workflow rules.
 *
 * Revenue Rules:
 * - lead_created / customer_contacted → Revenue = 0
 * - confirmed / packed / shipped      → Revenue = Pending
 * - delivered                         → Revenue = Earned (counted)
 * - cancelled / rejected              → Revenue Removed (not counted)
 */
function isEarnedRevenue(orderStatus: string): boolean {
  return orderStatus === 'delivered'
}

function isActiveCommission(commissionStatus: string): boolean {
  // Count pending + earned + paid commission (not none/cancelled/rejected)
  return commissionStatus === 'pending' || commissionStatus === 'earned' || commissionStatus === 'paid'
}

export const supabaseAnalyticsService = {
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*'),
      ])

      const orders = ordersRes.data || []
      const products = productsRes.data || []

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

      // --- Order counts by status ---
      let leadsCreated = 0
      let customerContacted = 0
      let confirmedOrders = 0
      let packedOrders = 0
      let shippedOrders = 0
      let deliveredOrders = 0
      let cancelledOrders = 0
      let rejectedOrders = 0

      // --- Revenue (only delivered orders) ---
      let todayRevenue = 0
      let monthlyRevenue = 0
      let totalRevenue = 0

      // --- Commission breakdown by commission_status ---
      let pendingCommission = 0
      let earnedCommission = 0
      let cancelledCommission = 0
      let rejectedCommission = 0
      let paidCommission = 0
      let totalCommission = 0

      // --- Today/Monthly totals (only count confirmed+ orders) ---
      let todayOrders = 0
      let monthlyOrders = 0
      let totalOrders = 0
      let todayCommission = 0
      let monthlyCommission = 0

      let sellerEarnings = 0
      let pendingPayouts = 0

      const categoryRevenueMap: Record<string, { orderCount: number; totalRevenue: number }> = {}

      orders.forEach((o) => {
        const orderTime = new Date(o.created_at || Date.now()).getTime()
        const price = Number(o.product_price || o.total_amount || 0)
        const comm = Number(o.commission_amount || 0)
        const earnings = Number(o.seller_earnings || price - comm)
        const orderStatus: string = o.order_status || 'lead_created'
        const commStatus: string = o.commission_status || 'none'

        totalOrders++

        // Count by status
        if (orderStatus === 'lead_created' || orderStatus === 'pending') leadsCreated++
        else if (orderStatus === 'customer_contacted') customerContacted++
        else if (orderStatus === 'confirmed' || orderStatus === 'processing') confirmedOrders++
        else if (orderStatus === 'packed') packedOrders++
        else if (orderStatus === 'shipped') shippedOrders++
        else if (orderStatus === 'delivered') deliveredOrders++
        else if (orderStatus === 'cancelled') cancelledOrders++
        else if (orderStatus === 'rejected') rejectedOrders++

        // Revenue: only count delivered orders
        if (isEarnedRevenue(orderStatus)) {
          totalRevenue += price
          sellerEarnings += earnings

          if (orderTime >= startOfMonth) {
            monthlyOrders += 1
            monthlyRevenue += price
          }
          if (orderTime >= startOfToday) {
            todayOrders += 1
            todayRevenue += price
          }
        }

        // Commission breakdown
        if (commStatus === 'pending') {
          pendingCommission += comm
          pendingPayouts += earnings
          totalCommission += comm
          if (orderTime >= startOfMonth) monthlyCommission += comm
          if (orderTime >= startOfToday) todayCommission += comm
        } else if (commStatus === 'earned') {
          earnedCommission += comm
          totalCommission += comm
          if (orderTime >= startOfMonth) monthlyCommission += comm
          if (orderTime >= startOfToday) todayCommission += comm
        } else if (commStatus === 'paid') {
          paidCommission += comm
          earnedCommission += comm
          totalCommission += comm
          if (orderTime >= startOfMonth) monthlyCommission += comm
          if (orderTime >= startOfToday) todayCommission += comm
        } else if (commStatus === 'cancelled') {
          cancelledCommission += comm
        } else if (commStatus === 'rejected') {
          rejectedCommission += comm
        }
      })

      const averageOrderValue = deliveredOrders > 0 ? Math.round(totalRevenue / deliveredOrders) : 0

      // Best selling products — only delivered orders count
      const productSalesMap: Record<string, { soldCount: number; revenue: number }> = {}
      orders.forEach((o) => {
        const orderStatus: string = o.order_status || 'lead_created'
        if (!isEarnedRevenue(orderStatus) || !o.product_id) return
        const pId = o.product_id
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = { soldCount: 0, revenue: 0 }
        }
        productSalesMap[pId].soldCount += Number(o.quantity || 1)
        productSalesMap[pId].revenue += Number(o.product_price || 0)
      })

      const bestSellingProducts = products
        .map((p) => {
          const sales = productSalesMap[p.id] || { soldCount: p.sold_count || 0, revenue: (p.sold_count || 0) * (p.price || 0) }
          return {
            id: p.id,
            name: p.name,
            price: Number(p.price || 0),
            soldCount: sales.soldCount,
            revenue: sales.revenue,
            imageUrl: Array.isArray(p.images) && p.images[0] ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url) : undefined,
          }
        })
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5)

      // Top categories — only delivered orders
      orders.forEach((o) => {
        const orderStatus: string = o.order_status || 'lead_created'
        if (!isEarnedRevenue(orderStatus)) return
        const catName = o.category_name || 'General Collections'
        if (!categoryRevenueMap[catName]) {
          categoryRevenueMap[catName] = { orderCount: 0, totalRevenue: 0 }
        }
        categoryRevenueMap[catName].orderCount += 1
        categoryRevenueMap[catName].totalRevenue += Number(o.product_price || 0)
      })

      const topCategories = Object.entries(categoryRevenueMap)
        .map(([categoryName, data]) => ({
          categoryName,
          orderCount: data.orderCount,
          totalRevenue: data.totalRevenue,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)

      // Monthly graph points (last 6 months) — only earned revenue
      const revenueGraph: Array<{ label: string; revenue: number }> = []
      const commissionGraph: Array<{ label: string; commission: number }> = []

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthLabel = d.toLocaleString('en-US', { month: 'short' })
        const mStart = d.getTime()
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59).getTime()

        let mRev = 0
        let mComm = 0

        orders.forEach((o) => {
          const orderStatus: string = o.order_status || 'lead_created'
          const commStatus: string = o.commission_status || 'none'
          const t = new Date(o.created_at || Date.now()).getTime()
          if (t >= mStart && t <= mEnd) {
            if (isEarnedRevenue(orderStatus)) {
              mRev += Number(o.product_price || 0)
            }
            if (isActiveCommission(commStatus)) {
              mComm += Number(o.commission_amount || 0)
            }
          }
        })

        revenueGraph.push({ label: monthLabel, revenue: mRev })
        commissionGraph.push({ label: monthLabel, commission: mComm })
      }

      return {
        todayOrders,
        monthlyOrders,
        totalOrders,
        todayRevenue,
        monthlyRevenue,
        totalRevenue,
        todayCommission,
        monthlyCommission,
        totalCommission,
        pendingCommission,
        earnedCommission,
        cancelledCommission,
        rejectedCommission,
        paidCommission,
        sellerEarnings,
        pendingPayouts,
        averageOrderValue,
        leadsCreated,
        customerContacted,
        confirmedOrders,
        packedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        rejectedOrders,
        bestSellingProducts,
        topCategories,
        revenueGraph,
        commissionGraph,
      }
    } catch (err) {
      console.warn('Failed to load analytics overview:', err)
      return {
        todayOrders: 0,
        monthlyOrders: 0,
        totalOrders: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        totalRevenue: 0,
        todayCommission: 0,
        monthlyCommission: 0,
        totalCommission: 0,
        pendingCommission: 0,
        earnedCommission: 0,
        cancelledCommission: 0,
        rejectedCommission: 0,
        paidCommission: 0,
        sellerEarnings: 0,
        pendingPayouts: 0,
        averageOrderValue: 0,
        leadsCreated: 0,
        customerContacted: 0,
        confirmedOrders: 0,
        packedOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        rejectedOrders: 0,
        bestSellingProducts: [],
        topCategories: [],
        revenueGraph: [],
        commissionGraph: [],
      }
    }
  },
}
