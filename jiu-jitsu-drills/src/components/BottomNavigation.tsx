export type ViewName = 'home' | 'techniques' | 'train' | 'history' | 'settings'
const items: { id: ViewName; label: string }[] = [
  { id:'home', label:'Início' }, { id:'techniques', label:'Técnicas' }, { id:'train', label:'Treinar' }, { id:'history', label:'Histórico' }, { id:'settings', label:'Ajustes' }
]
export function BottomNavigation({ current, onChange }: { current: ViewName; onChange: (view: ViewName) => void }) {
  return <nav className="bottom-nav" aria-label="Navegação principal">{items.map(item => <button key={item.id} className={current === item.id ? 'active' : ''} onClick={() => onChange(item.id)}>{item.label}</button>)}</nav>
}
