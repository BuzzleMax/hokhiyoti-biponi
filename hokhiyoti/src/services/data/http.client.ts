const jsonCache = new Map<string, unknown>()

export async function fetchJsonCached<T>(url: string): Promise<T> {
  const existing = jsonCache.get(url)
  if (existing) return existing as T

  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as T
  jsonCache.set(url, data)
  return data
}

