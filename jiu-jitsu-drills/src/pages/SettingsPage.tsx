import { useState } from 'react'
import { db } from '../db/localDb'
import { updateDefaultSeconds } from '../services/repository'
import { syncNow } from '../services/syncService'
import { supabase } from '../services/supabase'
import type { SyncState } from '../types/models'

export function SettingsPage({userId,email,seconds,syncState,refresh}:{userId:string;email:string;seconds:number;syncState:SyncState|null;refresh:()=>void}){
 const [mins,setMins]=useState(Math.max(1,Math.round(seconds/60)))
 return <section><header className="page-header"><div><p className="eyebrow">CONTA</p><h1>Ajustes</h1></div></header><div className="settings-list"><section><h2>Conta</h2><p>{email}</p></section><section><h2>Sincronização</h2><p>{syncState?.status==='error'?(syncState.error_message??'Erro'):(navigator.onLine?'Online':'Offline')}</p><button className="secondary" onClick={async()=>{await syncNow(userId);refresh()}}>Sincronizar agora</button></section><section><h2>Tempo padrão por técnica</h2><div className="inline-setting"><input aria-label="Minutos por técnica" type="number" min="1" value={mins} onChange={e=>setMins(Number(e.target.value))}/><span>min</span><button className="secondary" onClick={async()=>{await updateDefaultSeconds(userId,mins*60);refresh()}}>Salvar</button></div></section><section><h2>Gerenciar dados</h2><p className="muted">Os dados locais são isolados por usuário e sincronizados quando houver conexão.</p><button className="danger-button" onClick={async()=>{if(confirm('Apagar somente os dados locais deste usuário? Eles poderão voltar na próxima sincronização.')){await db.transaction('rw',db.groups,db.techniques,db.drillLogs,db.pendingMutations,db.profiles,async()=>{await db.groups.where('user_id').equals(userId).delete();await db.techniques.where('user_id').equals(userId).delete();await db.drillLogs.where('user_id').equals(userId).delete();await db.pendingMutations.where('user_id').equals(userId).delete();await db.profiles.delete(userId)});location.reload()}}}>Limpar dados locais</button></section><section><button className="secondary full" onClick={()=>supabase.auth.signOut()}>Sair</button></section></div></section>
}
