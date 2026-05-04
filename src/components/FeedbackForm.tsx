import React, { useState } from 'react'
import { FeedbackItem } from '../types'
import { isEmojiOnly } from '../engine/RuleEngine'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function FeedbackForm({ onSubmit }: { onSubmit: (f: FeedbackItem) => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const showAddContext = title.trim().length > 0 && isEmojiOnly(title)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const item: FeedbackItem = {
      id: uid(),
      title,
      body,
      createdAt: Date.now(),
      queue: 'Inbox'
    }
    onSubmit(item)
    setTitle('')
    setBody('')
  }

  return (
    <form onSubmit={submit} className="form">
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title or emoji" />
      </label>
      {showAddContext && (
        <div className="hint">Add context: explain the problem, context, and desired outcome</div>
      )}
      <label>
        Body
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Problem, context, outcome..." />
      </label>
      <div className="actions">
        <button type="submit">Submit</button>
      </div>
    </form>
  )
}
