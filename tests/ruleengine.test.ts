import { describe, it, expect } from 'vitest'
import {
  isEmojiOnly,
  nonWhitespaceLength,
  flagsForItem,
  classifyNewSubmission,
  canTransitionToPrioritized,
  isSpamLike,
  shouldBeTreatedAsReaction,
  runAutoClose
} from '../src/engine/RuleEngine'

import type { FeedbackItem } from '../src/types'

describe('RuleEngine basic behaviors', () => {
  it('detects emoji-only titles', () => {
    expect(isEmojiOnly('👍')).toBe(true)
    expect(isEmojiOnly('🔥🔥')).toBe(true)
    expect(isEmojiOnly('hello')).toBe(false)
  })

  it('counts non-whitespace chars correctly', () => {
    expect(nonWhitespaceLength('  a b  c ')).toBe(3)
    expect(nonWhitespaceLength('')).toBe(0)
  })

  it('flags low-signal and empty bodies', () => {
    const item: FeedbackItem = { id: '1', title: 'hi', body: 'ok', createdAt: Date.now(), queue: 'Inbox' }
    const flags = flagsForItem(item)
    expect(flags).toContain('low-signal')
  })

  it('classifies empty body into Needs Clarification', () => {
    const item: FeedbackItem = { id: '2', title: 'Some title', body: '', createdAt: Date.now(), queue: 'Inbox' }
    expect(classifyNewSubmission(item)).toBe('Needs Clarification')
  })

  it('prevents prioritize when template missing and allows when present', () => {
    const bad: FeedbackItem = { id: '3', title: 'T', body: 'short note', createdAt: Date.now(), queue: 'Backlog' }
    expect(canTransitionToPrioritized(bad)).toBe(false)

    const goodBody = 'Problem: Something is broken\nContext: Happened while testing\nOutcome: Expect a success'
    const good: FeedbackItem = { id: '4', title: 'T', body: goodBody, createdAt: Date.now(), queue: 'Backlog' }
    expect(canTransitionToPrioritized(good)).toBe(true)
  })

  it('detects spam-like < 10 non-whitespace chars', () => {
    const short: FeedbackItem = { id: '5', title: '!', body: '   ', createdAt: Date.now(), queue: 'Inbox' }
    expect(isSpamLike(short)).toBe(true)
  })

  it('treats emoji-only submissions as reactions candidate', () => {
    const r: FeedbackItem = { id: '6', title: '👍', body: '', createdAt: Date.now(), queue: 'Inbox' }
    expect(shouldBeTreatedAsReaction(r)).toBe(true)
  })

  it('auto-closes eligible items older than 24h', () => {
    const old = Date.now() - 25 * 60 * 60 * 1000
    const item: FeedbackItem = { id: '7', title: '👍', body: '', createdAt: old, queue: 'Needs Clarification' }
    const items = [item]
    const closed = runAutoClose(items, Date.now())
    expect(closed).toContain('7')
    expect(items[0].queue).toBe('Closed')
  })
})
