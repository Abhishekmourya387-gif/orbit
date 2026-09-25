import type { ChallengeSummaryResponse } from '../lib/api'

export function challengeState(name: string, summary: ChallengeSummaryResponse) {
  if (summary.completed_challenges.includes(name)) return { label: 'Complete', progress: 100 }
  if (summary.active_challenges.includes(name)) return { label: 'In progress', progress: null }
  return { label: 'Ready', progress: 0 }
}
