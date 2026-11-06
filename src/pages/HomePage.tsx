import { selectReviewTechniques } from '../features/drills/generator'
import type { DrillLog, Technique, TechniqueGroup } from '../types/models'
import type { ViewName } from '../components/BottomNavigation'

export function HomePage({ techniques, groups, logs, navigate }: { techniques: Technique[]; groups: TechniqueGroup[]; logs: DrillLog[]; navigate: (v: ViewName) => void }) {
  const review = selectReviewTechniques(techniques, logs, 4)
  const unique = new Set(logs.map(l => l.technique_id)).size
  const last = logs.length ? logs.map(l => l.performed_on).sort().at(-1) : null
  const format = (d: string) => d.split('-').reverse().join('/')
  return <section>
    <header className="page-header"><div><p className="eyebrow">JIU-JITSU</p><h1>Drills</h1></div></header>
    <div className="hero-actions"><button className="primary large" onClick={() => navigate('train')}>Gerar treino</button><button className="secondary large" onClick={() => navigate('history')}>Ver histórico</button></div>
    <div className="stats-strip"><span><strong>{logs.length}</strong> drills</span><span><strong>{unique}</strong> técnicas</span><span><strong>{last ? format(last) : '—'}</strong> último treino</span></div>
    <section className="section"><h2>Para revisar</h2>{review.length ? <ul className="plain-list">{review.map(t => <li key={t.id}><span>{t.name}</span><small>{groups.find(g => g.id === t.group_id)?.name}</small></li>)}</ul> : <p className="empty">Registre seus primeiros drills para iniciar as revisões.</p>}</section>
  </section>
}
