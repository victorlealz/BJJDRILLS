import { useCallback, useEffect, useState } from 'react'
import { db } from '../db/localDb'
import { getDrillLogs, getGroups, getTechniques } from '../services/repository'
import type { DrillLog, Profile, SyncState, Technique, TechniqueGroup } from '../types/models'

export function useLocalData(userId: string | null) {
  const [groups, setGroups] = useState<TechniqueGroup[]>([])
  const [techniques, setTechniques] = useState<Technique[]>([])
  const [logs, setLogs] = useState<DrillLog[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [syncState, setSyncState] = useState<SyncState | null>(null)
  const [revision, setRevision] = useState(0)

  const refresh = useCallback(() => setRevision(v => v + 1), [])

  useEffect(() => {
    if (!userId) return
    let live = true
    void Promise.all([getGroups(userId), getTechniques(userId), getDrillLogs(userId), db.profiles.get(userId), db.syncState.get(userId)]).then(([g,t,l,p,s]) => {
      if (!live) return
      setGroups(g); setTechniques(t); setLogs(l); setProfile(p ?? null); setSyncState(s ?? null)
    })
    return () => { live = false }
  }, [userId, revision])

  return { groups, techniques, logs, profile, syncState, refresh }
}
