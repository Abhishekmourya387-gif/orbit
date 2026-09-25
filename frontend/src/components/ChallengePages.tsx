import { BackButton } from './BackButton'
import type { ChallengeSummaryResponse } from '../lib/api'
import { challengeState } from './challengeState'

export function ChallengeListPage({ summary, onOpen }: { summary: ChallengeSummaryResponse; onOpen: (name: string) => void }) {
  return (
    <div className="inner-page">
      <div className="inner-page-header"><BackButton fallback="/" /><div><p className="kicker">Your practice</p><h1>Challenges</h1><p>Small experiments that help your intentions become something you can feel.</p></div></div>
      <section className="challenge-directory">
        {summary.available_challenges.length === 0 ? <div className="empty-state">No challenges are available right now.</div> : summary.available_challenges.map((name) => {
          const state = challengeState(name, summary)
          const progressLabel = state.progress === null ? 'In progress' : state.progress === 100 ? 'Complete' : state.progress === 0 ? 'Ready to begin' : `${state.progress}% complete`
          return <button className="directory-row" key={name} onClick={() => onOpen(name)}><span className="directory-index">{String(summary.available_challenges.indexOf(name) + 1).padStart(2, '0')}</span><span><strong>{name}</strong><small>{progressLabel}</small></span><span>→</span></button>
        })}
      </section>
    </div>
  )
}

export function ChallengeDetailPage({ name, summary, onAction }: { name: string; summary: ChallengeSummaryResponse; onAction: (name: string, action: 'join' | 'complete') => Promise<void> }) {
  const state = challengeState(name, summary)
  const isComplete = state.label === 'Complete'
  const isActive = state.label === 'In progress'

  return (
    <div className="inner-page challenge-detail">
      <div className="inner-page-header"><BackButton fallback="/challenges" /><div><p className="kicker">Challenge detail</p><h1>{name}</h1><p>A small, repeatable action is enough to start. Come back to this page when you are ready to mark the next step.</p></div></div>
      <section className="detail-content">
        <div className="detail-status"><span>{state.label}</span><strong>{state.progress === null ? 'In progress' : state.progress === 100 ? '100%' : state.progress === 0 ? 'Ready to begin' : `${state.progress}%`}</strong></div>
        <div className="line-progress"><span className={state.progress === null ? 'indeterminate' : ''} style={state.progress === null ? undefined : { width: `${state.progress}%` }} /></div>
        <p className="detail-copy">{isComplete ? 'You completed this challenge. Let the win be enough for today.' : isActive ? 'This challenge is part of your current practice. Finish the next small step when it feels right.' : 'This challenge is waiting for you. Joining it adds it to your current practice.'}</p>
        {!isComplete && <button className="button button-primary" onClick={() => void onAction(name, isActive ? 'complete' : 'join')}>{isActive ? 'Mark challenge complete' : 'Start challenge'} <span>→</span></button>}
      </section>
    </div>
  )
}
