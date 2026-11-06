import { supabase } from '../services/supabase'

export function SettingsPage({ email }: { email:string }) {
  return <section>
    <header className="page-header"><div><p className="eyebrow">CONTA</p><h1>Ajustes</h1></div></header>
    <div className="settings-list">
      <section><h2>Conta</h2><p>{email}</p></section>
      <section><button className="secondary full" onClick={() => supabase.auth.signOut()}>Sair</button></section>
    </div>
  </section>
}
