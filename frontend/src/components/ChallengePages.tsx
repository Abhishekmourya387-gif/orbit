import { BackButton } from './BackButton'
import type { ChallengeSummaryResponse } from '../lib/api'

function challengeState(name: string, summary: ChallengeSummaryResponse) {
  if (summary.completed_challenges.includes(name)) return { label: 'Complete', progress: 100 }
  if (summary.active_challenges.includes(name)) return { label: 'In progress', progress: 65 }
  return { label: 'Ready', progress: 0 }
}

export function ChallengeListPage({ summary, onOpen }: { summary: ChallengeSummaryResponse; onOpen: (name: string) => void }) {
  return <main className="inner-page"><div className="inner-page-header"><BackButton fallback="/" /><div><p className="kicker">Your practice</p><h1>Challenges</h1><p>Small experiments that help your intentions become something you can feel.</p></div></div><section className="challenge-directory">{summary.available_challenges.length === 0 ? <div className="empty-state">No challenges are available right now.</div> : summary.available_challenges.map((name) => { const state = challengeState(name, summary); return <button className="directory-row" key={name} onClick={() => onOpen(name)}><span className="directory-index">{String(summary.available_challenges.indexOf(name) + 1).padStart(2, '0')}</span><span><strong>{name}</strong><small>{state.label} · {state.progress}% complete</small></span><span>→</span></button> })}</section></main>
}

export function ChallengeDetailPage({ name, summary, onAction }: { name: string; summary: ChallengeSummaryResponse; onAction: (name: string, action: 'join' | 'complete') => Promise<void> }) {
  const state = challengeState(name, summary)
  const isComplete = state.label === 'Complete'
  const isActive = state.label === 'In progress'

  return <main className="inner-page challenge-detail"><div className="inner-page-header"><BackButton fallback="/challenges" /><div><p className="kicker">Challenge detail</p><h1>{name}</h1><p>A small, repeatable action is enough to start. Come back to this page when you are ready to mark the next step.</p></div></div><section className="detail-content"><div className="detail-status"><span>{state.label}</span><strong>{state.progress}%</strong></div><div className="line-progress"><span style={{ width: `${state.progress}%` }} /></div><p className="detail-copy">{isComplete ? 'You completed this challenge. Let the win be enough for today.' : isActive ? 'This challenge is part of your current practice. Finish the next small step when it feels right.' : 'This challenge is waiting for you. Joining it adds it to your current practice.'}</p>{!isComplete && <button className="button button-primary" onClick={() => void onAction(name, isActive ? 'complete' : 'join')}>{isActive ? 'Mark challenge complete' : 'Start challenge'} <span>→</span></button>}</section></main>
}
