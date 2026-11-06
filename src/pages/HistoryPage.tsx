import { deleteDrillLog } from '../services/repository'
import type { DrillLog, Technique } from '../types/models'

export function HistoryPage({ userId, techniques, logs, refresh }: { userId:string; techniques:Technique[]; logs:DrillLog[]; refresh:()=>void }) {
  const byDate = logs.reduce<Record<string, DrillLog[]>>((acc, log) => {
    ;(acc[log.performed_on] ??= []).push(log)
    return acc
  }, {})

  return <section>
    <header className="page-header"><div><p className="eyebrow">REGISTROS</p><h1>Histórico</h1></div></header>
    {(Object.entries(byDate) as [string, DrillLog[]][]).sort(([a], [b]) => b.localeCompare(a)).map(([date, entries]) =>
      <section className="history-day" key={date}>
        <h2>{date.split('-').reverse().join('/')}</h2>
        <ul className="plain-list">
          {entries.map(log => {
            const technique = techniques.find(item => item.id === log.technique_id)
            return <li key={log.id}>
              <span>{technique?.name ?? 'Técnica removida'}</span>
              <button className="icon-btn danger" onClick={async () => {
                if (confirm('Excluir este registro?')) {
                  await deleteDrillLog(userId, log.id)
                  refresh()
                }
              }}>Excluir</button>
            </li>
          })}
        </ul>
      </section>
    )}
    {logs.length === 0 && <p className="empty">Nenhum drill registrado.</p>}
  </section>
}
