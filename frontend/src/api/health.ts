import { parseOrThrow } from './client'

export type Health = { status: string; ors_configured: boolean }

export async function fetchHealth(): Promise<Health> {
  const res = await fetch('/health')
  return parseOrThrow(res, 'Fetch health')
}
