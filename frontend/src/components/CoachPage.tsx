import { useEffect, useState } from 'react'

import { getInsights, type InsightResponse } from '../lib/api'
import { BackButton } from './BackButton'

export function CoachPage({ token }: { token: string }) {
  const [insights, setInsights] = useState<InsightResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getInsights(token).then(setInsights).catch((loadError) => setError((loadError as Error).message || 'Unable to load your coach notes.')).finally(() => setLoading(false))
  }, [token])

  return <div className="inner-page coach-page"><div className="inner-page-header"><BackButton fallback="/" /><div><p className="kicker">A thoughtful nudge</p><h1>Orbit Coach</h1><p>A private reflection based on the patterns you have chosen to notice.</p></div></div>{loading && <div className="loading-state">Reading your recent rhythm…</div>}{error && <p className="form-error" role="alert">{error}</p>}{insights && <section className="coach-content"><div className="coach-headline"><p className="kicker">Your note for today</p><h2>{insights.headline}</h2></div><div className="coach-metrics"><span><strong>{insights.focus_score}%</strong> focus score</span><span><strong>{insights.current_streak}</strong> day streak</span><span><strong>{insights.xp_level}</strong> Orbit level</span></div><div className="coach-recommendations"><p className="kicker">Try this next</p><ul>{insights.recommendations.map((recommendation) => <li key={recommendation}><span>✓</span>{recommendation}</li>)}</ul></div></section>}</div>
}
