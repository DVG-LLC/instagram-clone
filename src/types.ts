// Core domain types for feedback items and queues.

export type QueueName = 'Inbox' | 'Needs Clarification' | 'Backlog' | 'Closed' | 'Prioritized'

export interface FeedbackItem {
  id: string
  title: string
  body: string
  createdAt: number // epoch ms
  queue: QueueName
  closedAt?: number
  flags?: string[]
  reactionToId?: string | null // if this was aggregated as a reaction
}
