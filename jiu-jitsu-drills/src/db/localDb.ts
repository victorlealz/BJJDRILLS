import Dexie, { type EntityTable } from 'dexie'
import type { ActiveDrillSession, DrillLog, PendingMutation, Profile, SyncState, Technique, TechniqueGroup } from '../types/models'

class JiuJitsuDb extends Dexie {
  profiles!: EntityTable<Profile, 'user_id'>
  groups!: EntityTable<TechniqueGroup, 'id'>
  techniques!: EntityTable<Technique, 'id'>
  drillLogs!: EntityTable<DrillLog, 'id'>
  pendingMutations!: EntityTable<PendingMutation, 'id'>
  syncState!: EntityTable<SyncState, 'user_id'>
  activeSessions!: EntityTable<ActiveDrillSession, 'user_id'>

  constructor() {
    super('jiu-jitsu-drills')
    this.version(1).stores({
      profiles: '&user_id, updated_at',
      groups: '&id, user_id, [user_id+sort_order], updated_at, deleted_at',
      techniques: '&id, user_id, group_id, [user_id+group_id], level, updated_at, deleted_at',
      drillLogs: '&id, user_id, technique_id, performed_on, [user_id+performed_on], updated_at, deleted_at',
      pendingMutations: '&id, user_id, [user_id+created_at], entity, entity_id, updated_at',
      syncState: '&user_id',
      activeSessions: '&user_id, updated_at'
    })
  }
}

export const db = new JiuJitsuDb()
