import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { BackButton } from './components/BackButton'
import { ChallengeDetailPage, ChallengeListPage } from './components/ChallengePages'
import { CoachPage } from './components/CoachPage'
import { challengeState } from './components/challengeState'
import { RescueFlow } from './components/RescueFlow'
import {
  clearSession,
  completeChallenge,
  createCheckIn,
  getChallenges,
  getDashboard,
  getFocusAnalytics,
  getLeaderboard,
  getRescueHistory,
  joinChallenge,
  completeFocusSession,
  logFocusDistraction,
  loginUser,
  readStoredSession,
  registerUser,
  saveSession,
  startFocusSession,
  type ChallengeSummaryResponse,
  type DashboardResponse,
  type FocusAnalyticsResponse,
  type FocusSessionResponse,
  type LeaderboardSummaryResponse,
  type RescueSessionResponse,
  type SessionPayload,
} from './lib/api'

type AuthMode = 'login' | 'register'

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Logo() {
  return <a className="logo" href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}><span className="logo-mark">o</span><span>orbit</span></a>
}

export function AuthScreen({ mode, setMode, loading, error, form, setForm, onSubmit }: {
  mode: AuthMode
  setMode: (mode: AuthMode) => void
  loading: boolean
  error: string
  form: { fullName: string; email: string; password: string }
  setForm: (form: { fullName: string; email: string; password: string }) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <main className="auth-screen">
      <div className="auth-aside">
        <Logo />
        <div className="aside-copy">
          <p className="kicker">A gentler way forward</p>
          <h1>Make room for what matters.</h1>
          <p>Orbit helps you notice your patterns, protect your attention, and build momentum without turning your life into a score.</p>
        </div>
        <p className="aside-note">Private by design. Built for real days.</p>
      </div>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel-head">
          <p className="kicker">Welcome to Orbit</p>
          <h2 id="auth-title">{mode === 'login' ? 'Good to see you.' : 'Start where you are.'}</h2>
          <p>{mode === 'login' ? 'Sign in to pick up your thread.' : 'Create a private space for your next chapter.'}</p>
        </div>
        <div className="auth-tabs" role="tablist" aria-label="Authentication options">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Log in</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
        </div>
        <form className="form-stack" onSubmit={onSubmit}>
          {mode === 'register' && <label><span>Full name</span><input type="text" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Your name" required /></label>}
          <label><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required /></label>
          <label><span>Password</span><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" minLength={8} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={loading}>{loading ? 'One moment…' : mode === 'login' ? 'Continue to Orbit' : 'Create my space'}</button>
        </form>
        <p className="form-footnote">By continuing, you agree to keep this space kind and private.</p>
      </section>
    </main>
  )
}

export function CheckInModal({ saving, error, onClose, onSubmit }: { saving: boolean; error: string; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="check-in-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-head"><div><p className="kicker">Daily reflection</p><h2 id="check-in-title">How are you arriving today?</h2></div><button className="close-button" type="button" onClick={onClose} aria-label="Close check-in">×</button></div>
      <form className="form-stack" onSubmit={onSubmit}>
        <label><span>Mood</span><select name="mood" defaultValue="" required><option value="" disabled>Choose one</option><option value="energized">Energized</option><option value="focused">Focused</option><option value="steady">Steady</option><option value="overwhelmed">Overwhelmed</option><option value="tired">Tired</option></select></label>
        <div className="form-grid"><label><span>Energy <em>1–10</em></span><input name="energyLevel" type="number" min="1" max="10" defaultValue="7" required /></label><label><span>Focus <em>1–10</em></span><input name="focusRating" type="number" min="1" max="10" defaultValue="7" required /></label></div>
        <label><span>One thing you noticed <em>optional</em></span><textarea name="reflection" rows={3} placeholder="What shaped your day?" /></label>
        <label><span>Small win <em>optional</em></span><input name="winOfDay" placeholder="What moved forward?" /></label>
        <label><span>Anything in the way <em>optional</em></span><input name="blockers" placeholder="Comma-separated, if useful" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose}>Not now</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save check-in'}</button></div>
      </form>
    </section>
  </div>
}

function Dashboard({ data, challenges, leaderboard, history, userName, onCheckIn, onRescue, onChallenge, onChallenges, onChallengeDetail }: { data: DashboardResponse; challenges: ChallengeSummaryResponse | null; leaderboard: LeaderboardSummaryResponse | null; history: RescueSessionResponse[]; userName: string; onCheckIn: () => void; onRescue: () => void; onChallenge: (name: string, action: 'join' | 'complete') => void; onChallenges: () => void; onChallengeDetail: (name: string) => void }) {
  const challengeRows = useMemo(() => {
    if (!challenges) return []
    return challenges.available_challenges.map((name) => {
      const state = challengeState(name, challenges)
      return { name, status: state.label, progress: state.progress }
    })
  }, [challenges])
  const latestCheckIn = data.checkins[0]
  const firstName = userName.split(' ')[0]
  const today = new Date()
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(today)
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return <main className="page-content" id="today">
    <section className="welcome-row"><div><p className="kicker">{dateLabel}</p><h1>{greeting}, {firstName}.</h1><p className="lede">A little structure for the things you care about.</p></div><div className="quiet-orbit" aria-hidden="true"><span>o</span><small>your pace<br />your orbit</small></div></section>
    <section className="today-grid">
      <div className="today-focus"><p className="kicker">Today’s intention</p><h2>{data.profile.primary_goal || 'Make space for one good thing.'}</h2><p>{data.profile.bio || 'You do not need a perfect day. Just a clear next step.'}</p><div className="primary-actions"><button className="button button-primary" onClick={onCheckIn}>Log a check-in <span>→</span></button><button className="button button-outline" onClick={() => document.getElementById('focus')?.scrollIntoView({ behavior: 'smooth' })}>View today <span>↓</span></button></div></div>
      <div className="today-progress"><div className="progress-header"><span>Profile progress</span><strong>{data.summary.profile_completion}%</strong></div><div className="line-progress"><span style={{ width: `${data.summary.profile_completion}%` }} /></div><p>{data.profile.focus_goals || 'Choose a focus that feels meaningful.'}</p></div>
    </section>
    <section className="rescue-banner" aria-labelledby="rescue-title"><div className="rescue-mark">+</div><div><p className="kicker">A moment for you</p><h2 id="rescue-title">Something got loud?</h2><p>Take 60 seconds to pause, move, and come back to yourself.</p></div><button className="button button-rescue" onClick={onRescue}>I need help <span>→</span></button></section>
    <section className="metric-row" aria-label="Your progress"><div><span className="metric-value">{data.summary.recent_checkins_count}</span><span className="metric-label">check-ins this week</span></div><div><span className="metric-value">{leaderboard?.leaders.find((entry) => entry.user_id === data.user.id)?.current_streak ?? 0}</span><span className="metric-label">day streak</span></div><div><span className="metric-value">{leaderboard?.leaders.find((entry) => entry.user_id === data.user.id)?.xp_points ?? 0}</span><span className="metric-label">points earned</span></div><div><span className="metric-value">{history.length}</span><span className="metric-label">resets completed</span></div></section>
    <section className="dashboard-grid" id="focus">
      <article className="content-section"><div className="section-heading"><div><p className="kicker">Keep moving</p><h2>Suggested for you</h2></div><span className="section-note">Based on your orbit</span></div><div className="suggestion-list"><button className="suggestion-row" onClick={onCheckIn}><span className="suggestion-icon">◌</span><span><strong>Check in with yourself</strong><small>{latestCheckIn ? 'You have already checked in today.' : 'A two-minute reflection to notice where you are.'}</small></span><span>→</span></button><button className="suggestion-row" onClick={onRescue}><span className="suggestion-icon">✦</span><span><strong>Take a small reset</strong><small>Breathing, movement, or grounding. Your choice.</small></span><span>→</span></button></div></article>
      <article className="content-section challenges-section" id="challenges"><div className="section-heading"><div><p className="kicker">Your practice</p><h2>Challenges</h2></div><button className="section-link" onClick={onChallenges}>View all →</button></div>{challengeRows.length === 0 ? <div className="empty-state">Your next challenge will appear here when your plan is ready.</div> : <div className="challenge-rows">{challengeRows.slice(0, 3).map((challenge) => <div className="challenge-row" key={challenge.name}><button className="challenge-row-link" onClick={() => onChallengeDetail(challenge.name)}><div className="challenge-row-top"><strong>{challenge.name}</strong><span>{challenge.status}</span></div><div className="line-progress"><span className={challenge.progress === null ? 'indeterminate' : ''} style={challenge.progress === null ? undefined : { width: `${challenge.progress}%` }} /></div></button>{challenge.status !== 'Complete' && <button className="text-button" onClick={() => onChallenge(challenge.name, challenge.status === 'Ready' ? 'join' : 'complete')}>{challenge.status === 'Ready' ? 'Start challenge' : 'Mark complete'} →</button>}</div>)}</div>}</article>
    </section>
    <section className="dashboard-grid lower-grid" id="progress"><article className="content-section"><div className="section-heading"><div><p className="kicker">Your rhythm</p><h2>Focus pulse</h2></div><span className="section-note">Last {Math.min(data.checkins.length, 7)} check-ins</span></div>{data.checkins.length === 0 ? <div className="empty-state">Your focus pulse will take shape after your first check-in.</div> : <div className="pulse-chart" aria-label="Recent focus ratings">{data.checkins.slice(0, 7).reverse().map((checkin) => <span key={checkin.id} style={{ height: `${Math.max(12, (checkin.focus_rating ?? 1) * 10)}%` }} title={`${checkin.focus_rating ?? 0} out of 10`} />)}</div>}</article><article className="content-section" id="insights"><div className="section-heading"><div><p className="kicker">A note to keep</p><h2>Recent wins</h2></div><span className="section-note">You noticed</span></div>{data.checkins.filter((checkin) => checkin.win_of_day).slice(0, 2).length === 0 ? <div className="empty-state">No wins written down yet. They count, even when they feel small.</div> : <ul className="win-list">{data.checkins.filter((checkin) => checkin.win_of_day).slice(0, 2).map((checkin) => <li key={checkin.id}><span>✓</span>{checkin.win_of_day}</li>)}</ul>}</article></section>
  </main>
}

export function RescuePage({ token, onBack, onFocus, onCoach, embedded = false }: { token: string; onBack: () => void; onFocus: () => void; onCoach: () => void; embedded?: boolean }) {
  return <RescueFlow token={token} onDashboard={onBack} onFocus={onFocus} onCoach={onCoach} embedded={embedded} />
}

export function FocusPage({ token, onBack, embedded = false }: { token: string; onBack: () => void; embedded?: boolean }) {
  const requestedDuration = Number(new URLSearchParams(window.location.search).get('duration'))
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState([25, 50, 90].includes(requestedDuration) ? requestedDuration : 25)
  const [focusSession, setFocusSession] = useState<FocusSessionResponse | null>(null)
  const [analytics, setAnalytics] = useState<FocusAnalyticsResponse | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [notes, setNotes] = useState('')
  const [distractionSource, setDistractionSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const finishingRef = useRef(false)

  useEffect(() => {
    getFocusAnalytics(token).then(setAnalytics).catch(() => undefined)
  }, [token])

  async function startFocus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (goal.trim().length < 3) {
      setError('Give this focus block a short, specific goal.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const started = await startFocusSession(token, { goal: goal.trim(), duration_minutes: duration })
      setFocusSession(started)
      setRemaining(duration * 60)
    } catch (startError) {
      setError((startError as Error).message || 'Unable to start Focus Mode.')
    } finally {
      setLoading(false)
    }
  }

  const finishFocus = useCallback(async () => {
    if (!focusSession || finishingRef.current) return
    finishingRef.current = true
    setLoading(true)
    setError('')
    try {
      const completed = await completeFocusSession(token, focusSession.id, notes)
      setFocusSession(completed)
      setAnalytics(await getFocusAnalytics(token))
    } catch (completeError) {
      setError((completeError as Error).message || 'Unable to complete this focus block.')
    } finally {
      finishingRef.current = false
      setLoading(false)
    }
  }, [focusSession, notes, token])

  useEffect(() => {
    if (focusSession?.status !== 'active' || remaining <= 0) return
    const timer = window.setInterval(() => {
      if (remaining === 1) {
        void finishFocus()
        setRemaining(0)
        return
      }
      setRemaining(remaining - 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [finishFocus, focusSession?.status, remaining])

  async function recordDistraction() {
    if (!focusSession || !distractionSource.trim()) return
    try {
      await logFocusDistraction(token, focusSession.id, distractionSource.trim())
      setFocusSession({ ...focusSession, distractions_count: focusSession.distractions_count + 1 })
      setDistractionSource('')
    } catch (distractionError) {
      setError((distractionError as Error).message || 'Unable to log that distraction.')
    }
  }

  function resetFocus() {
    setFocusSession(null)
    setRemaining(0)
    setNotes('')
    setDistractionSource('')
    setError('')
  }

  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0')
  const seconds = (remaining % 60).toString().padStart(2, '0')

  return <div className={`focus-page ${embedded ? 'focus-page-embedded' : ''}`}>{embedded ? <div className="embedded-page-toolbar"><BackButton fallback="/" label="Back to dashboard" onBack={onBack} /><span className="embedded-page-label">Focus Mode</span></div> : <header className="focus-header"><BackButton fallback="/" label="Back" onBack={onBack} /><Logo /><span className="rescue-label">Focus Mode</span></header>}<div className="focus-stage">
    {!focusSession && <section className="focus-setup"><div className="focus-setup-copy"><p className="kicker">A protected pocket of time</p><h1>Make room for the work.</h1><p>Choose one thing. Orbit will keep the rest of the world at a respectful distance.</p></div><form className="focus-form" onSubmit={startFocus}><label><span>What would feel good to finish?</span><input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Outline the first section" minLength={3} maxLength={255} required autoFocus /></label><fieldset><legend>How much time do you have?</legend><div className="focus-duration-options">{[5, 15, 25, 45, 50, 90].map((option) => <button type="button" key={option} className={duration === option ? 'focus-duration active' : 'focus-duration'} onClick={() => setDuration(option)}>{option}<small>min</small></button>)}</div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary button-wide" type="submit" disabled={loading}>{loading ? 'Opening your focus space…' : 'Start Focus Mode →'}</button></form>{analytics && <div className="focus-history-note"><strong>{analytics.completed_sessions}</strong><span>completed focus blocks<br />{analytics.total_minutes} minutes in your orbit</span></div>}</section>}
    {focusSession?.status === 'active' && <section className="focus-active"><p className="kicker">You are focusing on</p><h1>{focusSession.goal}</h1><div className="focus-timer" aria-live="polite"><span>{minutes}:{seconds}</span><small>protected time remaining</small></div><div className="focus-meter"><span style={{ width: `${Math.max(0, Math.min(100, ((focusSession.duration_minutes * 60 - remaining) / (focusSession.duration_minutes * 60)) * 100))}%` }} /></div><div className="focus-active-actions"><button className="button button-primary" onClick={() => void finishFocus()} disabled={loading}>Finish focus block</button><button className="button button-outline" onClick={() => void finishFocus()} disabled={loading}>End early</button></div><div className="distraction-box"><div><p className="kicker">A thought pulled you away?</p><p>Log it, then return without judgment.</p></div><div className="distraction-form"><input value={distractionSource} onChange={(event) => setDistractionSource(event.target.value)} placeholder="What pulled you away?" /><button className="text-button" onClick={() => void recordDistraction()} disabled={!distractionSource.trim()}>Log it</button></div><small>{focusSession.distractions_count} distractions logged</small></div></section>}
    {focusSession?.status === 'completed' && <section className="focus-complete"><span className="complete-mark">✓</span><p className="kicker">Focus block complete</p><h1>You kept a promise to your attention.</h1><p>{focusSession.duration_minutes} minutes on {focusSession.goal}. Take a breath before you choose what comes next.</p><label className="focus-notes"><span>Want to leave a note? <em>optional</em></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="What did you notice?" /></label><div className="complete-actions"><button className="button button-primary" onClick={resetFocus}>Start another block</button><button className="button button-outline" onClick={onBack}>Return to dashboard</button></div></section>}
  </div></div>
}

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [session, setSession] = useState<SessionPayload | null>(() => readStoredSession())
  const [path, setPath] = useState(window.location.pathname)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardSummaryResponse | null>(null)
  const [challenges, setChallenges] = useState<ChallengeSummaryResponse | null>(null)
  const [rescueHistory, setRescueHistory] = useState<RescueSessionResponse[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(() => readStoredSession() !== null)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [savingCheckIn, setSavingCheckIn] = useState(false)
  const [checkInError, setCheckInError] = useState('')
  const [form, setForm] = useState({ fullName: '', email: 'demo@orbit.app', password: 'StrongPass123!' })

  useEffect(() => { const onPopState = () => setPath(window.location.pathname); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState) }, [])
  useEffect(() => {
    if (!session) return
    let mounted = true
    Promise.all([getDashboard(session.access_token), getLeaderboard(session.access_token), getChallenges(session.access_token), getRescueHistory(session.access_token)])
      .then(([nextData, nextLeaderboard, nextChallenges, nextHistory]) => { if (!mounted) return; setData(nextData); setLeaderboard(nextLeaderboard); setChallenges(nextChallenges); setRescueHistory(nextHistory) })
      .catch((loadError) => mounted && setError((loadError as Error).message || 'Unable to load your Orbit.'))
      .finally(() => mounted && setLoadingDashboard(false))
    return () => { mounted = false }
  }, [session])

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(''); try { if (authMode === 'register') await registerUser(form.fullName, form.email, form.password); const nextSession = await loginUser(form.email, form.password); saveSession(nextSession); setLoadingDashboard(true); setSession(nextSession) } catch (requestError) { setError((requestError as Error).message || 'Unable to complete authentication.') } finally { setLoading(false) } }
  async function handleCheckIn(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!session) return; const values = new FormData(event.currentTarget); setSavingCheckIn(true); setCheckInError(''); try { await createCheckIn(session.access_token, { mood: String(values.get('mood')), energy_level: Number(values.get('energyLevel')), focus_rating: Number(values.get('focusRating')), reflection: String(values.get('reflection') || '').trim(), win_of_day: String(values.get('winOfDay') || '').trim(), blockers: String(values.get('blockers') || '').split(',').map((item) => item.trim()).filter(Boolean) }); setData(await getDashboard(session.access_token)); setCheckInOpen(false) } catch (requestError) { setCheckInError((requestError as Error).message || 'Unable to save your check-in.') } finally { setSavingCheckIn(false) } }
  async function handleChallenge(name: string, action: 'join' | 'complete') { if (!session) return; try { if (action === 'join') await joinChallenge(session.access_token, name); else await completeChallenge(session.access_token, name); setChallenges(await getChallenges(session.access_token)) } catch (requestError) { setError((requestError as Error).message || 'Unable to update this challenge.') } }
  function logout() { clearSession(); setSession(null); setData(null); setLoadingDashboard(false); navigate('/') }

  if (!session) return <AuthScreen mode={authMode} setMode={setAuthMode} loading={loading} error={error} form={form} setForm={setForm} onSubmit={handleAuth} />
  if (path === '/rescue') return <RescuePage token={session.access_token} onBack={() => navigate('/')} onFocus={() => navigate('/focus')} onCoach={() => navigate('/coach')} />
  if (path === '/focus') return <FocusPage token={session.access_token} onBack={() => navigate('/')} />
  if (path === '/coach') return <CoachPage token={session.access_token} />
  if (path === '/challenges' && challenges) return <ChallengeListPage summary={challenges} onOpen={(name) => navigate(`/challenges/${encodeURIComponent(name)}`)} />
  if (path.startsWith('/challenges/') && challenges) return <ChallengeDetailPage name={decodeURIComponent(path.slice('/challenges/'.length))} summary={challenges} onAction={handleChallenge} />
  const userName = session.user?.full_name || 'Orbit user'

  return <div className="app-shell"><header className="app-header"><Logo /><nav className="main-nav" aria-label="Main navigation"><a className="active" href="#today">Today</a><button className="nav-link-button" onClick={() => navigate('/focus')}>Focus</button><a href="#progress">Progress</a><button className="nav-link-button" onClick={() => navigate('/challenges')}>Challenges</button><a href="#insights">Insights</a></nav><div className="header-actions"><button className="header-rescue" onClick={() => navigate('/rescue')}>Rescue <span>+</span></button><button className="profile-button" onClick={logout} aria-label={`Log out ${userName}`}><span>{userName.charAt(0)}</span></button></div></header>{error && <div className="global-error" role="alert">{error}</div>}{loadingDashboard ? <div className="page-content"><div className="loading-state"><span className="loading-dot" />Preparing your orbit…</div></div> : data ? <Dashboard data={data} challenges={challenges} leaderboard={leaderboard} history={rescueHistory} userName={userName} onCheckIn={() => { setCheckInError(''); setCheckInOpen(true) }} onRescue={() => navigate('/rescue')} onChallenge={handleChallenge} onChallenges={() => navigate('/challenges')} onChallengeDetail={(name) => navigate(`/challenges/${encodeURIComponent(name)}`)} /> : <div className="page-content"><div className="empty-state">Your Orbit is quiet right now. Try refreshing the page.</div></div>}{checkInOpen && <CheckInModal saving={savingCheckIn} error={checkInError} onClose={() => !savingCheckIn && setCheckInOpen(false)} onSubmit={handleCheckIn} />}</div>
}

export default App
