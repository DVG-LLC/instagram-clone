/* Duplication logic with structured logs, serialization (per-topic chain), guards, and try/catch.
   Uses an in-memory store to keep the scaffold runnable. */
import { Topic } from '../types'

// In-memory topics store (seeded). This keeps the scaffold runnable without a backend.
const topicsStore: Topic[] = [
  { id: 't-1', title: 'Design meeting notes', metadata: { summary: 'Discuss roadmap' }, attachments: [{ id: 'a-1', filename: 'notes.pdf' }], relations: ['t-2'] },
  { id: 't-2', title: 'Research plan', metadata: { summary: 'User interviews' }, attachments: null, relations: null },
]

let idCounter = 100
function nextId() {
  idCounter += 1
  return `t-${idCounter}`
}

// Per-topic promise chain to serialize duplicate requests for the same source topic.
const chains: Map<string, Promise<Topic>> = new Map()

function structuredLog(payload: Record<string, unknown>) {
  // Keep logs parseable as JSON for structured logging ingestion
  try {
    console.log(JSON.stringify({ ts: new Date().toISOString(), ...payload }))
  } catch (e) {
    // Fallback
    console.log(payload)
  }
}

export function getAllTopics() {
  // Return a shallow copy so consumers cannot mutate internal store directly
  return topicsStore.map((t) => ({ ...t }))
}

export async function duplicateTopic(sourceId: string): Promise<Topic> {
  structuredLog({ event: 'duplicate_requested', sourceId })
  const chain = chains.get(sourceId) ?? Promise.resolve().then(() => { /* noop */ })

  // Append to the chain so calls serialize per sourceId
  const next = chain.then(() => _performDuplication(sourceId))
  // Ensure that errors don't permanently break the chain — catch here and rethrow later
  const guarded = next.catch((err) => {
    structuredLog({ event: 'duplicate_chain_error', sourceId, error: String(err) })
    // allow future duplications to proceed
    return Promise.reject(err)
  })

  chains.set(sourceId, guarded)
  // When the guarded promise settles, remove it from chains so new chains can start fresh
  guarded.finally(() => {
    const cur = chains.get(sourceId)
    if (cur === guarded) chains.delete(sourceId)
  })

  return guarded
}

async function _performDuplication(sourceId: string): Promise<Topic> {
  const stepId = `dup-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  structuredLog({ event: 'duplicate:start', stepId, sourceId })
  const start = Date.now()

  try {
    // Simulate an async read of the source topic
    await delay(30)
    const src = topicsStore.find((t) => t.id === sourceId)
    if (!src) {
      const message = `Source topic not found: ${sourceId}`
      structuredLog({ event: 'duplicate:missing_source', stepId, sourceId })
      throw new Error(message)
    }

    // Null/undefined guards — ensure optional fields exist in a safe shape
    const safeMetadata = src.metadata ?? {}
    const safeAttachments = Array.isArray(src.attachments) ? src.attachments.map((a) => ({ ...a })) : []
    const safeRelations = Array.isArray(src.relations) ? [...src.relations] : []

    // Build the clone with a new id and guarded properties
    const clone: Topic = {
      id: nextId(),
      title: `${src.title} (copy)`,
      metadata: { ...safeMetadata },
      attachments: safeAttachments,
      relations: safeRelations,
    }

    // Simulate potential asynchronous work (e.g. copying attachments)
    await delay(40)

    // Save to store
    topicsStore.push(clone)

    structuredLog({ event: 'duplicate:success', stepId, sourceId, newId: clone.id, durationMs: Date.now() - start })
    return { ...clone }
  } catch (err) {
    structuredLog({ event: 'duplicate:error', stepId, sourceId, error: String(err) })
    // Re-throw so callers can handle as needed
    throw err
  }
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

// Expose internals for tests (careful: tests rely on these functions)
export function _resetStoreForTests() {
  topicsStore.length = 0
  topicsStore.push({ id: 't-1', title: 'Design meeting notes', metadata: { summary: 'Discuss roadmap' }, attachments: [{ id: 'a-1', filename: 'notes.pdf' }], relations: ['t-2'] })
  topicsStore.push({ id: 't-2', title: 'Research plan', metadata: { summary: 'User interviews' }, attachments: null, relations: null })
  idCounter = 100
}
