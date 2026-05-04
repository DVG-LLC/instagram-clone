/* Shared types for topics */
export type Attachment = { id: string; filename: string } | null

export type Topic = {
  id: string
  title: string
  metadata?: { summary?: string | null }
  attachments?: Attachment[] | null
  relations?: string[] | null
}
