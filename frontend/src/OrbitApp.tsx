import { useEffect, useState, type FormEvent } from 'react'
import { AuthScreen, CheckInModal, FocusPage, RescuePage } from './App'
import './orbit.css'
import { OrbitShell } from './components/OrbitShell'
import { OrbitDashboard } from './components/OrbitDashboard'
import { HabitsPage, GoalsPage, ProfilePage, StreakPage } from './components/ProductPages'
import { ChallengeDetailPage, ChallengeListPage } from './components/ChallengePages'
import { CoachPage } from './components/CoachPage'
import {
  clearSession,
  completeChallenge,
  createCheckIn,
  getChallenges,
  getDashboard,
  getFocusAnalytics,
  getFocusHistory,
  getGoals,
  getHabits,
  getLeaderboard,
  getNotifications,
  getRescueHistory,
  getStreak,
  getXpSummary,
  joinChallenge,
  loginUser,
  readStoredSession,
  registerUser,
  saveSession,
  type ChallengeSummaryResponse,
  type DashboardResponse,
  type FocusAnalyticsResponse,
  type FocusSessionResponse,
  type GoalResponse,
  type HabitResponse,
  type LeaderboardSummaryResponse,
  type NotificationResponse,
  type RescueSessionResponse,
  type SessionPayload,
  type StreakResponse,
  type XpSummaryResponse,
} from './lib/api'

type AuthMode = 'login' | 'register'

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
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
  const [focusAnalytics, setFocusAnalytics] = useState<FocusAnalyticsResponse | null>(null)
  const [focusHistory, setFocusHistory] = useState<FocusSessionResponse[]>([])
  const [habits, setHabits] = useState<HabitResponse[]>([])
  const [goals, setGoals] = useState<GoalResponse[]>([])
  const [streak, setStreak] = useState<StreakResponse | null>(null)
  const [xp, setXp] = useState<XpSummaryResponse | null>(null)
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(() => readStoredSession() !== null)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [savingCheckIn, setSavingCheckIn] = useState(false)
  const [checkInError, setCheckInError] = useState('')
  const [form, setForm] = useState({ fullName: '', email: 'demo@orbit.app', password: 'StrongPass123!' })

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!session) return
    let active = true
    Promise.all([
      getDashboard(session.access_token),
      getLeaderboard(session.access_token),
      getChallenges(session.access_token),
      getRescueHistory(session.access_token),
      getFocusAnalytics(session.access_token),
      getFocusHistory(session.access_token),
      getHabits(session.access_token),
      getGoals(session.access_token),
      getStreak(session.access_token),
      getXpSummary(session.access_token),
      getNotifications(session.access_token),
    ]).then(([nextData, nextLeaderboard, nextChallenges, nextHistory, nextAnalytics, nextFocusHistory, nextHabits, nextGoals, nextStreak, nextXp, nextNotifications]) => {
      if (!active) return
      setData(nextData); setLeaderboard(nextLeaderboard); setChallenges(nextChallenges); setRescueHistory(nextHistory); setFocusAnalytics(nextAnalytics); setFocusHistory(nextFocusHistory); setHabits(nextHabits); setGoals(nextGoals); setStreak(nextStreak); setXp(nextXp); setNotifications(nextNotifications)
    }).catch((loadError) => { if (active) setError((loadError as Error).message || 'Unable to load your Orbit.') }).finally(() => { if (active) setLoadingDashboard(false) })
    return () => { active = false }
  }, [session])

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true); setError('')
    try {
      if (authMode === 'register') await registerUser(form.fullName, form.email, form.password)
      const nextSession = await loginUser(form.email, form.password)
      saveSession(nextSession); setLoadingDashboard(true); setSession(nextSession)
    } catch (requestError) { setError((requestError as Error).message || 'Unable to complete authentication.') } finally { setLoading(false) }
  }

  async function handleCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    const values = new FormData(event.currentTarget)
    setSavingCheckIn(true); setCheckInError('')
    try {
      await createCheckIn(session.access_token, { mood: String(values.get('mood')), energy_level: Number(values.get('energyLevel')), focus_rating: Number(values.get('focusRating')), reflection: String(values.get('reflection') || '').trim(), win_of_day: String(values.get('winOfDay') || '').trim(), blockers: String(values.get('blockers') || '').split(',').map((item) => item.trim()).filter(Boolean) })
      setData(await getDashboard(session.access_token)); setCheckInOpen(false)
    } catch (requestError) { setCheckInError((requestError as Error).message || 'Unable to save your check-in.') } finally { setSavingCheckIn(false) }
  }

  async function handleChallenge(name: string, action: 'join' | 'complete') {
    if (!session) return
    try {
      if (action === 'join') await joinChallenge(session.access_token, name)
      else await completeChallenge(session.access_token, name)
      const [nextChallenges, nextLeaderboard, nextXp] = await Promise.all([getChallenges(session.access_token), getLeaderboard(session.access_token), getXpSummary(session.access_token)])
      setChallenges(nextChallenges); setLeaderboard(nextLeaderboard); setXp(nextXp)
    } catch (requestError) { setError((requestError as Error).message || 'Unable to update this challenge.') }
  }

  function handleLogout() { clearSession(); setSession(null); setData(null); setLoadingDashboard(false); navigate('/') }
  const userName = session?.user?.full_name || 'Orbit user'
  const sharedPageProps = { token: session?.access_token ?? '', userName, xp, notifications, challengeCount: challenges?.active_challenges.length ?? 0, onNavigate: navigate, onLogout: handleLogout }

  if (!session) return <AuthScreen mode={authMode} setMode={setAuthMode} loading={loading} error={error} form={form} setForm={setForm} onSubmit={handleAuth} />
  if (path === '/focus') return <OrbitShell activePath="/focus" userName={userName} xp={xp} notifications={notifications} challengeCount={challenges?.active_challenges.length ?? 0} onNavigate={navigate} onLogout={handleLogout}><FocusPage token={session.access_token} onBack={() => navigate('/')} embedded /></OrbitShell>
  if (path === '/rescue') return <OrbitShell activePath="/rescue" userName={userName} xp={xp} notifications={notifications} challengeCount={challenges?.active_challenges.length ?? 0} onNavigate={navigate} onLogout={handleLogout}><RescuePage token={session.access_token} onBack={() => navigate('/')} onFocus={() => navigate('/focus')} onCoach={() => navigate('/coach')} embedded /></OrbitShell>
  if (path === '/habits') return <HabitsPage {...sharedPageProps} openOnMount={new URLSearchParams(window.location.search).has('new')} />
  if (path === '/goals') return <GoalsPage {...sharedPageProps} openOnMount={new URLSearchParams(window.location.search).has('new')} />
  if (path === '/streaks') return <StreakPage {...sharedPageProps} />
  if (path === '/profile') return <ProfilePage {...sharedPageProps} />
  if (path === '/coach') return <OrbitShell activePath="/coach" userName={userName} xp={xp} notifications={notifications} challengeCount={challenges?.active_challenges.length ?? 0} onNavigate={navigate} onLogout={handleLogout}><CoachPage token={session.access_token} /></OrbitShell>
  if (path === '/challenges' && challenges) return <OrbitShell activePath="/challenges" userName={userName} xp={xp} notifications={notifications} challengeCount={challenges.active_challenges.length} onNavigate={navigate} onLogout={handleLogout}><ChallengeListPage summary={challenges} onOpen={(name) => navigate(`/challenges/${encodeURIComponent(name)}`)} /></OrbitShell>
  if (path.startsWith('/challenges/') && challenges) return <OrbitShell activePath="/challenges" userName={userName} xp={xp} notifications={notifications} challengeCount={challenges.active_challenges.length} onNavigate={navigate} onLogout={handleLogout}><ChallengeDetailPage name={decodeURIComponent(path.slice('/challenges/'.length))} summary={challenges} onAction={handleChallenge} /></OrbitShell>

  if (loadingDashboard || !data || !challenges) return <OrbitShell activePath="/" userName={userName} xp={xp} notifications={notifications} challengeCount={challenges?.active_challenges.length ?? 0} onNavigate={navigate} onLogout={handleLogout}><div className="page-loading full-page-loading"><span className="orbit-loader"><i /><i /><i /></span><p>Preparing your orbit…</p></div></OrbitShell>

  return <>
    <OrbitDashboard data={data} challenges={challenges} leaderboard={leaderboard} rescueHistory={rescueHistory} focusAnalytics={focusAnalytics} focusHistory={focusHistory} habits={habits} goals={goals} streak={streak} xp={xp} notifications={notifications} userName={userName} error={error} onNavigate={navigate} onLogout={handleLogout} onCheckIn={() => { setCheckInError(''); setCheckInOpen(true) }} onRescue={() => navigate('/rescue')} onChallenge={handleChallenge} />
    {checkInOpen && <CheckInModal saving={savingCheckIn} error={checkInError} onClose={() => !savingCheckIn && setCheckInOpen(false)} onSubmit={handleCheckIn} />}
  </>
}

export default App

