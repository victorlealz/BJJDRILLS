import { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../../services/supabase'

export function AuthScreen() {
  const [mode, setMode] = useState<'login'|'signup'|'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      if (!isSupabaseConfigured) throw new Error('Configure as variáveis do Supabase no arquivo .env.')
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
        if (error) throw error
        setMessage('E-mail de recuperação enviado.')
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Conta criada. Confirme o e-mail se a confirmação estiver habilitada no Supabase.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível autenticar.') }
    finally { setBusy(false) }
  }

  return <main className="auth-shell"><section className="auth-card">
    <p className="eyebrow">JIU-JITSU</p><h1>Drills</h1><p className="muted">Seu sistema pessoal de evolução técnica.</p>
    <form onSubmit={submit}>
      <label>E-mail<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      {mode !== 'reset' && <label>Senha<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label>}
      <button className="primary" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}</button>
    </form>
    {message && <p role="status" className="notice">{message}</p>}
    <div className="auth-actions">
      <button className="link" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'Já tenho conta' : 'Criar conta'}</button>
      <button className="link" onClick={() => setMode(mode === 'reset' ? 'login' : 'reset')}>{mode === 'reset' ? 'Voltar' : 'Esqueci a senha'}</button>
    </div>
  </section></main>
}
