import { useRef } from 'react'

const REPO_URL = 'https://github.com/thomasmendez/my-itinerary-planner'

// Only rendered in VITE_DEMO builds (see App.tsx), where MSW serves fixture data with no backend.
export function DemoBanner() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <div
        data-testid="demo-banner"
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-notice px-4 py-2 text-center text-sm text-notice-ink"
      >
        <span>
          <strong>Demo</strong> · Searches and chat use sample data. Changes reset on reload.
          <span className="hidden sm:inline"> This is a trip planner you can self-host.</span>
        </span>
        <button
          type="button"
          data-testid="demo-about-button"
          onClick={() => dialogRef.current?.showModal()}
          className="font-medium underline hover:no-underline"
        >
          About this demo
        </button>
      </div>

      <dialog
        ref={dialogRef}
        data-testid="demo-about-dialog"
        className="m-auto w-full max-w-lg rounded border border-line-soft bg-canvas p-6 text-ink backdrop:bg-black/50"
      >
        <h2 className="mb-4 text-base font-bold">About this demo</h2>
        <div className="flex flex-col gap-4 text-sm text-ink-soft">
          <p>
            My Itinerary Planner is a self-hosted trip planner. It searches and compares flights, hotels, and local events.
            You can save results to your trip, and they show up on the trip calendar and map. It doesn't book anything. You book directly with the
            airline, hotel, or venue.
          </p>
          <div>
            <h3 className="mb-1 font-bold text-ink">What's simulated here</h3>
            <p>
              This demo runs entirely in your browser with no server. Search results, chat replies, and map routes are
              sample data. Anything you add or change is lost when you reload the page.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-ink">Run it yourself</h3>
            <p className="mb-2">
              Clone the repo and start it with Docker Compose. Add your own SerpApi key for live search, and optionally add
              Claude, OpenAI, or Ollama model to use the trip assistant.
            </p>
            <pre className="overflow-x-auto rounded bg-surface px-3 py-2 text-xs text-ink">docker compose up --build -d</pre>
          </div>
          <p className="text-muted">
            It has no login. It is meant for a single user or household on a trusted network.
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-4">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            data-testid="demo-repo-link"
            className="text-sm font-medium underline hover:no-underline"
          >
            Setup guide on GitHub
          </a>
          <button
            type="button"
            data-testid="demo-about-close-button"
            onClick={() => dialogRef.current?.close()}
            className="rounded border border-line px-4 py-1.5 text-sm font-medium text-ink-soft"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  )
}
