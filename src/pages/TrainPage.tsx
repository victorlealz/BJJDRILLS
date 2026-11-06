import { useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../db/localDb'
import { generateDrill, type DrillMode } from '../features/drills/generator'
import { addDrillLogs } from '../services/repository'
import type { ActiveDrillSession, DrillLog, Technique, TechniqueGroup } from '../types/models'

const today = () => new Date().toLocaleDateString('en-CA')

export function TrainPage({ userId, groups, techniques, logs, refresh }: { userId:string; groups:TechniqueGroup[]; techniques:Technique[]; logs:DrillLog[]; refresh:()=>void }) {
  const [mode, setMode] = useState<DrillMode>('random')
  const [group, setGroup] = useState('all')
  const [count, setCount] = useState(4)
  const [selected, setSelected] = useState<Technique[]>([])
  const [manual, setManual] = useState(false)
  const [manualIds, setManualIds] = useState<string[]>([])
  const [skippedIds, setSkippedIds] = useState<string[]>([])

  const eligible = useMemo(
    () => techniques.filter(t => group === 'all' || t.group_id === group),
    [techniques, group]
  )

  const resumeChecked = useRef(false)

  useEffect(() => {
    if (!selected.length) return
    const session: ActiveDrillSession = {
      user_id: userId,
      technique_ids: selected.map(t => t.id),
      current_index: 0,
      seconds_per_technique: 0,
      remaining_seconds: 0,
      running: false,
      started_at: null,
      updated_at: new Date().toISOString()
    }
    void db.activeSessions.put(session)
  }, [selected, userId])

  useEffect(() => {
    if (resumeChecked.current || techniques.length === 0) return
    resumeChecked.current = true
    void db.activeSessions.get(userId).then(session => {
      if (!session || !session.technique_ids.length) return
      const restored = session.technique_ids
        .map(id => techniques.find(t => t.id === id))
        .filter(Boolean) as Technique[]
      if (restored.length && window.confirm('Você possui um treino em andamento. Continuar?')) {
        setSelected(restored)
      } else {
        void db.activeSessions.delete(userId)
      }
    })
  }, [userId, techniques])

  function generate() {
    const result = manual
      ? techniques.filter(t => manualIds.includes(t.id))
      : generateDrill(mode, eligible, logs, count)
    setSelected(result)
    setSkippedIds([])
  }

  async function finish() {
    const completed = selected.filter(t => !skippedIds.includes(t.id)).map(t => t.id)
    if (completed.length) await addDrillLogs(userId, completed, today())
    await db.activeSessions.delete(userId)
    setSelected([])
    setManualIds([])
    setSkippedIds([])
    refresh()
    alert(completed.length ? 'Drill registrado.' : 'Nenhuma técnica foi marcada como realizada.')
  }

  function shuffle() {
    setSelected(items => [...items].sort(() => Math.random() - .5))
  }

  function move(index: number, delta: number) {
    setSelected(items => {
      const next = [...items]
      const target = index + delta
      if (target < 0 || target >= next.length) return items
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function replace(index: number) {
    const used = new Set(selected.map(x => x.id))
    const pool = eligible.filter(x => !used.has(x.id))
    if (!pool.length) {
      alert('Não há outra técnica elegível disponível.')
      return
    }
    const replacement = pool[Math.floor(Math.random() * pool.length)]
    setSelected(items => items.map((item, i) => i === index ? replacement : item))
  }

  if (selected.length) {
    return <section>
      <header className="page-header"><div><p className="eyebrow">TREINO</p><h1>Técnicas geradas</h1></div></header>
      <ol className="session-list">
        {selected.map((technique, index) => <li key={technique.id}>
          <span>{technique.name}</span>
          <span className="session-actions">
            <button aria-label={`Mover ${technique.name} para cima`} onClick={() => move(index, -1)}>↑</button>
            <button aria-label={`Mover ${technique.name} para baixo`} onClick={() => move(index, 1)}>↓</button>
            <button onClick={() => replace(index)}>trocar</button>
          </span>
        </li>)}
      </ol>
      <button className="secondary full" onClick={shuffle}>Embaralhar</button>
      <section className="section compact-section">
        <h2>Técnicas realizadas</h2>
        {selected.map(technique => <label className="check-row" key={technique.id}>
          <input
            type="checkbox"
            checked={!skippedIds.includes(technique.id)}
            onChange={event => setSkippedIds(ids => event.target.checked ? ids.filter(id => id !== technique.id) : [...ids, technique.id])}
          />
          <span>{technique.name}</span>
        </label>)}
        <button className="primary full" onClick={finish}>Salvar no histórico</button>
        <button className="link full" onClick={() => { void db.activeSessions.delete(userId); setSelected([]) }}>Voltar ao gerador</button>
      </section>
    </section>
  }

  return <section>
    <header className="page-header"><div><p className="eyebrow">TREINAR</p><h1>Gerar treino</h1></div></header>
    <div className="mode-grid">
      {([['random', 'Aleatório'], ['fundamental', 'Fundamentos'], ['review', 'Revisão'], ['advanced', 'Avançado']] as const).map(([id, label]) =>
        <button className={mode === id && !manual ? 'active' : ''} onClick={() => { setMode(id); setManual(false) }} key={id}>{label}</button>
      )}
      <button className={manual ? 'active' : ''} onClick={() => setManual(true)}>Manual</button>
    </div>
    <div className="form-card">
      <label>Grupo
        <select value={group} onChange={event => setGroup(event.target.value)}>
          <option value="all">Todos os grupos</option>
          {groups.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select>
      </label>
      {manual ? <div className="manual-list">
        {eligible.map(technique => <label className="check-row" key={technique.id}>
          <input
            type="checkbox"
            checked={manualIds.includes(technique.id)}
            onChange={event => setManualIds(ids => event.target.checked ? [...ids, technique.id] : ids.filter(id => id !== technique.id))}
          />
          <span>{technique.name}</span>
        </label>)}
      </div> : <label>Quantidade
        <input type="number" min="1" value={count} onChange={event => setCount(Number(event.target.value))} />
      </label>}
      <p className="muted">{manual ? `${manualIds.length} técnica(s) selecionada(s)` : `Serão selecionadas até ${count} técnica(s).`}</p>
      <button className="primary full" disabled={manual ? manualIds.length === 0 : eligible.length === 0} onClick={generate}>{manual ? 'Montar treino' : 'Gerar treino'}</button>
    </div>
  </section>
}
