import { supabase } from '../../lib/supabase'
import { fetchAllWithCursor } from '../../lib/cursor-pagination'
import type { AnalyticsOverview } from '../../types/analytics.types'

function isEarnedRevenue(orderStatus: string): boolean {
  return orderStatus === 'delivered'
}

function isActiveCommission(commissionStatus: string): boolean {
  return commissionStatus === 'pending' || commissionStatus === 'earned' || commissionStatus === 'paid'
}

const emptyOverview = (): AnalyticsOverview => ({
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
})

export const supabaseAnalyticsService = {
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    try {
      const [statusRes, revenueRes, commissionRes, graphRes, productsRes] = await Promise.all([
        supabase.rpc('get_order_status_counts'),
        supabase.rpc('get_revenue_aggregates'),
        supabase.rpc('get_commission_aggregates'),
        supabase.rpc('get_monthly_graph', { month_count: 6 }),
        supabase.from('products').select('id, name, price, sold_count, images').limit(500),
      ])

      const status = Array.isArray(statusRes.data) ? statusRes.data[0] : statusRes.data
      const revenue = Array.isArray(revenueRes.data) ? revenueRes.data[0] : revenueRes.data
      const commission = Array.isArray(commissionRes.data) ? commissionRes.data[0] : commissionRes.data
      const graph = graphRes.data || []
      const products = productsRes.data || []

      // Best sellers + top categories: cursor-paginate delivered orders (no OFFSET)
      const deliveredOrders = await fetchAllWithCursor(
        async (cursor, pageSize) => {
          let query = supabase
            .from('orders')
            .select('id, product_id, product_price, category_name, quantity, created_at')
            .eq('order_status', 'delivered')

          if (cursor) {
            query = query.or(
              `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt."${cursor.id}")`
            )
          }

          const { data, error } = await query
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(pageSize)

          if (error) throw error
          return (data || []).map((row) => ({
            id: row.id as string,
            createdAt: row.created_at as string,
            productId: row.product_id as string,
            productPrice: Number(row.product_price || 0),
            categoryName: (row.category_name as string) || 'General Collections',
            quantity: Number(row.quantity || 1),
          }))
        },
        200
      )

      const productSalesMap: Record<string, { soldCount: number; revenue: number }> = {}
      const categoryRevenueMap: Record<string, { orderCount: number; totalRevenue: number }> = {}

      for (const o of deliveredOrders) {
        if (!o.productId) continue
        const salesEntry = productSalesMap[o.productId] ?? { soldCount: 0, revenue: 0 }
        salesEntry.soldCount += o.quantity
        salesEntry.revenue += o.productPrice
        productSalesMap[o.productId] = salesEntry

        const catName = o.categoryName
        const catEntry = categoryRevenueMap[catName] ?? { orderCount: 0, totalRevenue: 0 }
        catEntry.orderCount += 1
        catEntry.totalRevenue += o.productPrice
        categoryRevenueMap[catName] = catEntry
      }

      const bestSellingProducts = products
        .map((p) => {
          const sales = productSalesMap[p.id] || {
            soldCount: p.sold_count || 0,
            revenue: (p.sold_count || 0) * (p.price || 0),
          }
          return {
            id: p.id,
            name: p.name,
            price: Number(p.price || 0),
            soldCount: sales.soldCount,
            revenue: sales.revenue,
            imageUrl:
              Array.isArray(p.images) && p.images[0]
                ? typeof p.images[0] === 'string'
                  ? p.images[0]
                  : p.images[0].url
                : undefined,
          }
        })
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5)

      const topCategories = Object.entries(categoryRevenueMap)
        .map(([categoryName, data]) => ({
          categoryName,
          orderCount: data.orderCount,
          totalRevenue: data.totalRevenue,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)

      // Use RPC results when available; fall back to legacy scan only if RPC missing
      if (status && revenue && commission) {
        return {
          todayOrders: Number(revenue.today_orders || 0),
          monthlyOrders: Number(revenue.monthly_orders || 0),
          totalOrders: Number(revenue.total_orders || 0),
          todayRevenue: Number(revenue.today_revenue || 0),
          monthlyRevenue: Number(revenue.monthly_revenue || 0),
          totalRevenue: Number(revenue.total_revenue || 0),
          todayCommission: Number(commission.today_commission || 0),
          monthlyCommission: Number(commission.monthly_commission || 0),
          totalCommission: Number(commission.total_commission || 0),
          pendingCommission: Number(commission.pending_commission || 0),
          earnedCommission: Number(commission.earned_commission || 0),
          cancelledCommission: Number(commission.cancelled_commission || 0),
          rejectedCommission: Number(commission.rejected_commission || 0),
          paidCommission: Number(commission.paid_commission || 0),
          sellerEarnings: Number(commission.seller_earnings || 0),
          pendingPayouts: Number(commission.pending_payouts || 0),
          averageOrderValue: Number(revenue.average_order_value || 0),
          leadsCreated: Number(status.leads_created || 0),
          customerContacted: Number(status.customer_contacted || 0),
          confirmedOrders: Number(status.confirmed_orders || 0),
          packedOrders: Number(status.packed_orders || 0),
          shippedOrders: Number(status.shipped_orders || 0),
          deliveredOrders: Number(status.delivered_orders || 0),
          cancelledOrders: Number(status.cancelled_orders || 0),
          rejectedOrders: Number(status.rejected_orders || 0),
          bestSellingProducts,
          topCategories,
          revenueGraph: graph.map((g: { month_label: string; revenue: number }) => ({
            label: g.month_label,
            revenue: Number(g.revenue || 0),
          })),
          commissionGraph: graph.map((g: { month_label: string; commission: number }) => ({
            label: g.month_label,
            commission: Number(g.commission || 0),
          })),
        }
      }

      return this.getAnalyticsOverviewLegacy()
    } catch (err) {
      console.warn('Failed to load analytics overview:', err)
      return emptyOverview()
    }
  },

  /** Legacy fallback using cursor pagination instead of OFFSET (for pre-migration databases). */
  async getAnalyticsOverviewLegacy(): Promise<AnalyticsOverview> {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, sold_count, images')
        .limit(500)

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

      let leadsCreated = 0
      let customerContacted = 0
      let confirmedOrders = 0
      let packedOrders = 0
      let shippedOrders = 0
      let deliveredOrders = 0
      let cancelledOrders = 0
      let rejectedOrders = 0
      let todayRevenue = 0
      let monthlyRevenue = 0
      let totalRevenue = 0
      let pendingCommission = 0
      let earnedCommission = 0
      let cancelledCommission = 0
      let rejectedCommission = 0
      let paidCommission = 0
      let totalCommission = 0
      let todayOrders = 0
      let monthlyOrders = 0
      let totalOrders = 0
      let todayCommission = 0
      let monthlyCommission = 0
      let sellerEarnings = 0
      let pendingPayouts = 0

      const categoryRevenueMap: Record<string, { orderCount: number; totalRevenue: number }> = {}
      const productSalesMap: Record<string, { soldCount: number; revenue: number }> = {}

      // Re-fetch full order rows in cursor pages for aggregation
      let cursor: { createdAt: string; id: string } | null = null
      for (;;) {
        let query = supabase
          .from('orders')
          .select(
            'id, created_at, product_price, commission_amount, seller_earnings, order_status, status, commission_status, product_id, category_name, quantity'
          )

        if (cursor) {
          query = query.or(
            `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt."${cursor.id}")`
          )
        }

        const { data: page, error } = await query
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(200)

        if (error) break
        if (!page || page.length === 0) break

        for (const o of page) {
          const orderStatus: string = o.order_status || o.status || 'lead_created'
          if (orderStatus === 'archived') continue

          const orderTime = new Date(o.created_at || Date.now()).getTime()
          const price = Number(o.product_price || 0)
          const comm = Number(o.commission_amount || 0)
          const earnings = Number(o.seller_earnings || price - comm)
          const commStatus: string = o.commission_status || 'none'

          totalOrders++

          if (orderStatus === 'lead_created' || orderStatus === 'pending') leadsCreated++
          else if (orderStatus === 'customer_contacted') customerContacted++
          else if (orderStatus === 'confirmed' || orderStatus === 'processing') confirmedOrders++
          else if (orderStatus === 'packed') packedOrders++
          else if (orderStatus === 'shipped') shippedOrders++
          else if (orderStatus === 'delivered') deliveredOrders++
          else if (orderStatus === 'cancelled') cancelledOrders++
          else if (orderStatus === 'rejected') rejectedOrders++

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
            if (o.product_id) {
              const pId = o.product_id
              if (!productSalesMap[pId]) productSalesMap[pId] = { soldCount: 0, revenue: 0 }
              productSalesMap[pId].soldCount += Number(o.quantity || 1)
              productSalesMap[pId].revenue += price
            }
            const catName = o.category_name || 'General Collections'
            if (!categoryRevenueMap[catName]) categoryRevenueMap[catName] = { orderCount: 0, totalRevenue: 0 }
            categoryRevenueMap[catName].orderCount += 1
            categoryRevenueMap[catName].totalRevenue += price
          }

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
        }

        if (page.length < 200) break
        const last = page.at(-1)
        if (!last) break
        cursor = { createdAt: last.created_at, id: last.id }
      }

      const averageOrderValue = deliveredOrders > 0 ? Math.round(totalRevenue / deliveredOrders) : 0

      const bestSellingProducts = (products || [])
        .map((p) => {
          const sales = productSalesMap[p.id] || {
            soldCount: p.sold_count || 0,
            revenue: (p.sold_count || 0) * (p.price || 0),
          }
          return {
            id: p.id,
            name: p.name,
            price: Number(p.price || 0),
            soldCount: sales.soldCount,
            revenue: sales.revenue,
            imageUrl:
              Array.isArray(p.images) && p.images[0]
                ? typeof p.images[0] === 'string'
                  ? p.images[0]
                  : p.images[0].url
                : undefined,
          }
        })
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5)

      const topCategories = Object.entries(categoryRevenueMap)
        .map(([categoryName, data]) => ({
          categoryName,
          orderCount: data.orderCount,
          totalRevenue: data.totalRevenue,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)

      const revenueGraph: Array<{ label: string; revenue: number }> = []
      const commissionGraph: Array<{ label: string; commission: number }> = []

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthLabel = d.toLocaleString('en-US', { month: 'short' })
        const mStart = d.getTime()
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59).getTime()

        let mRev = 0
        let mComm = 0

        let gCursor: { createdAt: string; id: string } | null = null
        for (;;) {
          let gQuery = supabase
            .from('orders')
            .select('id, created_at, product_price, order_status, status, commission_status, commission_amount')

          if (gCursor) {
            gQuery = gQuery.or(
              `created_at.lt."${gCursor.createdAt}",and(created_at.eq."${gCursor.createdAt}",id.lt."${gCursor.id}")`
            )
          }

          const { data: gPage } = await gQuery
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(200)

          if (!gPage || gPage.length === 0) break

          for (const o of gPage) {
            const orderStatus: string = o.order_status || o.status || 'lead_created'
            if (orderStatus === 'archived') continue
            const commStatus: string = o.commission_status || 'none'
            const t = new Date(o.created_at || Date.now()).getTime()
            if (t >= mStart && t <= mEnd) {
              if (isEarnedRevenue(orderStatus)) mRev += Number(o.product_price || 0)
              if (isActiveCommission(commStatus)) mComm += Number(o.commission_amount || 0)
            }
          }

          if (gPage.length < 200) break
          const last = gPage.at(-1)
          if (!last) break
          gCursor = { createdAt: last.created_at, id: last.id }
        }

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
    } catch {
      return emptyOverview()
    }
  },
}
