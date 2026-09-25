const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api\/v1$/, '')

export type SessionPayload = {
  access_token: string
  refresh_token: string
  token_type?: string
  user?: {
    id: number
    full_name: string
    email: string
  }
}

export type DashboardResponse = {
  user: {
    id: number
    full_name: string
    email: string
  }
  profile: {
    bio: string | null
    primary_goal: string | null
    current_challenges: string[]
    preferred_habits: string[]
    focus_goals: string | null
    improvement_goals: string | null
    profile_completion: number
  }
  onboarding: {
    primary_goal: string | null
    current_challenges: string[]
    common_triggers: string[]
    preferred_routine: string | null
    focus_goals: string | null
    improvement_goals: string | null
  }
  checkins: Array<{
    id: number
    user_id?: number
    mood: string
    energy_level: number | null
    focus_rating: number | null
    reflection: string | null
    win_of_day: string | null
    blockers: string[]
    created_at?: string
  }>
  summary: {
    recent_checkins_count: number
    profile_completion: number
  }
}

export type DailyCheckInCreate = {
  mood: string
  energy_level: number
  focus_rating: number
  reflection: string
  win_of_day: string
  blockers: string[]
}

export type DailyCheckInResponse = DailyCheckInCreate & {
  id: number
  user_id: number
}

export type ChallengeSummaryResponse = {
  user_id: number
  available_challenges: string[]
  active_challenges: string[]
  completed_challenges: string[]
}

export type LeaderboardEntry = {
  rank: number
  user_id: number
  full_name: string
  xp_points: number
  level: number
  current_streak: number
}

export type LeaderboardSummaryResponse = {
  user_id: number
  rank: number
  top_3_count: number
  leaders: LeaderboardEntry[]
  total_users: number
}

export type RescueActivityType = 'breathing' | 'pushups' | 'movement' | 'grounding' | 'stretch' | 'cool_water'

export type RescueSessionResponse = {
  id: number
  user_id: number
  activity_type: RescueActivityType
  duration_seconds: number
  completed: boolean
  created_at: string
}

export type FocusSessionResponse = {
  id: number
  user_id: number
  goal: string
  duration_minutes: number
  status: string
  started_at: string
  completed_at: string | null
  notes: string | null
  xp_awarded: number
  distractions_count: number
}

export type FocusAnalyticsResponse = {
  total_sessions: number
  completed_sessions: number
  total_minutes: number
  total_distractions: number
  average_session_minutes: number
  best_session_minutes: number
}

export type InsightResponse = {
  user_id: number
  headline: string
  focus_score: number
  energy_trend: string
  average_focus: number
  average_energy: number
  current_streak: number
  xp_level: number
  recommendations: string[]
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.text()
    try {
      const parsed = JSON.parse(body) as { detail?: string }
      throw new Error(parsed.detail || 'Request failed')
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== 'Request failed') {
        throw parseError
      }
      throw new Error(body || 'Request failed')
    }
  }

  return response.json() as Promise<T>
}

export function readStoredSession(): SessionPayload | null {
  try {
    const raw = localStorage.getItem('orbit_session')
    return raw ? (JSON.parse(raw) as SessionPayload) : null
  } catch {
    return null
  }
}

export function saveSession(session: SessionPayload) {
  localStorage.setItem('orbit_session', JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem('orbit_session')
}

export async function registerUser(fullName: string, email: string, password: string) {
  return request<SessionPayload>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name: fullName, email, password }),
  })
}

export async function loginUser(email: string, password: string) {
  return request<SessionPayload>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getDashboard(token: string) {
  return request<DashboardResponse>('/api/v1/dashboard', { method: 'GET' }, token)
}

export async function getChallenges(token: string) {
  return request<ChallengeSummaryResponse>('/api/v1/challenges', { method: 'GET' }, token)
}

export async function getLeaderboard(token: string) {
  return request<LeaderboardSummaryResponse>('/api/v1/leaderboard', { method: 'GET' }, token)
}

export async function getRescueHistory(token: string) {
  return request<RescueSessionResponse[]>('/api/v1/rescue/history', { method: 'GET' }, token)
}

export async function createRescueSession(token: string, payload: {
  activity_type: RescueActivityType
  duration_seconds: number
  completed: boolean
}) {
  return request<RescueSessionResponse>('/api/v1/rescue/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token)
}

export async function startFocusSession(token: string, payload: { goal: string; duration_minutes: number }) {
  return request<FocusSessionResponse>('/api/v1/focus/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token)
}

export async function completeFocusSession(token: string, sessionId: number, notes: string) {
  return request<FocusSessionResponse>(`/api/v1/focus/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ completed: true, notes: notes.trim() || null }),
  }, token)
}

export async function logFocusDistraction(token: string, sessionId: number, source: string) {
  return request<{ id: number; session_id: number; source: string | null }>('/api/v1/focus/' + sessionId + '/distraction', {
    method: 'POST',
    body: JSON.stringify({ source, note: null }),
  }, token)
}

export async function getFocusAnalytics(token: string) {
  return request<FocusAnalyticsResponse>('/api/v1/focus/analytics', { method: 'GET' }, token)
}

export async function getInsights(token: string) {
  return request<InsightResponse>('/api/v1/insights', { method: 'GET' }, token)
}

export async function createCheckIn(token: string, payload: DailyCheckInCreate) {
  return request<DailyCheckInResponse>('/api/v1/checkins', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token)
}

export async function joinChallenge(token: string, challengeName: string) {
  return request<{ challenge_name: string; joined: boolean }>('/api/v1/challenges/join', {
    method: 'POST',
    body: JSON.stringify({ challenge_name: challengeName }),
  }, token)
}

export async function completeChallenge(token: string, challengeName: string) {
  return request<{ challenge_name: string; completed: boolean; xp_awarded: number }>('/api/v1/challenges/complete', {
    method: 'POST',
    body: JSON.stringify({ challenge_name: challengeName }),
  }, token)
}
