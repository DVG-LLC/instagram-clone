import React, { useEffect, useState } from 'react'
import { Topic } from './types'
import { duplicateTopic, getAllTopics } from './lib/duplicator'
import { captureException } from './lib/sentry'

// Minimal UI to exercise duplication and show error messages
export default function App() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setTopics(getAllTopics())
  }, [])

  async function onDuplicate(id: string) {
    setMessage(null)
    try {
      const next = await duplicateTopic(id)
      setTopics(getAllTopics())
      setMessage(`Duplicated topic "${next.title}" (id: ${next.id})`)
    } catch (err) {
      // Surface friendly error and capture
      const msg = err instanceof Error ? err.message : 'Unknown error while duplicating'
      setMessage(`Failed to duplicate: ${msg}`)
      captureException(err)
    }
  }

  return (
    <div className="container">
      <h1>Topic Duplicator</h1>
      <p className="lead">A small playground demonstrating a hardened duplication flow.</p>

      {message && <div className="message" role="status">{message}</div>}

      <ul className="topics">
        {topics.map((t) => (
          <li key={t.id} className="topic">
            <div>
              <strong>{t.title}</strong>
              <div className="meta">id: {t.id} • {t.metadata?.summary ?? 'no summary'}</div>
            </div>
            <button onClick={() => onDuplicate(t.id)}>Duplicate</button>
          </li>
        ))}
      </ul>

      <footer>
        <small>Open the console to see structured duplication logs.</small>
      </footer>
    </div>
  )
}
