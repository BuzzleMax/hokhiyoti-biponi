export type NewsletterSubscriber = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  active: boolean
  subscribedAt: string
  source?: string
}
