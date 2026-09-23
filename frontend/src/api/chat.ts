import { parseOrThrow } from './client'


export type ChatMessage = { role: string; content: unknown; [key: string]: unknown }

export async function sendChatMessage(messages: ChatMessage[], tripId?: number): Promise<ChatMessage[]> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, trip_id: tripId ?? null }),
  })
  const data = await parseOrThrow<{ messages: ChatMessage[] }>(res, 'Chat')
  return data.messages
}

export function extractText(message: ChatMessage): string {
  if (typeof message.content === 'string') return message.content
  if (Array.isArray(message.content)) {
    return message.content
      .filter((block): block is { type: string; text: string } => block?.type === 'text')
      .map((block) => block.text)
      .join('')
  }
  return ''
}
