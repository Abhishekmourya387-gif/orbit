import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { BackButton } from './components/BackButton'
import { ChallengeDetailPage, ChallengeListPage } from './components/ChallengePages'
import { CoachPage } from './components/CoachPage'
import { RescueFlow } from './components/RescueFlow'
import {
  clearSession,
  completeChallenge,
  createCheckIn,
  createRescueSession,
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
  type RescueActivityType,
  type RescueSessionResponse,
  type SessionPayload,
} from './lib/api'

type AuthMode = 'login' | 'register'
type Trigger = 'urge' | 'stress' | 'focus' | 'restless' | 'reset'
type RescueView = 'start' | 'activity' | 'complete'

const triggerOptions: Array<{ id: Trigger; label: string; detail: string }> = [
  { id: 'urge', label: 'Strong urge', detail: 'I need a little distance from this feeling.' },
  { id: 'stress', label: 'Feeling stressed', detail: 'My body needs a softer pace.' },
  { id: 'focus', label: "Can't focus", detail: 'I want to find my next small step.' },
  { id: 'restless', label: 'Feeling restless', detail: 'I need to move some energy through.' },
  { id: 'reset', label: 'Just need a reset', detail: 'Nothing is wrong. I want a clean pause.' },
]

const recommendations: Record<Trigger, RescueActivityType[]> = {
  urge: ['breathing', 'movement', 'grounding'],
  stress: ['breathing', 'stretch', 'grounding'],
  focus: ['movement', 'breathing', 'grounding'],
  restless: ['movement', 'grounding', 'breathing'],
  reset: ['breathing', 'stretch', 'cool_water'],
}

const activityMeta: Record<RescueActivityType, { label: string; eyebrow: string; description: string }> = {
  breathing: { label: '30-second breathing', eyebrow: 'Slow the moment down', description: 'Follow the circle. There is nothing to solve while you breathe.' },
  pushups: { label: 'A short physical reset', eyebrow: 'Change your state', description: 'Choose a small set and complete it at your own pace.' },
  movement: { label: 'Quick movement', eyebrow: 'Let the energy move', description: 'Walk around, shake out your arms, or roll your shoulders for 30 seconds.' },
  grounding: { label: '5–4–3 grounding', eyebrow: 'Come back to now', description: 'Notice what is around you, one sense at a time.' },
  stretch: { label: 'Gentle stretch', eyebrow: 'Make some room', description: 'Try a beginner-friendly shoulder and neck stretch for 30 seconds.' },
  cool_water: { label: 'Cool-water reset', eyebrow: 'A simple change of pace', description: 'Wash your face with cool water, then come back when you are ready.' },
}

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Logo() {
  return <a className="logo" href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}><span className="logo-mark">o</span><span>orbit</span></a>
}

function AuthScreen({ mode, setMode, loading, error, form, setForm, onSubmit }: {
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

function CheckInModal({ saving, error, onClose, onSubmit }: { saving: boolean; error: string; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
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
    const active = new Set(challenges.active_challenges)
    const completed = new Set(challenges.completed_challenges)
    return challenges.available_challenges.map((name) => ({ name, status: completed.has(name) ? 'Complete' : active.has(name) ? 'In progress' : 'Ready', progress: completed.has(name) ? 100 : active.has(name) ? 65 : 0 }))
  }, [challenges])
  const latestCheckIn = data.checkins[0]
  const firstName = userName.split(' ')[0]

  return <main className="page-content" id="today">
    <section className="welcome-row"><div><p className="kicker">Thursday, September 25</p><h1>Good morning, {firstName}.</h1><p className="lede">A little structure for the things you care about.</p></div><div className="quiet-orbit" aria-hidden="true"><span>o</span><small>your pace<br />your orbit</small></div></section>
    <section className="today-grid">
      <div className="today-focus"><p className="kicker">Today’s intention</p><h2>{data.profile.primary_goal || 'Make space for one good thing.'}</h2><p>{data.profile.bio || 'You do not need a perfect day. Just a clear next step.'}</p><div className="primary-actions"><button className="button button-primary" onClick={onCheckIn}>Log a check-in <span>→</span></button><button className="button button-outline" onClick={() => document.getElementById('focus')?.scrollIntoView({ behavior: 'smooth' })}>View today <span>↓</span></button></div></div>
      <div className="today-progress"><div className="progress-header"><span>Profile progress</span><strong>{data.summary.profile_completion}%</strong></div><div className="line-progress"><span style={{ width: `${data.summary.profile_completion}%` }} /></div><p>{data.profile.focus_goals || 'Choose a focus that feels meaningful.'}</p></div>
    </section>
    <section className="rescue-banner" aria-labelledby="rescue-title"><div className="rescue-mark">+</div><div><p className="kicker">A moment for you</p><h2 id="rescue-title">Something got loud?</h2><p>Take 60 seconds to pause, move, and come back to yourself.</p></div><button className="button button-rescue" onClick={onRescue}>I need help <span>→</span></button></section>
    <section className="metric-row" aria-label="Your progress"><div><span className="metric-value">{data.summary.recent_checkins_count}</span><span className="metric-label">check-ins this week</span></div><div><span className="metric-value">{leaderboard?.leaders.find((entry) => entry.user_id === data.user.id)?.current_streak ?? 0}</span><span className="metric-label">day streak</span></div><div><span className="metric-value">{leaderboard?.leaders.find((entry) => entry.user_id === data.user.id)?.xp_points ?? 0}</span><span className="metric-label">points earned</span></div><div><span className="metric-value">{history.length}</span><span className="metric-label">resets completed</span></div></section>
    <section className="dashboard-grid" id="focus">
      <article className="content-section"><div className="section-heading"><div><p className="kicker">Keep moving</p><h2>Suggested for you</h2></div><span className="section-note">Based on your orbit</span></div><div className="suggestion-list"><button className="suggestion-row" onClick={onCheckIn}><span className="suggestion-icon">◌</span><span><strong>Check in with yourself</strong><small>{latestCheckIn ? 'You have already checked in today.' : 'A two-minute reflection to notice where you are.'}</small></span><span>→</span></button><button className="suggestion-row" onClick={onRescue}><span className="suggestion-icon">✦</span><span><strong>Take a small reset</strong><small>Breathing, movement, or grounding. Your choice.</small></span><span>→</span></button></div></article>
      <article className="content-section challenges-section" id="challenges"><div className="section-heading"><div><p className="kicker">Your practice</p><h2>Challenges</h2></div><button className="section-link" onClick={onChallenges}>View all →</button></div>{challengeRows.length === 0 ? <div className="empty-state">Your next challenge will appear here when your plan is ready.</div> : <div className="challenge-rows">{challengeRows.slice(0, 3).map((challenge) => <div className="challenge-row" key={challenge.name}><button className="challenge-row-link" onClick={() => onChallengeDetail(challenge.name)}><div className="challenge-row-top"><strong>{challenge.name}</strong><span>{challenge.status}</span></div><div className="line-progress"><span style={{ width: `${challenge.progress}%` }} /></div></button>{challenge.status !== 'Complete' && <button className="text-button" onClick={() => onChallenge(challenge.name, challenge.status === 'Ready' ? 'join' : 'complete')}>{challenge.status === 'Ready' ? 'Start challenge' : 'Mark complete'} →</button>}</div>)}</div>}</article>
    </section>
    <section className="dashboard-grid lower-grid" id="progress"><article className="content-section"><div className="section-heading"><div><p className="kicker">Your rhythm</p><h2>Focus pulse</h2></div><span className="section-note">Last {Math.min(data.checkins.length, 7)} check-ins</span></div>{data.checkins.length === 0 ? <div className="empty-state">Your focus pulse will take shape after your first check-in.</div> : <div className="pulse-chart" aria-label="Recent focus ratings">{data.checkins.slice(0, 7).reverse().map((checkin) => <span key={checkin.id} style={{ height: `${Math.max(12, (checkin.focus_rating ?? 1) * 10)}%` }} title={`${checkin.focus_rating ?? 0} out of 10`} />)}</div>}</article><article className="content-section" id="insights"><div className="section-heading"><div><p className="kicker">A note to keep</p><h2>Recent wins</h2></div><span className="section-note">You noticed</span></div>{data.checkins.filter((checkin) => checkin.win_of_day).slice(0, 2).length === 0 ? <div className="empty-state">No wins written down yet. They count, even when they feel small.</div> : <ul className="win-list">{data.checkins.filter((checkin) => checkin.win_of_day).slice(0, 2).map((checkin) => <li key={checkin.id}><span>✓</span>{checkin.win_of_day}</li>)}</ul>}</article></section>
  </main>
}

function RescuePage({ token, onBack, onFocus, onCoach }: { token: string; onBack: () => void; onFocus: () => void; onCoach: () => void }) {
  return <RescueFlow token={token} onDashboard={onBack} onFocus={onFocus} onCoach={onCoach} />

  /* Legacy implementation retained below until the next cleanup pass. */
  const [view, setView] = useState<RescueView>('start')
  const [trigger, setTrigger] = useState<Trigger | null>(null)
  const [activity, setActivity] = useState<RescueActivityType>('breathing')
  const [remaining, setRemaining] = useState(30)
  const [paused, setPaused] = useState(false)
  const [pushupCount, setPushupCount] = useState(5)
  const [groundingStep, setGroundingStep] = useState(0)
  const [groundingNote, setGroundingNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<RescueSessionResponse[]>([])
  const [error, setError] = useState('')

  useEffect(() => { getRescueHistory(token).then(setHistory).catch(() => undefined) }, [token])
  useEffect(() => {
    if (view !== 'activity' || paused || !['breathing', 'movement', 'stretch'].includes(activity) || remaining <= 0) return
    const timer = window.setInterval(() => setRemaining((current) => Math.max(0, current - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [activity, paused, remaining, view])
  useEffect(() => { if (view === 'activity' && remaining === 0 && ['breathing', 'movement', 'stretch'].includes(activity)) completeActivity(30) }, [activity, remaining, view])

  async function completeActivity(durationSeconds: number) {
    if (saving || view === 'complete') return
    setSaving(true)
    setError('')
    try {
      const saved = await createRescueSession(token, { activity_type: activity, duration_seconds: durationSeconds, completed: true })
      setHistory((current) => [saved, ...current])
      setView('complete')
    } catch (saveError) { setError((saveError as Error).message || 'We could not save this reset.') } finally { setSaving(false) }
  }

  function chooseTrigger(nextTrigger: Trigger) { setTrigger(nextTrigger); setActivity(recommendations[nextTrigger][0]); setRemaining(30); setGroundingStep(0); setGroundingNote(''); setView('activity') }
  function chooseAnother(nextActivity: RescueActivityType) { setActivity(nextActivity); setRemaining(30); setGroundingStep(0); setGroundingNote(''); setView('activity') }
  const phaseElapsed = 30 - remaining
  const breathPhase = phaseElapsed % 12 < 4 ? 'Breathe in' : phaseElapsed % 12 < 6 ? 'Hold' : 'Breathe out'
  const groundingPrompts = ['Name 5 things you can see.', 'Name 4 things you can feel.', 'Name 3 things you can hear.']

  return <main className="rescue-page"><header className="rescue-header"><button className="back-button" onClick={onBack}>← <span>Back to Orbit</span></button><Logo /><span className="rescue-label">Private reset</span></header><div className="rescue-stage">
    {view === 'start' && <section className="rescue-start"><div className="rescue-intro"><span className="rescue-symbol">+</span><p className="kicker">No judgment. No pressure.</p><h1>Pause.<br />You don’t have to act on this feeling right now.</h1><p>Let’s get through the next 60 seconds together.</p><p className="rescue-history-note">{history.length > 0 ? `${history.length} private reset${history.length === 1 ? '' : 's'} completed` : 'This is a private space to reset.'}</p></div><div className="trigger-picker"><p className="kicker">What’s happening right now?</p>{triggerOptions.map((option) => <button className="trigger-option" key={option.id} onClick={() => chooseTrigger(option.id)}><span><strong>{option.label}</strong><small>{option.detail}</small></span><span>→</span></button>)}</div></section>}
    {view === 'activity' && <section className="activity-view"><button className="back-button activity-back" onClick={() => setView('start')}>← Choose another feeling</button><div className="activity-content"><p className="kicker">{activityMeta[activity].eyebrow}</p><h1>{activityMeta[activity].label}</h1><p className="activity-description">{activityMeta[activity].description}</p>{activity === 'breathing' && <div className="breathing-workspace"><div className={`breathing-orb ${paused ? 'paused' : ''}`}><span>{remaining > 0 ? breathPhase : 'Complete'}</span></div><div className="timer-line"><span style={{ width: `${((30 - remaining) / 30) * 100}%` }} /></div><p className="timer-copy">{remaining > 0 ? `${remaining} seconds left` : 'Well done. Take a moment to notice.'}</p><div className="activity-actions">{remaining > 0 && <button className="button button-outline" onClick={() => setPaused((current) => !current)}>{paused ? 'Continue' : 'Pause'}</button>}{remaining > 0 && <button className="text-button" onClick={() => setRemaining(30)}>Restart</button>}</div></div>}{activity === 'pushups' && <div className="manual-workspace"><p className="big-instruction">Do a few push-ups at your own pace.</p><div className="choice-row">{[5, 10, 15].map((count) => <button key={count} className={pushupCount === count ? 'choice active' : 'choice'} onClick={() => setPushupCount(count)}>{count}</button>)}</div><button className="button button-primary" onClick={() => completeActivity(0)} disabled={saving}>I did {pushupCount} push-ups</button></div>}{activity === 'grounding' && <div className="manual-workspace"><div className="grounding-step"><span className="step-count">{groundingStep + 1} / 3</span><h2>{groundingPrompts[groundingStep]}</h2><input value={groundingNote} onChange={(event) => setGroundingNote(event.target.value)} placeholder="Write a word or two, if helpful" autoFocus /></div>{groundingStep < 2 ? <button className="button button-primary" disabled={!groundingNote.trim()} onClick={() => { setGroundingStep((current) => current + 1); setGroundingNote('') }}>Next sense <span>→</span></button> : <button className="button button-primary" disabled={!groundingNote.trim() || saving} onClick={() => completeActivity(0)}>Finish grounding</button>}</div>}{activity === 'cool_water' && <div className="manual-workspace"><p className="big-instruction">Wash your face with cool water, or hold a cool cloth for a moment.</p><button className="button button-primary" onClick={() => completeActivity(20)} disabled={saving}>I’m back</button></div>}{['movement', 'stretch'].includes(activity) && <div className="manual-workspace"><div className="movement-card"><span className="movement-figure">◡</span><p>{activity === 'movement' ? 'Walk around, shake out your arms, or roll your shoulders.' : 'Let your shoulders drop. Slowly turn your head left and right.'}</p></div><div className="timer-line"><span style={{ width: `${((30 - remaining) / 30) * 100}%` }} /></div><p className="timer-copy">{remaining} seconds left</p><button className="button button-outline" onClick={() => setPaused((current) => !current)}>{paused ? 'Continue' : 'Pause'}</button></div>}{error && <p className="form-error" role="alert">{error}</p>}</div></section>}
    {view === 'complete' && <section className="rescue-complete"><span className="complete-mark">✓</span><p className="kicker">You made a little room</p><h1>Nice. Give yourself another 30 seconds.</h1><p>You noticed what was happening and chose your next moment. That matters.</p><div className="complete-actions"><button className="button button-primary" onClick={() => { if (trigger) chooseAnother(recommendations[trigger][1]) }}>Try another activity <span>→</span></button><button className="button button-outline" onClick={onBack}>Return to dashboard</button></div></section>}
  </div></main>
}

function FocusPage({ token, onBack }: { token: string; onBack: () => void }) {
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState(25)
  const [focusSession, setFocusSession] = useState<FocusSessionResponse | null>(null)
  const [analytics, setAnalytics] = useState<FocusAnalyticsResponse | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [notes, setNotes] = useState('')
  const [distractionSource, setDistractionSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getFocusAnalytics(token).then(setAnalytics).catch(() => undefined)
  }, [token])

  useEffect(() => {
    if (!focusSession || focusSession.status === 'completed' || remaining <= 0) return
    const timer = window.setInterval(() => setRemaining((current) => Math.max(0, current - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [focusSession, remaining])

  useEffect(() => {
    if (focusSession?.status === 'active' && remaining === 0) {
      void finishFocus()
    }
  }, [remaining, focusSession?.status])

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

  async function finishFocus() {
    if (!focusSession || loading) return
    setLoading(true)
    setError('')
    try {
      const completed = await completeFocusSession(token, focusSession.id, notes)
      setFocusSession(completed)
      setAnalytics(await getFocusAnalytics(token))
    } catch (completeError) {
      setError((completeError as Error).message || 'Unable to complete this focus block.')
    } finally {
      setLoading(false)
    }
  }

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

  return <main className="focus-page"><header className="focus-header"><BackButton fallback="/" label="Back" onBack={onBack} /><Logo /><span className="rescue-label">Focus Mode</span></header><div className="focus-stage">
    {!focusSession && <section className="focus-setup"><div className="focus-setup-copy"><p className="kicker">A protected pocket of time</p><h1>Make room for the work.</h1><p>Choose one thing. Orbit will keep the rest of the world at a respectful distance.</p></div><form className="focus-form" onSubmit={startFocus}><label><span>What would feel good to finish?</span><input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Outline the first section" minLength={3} maxLength={255} required autoFocus /></label><fieldset><legend>How much time do you have?</legend><div className="focus-duration-options">{[5, 15, 25, 45].map((option) => <button type="button" key={option} className={duration === option ? 'focus-duration active' : 'focus-duration'} onClick={() => setDuration(option)}>{option}<small>min</small></button>)}</div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary button-wide" type="submit" disabled={loading}>{loading ? 'Opening your focus space…' : 'Start Focus Mode →'}</button></form>{analytics && <div className="focus-history-note"><strong>{analytics.completed_sessions}</strong><span>completed focus blocks<br />{analytics.total_minutes} minutes in your orbit</span></div>}</section>}
    {focusSession?.status === 'active' && <section className="focus-active"><p className="kicker">You are focusing on</p><h1>{focusSession.goal}</h1><div className="focus-timer" aria-live="polite"><span>{minutes}:{seconds}</span><small>protected time remaining</small></div><div className="focus-meter"><span style={{ width: `${Math.max(0, Math.min(100, ((focusSession.duration_minutes * 60 - remaining) / (focusSession.duration_minutes * 60)) * 100))}%` }} /></div><div className="focus-active-actions"><button className="button button-primary" onClick={() => void finishFocus()} disabled={loading}>Finish focus block</button><button className="button button-outline" onClick={() => void finishFocus()} disabled={loading}>End early</button></div><div className="distraction-box"><div><p className="kicker">A thought pulled you away?</p><p>Log it, then return without judgment.</p></div><div className="distraction-form"><input value={distractionSource} onChange={(event) => setDistractionSource(event.target.value)} placeholder="What pulled you away?" /><button className="text-button" onClick={() => void recordDistraction()} disabled={!distractionSource.trim()}>Log it</button></div><small>{focusSession.distractions_count} distractions logged</small></div></section>}
    {focusSession?.status === 'completed' && <section className="focus-complete"><span className="complete-mark">✓</span><p className="kicker">Focus block complete</p><h1>You kept a promise to your attention.</h1><p>{focusSession.duration_minutes} minutes on {focusSession.goal}. Take a breath before you choose what comes next.</p><label className="focus-notes"><span>Want to leave a note? <em>optional</em></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="What did you notice?" /></label><div className="complete-actions"><button className="button button-primary" onClick={resetFocus}>Start another block</button><button className="button button-outline" onClick={onBack}>Return to dashboard</button></div></section>}
  </div></main>
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
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [savingCheckIn, setSavingCheckIn] = useState(false)
  const [checkInError, setCheckInError] = useState('')
  const [form, setForm] = useState({ fullName: '', email: 'demo@orbit.app', password: 'StrongPass123!' })

  useEffect(() => { const onPopState = () => setPath(window.location.pathname); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState) }, [])
  useEffect(() => {
    if (!session) return
    let mounted = true
    setLoadingDashboard(true)
    Promise.all([getDashboard(session.access_token), getLeaderboard(session.access_token), getChallenges(session.access_token), getRescueHistory(session.access_token)])
      .then(([nextData, nextLeaderboard, nextChallenges, nextHistory]) => { if (!mounted) return; setData(nextData); setLeaderboard(nextLeaderboard); setChallenges(nextChallenges); setRescueHistory(nextHistory) })
      .catch((loadError) => mounted && setError((loadError as Error).message || 'Unable to load your Orbit.'))
      .finally(() => mounted && setLoadingDashboard(false))
    return () => { mounted = false }
  }, [session])

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(''); try { const nextSession = authMode === 'register' ? await registerUser(form.fullName, form.email, form.password) : await loginUser(form.email, form.password); saveSession(nextSession); setSession(nextSession) } catch (requestError) { setError((requestError as Error).message || 'Unable to complete authentication.') } finally { setLoading(false) } }
  async function handleCheckIn(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!session) return; const values = new FormData(event.currentTarget); setSavingCheckIn(true); setCheckInError(''); try { await createCheckIn(session.access_token, { mood: String(values.get('mood')), energy_level: Number(values.get('energyLevel')), focus_rating: Number(values.get('focusRating')), reflection: String(values.get('reflection') || '').trim(), win_of_day: String(values.get('winOfDay') || '').trim(), blockers: String(values.get('blockers') || '').split(',').map((item) => item.trim()).filter(Boolean) }); setData(await getDashboard(session.access_token)); setCheckInOpen(false) } catch (requestError) { setCheckInError((requestError as Error).message || 'Unable to save your check-in.') } finally { setSavingCheckIn(false) } }
  async function handleChallenge(name: string, action: 'join' | 'complete') { if (!session) return; try { if (action === 'join') await joinChallenge(session.access_token, name); else await completeChallenge(session.access_token, name); setChallenges(await getChallenges(session.access_token)) } catch (requestError) { setError((requestError as Error).message || 'Unable to update this challenge.') } }
  function logout() { clearSession(); setSession(null); setData(null); navigate('/') }

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
