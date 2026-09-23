import { useEffect, useState } from 'react'
import { sendChatMessage, extractText, type ChatMessage } from '../../api/chat'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loadCalendar } from '../../store/calendarSlice'
import { loadSavedEvents } from '../../store/eventsSlice'
import { loadSavedFlights } from '../../store/flightsSlice'
import { loadSavedHotels } from '../../store/hotelsSlice'
import { selectActiveTrip } from '../../store/tripsSlice'

// Survives an accidental page refresh; scoped per trip since chat is trip-scoped.
function chatStorageKey(tripId?: number) {
  return `chat-history:${tripId ?? 'none'}`
}

function loadMessages(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function ChatWidget() {
  const dispatch = useAppDispatch()
  const tripId = useAppSelector(selectActiveTrip)?.id
  const storageKey = chatStorageKey(tripId)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storageKey))
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Adjusting state during render (not an effect) when the trip-scoped key changes -
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [loadedStorageKey, setLoadedStorageKey] = useState(storageKey)
  if (storageKey !== loadedStorageKey) {
    setLoadedStorageKey(storageKey)
    setMessages(loadMessages(storageKey))
  }

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    } catch {
      // ignore - e.g. localStorage unavailable in private browsing
    }
  }, [storageKey, messages])

  function clearChat() {
    setMessages([])
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || loading) return

    const withUserMessage = [...messages, { role: 'user', content: text }]
    setMessages(withUserMessage)
    setDraft('')
    setLoading(true)
    setError(null)
    try {
      setMessages(await sendChatMessage(withUserMessage, tripId))
      // Chat tool calls save/remove flights/hotels/events and touch the calendar straight
      // through the backend, bypassing the slices' own thunks - reload all of them so the
      // UI reflects the real DB state even if the model's own text about what it did is
      // wrong (e.g. a local model claiming a save succeeded when it didn't call the tool).
      dispatch(loadSavedFlights())
      dispatch(loadSavedHotels())
      dispatch(loadSavedEvents())
      dispatch(loadCalendar())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        data-testid="chat-open-button"
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 rounded-full bg-strong px-5 py-3 text-sm font-medium text-white shadow-lg"
      >
        Ask the trip assistant
      </button>
    )
  }

  return (
    <div className="fixed right-6 bottom-6 flex h-[32rem] w-96 flex-col rounded border border-line bg-canvas shadow-lg">
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
        <span className="text-sm font-medium text-ink">Trip assistant</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="chat-clear-button"
            onClick={clearChat}
            className="text-sm text-muted hover:text-ink"
          >
            Clear chat
          </button>
          <button
            type="button"
            data-testid="chat-close-button"
            onClick={() => setOpen(false)}
            className="text-sm text-muted hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>

      <div data-testid="chat-messages" className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m, i) => {
            const text = extractText(m)
            if (!text) return null
            const fromUser = m.role === 'user'
            return (
              <div
                key={i}
                className={`max-w-[85%] rounded px-3 py-2 text-sm whitespace-pre-wrap ${
                  fromUser ? 'self-end bg-strong text-white' : 'self-start bg-surface text-ink'
                }`}
              >
                {text}
              </div>
            )
          })}
        {loading && <div className="self-start text-sm text-muted">Thinking…</div>}
        {error && (
          <div data-testid="chat-error" className="self-start text-sm text-red-500">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-line-soft p-3">
        <input
          data-testid="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about this trip…"
          className="flex-1 rounded border border-line px-2 py-1.5 text-sm text-ink"
        />
        <button
          data-testid="chat-send-button"
          type="submit"
          disabled={loading || !draft.trim()}
          className="rounded bg-strong px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
