/**
 * Newsletter subscription service via Cloudflare Worker.
 *
 * Uses a Cloudflare Worker to securely proxy newsletter subscriptions to Brevo.
 * The Worker handles the Brevo API key, keeping it completely out of the frontend.
 *
 * Environment variables (set in .env):
 *   VITE_NEWSLETTER_WORKER_URL — your Cloudflare Worker URL
 */

export type SubscribeResult =
  | { success: true }
  | { success: false; reason: 'duplicate' | 'invalid' | 'network' | 'unknown' }

/**
 * Subscribe an email address to the newsletter via Cloudflare Worker.
 *
 * @param email - Validated email address
 * @returns SubscribeResult indicating success or the failure reason
 */
export async function subscribeToBrevo(email: string): Promise<SubscribeResult> {
  const workerUrl = import.meta.env.VITE_NEWSLETTER_WORKER_URL as string | undefined

  if (!workerUrl) {
    console.error('[Newsletter] Missing VITE_NEWSLETTER_WORKER_URL environment variable.')
    return { success: false, reason: 'unknown' }
  }

  let response: Response
  try {
    response = await fetch(`${workerUrl}/newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
  } catch {
    return { success: false, reason: 'network' }
  }

  if (response.status === 200) {
    return { success: true }
  }

  if (response.status === 400) {
    return { success: false, reason: 'invalid' }
  }

  if (response.status === 409) {
    return { success: false, reason: 'duplicate' }
  }

  // Any other status code
  const body = await response.text().catch(() => '')
  console.error(`[Newsletter] Unexpected response ${response.status}:`, body)
  return { success: false, reason: 'unknown' }
}
