export type TechniqueLevel = 'fundamental' | 'advanced'
export type EntityName = 'profiles' | 'technique_groups' | 'techniques' | 'drill_logs'
export type MutationOperation = 'upsert' | 'delete'

export interface Profile {
  user_id: string
  library_initialized: boolean
  default_seconds_per_technique: number
  created_at: string
  updated_at: string
}

export interface TechniqueGroup {
  id: string
  user_id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Technique {
  id: string
  user_id: string
  group_id: string
  name: string
  notes: string | null
  level: TechniqueLevel
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DrillLog {
  id: string
  user_id: string
  technique_id: string
  performed_on: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PendingMutation {
  id: string
  user_id: string
  entity: EntityName
  entity_id: string
  operation: MutationOperation
  payload: Profile | TechniqueGroup | Technique | DrillLog
  updated_at: string
  created_at: string
}

export interface SyncState {
  user_id: string
  last_pulled_at: string | null
  last_synced_at: string | null
  status: 'offline' | 'idle' | 'syncing' | 'error'
  error_message: string | null
}

export interface ActiveDrillSession {
  user_id: string
  technique_ids: string[]
  current_index: number
  seconds_per_technique: number
  remaining_seconds: number
  running: boolean
  started_at: string | null
  updated_at: string
}
