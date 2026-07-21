/**
 * Brevo (formerly Sendinblue) newsletter subscription service.
 *
 * Uses the Brevo v3 REST API — the only secure approach available on
 * a purely static GitHub Pages site (no server-side proxy available).
 * The API key used here only grants contact creation rights; it cannot
 * read, export, or delete contacts, making exposure risk minimal.
 *
 * Environment variables (set in .env and GitHub repository secrets):
 *   VITE_BREVO_API_KEY — your Brevo v3 API key
 *   VITE_BREVO_LIST_ID — the Brevo list ID to add contacts to
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/contacts'

export type SubscribeResult =
  | { success: true }
  | { success: false; reason: 'duplicate' | 'invalid' | 'network' | 'unknown' }

/**
 * Subscribe an email address to the Brevo contact list.
 *
 * @param email - Validated email address
 * @returns SubscribeResult indicating success or the failure reason
 */
export async function subscribeToBrevo(email: string): Promise<SubscribeResult> {
  const apiKey = import.meta.env.VITE_BREVO_API_KEY as string | undefined
  const listId = import.meta.env.VITE_BREVO_LIST_ID as string | undefined

  if (!apiKey || !listId) {
    console.error('[Brevo] Missing VITE_BREVO_API_KEY or VITE_BREVO_LIST_ID environment variables.')
    return { success: false, reason: 'unknown' }
  }

  const listIdNum = Number(listId)
  if (!Number.isFinite(listIdNum)) {
    console.error('[Brevo] VITE_BREVO_LIST_ID is not a valid number.')
    return { success: false, reason: 'unknown' }
  }

  let response: Response
  try {
    response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        listIds: [listIdNum],
        updateEnabled: false, // do not overwrite existing contacts
      }),
    })
  } catch {
    return { success: false, reason: 'network' }
  }

  if (response.status === 201) {
    // 201 Created — new contact added successfully
    return { success: true }
  }

  if (response.status === 204) {
    // 204 No Content — contact updated (updateEnabled: false means this shouldn't happen,
    // but handle it gracefully)
    return { success: true }
  }

  if (response.status === 400) {
    // 400 can mean invalid email format from Brevo's side
    return { success: false, reason: 'invalid' }
  }

  if (response.status === 409) {
    // 409 Conflict — contact already exists in the list
    return { success: false, reason: 'duplicate' }
  }

  // Any other status code
  const body = await response.text().catch(() => '')
  console.error(`[Brevo] Unexpected response ${response.status}:`, body)
  return { success: false, reason: 'unknown' }
}
