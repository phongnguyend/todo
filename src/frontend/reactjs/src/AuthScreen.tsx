import { useState } from 'react'
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { api } from './api'

type Mode = 'login' | 'signup' | 'reset'

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (email: string) => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setResetSent(false)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'reset') {
        if (api.enabled) await api.requestPasswordReset(email)
        setResetSent(true)
        return
      }
      if (mode === 'signup' && api.enabled) await api.signup(username, email, password)
      const token = api.enabled ? await api.login(email, password) : ''
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('donezo_session', email.trim())
      if (token) storage.setItem('todo_access_token', token)
      onAuthenticated(email.trim())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-story" aria-label="Donezo introduction">
      <div className="auth-brand"><span className="brand-symbol"><Check size={16} strokeWidth={3} /></span><span>donezo</span></div>
      <div className="auth-message">
        <span className="auth-kicker">A CLEARER DAY STARTS HERE</span>
        <h1>Make space for<br /><em>what matters.</em></h1>
        <p>A calm place for your tasks, plans, and small wins—without the clutter.</p>
        <div className="auth-proof">
          <span><Check size={15} /></span>
          <div><strong>Plan simply. Finish confidently.</strong><small>Your work stays organized and always within reach.</small></div>
        </div>
      </div>
      <p className="auth-quote">“The secret of getting ahead is getting started.” <span>— Mark Twain</span></p>
    </section>

    <section className="auth-form-side">
      <div className="auth-mobile-brand"><span className="brand-symbol"><Check size={14} strokeWidth={3} /></span>donezo</div>
      <div className="auth-card">
        {mode !== 'login' && <button className="auth-back" onClick={() => switchMode('login')}><ArrowLeft size={16} /> Back to sign in</button>}
        {resetSent ? <div className="reset-success">
          <span><Mail size={26} /></span>
          <h2>Check your inbox</h2>
          <p>If an account exists for <strong>{email}</strong>, we’ve sent password reset instructions.</p>
          <button className="auth-submit" onClick={() => switchMode('login')}>Return to sign in</button>
        </div> : <>
          <div className="auth-heading">
            <span>{mode === 'login' ? 'WELCOME BACK' : mode === 'signup' ? 'CREATE YOUR ACCOUNT' : 'RESET YOUR PASSWORD'}</span>
            <h2>{mode === 'login' ? 'Sign in to Donezo' : mode === 'signup' ? 'Start getting things done' : 'Forgot your password?'}</h2>
            <p>{mode === 'login' ? 'Your next small win is waiting.' : mode === 'signup' ? 'A calmer, more focused day is one step away.' : 'Enter your email and we’ll send you a reset link.'}</p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && <label>Username<div className="auth-input"><UserRound size={17} /><input required minLength={2} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Your name" autoComplete="username" /></div></label>}
            <label>Email address<div className="auth-input"><Mail size={17} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></div></label>
            {mode !== 'reset' && <label>Password<div className="auth-input"><LockKeyhole size={17} /><input required minLength={8} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}

            {mode === 'login' && <div className="auth-options"><label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span><Check size={11} /></span>Remember me</label><button type="button" onClick={() => switchMode('reset')}>Forgot password?</button></div>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}</button>
          </form>

          {mode === 'login' && !api.enabled && <p className="demo-hint"><span>DEMO MODE</span> Use any valid email and an 8+ character password.</p>}
          <p className="auth-switch">{mode === 'login' ? <>New to Donezo? <button onClick={() => switchMode('signup')}>Create an account</button></> : mode === 'signup' ? <>Already have an account? <button onClick={() => switchMode('login')}>Sign in</button></> : null}</p>
        </>}
      </div>
      <p className="auth-legal">By continuing, you agree to our <button>Terms</button> and <button>Privacy Policy</button>.</p>
    </section>
  </main>
}
