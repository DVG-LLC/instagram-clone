import React, { useMemo, useState } from 'react'
import FeedbackForm from './components/FeedbackForm'
import QueueView from './components/QueueView'
import { FeedbackItem } from './types'
import * as Engine from './engine/RuleEngine'

// Small demo app to submit items and run the rule engine actions.
export default function App() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const now = Date.now()

  function handleSubmit(item: FeedbackItem) {
    // classify and assign initial queue
    const q = Engine.classifyNewSubmission(item)
    item.queue = q
    item.flags = Engine.flagsForItem(item)
    setItems((s) => [item, ...s])
  }

  function runAutoClose() {
    const closed = Engine.runAutoClose(items, Date.now())
    if (closed.length > 0) {
      setItems([...items])
    } else {
      alert('No items met auto-close criteria (try creating an emoji-only + empty body item with createdAt older than 24h in tests).')
    }
  }

  function prioritize(id: string) {
    setItems((cur) => {
      return cur.map((it) => {
        if (it.id === id) {
          if (Engine.canTransitionToPrioritized(it)) {
            it.queue = 'Prioritized'
          } else {
            alert('Item does not satisfy the minimum detail template (problem, context, outcome).')
          }
        }
        return it
      })
    })
  }

  function closeItem(id: string) {
    setItems((cur) => cur.map((it) => (it.id === id ? { ...it, queue: 'Closed', closedAt: Date.now() } : it)))
  }

  function batchBundleToday() {
    const bundleId = 'bundle-' + Math.random().toString(36).slice(2, 6)
    const cloned = items.map((it) => ({ ...it }))
    Engine.bundleLowSignal(cloned, bundleId, Date.now())
    setItems(cloned)
  }

  const byQueue = useMemo(() => {
    return {
      Inbox: items.filter((i) => i.queue === 'Inbox'),
      'Needs Clarification': items.filter((i) => i.queue === 'Needs Clarification'),
      Backlog: items.filter((i) => i.queue === 'Backlog'),
      Closed: items.filter((i) => i.queue === 'Closed'),
      Prioritized: items.filter((i) => i.queue === 'Prioritized')
    }
  }, [items])

  return (
    <div className="container">
      <header>
        <h1>Feedback Triage Playground</h1>
        <p>Experiment with intake rules, noise filtering, emoji reactions, and clarification gating.</p>
      </header>

      <main>
        <aside className="left">
          <FeedbackForm onSubmit={handleSubmit} />

          <div className="controls">
            <button onClick={runAutoClose}>Run auto-close (24h rule)</button>
            <button onClick={batchBundleToday}>Bundle low-signal into Inbox bundle</button>
          </div>

          <section className="notes">
            <h4>Quick notes</h4>
            <ul>
              <li>Submissions with empty body go to Needs Clarification.</li>
              <li>Emoji-only titles are treated as reactions and land in Inbox for aggregation.</li>
              <li>Items with &lt;10 non-whitespace chars are flagged as low-signal.</li>
            </ul>
          </section>
        </aside>

        <section className="queues">
          <QueueView title={'Inbox'} items={byQueue.Inbox} onPrioritize={prioritize} onClose={closeItem} />
          <QueueView title={'Needs Clarification'} items={byQueue['Needs Clarification']} onPrioritize={prioritize} onClose={closeItem} />
          <QueueView title={'Backlog'} items={byQueue.Backlog} onPrioritize={prioritize} onClose={closeItem} />
          <QueueView title={'Prioritized'} items={byQueue.Prioritized} onPrioritize={undefined} onClose={closeItem} />
          <QueueView title={'Closed'} items={byQueue.Closed} onPrioritize={undefined} onClose={undefined} />
        </section>
      </main>

      <footer>
        <small>Use the controls to simulate the rules described in the project topics.</small>
      </footer>
    </div>
  )
}
