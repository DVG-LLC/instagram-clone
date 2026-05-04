// Rule engine implementing the triage decisions described in the project topics.

import { FeedbackItem, QueueName } from '../types'

// Detect if a string contains only emoji (and whitespace). We use a conservative regex matching common emoji ranges.
const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|[\u2600-\u27BF])+$|^(?:\s)*(?:[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200d\u2640-\u2642\u2600-\u27BF])+\s*$/u

export function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  try {
    return emojiRegex.test(trimmed)
  } catch (e) {
    // If regex fails due to environment, fall back to simple heuristic: non-alphanumeric only
    return /^[^\w\d]+$/.test(trimmed)
  }
}

export function nonWhitespaceLength(text: string): number {
  return text.replace(/\s+/g, '').length
}

export function flagsForItem(item: FeedbackItem): string[] {
  const flags: string[] = []
  if (item.title && isEmojiOnly(item.title)) flags.push('emoji-only-title')
  if (!item.body || item.body.trim().length === 0) flags.push('empty-body')
  if (nonWhitespaceLength(item.body) < 10) flags.push('low-signal')
  return flags
}

// Classify where a new submission should land initially
export function classifyNewSubmission(item: FeedbackItem): QueueName {
  const flags = flagsForItem(item)
  if (flags.includes('empty-body')) {
    // Items with missing body go to Needs Clarification (segregated)
    return 'Needs Clarification'
  }
  if (flags.includes('low-signal')) {
    // low-signal items land in Inbox for batching / review
    return 'Inbox'
  }
  if (flags.includes('emoji-only-title')) {
    // treat emoji-only as a reaction and put into Inbox for aggregation
    return 'Inbox'
  }
  // otherwise regular backlog
  return 'Backlog'
}

// Determine whether an item should be auto-closed: empty body and emoji-only title -> auto-close after 24h
export function shouldAutoClose(item: FeedbackItem, now = Date.now()): boolean {
  const flags = flagsForItem(item)
  if (flags.includes('empty-body') && flags.includes('emoji-only-title')) {
    const ageMs = now - item.createdAt
    const twentyFourHours = 24 * 60 * 60 * 1000
    return ageMs >= twentyFourHours
  }
  return false
}

// Flag spam / noise for review: <10 non-whitespace characters
export function isSpamLike(item: FeedbackItem): boolean {
  return nonWhitespaceLength((item.title || '') + (item.body || '')) < 10
}

// Require minimum detail template before prioritizing
export function canTransitionToPrioritized(item: FeedbackItem): boolean {
  const body = item.body || ''
  const required = ['problem', 'context', 'outcome']
  const lower = body.toLowerCase()
  return required.every((r) => lower.includes(r))
}

// Aggregate emoji-only submissions into reactions: decide whether to treat as reaction
export function shouldBeTreatedAsReaction(item: FeedbackItem): boolean {
  return isEmojiOnly(item.title) && (!item.body || item.body.trim().length === 0)
}

// Helper: apply auto-close to a set of items. Returns ids closed.
export function runAutoClose(items: FeedbackItem[], now = Date.now()): string[] {
  const closed: string[] = []
  for (const it of items) {
    if (!it.closedAt && shouldAutoClose(it, now)) {
      it.closedAt = now
      it.queue = 'Closed'
      closed.push(it.id)
    }
  }
  return closed
}

// Helper: route a batch of low-signal items into a single Inbox bundle (per day). This will mark their queue as Inbox and set reactionToId to the bundle id when aggregated.
export function bundleLowSignal(items: FeedbackItem[], bundleId: string, dayStart = Date.now()): string[] {
  const bundled: string[] = []
  for (const it of items) {
    const sameDay = new Date(it.createdAt).toDateString() === new Date(dayStart).toDateString()
    if (sameDay && nonWhitespaceLength(it.body) < 50) {
      it.queue = 'Inbox'
      it.reactionToId = bundleId
      bundled.push(it.id)
    }
  }
  return bundled
}
