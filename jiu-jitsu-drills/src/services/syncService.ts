import type { PostgrestError } from '@supabase/supabase-js'
import { db } from '../db/localDb'
import type { DrillLog, EntityName, PendingMutation, Profile, SyncState, Technique, TechniqueGroup } from '../types/models'
import { isSupabaseConfigured, supabase } from './supabase'
import { remoteWins } from './syncPolicy'

const tables: EntityName[] = ['profiles', 'technique_groups', 'techniques', 'drill_logs']
const epoch = '1970-01-01T00:00:00.000Z'

type RemoteRow = Profile | TechniqueGroup | Technique | DrillLog

function localTable(entity: EntityName) {
  if (entity === 'profiles') return db.profiles
  if (entity === 'technique_groups') return db.groups
  if (entity === 'techniques') return db.techniques
  return db.drillLogs
}

async function setStatus(userId: string, patch: Partial<SyncState>) {
  const current = await db.syncState.get(userId)
  await db.syncState.put({
    user_id: userId,
    last_pulled_at: current?.last_pulled_at ?? null,
    last_synced_at: current?.last_synced_at ?? null,
    status: current?.status ?? 'idle',
    error_message: current?.error_message ?? null,
    ...patch
  })
}

async function applyRemote(entity: EntityName, row: RemoteRow) {
  const table = localTable(entity)
  await (table as any).put(row)
}

async function pushMutation(mutation: PendingMutation) {
  const { data: remote, error: fetchError } = await supabase.from(mutation.entity).select('*').eq(mutation.entity === 'profiles' ? 'user_id' : 'id', mutation.entity_id).maybeSingle()
  if (fetchError) throw fetchError

  if (remote && remoteWins(remote.updated_at, mutation.updated_at)) {
    await applyRemote(mutation.entity, remote as RemoteRow)
    await db.pendingMutations.delete(mutation.id)
    return
  }

  const { error } = await supabase.from(mutation.entity).upsert(mutation.payload as never, { onConflict: mutation.entity === 'profiles' ? 'user_id' : 'id' })
  if (error) throw error
  await db.pendingMutations.delete(mutation.id)
}

async function pullTable(userId: string, entity: EntityName, since: string) {
  const { data, error } = await supabase.from(entity).select('*').eq('user_id', userId).gt('updated_at', since).order('updated_at', { ascending: true })
  if (error) throw error
  for (const row of data ?? []) {
    const local = await (localTable(entity) as any).get(entity === 'profiles' ? userId : row.id)
    if (!local || new Date(row.updated_at).getTime() > new Date(local.updated_at).getTime()) {
      await applyRemote(entity, row as RemoteRow)
    }
  }
}

export async function syncNow(userId: string) {
  if (!isSupabaseConfigured || !navigator.onLine) {
    await setStatus(userId, { status: 'offline' })
    return
  }
  await setStatus(userId, { status: 'syncing', error_message: null })
  try {
    const mutations = await db.pendingMutations.where('user_id').equals(userId).sortBy('created_at')
    for (const mutation of mutations) await pushMutation(mutation)

    const state = await db.syncState.get(userId)
    const since = state?.last_pulled_at ?? epoch
    for (const entity of tables) await pullTable(userId, entity, since)
    const timestamp = new Date().toISOString()
    await setStatus(userId, { status: 'idle', last_pulled_at: timestamp, last_synced_at: timestamp, error_message: null })
  } catch (error) {
    const message = (error as PostgrestError)?.message ?? (error instanceof Error ? error.message : 'Falha de sincronização')
    console.error('sync error', error)
    await setStatus(userId, { status: 'error', error_message: message })
  }
}

let syncTimer: number | null = null
export function startSyncLoop(userId: string, onChanged?: () => void) {
  const run = async () => { await syncNow(userId); onChanged?.() }
  const online = () => { void run() }
  const offline = () => { void setStatus(userId, { status: 'offline' }).then(() => onChanged?.()) }
  window.addEventListener('online', online)
  window.addEventListener('offline', offline)
  void run()
  syncTimer = window.setInterval(() => void run(), 30_000)
  return () => {
    window.removeEventListener('online', online)
    window.removeEventListener('offline', offline)
    if (syncTimer) window.clearInterval(syncTimer)
    syncTimer = null
  }
}
