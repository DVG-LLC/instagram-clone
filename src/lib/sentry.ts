// Lightweight Sentry wrapper: initialize only if DSN provided
import * as Sentry from '@sentry/browser'

const DSN = import.meta.env.VITE_SENTRY_DSN ?? ''
if (DSN) {
  Sentry.init({ dsn: DSN, tracesSampleRate: 0.0 })
}

export function captureException(err: unknown) {
  if (DSN) Sentry.captureException(err)
  // Always log so developers see issues in local dev consoles
  console.error(JSON.stringify({ event: 'exception_captured', error: String(err) }))
}
