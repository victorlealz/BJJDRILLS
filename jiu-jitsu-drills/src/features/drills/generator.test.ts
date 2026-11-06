import { describe, expect, it } from 'vitest'
import type { DrillLog, Technique } from '../../types/models'
import { generateDrill, quantityFromDuration, selectReviewTechniques } from './generator'

const base = (id: string, level: 'fundamental' | 'advanced'): Technique => ({ id, user_id: 'u', group_id: 'g', name: id, notes: null, level, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', deleted_at: null })
const techniques = [base('a','fundamental'), base('b','fundamental'), base('c','advanced'), base('d','advanced')]

describe('generator', () => {
  it('does not repeat techniques', () => {
    const result = generateDrill('random', techniques, [], 4, () => 0.5)
    expect(new Set(result.map(t => t.id)).size).toBe(result.length)
  })
  it('filters fundamentals and advanced', () => {
    expect(generateDrill('fundamental', techniques, [], 4).every(t => t.level === 'fundamental')).toBe(true)
    expect(generateDrill('advanced', techniques, [], 4).every(t => t.level === 'advanced')).toBe(true)
  })
  it('prioritizes never trained in review', () => {
    const logs: DrillLog[] = [{ id:'l', user_id:'u', technique_id:'a', performed_on:'2026-11-05', created_at:'2026-11-05T12:00:00Z', updated_at:'2026-11-05T12:00:00Z', deleted_at:null }]
    expect(selectReviewTechniques(techniques, logs, 1, () => 0)[0].id).not.toBe('a')
  })
  it('calculates duration with minimum one', () => {
    expect(quantityFromDuration(20, 5)).toBe(4)
    expect(quantityFromDuration(2, 5)).toBe(1)
  })
})
