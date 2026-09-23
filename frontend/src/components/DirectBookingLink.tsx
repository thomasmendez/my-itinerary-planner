// Google's booking redirector (used for flights) requires post_data to be POSTed in the
// request body - a bare GET to `url` 404s. Submitting a real HTML form is what actually
// works (mirrors Google Flights' own UI); a script-driven fetch/XHR POST does not carry
// enough browser context and also still 404s. Hotels have no post_data and just need a
// plain link.
export function DirectBookingLink({
  url,
  postData,
  testId,
}: {
  url: string | null | undefined
  postData?: string | null
  testId: string
}) {
  if (!url) {
    return (
      <button
        type="button"
        disabled
        data-testid={testId}
        title="This result's provider doesn't offer a direct booking link through this search — book on their site directly"
        className="cursor-not-allowed rounded border border-line px-3 py-1 text-sm font-medium text-faint"
      >
        Direct Booking Link
      </button>
    )
  }

  if (postData) {
    // post_data is already a urlencoded "key=value[&key=value...]" body (e.g. "u=<token>")
    // - it is NOT a bare token to wrap in a field named "u". Parsing it into its real
    // key/value pairs and letting the browser's own form encoding reproduce them is what
    // makes the resubmitted body match byte-for-byte; hardcoding name="u" here previously
    // double-wrapped it as "u=u%3D<token>", which is why Google 404'd.
    const fields = [...new URLSearchParams(postData).entries()]
    return (
      <form action={url} method="post" target="_blank" data-testid={`${testId}-form`}>
        {fields.map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type="submit"
          data-testid={testId}
          className="rounded border border-line px-3 py-1 text-sm font-medium text-ink-soft"
        >
          Direct Booking Link
        </button>
      </form>
    )
  }

  return (
    <a
      data-testid={testId}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded border border-line px-3 py-1 text-sm font-medium text-ink-soft"
    >
      Direct Booking Link
    </a>
  )
}
