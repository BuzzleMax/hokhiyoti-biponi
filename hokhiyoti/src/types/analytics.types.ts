export type AnalyticsOverview = {
  // --- Revenue ---
  todayRevenue: number
  monthlyRevenue: number
  totalRevenue: number

  // --- Commission ---
  todayCommission: number
  monthlyCommission: number
  totalCommission: number

  // --- Commission Breakdown by Status ---
  pendingCommission: number
  earnedCommission: number
  cancelledCommission: number
  rejectedCommission: number
  paidCommission: number

  // --- Seller Earnings ---
  sellerEarnings: number
  pendingPayouts: number

  // --- Order Counts (all time) ---
  totalOrders: number
  todayOrders: number
  monthlyOrders: number

  // --- Order Counts by Status ---
  leadsCreated: number
  customerContacted: number
  confirmedOrders: number
  packedOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  rejectedOrders: number

  // --- Averages ---
  averageOrderValue: number

  // --- Best Sellers ---
  bestSellingProducts: Array<{
    id: string
    name: string
    price: number
    soldCount: number
    revenue: number
    imageUrl?: string
  }>

  // --- Top Categories ---
  topCategories: Array<{
    categoryName: string
    orderCount: number
    totalRevenue: number
  }>

  // --- Graphs ---
  revenueGraph: Array<{
    label: string
    revenue: number
  }>

  commissionGraph: Array<{
    label: string
    commission: number
  }>
}
