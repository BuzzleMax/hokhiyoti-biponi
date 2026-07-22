export interface Env {
  BREVO_API_KEY: string
  BREVO_LIST_ID: string
}

interface NewsletterRequest {
  email: string
}

interface NewsletterResponse {
  success: boolean
  error?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }

    const url = new URL(request.url)

    // Only allow POST requests to /newsletter
    if (request.method !== 'POST' || url.pathname !== '/newsletter') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const body: NewsletterRequest = await request.json()

      // Validate email
      if (!body.email || typeof body.email !== 'string') {
        return jsonResponse({ success: false, error: 'Email is required' }, 400)
      }

      const email = body.email.trim()

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return jsonResponse({ success: false, error: 'Invalid email format' }, 400)
      }

      // Validate environment variables
      if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID) {
        console.error('[Worker] Missing BREVO_API_KEY or BREVO_LIST_ID')
        return jsonResponse({ success: false, error: 'Server configuration error' }, 500)
      }

      const listIdNum = Number(env.BREVO_LIST_ID)
      if (!Number.isFinite(listIdNum)) {
        console.error('[Worker] BREVO_LIST_ID is not a valid number')
        return jsonResponse({ success: false, error: 'Server configuration error' }, 500)
      }

      // Call Brevo API
      const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          email,
          listIds: [listIdNum],
          updateEnabled: false,
        }),
      })

      // Handle Brevo response
      if (brevoResponse.status === 201 || brevoResponse.status === 204) {
        return jsonResponse({ success: true }, 200)
      }

      if (brevoResponse.status === 400) {
        return jsonResponse({ success: false, error: 'Invalid email address' }, 400)
      }

      if (brevoResponse.status === 409) {
        return jsonResponse({ success: false, error: 'Email already subscribed' }, 409)
      }

      // Any other error
      const errorText = await brevoResponse.text().catch(() => '')
      console.error(`[Worker] Brevo error ${brevoResponse.status}:`, errorText)
      return jsonResponse({ success: false, error: 'Failed to subscribe. Please try again.' }, 500)

    } catch (error) {
      console.error('[Worker] Request error:', error)
      return jsonResponse({ success: false, error: 'Invalid request' }, 400)
    }
  },
}

function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

function jsonResponse(data: NewsletterResponse, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
