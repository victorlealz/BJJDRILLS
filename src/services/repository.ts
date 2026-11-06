import { db } from '../db/localDb'
import defaultLibrary from '../data/default-library.json'
import type { DrillLog, EntityName, PendingMutation, Profile, Technique, TechniqueGroup, TechniqueLevel } from '../types/models'

const now = () => new Date().toISOString()
const uuid = () => crypto.randomUUID()

type SyncEntity = Profile | TechniqueGroup | Technique | DrillLog

async function enqueue(userId: string, entity: EntityName, entityId: string, payload: SyncEntity, operation: 'upsert' | 'delete' = 'upsert') {
  const timestamp = now()
  const mutation: PendingMutation = {
    id: uuid(), user_id: userId, entity, entity_id: entityId, operation, payload,
    updated_at: timestamp, created_at: timestamp
  }
  await db.pendingMutations.add(mutation)
}

export async function ensureLocalProfile(userId: string) {
  const existing = await db.profiles.get(userId)
  if (existing) return existing
  const timestamp = now()
  const profile: Profile = { user_id: userId, library_initialized: false, default_seconds_per_technique: 300, created_at: timestamp, updated_at: timestamp }
  await db.profiles.put(profile)
  await enqueue(userId, 'profiles', userId, profile)
  return profile
}

export async function initializeDefaultLibrary(userId: string) {
  const profile = await ensureLocalProfile(userId)
  if (profile.library_initialized) return
  const timestamp = now()
  await db.transaction('rw', db.profiles, db.groups, db.techniques, db.pendingMutations, async () => {
    const latest = await db.profiles.get(userId)
    if (latest?.library_initialized) return
    for (const [index, groupDef] of defaultLibrary.entries()) {
      const group: TechniqueGroup = { id: uuid(), user_id: userId, name: groupDef.name, sort_order: index, created_at: timestamp, updated_at: timestamp, deleted_at: null }
      await db.groups.add(group)
      await enqueue(userId, 'technique_groups', group.id, group)
      for (const techniqueDef of groupDef.techniques) {
        const technique: Technique = {
          id: uuid(), user_id: userId, group_id: group.id, name: techniqueDef.name, notes: null,
          level: techniqueDef.level as TechniqueLevel, created_at: timestamp, updated_at: timestamp, deleted_at: null
        }
        await db.techniques.add(technique)
        await enqueue(userId, 'techniques', technique.id, technique)
      }
    }
    const initialized: Profile = { ...(latest ?? profile), library_initialized: true, updated_at: timestamp }
    await db.profiles.put(initialized)
    await enqueue(userId, 'profiles', userId, initialized)
  })
}

export const getGroups = (userId: string) => db.groups.where('user_id').equals(userId).filter(g => !g.deleted_at).sortBy('sort_order')
export const getTechniques = (userId: string) => db.techniques.where('user_id').equals(userId).filter(t => !t.deleted_at).toArray()
export const getDrillLogs = (userId: string) => db.drillLogs.where('user_id').equals(userId).filter(l => !l.deleted_at).reverse().sortBy('performed_on')

export async function saveGroup(userId: string, input: { id?: string; name: string; sort_order: number }) {
  const timestamp = now()
  const previous = input.id ? await db.groups.get(input.id) : undefined
  const group: TechniqueGroup = previous
    ? { ...previous, name: input.name.trim(), sort_order: input.sort_order, updated_at: timestamp, deleted_at: null }
    : { id: uuid(), user_id: userId, name: input.name.trim(), sort_order: input.sort_order, created_at: timestamp, updated_at: timestamp, deleted_at: null }
  await db.groups.put(group)
  await enqueue(userId, 'technique_groups', group.id, group)
  return group
}

export async function deleteGroup(userId: string, groupId: string) {
  const timestamp = now()
  await db.transaction('rw', db.groups, db.techniques, db.pendingMutations, async () => {
    const group = await db.groups.get(groupId)
    if (!group || group.user_id !== userId) return
    const deletedGroup = { ...group, updated_at: timestamp, deleted_at: timestamp }
    await db.groups.put(deletedGroup)
    await enqueue(userId, 'technique_groups', group.id, deletedGroup, 'delete')
    const techniques = await db.techniques.where('[user_id+group_id]').equals([userId, groupId]).toArray()
    for (const technique of techniques.filter(t => !t.deleted_at)) {
      const deletedTechnique = { ...technique, updated_at: timestamp, deleted_at: timestamp }
      await db.techniques.put(deletedTechnique)
      await enqueue(userId, 'techniques', technique.id, deletedTechnique, 'delete')
    }
  })
}

export async function saveTechnique(userId: string, input: { id?: string; group_id: string; name: string; notes: string; level: TechniqueLevel }) {
  const timestamp = now()
  const previous = input.id ? await db.techniques.get(input.id) : undefined
  const technique: Technique = previous
    ? { ...previous, group_id: input.group_id, name: input.name.trim(), notes: input.notes.trim() || null, level: input.level, updated_at: timestamp, deleted_at: null }
    : { id: uuid(), user_id: userId, group_id: input.group_id, name: input.name.trim(), notes: input.notes.trim() || null, level: input.level, created_at: timestamp, updated_at: timestamp, deleted_at: null }
  await db.techniques.put(technique)
  await enqueue(userId, 'techniques', technique.id, technique)
  return technique
}

export async function deleteTechnique(userId: string, techniqueId: string) {
  const technique = await db.techniques.get(techniqueId)
  if (!technique || technique.user_id !== userId) return
  const timestamp = now()
  const deleted = { ...technique, updated_at: timestamp, deleted_at: timestamp }
  await db.techniques.put(deleted)
  await enqueue(userId, 'techniques', technique.id, deleted, 'delete')
}

export async function addDrillLogs(userId: string, techniqueIds: string[], performedOn: string) {
  const timestamp = now()
  await db.transaction('rw', db.drillLogs, db.pendingMutations, async () => {
    for (const techniqueId of techniqueIds) {
      const log: DrillLog = { id: uuid(), user_id: userId, technique_id: techniqueId, performed_on: performedOn, created_at: timestamp, updated_at: timestamp, deleted_at: null }
      await db.drillLogs.add(log)
      await enqueue(userId, 'drill_logs', log.id, log)
    }
  })
}

export async function deleteDrillLog(userId: string, id: string) {
  const log = await db.drillLogs.get(id)
  if (!log || log.user_id !== userId) return
  const timestamp = now()
  const deleted = { ...log, updated_at: timestamp, deleted_at: timestamp }
  await db.drillLogs.put(deleted)
  await enqueue(userId, 'drill_logs', id, deleted, 'delete')
}

export async function updateDefaultSeconds(userId: string, seconds: number) {
  const profile = await ensureLocalProfile(userId)
  const updated: Profile = { ...profile, default_seconds_per_technique: seconds, updated_at: now() }
  await db.profiles.put(updated)
  await enqueue(userId, 'profiles', userId, updated)
}
