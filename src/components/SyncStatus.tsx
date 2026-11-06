import type { SyncState } from '../types/models'

export function SyncStatus({ state }: { state: SyncState | null }) {
  const online = navigator.onLine
  const label = !online || state?.status === 'offline' ? 'Offline — alterações serão sincronizadas depois'
    : state?.status === 'syncing' ? 'Sincronizando…'
    : state?.status === 'error' ? 'Erro ao sincronizar'
    : 'Sincronizado'
  return <span className="sync-status" aria-live="polite">{label}</span>
}
