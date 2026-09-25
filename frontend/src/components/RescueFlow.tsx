import { useCallback, useEffect, useRef, useState } from 'react'

import { BackButton } from './BackButton'
import {
  createRescueSession,
  getRescueHistory,
  type RescueActivityType,
  type RescueSessionResponse,
} from '../lib/api'

type RescueTrigger = 'craving' | 'stress' | 'restlessness' | 'focus' | 'reset'
type RescueStep = RescueActivityType | 'physical'
type RescueView = 'start' | 'activity' | 'physical' | 'grounding' | 'urge-check' | 'complete'
type PhysicalChoice = 'pushups-5' | 'pushups-10' | 'stretch' | 'walk'

const triggerOptions: Array<{ id: RescueTrigger; label: string; detail: string }> = [
  { id: 'craving', label: 'Strong craving', detail: 'I need a little distance from this feeling.' },
  { id: 'stress', label: 'Stress', detail: 'My body needs a softer pace.' },
  { id: 'restlessness', label: 'Restlessness', detail: 'I need to move some energy through.' },
  { id: 'focus', label: "Can't focus", detail: 'I want to find my next small step.' },
  { id: 'reset', label: 'I just need a reset', detail: 'Nothing is wrong. I want a clean pause.' },
]

const flows: Record<RescueTrigger, RescueStep[]> = {
  craving: ['breathing', 'physical', 'grounding'],
  stress: ['breathing', 'stretch', 'grounding'],
  restlessness: ['movement', 'breathing', 'grounding'],
  focus: ['movement', 'breathing'],
  reset: ['breathing', 'grounding', 'movement'],
}

const activityLabels: Record<RescueActivityType, { label: string; eyebrow: string; description: string }> = {
  breathing: { label: '30-second breathing', eyebrow: 'Slow the moment down', description: 'Follow the circle. There is nothing to solve while you breathe.' },
  movement: { label: '30-second movement', eyebrow: 'Let the energy move', description: 'Walk around, shake out your arms, or roll your shoulders.' },
  stretch: { label: 'A gentle stretch', eyebrow: 'Make some room', description: 'Let your shoulders drop and slowly turn your head left and right.' },
  grounding: { label: '5–4–3 grounding', eyebrow: 'Come back to now', description: 'Notice what is around you, one sense at a time.' },
  pushups: { label: 'Push-ups', eyebrow: 'Change your state', description: 'Choose a small set and complete it at your own pace.' },
  cool_water: { label: 'Cool-water reset', eyebrow: 'A simple change of pace', description: 'Wash your face with cool water, then come back when you are ready.' },
}

const groundingPrompts = ['Name 5 things you can see.', 'Name 4 things you can feel.', 'Name 3 things you can hear.']

export function RescueFlow({ token, onDashboard, onFocus, onCoach, embedded = false }: { token: string; onDashboard: () => void; onFocus: () => void; onCoach: () => void; embedded?: boolean }) {
  const [view, setView] = useState<RescueView>('start')
  const [trigger, setTrigger] = useState<RescueTrigger | null>(null)
  const [step, setStep] = useState(0)
  const [activity, setActivity] = useState<RescueStep>('breathing')
  const [remaining, setRemaining] = useState(30)
  const [paused, setPaused] = useState(false)
  const [physicalChoice, setPhysicalChoice] = useState<PhysicalChoice>('pushups-5')
  const [groundingStep, setGroundingStep] = useState(0)
  const [groundingNote, setGroundingNote] = useState('')
  const [urgeRating, setUrgeRating] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<RescueSessionResponse[]>([])
  const [error, setError] = useState('')
  const savingRef = useRef(false)

  useEffect(() => {
    getRescueHistory(token).then(setHistory).catch(() => undefined)
  }, [token])

  function startTrigger(nextTrigger: RescueTrigger) {
    const firstStep = flows[nextTrigger][0]
    setTrigger(nextTrigger)
    setStep(0)
    setActivity(firstStep)
    setRemaining(30)
    setGroundingStep(0)
    setGroundingNote('')
    setNotice('')
    setView(firstStep === 'physical' ? 'physical' : firstStep === 'grounding' ? 'grounding' : 'activity')
  }

  const continueToNextStep = useCallback(() => {
    if (!trigger) return
    const nextStep = flows[trigger][step + 1]
    if (!nextStep) {
      setView('complete')
      return
    }
    setStep((current) => current + 1)
    setActivity(nextStep)
    setRemaining(30)
    setPaused(false)
    setGroundingStep(0)
    setGroundingNote('')
    setNotice('')
    setView(nextStep === 'physical' ? 'physical' : nextStep === 'grounding' ? 'grounding' : 'activity')
  }, [step, trigger])

  const completeStep = useCallback(async (activityType: RescueActivityType, durationSeconds: number) => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError('')
    try {
      const saved = await createRescueSession(token, {
        activity_type: activityType,
        duration_seconds: durationSeconds,
        completed: true,
      })
      setHistory((current) => [saved, ...current])
      if (activityType === 'breathing' && trigger === 'craving') {
        setNotice('Good. Give the urge another 30 seconds.')
      }
      if (trigger === 'craving' && activityType === 'grounding') {
        setView('urge-check')
      } else {
        continueToNextStep()
      }
    } catch (saveError) {
      setError((saveError as Error).message || 'We could not save this reset.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [continueToNextStep, token, trigger])

  useEffect(() => {
    if (view !== 'activity' || paused || !['breathing', 'movement', 'stretch'].includes(activity) || remaining <= 0) return
    const timer = window.setInterval(() => {
      if (remaining === 1) {
        void completeStep(activity as RescueActivityType, 30)
        setRemaining(0)
        return
      }
      setRemaining(remaining - 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [activity, completeStep, paused, remaining, view])

  function completePhysical() {
    const activityType: RescueActivityType = physicalChoice === 'pushups-5' || physicalChoice === 'pushups-10' ? 'pushups' : physicalChoice === 'stretch' ? 'stretch' : 'movement'
    const duration = physicalChoice === 'walk' ? 60 : physicalChoice === 'stretch' ? 30 : 0
    void completeStep(activityType, duration)
  }

  const elapsed = 30 - remaining
  const breathPhase = elapsed % 12 < 4 ? 'Breathe in' : elapsed % 12 < 6 ? 'Hold' : 'Breathe out'
  const flowLength = trigger ? flows[trigger].length + (trigger === 'craving' ? 1 : 0) : 1
  const visibleStep = trigger ? Math.min(step + 1, flowLength) : 1

  return <div className={`rescue-page ${embedded ? 'rescue-page-embedded' : ''}`}>{embedded ? <div className="embedded-page-toolbar"><BackButton fallback="/" label="Exit Rescue" onBack={onDashboard} /><span className="embedded-page-label">Private reset</span></div> : <header className="rescue-header"><BackButton fallback="/" label="Exit Rescue" /><a className="logo" href="/" onClick={(event) => { event.preventDefault(); onDashboard() }}><span className="logo-mark">o</span><span>orbit</span></a><span className="rescue-label">Private reset</span></header>}<div className="rescue-stage">
    {view === 'start' && <section className="rescue-start"><div className="rescue-intro"><span className="rescue-symbol">+</span><p className="kicker">No judgment. No pressure.</p><h1>Pause.<br />You don’t have to act on the urge right now.</h1><p>Let’s get through the next few minutes together.</p><p className="rescue-history-note">{history.length > 0 ? `${history.length} private reset${history.length === 1 ? '' : 's'} completed` : 'This is a private space to reset.'}</p></div><div className="trigger-picker"><p className="kicker">What are you feeling right now?</p>{triggerOptions.map((option) => <button className="trigger-option" key={option.id} onClick={() => startTrigger(option.id)}><span><strong>{option.label}</strong><small>{option.detail}</small></span><span>→</span></button>)}</div></section>}
    {trigger && view !== 'start' && view !== 'complete' && <div className="rescue-progress" aria-label={`Rescue step ${visibleStep} of ${flowLength}`}><span style={{ width: `${(visibleStep / flowLength) * 100}%` }} /></div>}
    {view === 'activity' && typeof activity === 'string' && activity !== 'physical' && <section className="activity-view"><button className="back-button activity-back" onClick={() => setView('start')}>← <span>Choose another feeling</span></button><div className="activity-content"><p className="kicker">{activityLabels[activity].eyebrow}</p><h1>{activityLabels[activity].label}</h1><p className="activity-description">{activityLabels[activity].description}</p>{notice && <p className="rescue-notice">{notice}</p>}{activity === 'breathing' && <div className="breathing-workspace"><div className={`breathing-orb ${paused ? 'paused' : ''}`}><span>{breathPhase}</span></div><div className="timer-line"><span style={{ width: `${((30 - remaining) / 30) * 100}%` }} /></div><p className="timer-copy">{remaining} seconds left</p><div className="activity-actions"><button className="button button-outline" onClick={() => setPaused((current) => !current)}>{paused ? 'Continue' : 'Pause'}</button><button className="text-button" onClick={() => setRemaining(30)}>Restart</button></div></div>}{(activity === 'movement' || activity === 'stretch') && <div className="manual-workspace"><div className="movement-card"><span className="movement-figure">◡</span><p>{activity === 'movement' ? 'Walk around, shake out your arms, or roll your shoulders.' : 'Let your shoulders drop. Slowly turn your head left and right.'}</p></div><div className="timer-line"><span style={{ width: `${((30 - remaining) / 30) * 100}%` }} /></div><p className="timer-copy">{remaining} seconds left</p><button className="button button-outline" onClick={() => setPaused((current) => !current)}>{paused ? 'Continue' : 'Pause'}</button></div>}{error && <p className="form-error" role="alert">{error}</p>}</div></section>}
    {view === 'physical' && <section className="activity-view"><button className="back-button activity-back" onClick={() => setView('start')}>← <span>Choose another feeling</span></button><div className="activity-content"><p className="kicker">Step 2 · Physical reset</p><h1>Give your attention somewhere else.</h1><p className="activity-description">Pick one short body reset. This is not about performance, just a change of state.</p><div className="physical-options">{[['pushups-5', '5 push-ups'], ['pushups-10', '10 push-ups'], ['stretch', '30-second stretch'], ['walk', '60-second walk']].map(([value, label]) => <button key={value} className={physicalChoice === value ? 'physical-option active' : 'physical-option'} onClick={() => setPhysicalChoice(value as PhysicalChoice)}>{label}<span>→</span></button>)}</div><button className="button button-primary" onClick={completePhysical} disabled={saving}>Mark reset complete</button>{error && <p className="form-error" role="alert">{error}</p>}</div></section>}
    {view === 'grounding' && <section className="activity-view"><button className="back-button activity-back" onClick={() => setView('start')}>← <span>Choose another feeling</span></button><div className="activity-content"><p className="kicker">Step {step + 1} · Grounding</p><h1>{groundingPrompts[groundingStep]}</h1><p className="activity-description">You can name them silently or write a word to help your attention land.</p><div className="grounding-step"><span className="step-count">{groundingStep + 1} / 3</span><input value={groundingNote} onChange={(event) => setGroundingNote(event.target.value)} placeholder="A word or two, if helpful" autoFocus /></div>{groundingStep < 2 ? <button className="button button-primary" disabled={!groundingNote.trim()} onClick={() => { setGroundingStep((current) => current + 1); setGroundingNote('') }}>Complete step <span>→</span></button> : <button className="button button-primary" disabled={!groundingNote.trim() || saving} onClick={() => void completeStep('grounding', 0)}>Finish grounding</button>}{error && <p className="form-error" role="alert">{error}</p>}</div></section>}
    {view === 'urge-check' && <section className="activity-view urge-check-view"><div className="activity-content"><p className="kicker">Step 4 · A quick check</p><h1>How strong is the urge now?</h1><p className="activity-description">There is no right answer. Just notice the number that feels closest.</p><div className="urge-scale">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} className={urgeRating === rating ? 'active' : ''} onClick={() => setUrgeRating(rating)}><strong>{rating}</strong><small>{rating === 1 ? 'Very low' : rating === 5 ? 'Very strong' : ''}</small></button>)}</div>{urgeRating && <div className="urge-result"><p>Whatever the number is, you made it through another moment without acting on the urge.</p><div className="complete-actions"><button className="button button-primary" onClick={() => setView('start')}>Do another reset</button><button className="button button-outline" onClick={onFocus}>Start Focus Mode</button><button className="button button-outline" onClick={onCoach}>Talk to Orbit Coach</button><button className="button button-quiet" onClick={onDashboard}>Return to Dashboard</button></div></div>}</div></section>}
    {view === 'complete' && <section className="rescue-complete"><span className="complete-mark">✓</span><p className="kicker">You made some room</p><h1>Nice. Give yourself another moment.</h1><p>You noticed what was happening and chose a next step. That matters.</p><div className="complete-actions"><button className="button button-primary" onClick={() => setView('start')}>Do another reset</button><button className="button button-outline" onClick={onFocus}>Start Focus Mode</button><button className="button button-outline" onClick={onCoach}>Talk to Orbit Coach</button><button className="button button-quiet" onClick={onDashboard}>Return to Dashboard</button></div></section>}
  </div></div>
}
