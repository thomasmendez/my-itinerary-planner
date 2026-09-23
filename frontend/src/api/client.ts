export async function parseOrThrow<T>(res: Response, action: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `${action} failed: ${res.status}`)
  }
  return res.json()
}

export async function postBestEffort<T>(url: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback
  }
}
