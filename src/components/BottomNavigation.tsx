export type ViewName = 'home' | 'techniques' | 'train' | 'history' | 'settings'

const items: { id: ViewName; label: string }[] = [
  { id: 'home', label: 'Início' },
  { id: 'techniques', label: 'Técnicas' },
  { id: 'train', label: 'Treinar' },
  { id: 'history', label: 'Histórico' },
  { id: 'settings', label: 'Ajustes' }
]

export function TopNavigation({ current, onChange }: { current: ViewName; onChange: (view: ViewName) => void }) {
  return <nav className="top-nav" aria-label="Navegação principal">
    <div className="top-nav-inner">
      <button className="brand-button" onClick={() => onChange('home')} aria-label="Ir para o início">AwakenBJJ</button>
      <details className="cascade-menu">
        <summary>Menu</summary>
        <div className="cascade-panel">
          {items.map(item => <button
            key={item.id}
            className={current === item.id ? 'active' : ''}
            onClick={event => {
              onChange(item.id)
              event.currentTarget.closest('details')?.removeAttribute('open')
            }}
          >{item.label}</button>)}
        </div>
      </details>
    </div>
  </nav>
}
