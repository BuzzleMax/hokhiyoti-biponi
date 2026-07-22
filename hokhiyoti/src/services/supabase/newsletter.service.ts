import { supabase } from '../../lib/supabase'
import type { NewsletterSubscriber } from '../../types/newsletter.types'

// Convert DB row to NewsletterSubscriber
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSubscriber(row: any): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name || undefined,
    lastName: row.last_name || undefined,
    active: Boolean(row.active),
    subscribedAt: row.subscribed_at || row.created_at || new Date().toISOString(),
    source: row.source || undefined,
  }
}

export const supabaseNewsletterService = {
  async getSubscribers(): Promise<NewsletterSubscriber[]> {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false })

    if (error) {
      // Fallback query to legacy view if table was created as newsletter
      const fb = await supabase.from('newsletter').select('*').order('subscribed_at', { ascending: false })
      if (fb.error) {
        console.warn('Newsletter query warning:', error)
        return []
      }
      return (fb.data || []).map(rowToSubscriber)
    }
    return (data || []).map(rowToSubscriber)
  },

  async deleteSubscriber(id: string): Promise<void> {
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id)
    if (error) {
      try {
        await supabase.from('newsletter').delete().eq('id', id)
      } catch {
        // Legacy table fallback failed, ignore
      }
    }
  },

  exportCSV(subscribers: NewsletterSubscriber[]) {
    const headers = ['Email', 'First Name', 'Last Name', 'Active', 'Subscribed At', 'Source']
    const rows = subscribers.map((s) => [
      `"${s.email}"`,
      `"${s.firstName || ''}"`,
      `"${s.lastName || ''}"`,
      s.active ? 'Yes' : 'No',
      `"${new Date(s.subscribedAt).toLocaleString()}"`,
      `"${s.source || 'website'}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `hokhiyoti_subscribers_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },
}
