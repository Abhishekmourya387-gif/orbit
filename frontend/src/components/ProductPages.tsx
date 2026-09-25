import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { OrbitShell } from './OrbitShell'
import { AppIcon, type IconName } from './OrbitIcons'
import {
  createGoal,
  createHabit,
  getGoals,
  getHabits,
  getProfile,
  getStreak,
  updateProfile,
  type GoalResponse,
  type HabitResponse,
  type NotificationResponse,
  type ProfileResponse,
  type StreakResponse,
  type XpSummaryResponse,
} from '../lib/api'

type FeaturePageProps = {
  token: string
  userName: string
  xp: XpSummaryResponse | null
  notifications: NotificationResponse[]
  challengeCount?: number
  onNavigate: (path: string) => void
  onLogout: () => void
}

function FeatureFrame({ path, userName, xp, notifications, challengeCount = 0, onNavigate, onLogout, children }: FeaturePageProps & { path: string; children: ReactNode }) {
  return <OrbitShell activePath={path} userName={userName} xp={xp} notifications={notifications} challengeCount={challengeCount} onNavigate={onNavigate} onLogout={onLogout}>{children}</OrbitShell>
}

function FeatureHeader({ eyebrow, title, description, icon, action }: { eyebrow: string; title: string; description: string; icon: IconName; action?: ReactNode }) {
  return <div className="feature-header"><div className="feature-heading"><span className="feature-icon"><AppIcon name={icon} /></span><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></div>{action}</div>
}

function PageLoading({ label }: { label: string }) {
  return <div className="page-loading"><span className="orbit-loader"><i /><i /><i /></span><p>{label}</p></div>
}

function EmptyPageState({ icon, title, copy, action }: { icon: IconName; title: string; copy: string; action?: ReactNode }) {
  return <div className="feature-page-empty"><span><AppIcon name={icon} /></span><h3>{title}</h3><p>{copy}</p>{action}</div>
}

function localDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function HabitsPage({ openOnMount = false, ...pageProps }: FeaturePageProps & { openOnMount?: boolean }) {
  const [habits, setHabits] = useState<HabitResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(openOnMount)

  useEffect(() => { getHabits(pageProps.token).then(setHabits).catch((loadError) => setError((loadError as Error).message)).finally(() => setLoading(false)) }, [pageProps.token])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const title = String(values.get('title') ?? '').trim()
    if (!title) return
    setSaving(true); setError('')
    try {
      const created = await createHabit(pageProps.token, { title, description: String(values.get('description') ?? '').trim() || null, frequency: String(values.get('frequency') ?? 'daily') })
      setHabits((current) => [created, ...current]); setFormOpen(false)
    } catch (saveError) { setError((saveError as Error).message) } finally { setSaving(false) }
  }

  const completed = habits.filter((habit) => habit.completed_today).length
  return <FeatureFrame {...pageProps} path="/habits"><div className="feature-page"><FeatureHeader eyebrow="Daily rhythm" title="Habits" description="Small repeatable actions that make your intentions easier to keep." icon="habit" action={<button className="button button-primary" type="button" onClick={() => setFormOpen(true)}><AppIcon name="plus" size={17} />Add habit</button>} /><div className="feature-summary-strip"><div><span className="summary-icon cyan"><AppIcon name="habit" /></span><p><strong>{habits.length}</strong><small>Total habits</small></p></div><div><span className="summary-icon violet"><AppIcon name="check" /></span><p><strong>{completed}</strong><small>Done today</small></p></div><div><span className="summary-icon orange"><AppIcon name="flame" /></span><p><strong>{Math.max(0, ...habits.map((habit) => habit.streak))}</strong><small>Best active streak</small></p></div></div>{error && <div className="global-error orbit-error">{error}</div>}{loading ? <PageLoading label="Loading your habits…" /> : habits.length ? <div className="feature-card-grid">{habits.map((habit) => <article className={`glass-card entity-card ${habit.completed_today ? 'completed' : ''}`} key={habit.id}><div className="entity-card-top"><span className="entity-icon cyan"><AppIcon name={habit.completed_today ? 'check' : 'habit'} /></span><span className={`entity-status ${habit.completed_today ? 'done' : ''}`}>{habit.completed_today ? 'Complete today' : habit.frequency}</span></div><h3>{habit.title}</h3><p>{habit.description || 'A small promise to yourself.'}</p><div className="entity-meta"><span><AppIcon name="flame" size={15} />{habit.streak} day streak</span><span><AppIcon name="calendar" size={15} />{habit.frequency}</span></div></article>)}</div> : <EmptyPageState icon="habit" title="Build your first rhythm" copy="Habits you create here are stored in your real Orbit profile." action={<button className="button button-primary" type="button" onClick={() => setFormOpen(true)}>Create a habit</button>} />}</div>{formOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setFormOpen(false)}><form className="modal feature-modal" onSubmit={handleCreate} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">New habit</span><h2>Make it easy to begin.</h2></div><button className="close-button" type="button" onClick={() => setFormOpen(false)}>×</button></div><div className="form-stack"><label><span>Habit name</span><input name="title" required minLength={2} placeholder="e.g. Read for ten minutes" autoFocus /></label><label><span>Why it matters <em>optional</em></span><textarea name="description" rows={3} placeholder="A gentle reminder for your future self" /></label><label><span>Frequency</span><select name="frequency" defaultValue="daily"><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option></select></label></div><div className="modal-actions"><button className="button button-quiet" type="button" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Create habit'}</button></div></form></div>}</FeatureFrame>
}


export function GoalsPage({ openOnMount = false, ...pageProps }: FeaturePageProps & { openOnMount?: boolean }) {
  const [goals, setGoals] = useState<GoalResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(openOnMount)

  useEffect(() => { getGoals(pageProps.token).then(setGoals).catch((loadError) => setError((loadError as Error).message)).finally(() => setLoading(false)) }, [pageProps.token])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const title = String(values.get('title') ?? '').trim()
    if (!title) return
    setSaving(true); setError('')
    try {
      const created = await createGoal(pageProps.token, { title, description: String(values.get('description') ?? '').trim() || null, target_date: String(values.get('targetDate') ?? '') || null })
      setGoals((current) => [created, ...current]); setFormOpen(false)
    } catch (saveError) { setError((saveError as Error).message) } finally { setSaving(false) }
  }

  const completed = goals.filter((goal) => goal.progress >= 100).length
  const averageProgress = goals.length ? goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length : 0
  return <FeatureFrame {...pageProps} path="/goals"><div className="feature-page"><FeatureHeader eyebrow="Direction" title="Goals" description="Name the outcomes that deserve your time, then give them a clear next step." icon="goal" action={<button className="button button-primary" type="button" onClick={() => setFormOpen(true)}><AppIcon name="plus" size={17} />Set goal</button>} /><div className="feature-summary-strip"><div><span className="summary-icon violet"><AppIcon name="goal" /></span><p><strong>{goals.length}</strong><small>Total goals</small></p></div><div><span className="summary-icon cyan"><AppIcon name="chart" /></span><p><strong>{Math.round(averageProgress)}%</strong><small>Average progress</small></p></div><div><span className="summary-icon orange"><AppIcon name="check" /></span><p><strong>{completed}</strong><small>Completed</small></p></div></div>{error && <div className="global-error orbit-error">{error}</div>}{loading ? <PageLoading label="Loading your goals…" /> : goals.length ? <div className="feature-card-grid goals-grid">{goals.map((goal) => <article className="glass-card entity-card goal-entity" key={goal.id}><div className="entity-card-top"><span className="entity-icon violet"><AppIcon name="goal" /></span><span className={`entity-status ${goal.progress >= 100 ? 'done' : ''}`}>{goal.status}</span></div><h3>{goal.title}</h3><p>{goal.description || 'A clear direction for your attention.'}</p><div className="goal-progress-copy"><span>Progress</span><strong>{goal.progress}%</strong></div><span className="orbit-progress"><i style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }} /></span><div className="entity-meta"><span><AppIcon name="calendar" size={15} />{goal.target_date ? `Due ${goal.target_date}` : 'No target date'}</span><span><AppIcon name="chart" size={15} />{goal.progress >= 100 ? 'Complete' : 'In progress'}</span></div></article>)}</div> : <EmptyPageState icon="goal" title="Give your effort a direction" copy="Goals created here appear in your dashboard plan and use your existing Orbit goal record." action={<button className="button button-primary" type="button" onClick={() => setFormOpen(true)}>Set your first goal</button>} />}</div>{formOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setFormOpen(false)}><form className="modal feature-modal" onSubmit={handleCreate} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">New goal</span><h2>What do you want to move toward?</h2></div><button className="close-button" type="button" onClick={() => setFormOpen(false)}>×</button></div><div className="form-stack"><label><span>Goal name</span><input name="title" required minLength={2} placeholder="e.g. Finish the first project draft" autoFocus /></label><label><span>Why it matters <em>optional</em></span><textarea name="description" rows={3} placeholder="A short note about why this matters" /></label><label><span>Target date <em>optional</em></span><input name="targetDate" type="date" /></label></div><div className="modal-actions"><button className="button button-quiet" type="button" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Create goal'}</button></div></form></div>}</FeatureFrame>
}


export function StreakPage(pageProps: FeaturePageProps) {
  const [streak, setStreak] = useState<StreakResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { getStreak(pageProps.token).then(setStreak).catch((loadError) => setError((loadError as Error).message)).finally(() => setLoading(false)) }, [pageProps.token])

  const lastActivityKey = streak?.last_activity ? localDateKey(streak.last_activity) : null
  const days = Array.from({ length: 14 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (13 - index)); const key = localDateKey(date); return { key, label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), today: index === 13, lastActivity: key === lastActivityKey } })
  return <FeatureFrame {...pageProps} path="/streaks"><div className="feature-page"><FeatureHeader eyebrow="Consistency" title="Your Streak" description="A quiet measure of how often you keep showing up for yourself." icon="flame" />{error && <div className="global-error orbit-error">{error}</div>}{loading ? <PageLoading label="Reading your rhythm…" /> : <><section className="streak-hero glass-card"><div className="streak-hero-copy"><span className="eyebrow warm"><AppIcon name="flame" size={15} />Current rhythm</span><strong>{streak?.current_streak ?? 0}</strong><h2>days in a row</h2><p>{streak?.streak_status === 'active' ? 'You are protecting the momentum. Keep choosing the next small action.' : 'Your next check-in is a fresh beginning.'}</p></div><div className="streak-orbit-visual"><span className="streak-big-flame"><AppIcon name="flame" size={54} /></span><i /><i /><i /></div><div className="streak-hero-stats"><div><small>Longest streak</small><strong>{streak?.longest_streak ?? 0} days</strong></div><div><small>Last activity</small><strong>{streak?.last_activity ? new Date(streak.last_activity).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</strong></div><div><small>Status</small><strong>{streak?.streak_status ?? 'inactive'}</strong></div></div></section><section className="glass-card streak-calendar"><div className="section-title-row"><div><span className="eyebrow">Last 14 days</span><h3>Showing up</h3></div><span className="status-pill"><i />{streak?.streak_status ?? 'inactive'}</span></div><div className="calendar-grid">{days.map((day) => <div key={day.key} className={day.today ? 'today' : ''}><span>{day.label}</span><i className={day.lastActivity ? 'current' : ''}>{day.lastActivity ? <AppIcon name="sparkles" size={15} /> : ''}</i></div>)}</div><p className="calendar-note">A streak is a record, not a verdict. Missing a day does not erase the work you have already done.</p></section></>}</div></FeatureFrame>
}


export function ProfilePage(pageProps: FeaturePageProps) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => { getProfile(pageProps.token).then(setProfile).catch((loadError) => setError((loadError as Error).message)).finally(() => setLoading(false)) }, [pageProps.token])

  function updateText(field: 'bio' | 'primary_goal' | 'focus_goals' | 'improvement_goals', value: string) { setProfile((current) => current ? { ...current, [field]: value || null } : current) }
  function updateList(field: 'preferred_habits' | 'current_challenges', value: string) { setProfile((current) => current ? { ...current, [field]: value.split(',').map((item) => item.trim()).filter(Boolean) } : current) }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    setSaving(true); setError(''); setSaved(false)
    try { await updateProfile(pageProps.token, { bio: profile.bio, primary_goal: profile.primary_goal, focus_goals: profile.focus_goals, improvement_goals: profile.improvement_goals, preferred_habits: profile.preferred_habits, current_challenges: profile.current_challenges }); setSaved(true) } catch (saveError) { setError((saveError as Error).message) } finally { setSaving(false) }
  }

  const initials = pageProps.userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <FeatureFrame {...pageProps} path="/profile"><div className="feature-page"><FeatureHeader eyebrow="Your identity" title="Profile" description="Keep the details that help Orbit support the person behind the progress." icon="user" />{error && <div className="global-error orbit-error">{error}</div>}{loading ? <PageLoading label="Loading your profile…" /> : profile && <div className="profile-layout"><aside className="glass-card profile-summary"><div className="profile-avatar-large">{initials}<span><AppIcon name="sparkles" size={14} /></span></div><h2>{pageProps.userName}</h2><p>{profile.bio || 'Your profile is a space for the direction you are building.'}</p><div className="profile-level"><span><AppIcon name="zap" size={16} />Level {pageProps.xp?.level ?? 1}</span><strong>{pageProps.xp?.total_xp ?? 0} XP</strong></div><div className="profile-completion"><span>Profile completion <b>{profile.profile_completion}%</b></span><span className="orbit-progress"><i style={{ width: `${profile.profile_completion}%` }} /></span></div><div className="profile-badges">{(pageProps.xp?.badges ?? []).map((badge) => <span key={badge}><AppIcon name="trophy" size={13} />{badge}</span>)}</div></aside><form className="glass-card profile-form" onSubmit={saveProfile}><div className="section-title-row"><div><span className="eyebrow"><AppIcon name="settings" size={15} />Personal details</span><h3>Make Orbit yours</h3></div>{saved && <span className="saved-badge"><AppIcon name="check" size={14} />Saved</span>}</div><div className="profile-form-grid"><label><span>Bio</span><textarea value={profile.bio ?? ''} onChange={(event) => updateText('bio', event.target.value)} rows={4} placeholder="A little about what you are working toward" /></label><label><span>Primary goal</span><input value={profile.primary_goal ?? ''} onChange={(event) => updateText('primary_goal', event.target.value)} placeholder="What matters most right now?" /></label><label><span>Focus goals</span><input value={profile.focus_goals ?? ''} onChange={(event) => updateText('focus_goals', event.target.value)} placeholder="Where do you want to focus?" /></label><label><span>Improvement goals</span><input value={profile.improvement_goals ?? ''} onChange={(event) => updateText('improvement_goals', event.target.value)} placeholder="What would you like to improve?" /></label><label className="full"><span>Preferred habits <em>comma separated</em></span><input value={profile.preferred_habits.join(', ')} onChange={(event) => updateList('preferred_habits', event.target.value)} placeholder="Read, walk, reflect" /></label><label className="full"><span>Current challenges <em>comma separated</em></span><input value={profile.current_challenges.join(', ')} onChange={(event) => updateList('current_challenges', event.target.value)} placeholder="Challenges you are exploring" /></label></div><div className="profile-form-footer"><span>Your changes stay connected to your Orbit profile.</span><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></div></form></div>}</div></FeatureFrame>
}

