import { useMemo, useState } from 'react'
import { OrbitShell, type OrbitSearchItem } from './OrbitShell'
import { challengeState } from './challengeState'
import { AppIcon, type IconName } from './OrbitIcons'
import type {
  ChallengeSummaryResponse,
  DashboardResponse,
  FocusAnalyticsResponse,
  FocusSessionResponse,
  GoalResponse,
  HabitResponse,
  LeaderboardSummaryResponse,
  NotificationResponse,
  RescueSessionResponse,
  StreakResponse,
  XpSummaryResponse,
} from '../lib/api'

type OrbitDashboardProps = {
  data: DashboardResponse
  challenges: ChallengeSummaryResponse
  leaderboard: LeaderboardSummaryResponse | null
  rescueHistory: RescueSessionResponse[]
  focusAnalytics: FocusAnalyticsResponse | null
  focusHistory: FocusSessionResponse[]
  habits: HabitResponse[]
  goals: GoalResponse[]
  streak: StreakResponse | null
  xp: XpSummaryResponse | null
  notifications: NotificationResponse[]
  userName: string
  error: string
  onNavigate: (path: string) => void
  onLogout: () => void
  onCheckIn: () => void
  onRescue: () => void
  onChallenge: (name: string, action: 'join' | 'complete') => Promise<void>
}

type PlanItem = { id: number; title: string; meta: string; category: string; completed: boolean; icon: IconName }
type ActivityItem = { id: string; title: string; detail: string; timestamp: string; icon: IconName; tone: string }

function localDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}

function relativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(elapsed / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days < 7 ? `${days}d ago` : shortDate(value)
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function ProgressBar({ value, className = '', indeterminate = false }: { value: number; className?: string; indeterminate?: boolean }) {
  return <span className={`orbit-progress ${indeterminate ? 'is-indeterminate' : ''} ${className}`}><i style={indeterminate ? undefined : { width: `${Math.max(0, Math.min(100, value))}%` }} /></span>
}

export function OrbitDashboard({ data, challenges, leaderboard, rescueHistory, focusAnalytics, focusHistory, habits, goals, streak, xp, notifications, userName, error, onNavigate, onLogout, onCheckIn, onRescue, onChallenge }: OrbitDashboardProps) {
  const [focusMinutes, setFocusMinutes] = useState(25)
  const firstName = userName.split(' ')[0]
  const level = xp?.level ?? 1
  const totalXp = xp?.total_xp ?? 0
  const levelProgress = xp?.progress_percentage ?? data.summary.profile_completion
  const currentStreak = streak?.current_streak ?? 0

  const planItems = useMemo<PlanItem[]>(() => [
    ...habits.map((habit) => ({ id: habit.id, title: habit.title, meta: habit.frequency, category: 'Habit', completed: habit.completed_today, icon: 'habit' as const })),
    ...goals.map((goal) => ({ id: goal.id, title: goal.title, meta: goal.target_date ? `Due ${shortDate(goal.target_date)}` : goal.status, category: 'Goal', completed: goal.progress >= 100, icon: 'goal' as const })),
  ].sort((a, b) => Number(a.completed) - Number(b.completed)).slice(0, 6), [habits, goals])

  const challengeRows = useMemo(() => challenges.available_challenges.map((name, index) => {
    const state = challengeState(name, challenges)
    return { name, progress: state.progress, icon: (['focus', 'flame', 'trophy', 'zap'] as IconName[])[index % 4] }
  }), [challenges])

  const activityItems = useMemo<ActivityItem[]>(() => [
    ...data.checkins.filter((item) => item.created_at).map((item) => ({ id: `checkin-${item.id}`, title: 'Daily check-in', detail: item.mood ? `Feeling ${item.mood}` : 'Reflection saved', timestamp: item.created_at as string, icon: 'sparkles' as const, tone: 'cyan' })),
    ...rescueHistory.map((item) => ({ id: `rescue-${item.id}`, title: 'Rescue reset', detail: `${item.activity_type.replace('_', ' ')} · ${item.duration_seconds}s`, timestamp: item.created_at, icon: 'leaf' as const, tone: 'violet' })),
    ...focusHistory.map((item) => ({ id: `focus-${item.id}`, title: 'Focus session', detail: item.goal, timestamp: item.started_at, icon: 'focus' as const, tone: 'blue' })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5), [data.checkins, focusHistory, rescueHistory])

  const weeklyActivity = useMemo(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const key = localDateKey(date)
      const checkin = data.checkins.find((item) => item.created_at && localDateKey(item.created_at) === key)
      const focus = focusHistory.find((item) => localDateKey(item.started_at) === key && item.status === 'completed')
      return { key, label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), score: Math.max(checkin?.focus_rating ? checkin.focus_rating * 10 : 0, focus ? Math.min(100, focus.duration_minutes * 4) : 0), isToday: key === localDateKey(today) }
    })
  }, [data.checkins, focusHistory])

  const streakDays = useMemo(() => {
    const lastActivityKey = streak?.last_activity ? localDateKey(streak.last_activity) : null
    const today = new Date()
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const key = localDateKey(date)
      return { key, label: date.toLocaleDateString(undefined, { weekday: 'narrow' }), completed: key === lastActivityKey, today: index === 6 }
    })
  }, [streak])

  const searchItems: OrbitSearchItem[] = challengeRows.map((challenge) => ({ label: challenge.name, path: `/challenges/${encodeURIComponent(challenge.name)}`, icon: 'challenge', hint: challenge.progress === null ? 'In progress' : challenge.progress === 100 ? 'Complete' : challenge.progress === 0 ? 'Ready to begin' : `${challenge.progress}% complete` }))

  const statCards = [
    { label: 'Focus Sessions', value: focusAnalytics?.completed_sessions ?? 0, detail: `${focusAnalytics?.total_minutes ?? 0} focused minutes`, progress: focusAnalytics?.total_sessions ? (focusAnalytics.completed_sessions / focusAnalytics.total_sessions) * 100 : 0, icon: 'focus' as const, tone: 'blue' },
    { label: 'Challenges', value: challenges.completed_challenges.length, detail: `${challenges.active_challenges.length} currently active`, progress: challenges.available_challenges.length ? (challenges.completed_challenges.length / challenges.available_challenges.length) * 100 : 0, icon: 'trophy' as const, tone: 'violet' },
    { label: 'Habits', value: habits.filter((habit) => habit.completed_today).length, detail: `${habits.length} in your routine`, progress: habits.length ? habits.filter((habit) => habit.completed_today).length / habits.length * 100 : 0, icon: 'habit' as const, tone: 'cyan' },
    { label: 'Goals', value: goals.filter((goal) => goal.status === 'active').length, detail: `${goals.filter((goal) => goal.progress >= 100).length} completed`, progress: goals.length ? goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length : 0, icon: 'goal' as const, tone: 'pink' },
  ]

  return <OrbitShell activePath="/" userName={userName} xp={xp} notifications={notifications} challengeCount={challenges.active_challenges.length} onNavigate={onNavigate} onLogout={onLogout} searchItems={searchItems}>
    <div className="dashboard-page">
      <div className="dashboard-welcome"><div><span className="eyebrow"><i />{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span><h1>Your space to <em>move forward.</em></h1><p>{data.profile.primary_goal || 'Build a day that feels clear, kind, and like yours.'}</p></div><button className="button button-primary" type="button" onClick={onCheckIn}><AppIcon name="plus" size={18} />Daily check-in</button></div>
      {error && <div className="global-error orbit-error" role="alert">{error}</div>}

      <section className="dashboard-hero">
        <div className="hero-glow" />
        <div className="hero-copy"><span className="hero-pill"><AppIcon name="sparkles" size={15} />Your orbit is looking bright</span><h2>{getGreeting()}, {firstName} <span>☀️</span></h2><p>{data.profile.bio || 'You do not need a perfect day. Just one clear next step and the courage to begin.'}</p><div className="hero-actions"><button className="button button-light" type="button" onClick={onCheckIn}>Check in now <AppIcon name="arrow" size={17} /></button><button className="button button-glass" type="button" onClick={onRescue}><AppIcon name="leaf" size={17} />Take a reset</button></div><span className="handwritten-note">Better than yesterday <i>↗</i></span></div>
        <div className="hero-insight-card"><div className="hero-level"><span className="mini-icon"><AppIcon name="zap" /></span><div><small>Current level</small><strong>Level {level}</strong></div><b>{totalXp} XP</b></div><ProgressBar value={levelProgress} /><div className="hero-streak"><span className="mini-icon flame"><AppIcon name="flame" /></span><div><small>Current streak</small><strong>{currentStreak} days</strong></div><span>{currentStreak > 0 ? 'Keep the flame alive' : 'Start your first day'}</span></div></div>
      </section>

      <section className="dashboard-feature-grid">
        <article className="glass-card focus-preview-card">
          <div className="card-heading"><div><span className="eyebrow"><AppIcon name="focus" size={15} />Deep work</span><h3>Focus Mode</h3><p>Protect your attention. Make something matter.</p></div><button className="icon-button" type="button" onClick={() => onNavigate('/focus')} aria-label="Open focus settings"><AppIcon name="settings" /></button></div>
          <div className="focus-preview-body"><div className="focus-ring" style={{ '--focus-progress': '72%' } as React.CSSProperties}><div><strong>{focusMinutes}:00</strong><span>Focus Time</span></div></div><div className="focus-preview-copy"><span className="status-pill"><i />Ready when you are</span><p>Your existing Focus workspace keeps the timer, goal tracking, distraction log, and completion rewards intact.</p><button className="button button-primary wide" type="button" onClick={() => onNavigate(`/focus?duration=${focusMinutes}`)}>Start Focus <AppIcon name="arrow" size={17} /></button></div></div>
          <div className="duration-picker">{[25, 50, 90].map((minutes) => <button key={minutes} type="button" className={focusMinutes === minutes ? 'active' : ''} onClick={() => setFocusMinutes(minutes)}>{minutes}<small>min</small></button>)}</div>
        </article>
        <article className="glass-card streak-card">
          <div className="card-heading"><div><span className="eyebrow warm"><AppIcon name="flame" size={15} />Consistency</span><h3>Current Streak</h3></div><span className="streak-number">{currentStreak}<small>days</small></span></div>
          <div className="week-row">{streakDays.map((day) => <div key={day.key} className={day.today ? 'today' : ''}><span>{day.completed ? <AppIcon name="check" size={14} /> : day.today ? <i /> : null}</span><small>{day.label}</small></div>)}</div>
          <div className="streak-message"><span><AppIcon name="flame" /></span><p><strong>{streak?.streak_status === 'active' ? 'You are on fire.' : currentStreak ? 'Keep the momentum.' : 'Every orbit starts here.'}</strong><small>{currentStreak ? 'One check-in today protects your streak.' : 'Complete today’s check-in to begin.'}</small></p></div>
          <div className="streak-footer"><span>Longest <b>{streak?.longest_streak ?? 0} days</b></span><button type="button" onClick={() => onNavigate('/streaks')}>View streak <AppIcon name="arrow" size={14} /></button></div>
        </article>
      </section>


      <section className="stat-card-grid">{statCards.map((stat) => <article className={`glass-card stat-card ${stat.tone}`} key={stat.label}><span className="stat-icon"><AppIcon name={stat.icon} /></span><div className="stat-copy"><small>{stat.label}</small><strong>{stat.value}</strong><p>{stat.detail}</p></div><div className="stat-visual"><i style={{ height: `${Math.max(14, stat.progress)}%` }} /><i style={{ height: `${Math.max(24, Math.min(100, stat.progress + 18))}%` }} /><i style={{ height: `${Math.max(10, Math.min(100, stat.progress * .72))}%` }} /></div><ProgressBar value={stat.progress} /></article>)}</section>

      <div className="dashboard-content-grid">
        <div className="dashboard-primary-column">
          <section className="glass-card plan-card">
            <div className="section-title-row"><div><span className="eyebrow"><AppIcon name="calendar" size={15} />Daily rhythm</span><h3>Today’s Plan</h3><p>Built from your real habits and goals.</p></div><button className="text-link" type="button" onClick={() => onNavigate('/habits')}>View all <AppIcon name="arrow" size={15} /></button></div>
            <div className="plan-list">{planItems.length ? planItems.map((item) => <div className={`plan-item ${item.completed ? 'completed' : ''}`} key={`${item.category}-${item.id}`}><span className="plan-check">{item.completed && <AppIcon name="check" size={14} />}</span><span className={`plan-icon ${item.category.toLowerCase()}`}><AppIcon name={item.icon} size={18} /></span><div><strong>{item.title}</strong><small>{item.category} · {item.meta}</small></div><time>{item.completed ? 'Done' : item.category}</time><AppIcon name="chevron" size={15} /></div>) : <div className="feature-empty"><span><AppIcon name="calendar" /></span><strong>Your plan is ready for real tasks.</strong><p>Add a habit or goal and it will appear here automatically.</p><div><button className="button button-primary" type="button" onClick={() => onNavigate('/habits?new=1')}>Add habit</button><button className="button button-outline" type="button" onClick={() => onNavigate('/goals?new=1')}>Set goal</button></div></div>}</div>
          </section>

          <section className="glass-card progress-card" id="progress-card">
            <div className="section-title-row"><div><span className="eyebrow"><AppIcon name="chart" size={15} />Momentum</span><h3>Your Progress</h3></div><span className="level-chip"><AppIcon name="zap" size={15} />Level {level}</span></div>
            <div className="level-progress-head"><div><strong>{totalXp} XP</strong><span>{xp?.xp_to_next_level ?? 100} XP to level {level + 1}</span></div><b>{Math.round(levelProgress)}%</b></div><ProgressBar value={levelProgress} className="large" />
            <div className="activity-chart"><div className="chart-scale"><span>100</span><span>50</span><span>0</span></div><div className="chart-bars">{weeklyActivity.map((day) => <div key={day.key} className={day.isToday ? 'today' : ''}><span><i style={{ height: `${Math.max(day.score ? 8 : 2, day.score)}%` }} /></span><small>{day.label}</small></div>)}</div></div>
            <div className="progress-foot"><span><AppIcon name="flame" size={16} />{currentStreak} day streak</span><span><AppIcon name="focus" size={16} />{focusAnalytics?.best_session_minutes ?? 0} min best focus</span><span><AppIcon name="trophy" size={16} />{leaderboard?.rank || '—'} leaderboard rank</span></div>
          </section>
        </div>


        <aside className="dashboard-side-column">
          <section className="glass-card quick-actions-card"><div className="section-title-row"><div><span className="eyebrow"><AppIcon name="zap" size={15} />Shortcuts</span><h3>Quick Actions</h3></div></div><div className="quick-action-list">
            <button type="button" onClick={() => onNavigate('/habits?new=1')}><span className="action-icon violet"><AppIcon name="habit" /></span><div><strong>Add Habit</strong><small>Build your routine</small></div><AppIcon name="arrow" size={16} /></button>
            <button type="button" onClick={() => onNavigate('/goals?new=1')}><span className="action-icon cyan"><AppIcon name="goal" /></span><div><strong>Set Goal</strong><small>Choose what matters next</small></div><AppIcon name="arrow" size={16} /></button>
            <button type="button" onClick={() => onNavigate('/challenges')}><span className="action-icon orange"><AppIcon name="trophy" /></span><div><strong>View Challenges</strong><small>{challenges.active_challenges.length} active now</small></div><AppIcon name="arrow" size={16} /></button>
            <button type="button" onClick={onCheckIn}><span className="action-icon pink"><AppIcon name="sparkles" /></span><div><strong>Check-in</strong><small>Notice how you feel</small></div><AppIcon name="arrow" size={16} /></button>
            <button type="button" onClick={() => { onNavigate('/'); window.setTimeout(() => document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' }), 50) }}><span className="action-icon blue"><AppIcon name="chart" /></span><div><strong>See Leaderboard</strong><small>{leaderboard ? `Rank #${leaderboard.rank}` : 'Loading your rank'}</small></div><AppIcon name="arrow" size={16} /></button>
          </div></section>

          <section className="glass-card recent-card"><div className="section-title-row"><div><span className="eyebrow"><AppIcon name="clock" size={15} />Latest signals</span><h3>Recent Activity</h3></div></div><div className="activity-list">{activityItems.length ? activityItems.map((item) => <div className="activity-item" key={item.id}><span className={`activity-icon ${item.tone}`}><AppIcon name={item.icon} size={17} /></span><div><strong>{item.title}</strong><p>{item.detail}</p></div><time>{relativeTime(item.timestamp)}</time></div>) : <div className="feature-empty compact"><span><AppIcon name="clock" /></span><strong>No activity yet</strong><p>Your real check-ins, focus blocks, and resets will appear here.</p></div>}</div></section>

          <section className="glass-card leaderboard-card" id="leaderboard"><div className="section-title-row"><div><span className="eyebrow"><AppIcon name="trophy" size={15} />Community</span><h3>Leaderboard</h3></div>{leaderboard && <span className="rank-pill">Rank #{leaderboard.rank}</span>}</div><div className="leader-list">{leaderboard?.leaders.length ? leaderboard.leaders.map((entry) => <div key={entry.user_id} className={entry.user_id === data.user.id ? 'current' : ''}><span className={`leader-rank rank-${entry.rank}`}>{entry.rank}</span><span className="leader-avatar">{entry.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><strong>{entry.full_name}</strong><small>Level {entry.level} · {entry.current_streak} day streak</small></div><b>{entry.xp_points} XP</b></div>) : <div className="feature-empty compact"><span><AppIcon name="trophy" /></span><strong>Leaderboard warming up</strong><p>Complete activities to join the rankings.</p></div>}</div><button className="leaderboard-link" type="button" onClick={() => onNavigate('/coach')}>Open Orbit Coach <AppIcon name="arrow" size={15} /></button></section>
        </aside>
      </div>


      <section className="dashboard-section challenges-preview"><div className="section-title-row"><div><span className="eyebrow"><AppIcon name="trophy" size={15} />Keep growing</span><h2>Challenges</h2><p>Real challenges from your current Orbit practice.</p></div><button className="text-link" type="button" onClick={() => onNavigate('/challenges')}>Explore all <AppIcon name="arrow" size={15} /></button></div><div className="challenge-preview-grid">{challengeRows.map((challenge) => { const complete = challenge.progress === 100; const active = challenge.progress === null; return <article className="glass-card challenge-preview-card" key={challenge.name}><div className="challenge-card-top"><span className={`challenge-art ${challenge.icon}`}><AppIcon name={challenge.icon} /></span><span className="challenge-status">{complete ? 'Complete' : active ? 'In progress' : 'Ready'}</span></div><h3>{challenge.name}</h3><p>{complete ? 'You kept the promise to yourself.' : active ? 'Your next small step is waiting.' : 'Join when this experiment feels right.'}</p><ProgressBar value={challenge.progress ?? 0} indeterminate={active} /><div className="challenge-card-bottom"><span>{active ? 'In progress' : challenge.progress === 100 ? 'Complete' : challenge.progress === 0 ? 'Ready to begin' : `${challenge.progress}% complete`}</span>{!complete && <button type="button" onClick={() => void onChallenge(challenge.name, active ? 'complete' : 'join')}>{active ? 'Complete' : 'Start'} <AppIcon name="arrow" size={14} /></button>}</div></article> })}</div></section>

      <section className="motivational-quote"><div className="quote-overlay" /><span className="quote-mark"><AppIcon name="quote" size={30} /></span><div><span className="eyebrow">A note for your orbit</span><blockquote>“The secret of getting ahead is getting started.”</blockquote><p>Small actions, repeated with care, become a life that feels like yours.</p></div><span className="quote-orbit" aria-hidden="true"><i /><i /><i /></span></section>
    </div>
  </OrbitShell>
}

