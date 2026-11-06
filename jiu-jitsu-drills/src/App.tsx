import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { registerSW } from 'virtual:pwa-register'
import { BottomNavigation, type ViewName } from './components/BottomNavigation'
import { SyncStatus } from './components/SyncStatus'
import { AuthScreen } from './features/auth/AuthScreen'
import { useLocalData } from './hooks/useLocalData'
import { HomePage } from './pages/HomePage'
import { TechniquesPage } from './pages/TechniquesPage'
import { TrainPage } from './pages/TrainPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { initializeDefaultLibrary } from './services/repository'
import { startSyncLoop } from './services/syncService'
import { supabase } from './services/supabase'

export default function App(){
 const [session,setSession]=useState<Session|null>(null);const [view,setView]=useState<ViewName>('home');const [ready,setReady]=useState(false);const [updateAvailable,setUpdateAvailable]=useState(false);const applyUpdate=useRef<(()=>Promise<void>)|null>(null);const userId=session?.user.id??null;const {groups,techniques,logs,profile,syncState,refresh}=useLocalData(userId)
 useEffect(()=>{void supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setReady(true)});return()=>data.subscription.unsubscribe()},[])
 useEffect(()=>{if(!userId)return;let stop=()=>{};void initializeDefaultLibrary(userId).then(()=>{refresh();stop=startSyncLoop(userId,refresh)});return()=>stop()},[userId,refresh])
 useEffect(()=>{const updateSW=registerSW({onNeedRefresh(){applyUpdate.current=()=>updateSW(true);setUpdateAvailable(true)},onOfflineReady(){console.info('PWA pronta para uso offline')}});return()=>{applyUpdate.current=null}},[])
 if(!ready)return <main className="loading">Carregando…</main>;if(!session)return <AuthScreen/>
 const common={userId:session.user.id,groups,techniques,logs,refresh}
 return <div className="app-shell"><div className="top-status"><SyncStatus state={syncState}/></div><main className="content">{view==='home'&&<HomePage techniques={techniques} groups={groups} logs={logs} navigate={setView}/>} {view==='techniques'&&<TechniquesPage userId={session.user.id} groups={groups} techniques={techniques} refresh={refresh}/>} {view==='train'&&<TrainPage {...common} defaultSeconds={profile?.default_seconds_per_technique??300}/>} {view==='history'&&<HistoryPage {...common}/>} {view==='settings'&&<SettingsPage userId={session.user.id} email={session.user.email??''} seconds={profile?.default_seconds_per_technique??300} syncState={syncState} refresh={refresh}/>}</main>{updateAvailable&&<div className="update-banner">Nova versão disponível <button onClick={()=>void applyUpdate.current?.()}>Atualizar</button></div>}<BottomNavigation current={view} onChange={setView}/></div>
}
