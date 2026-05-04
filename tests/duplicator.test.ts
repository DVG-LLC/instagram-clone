import { describe, it, expect, beforeEach } from 'vitest'
import { duplicateTopic, _resetStoreForTests } from '../src/lib/duplicator'

describe('duplicateTopic', () => {
  beforeEach(() => {
    _resetStoreForTests()
  })

  it('duplicates a topic and returns a new topic with a unique id', async () => {
    const result = await duplicateTopic('t-1')
    expect(result).toHaveProperty('id')
    expect(result.id).not.toBe('t-1')
    expect(result.title).toContain('copy')
  })

  it('handles nullish attachments/relations/metadata without throwing', async () => {
    // t-2 has null attachments and relations in the seeded store
    const r = await duplicateTopic('t-2')
    expect(r).toHaveProperty('attachments')
    expect(Array.isArray(r.attachments)).toBe(true)
    expect(r.relations).toBeDefined()
  })

  it('serializes concurrent duplicate requests for the same source and completes both', async () => {
    // Fire two duplications at almost the same time
    const [a, b] = await Promise.all([duplicateTopic('t-1'), duplicateTopic('t-1')])
    // Both should complete and produce distinct ids
    expect(a.id).not.toBe(b.id)
    expect(a.title).toContain('copy')
    expect(b.title).toContain('copy')
  })
})
