import React from 'react'
import { FeedbackItem, QueueName } from '../types'

export default function QueueView({
  title,
  items,
  onPrioritize,
  onClose
}: {
  title: QueueName
  items: FeedbackItem[]
  onPrioritize?: (id: string) => void
  onClose?: (id: string) => void
}) {
  return (
    <section className="queue">
      <h3>{title} ({items.length})</h3>
      <ul>
        {items.map((it) => (
          <li key={it.id} className={it.queue === 'Closed' ? 'closed' : ''}>
            <strong>{it.title || '(no title)'}</strong>
            <div className="meta">{new Date(it.createdAt).toLocaleString()}</div>
            <p className="body">{it.body || <i>— no body —</i>}</p>
            <div className="card-actions">
              {onPrioritize && it.queue !== 'Closed' && (
                <button onClick={() => onPrioritize(it.id)}>Attempt Prioritize</button>
              )}
              {onClose && it.queue !== 'Closed' && (
                <button onClick={() => onClose(it.id)}>Close</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
