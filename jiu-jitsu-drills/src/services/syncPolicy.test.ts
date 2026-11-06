import { describe, expect, it } from 'vitest'
import { remoteWins } from './syncPolicy'

describe('sync conflict policy', () => {
  it('keeps the newest write', () => {
    expect(remoteWins('2026-11-06T12:00:01.000Z', '2026-11-06T12:00:00.000Z')).toBe(true)
    expect(remoteWins('2026-11-06T11:59:59.000Z', '2026-11-06T12:00:00.000Z')).toBe(false)
  })
})
