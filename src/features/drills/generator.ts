import type { DrillLog, Technique, TechniqueLevel } from '../../types/models'

export type DrillMode = 'random' | 'fundamental' | 'review' | 'advanced'

export function quantityFromDuration(totalMinutes: number, minutesPerTechnique: number) {
  if (!Number.isFinite(totalMinutes) || !Number.isFinite(minutesPerTechnique) || minutesPerTechnique <= 0) return 1
  return Math.max(1, Math.floor(totalMinutes / minutesPerTechnique))
}

function shuffled<T>(items: T[], random = Math.random) {
  return [...items].sort(() => random() - 0.5)
}

export function selectRandomTechniques(techniques: Technique[], count: number, level?: TechniqueLevel | 'all', random = Math.random) {
  const eligible = techniques.filter(t => !t.deleted_at && (!level || level === 'all' || t.level === level))
  return shuffled(eligible, random).slice(0, Math.min(Math.max(0, count), eligible.length))
}

export function selectReviewTechniques(techniques: Technique[], logs: DrillLog[], count: number, random = Math.random) {
  const active = techniques.filter(t => !t.deleted_at)
  const stats = new Map<string, { count: number; last: number }>()
  for (const log of logs.filter(l => !l.deleted_at)) {
    const date = new Date(`${log.performed_on}T12:00:00`).getTime()
    const current = stats.get(log.technique_id) ?? { count: 0, last: 0 }
    stats.set(log.technique_id, { count: current.count + 1, last: Math.max(current.last, date) })
  }
  const now = Date.now()
  return active
    .map(technique => {
      const stat = stats.get(technique.id)
      const neverBonus = stat ? 0 : 10_000_000
      const days = stat?.last ? Math.floor((now - stat.last) / 86_400_000) : 3650
      const lowFrequency = stat ? Math.max(0, 100 - stat.count * 10) : 1000
      const jitter = random() * 20
      return { technique, score: neverBonus + days * 100 + lowFrequency + jitter }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(count, active.length))
    .map(item => item.technique)
}

export function generateDrill(mode: DrillMode, techniques: Technique[], logs: DrillLog[], count: number, random = Math.random) {
  if (mode === 'review') return selectReviewTechniques(techniques, logs, count, random)
  if (mode === 'fundamental') return selectRandomTechniques(techniques, count, 'fundamental', random)
  if (mode === 'advanced') return selectRandomTechniques(techniques, count, 'advanced', random)
  return selectRandomTechniques(techniques, count, 'all', random)
}
