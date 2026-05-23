import type {
  ActionRollContent,
  CampaignRollContent,
  EngagementRollContent,
  FortuneRollContent,
  ResistanceRollContent,
  RollActor,
  RollContent,
} from '@/lib/types'

export type RollOutcome = 'failure' | 'partial' | 'success' | 'critical'

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number')

export const getKeptDie = (results: number[], dicePool: number): number => {
  if (!results.length) {
    return 0
  }

  if (dicePool === 0) {
    return Math.min(...results)
  }

  return Math.max(...results)
}

export const getResistanceStressCost = (results: number[], dicePool: number) => {
  const kept = getKeptDie(results, dicePool)
  const sixes = dicePool > 0 ? results.filter((r) => r === 6).length : 0

  if (sixes >= 2) {
    return -1
  }

  return Math.max(0, 6 - kept)
}

export const getFitDOutcome = (results: number[], dicePool: number): RollOutcome => {
  if (!results.length) {
    return 'failure'
  }

  const keptDie = getKeptDie(results, dicePool)

  if (dicePool === 0) {
    if (keptDie >= 6) {
      return 'success'
    }
    if (keptDie >= 4) {
      return 'partial'
    }
    return 'failure'
  }

  const sixes = results.filter((result) => result === 6).length
  if (sixes >= 2) {
    return 'critical'
  }
  if (keptDie === 6) {
    return 'success'
  }
  if (keptDie >= 4) {
    return 'partial'
  }
  return 'failure'
}

export const getRollDescription = (rollType: string, outcome: RollOutcome): string => {
  const descriptions: Record<string, Record<RollOutcome, string>> = {
    action: {
      critical: 'Critical Success! You accomplish your goal with significant advantage. (Multiple 6s rolled)',
      success: 'Full Success. Things go well. You achieve your goal as intended.',
      partial: 'Partial Success. You do what you’re trying to do, but there are consequences: trouble, harm, reduced effect, etc.',
      failure: 'Bad Outcome. Things go poorly. You do not achieve your goal and you suffer complications.',
    },
    resistance: {
      critical: 'Critical Resistance! You reduce or avoid the effects of the consequence. You clear 1 stress.',
      success: 'You reduce or avoid the effects of the consequence. No stress taken.',
      partial: 'You reduce or avoid the effects of the consequence. Mark stress.',
      failure: 'You fail to reduce the consequence. Mark stress.',
    },
    fortune: {
      critical: 'Exceptional fortune. You gain a big advantage.',
      success: 'Good fortune. Things go your way.',
      partial: 'Mixed fortune. There is some benefit, but it is limited.',
      failure: 'Poor fortune. You get no help from luck.',
    },
    engagement: {
      critical: 'Engagement critical result.',
      success: 'Engagement success.',
      partial: 'Engagement partial success.',
      failure: 'Engagement failure.',
    },
    campaign: {
      critical: 'Campaign roll critical result.',
      success: 'Campaign roll success.',
      partial: 'Campaign roll partial success.',
      failure: 'Campaign roll failure.',
    },
  }

  return descriptions[rollType]?.[outcome] ?? ''
}

const actorFromLegacy = (payload: any): RollActor => {
  if (payload?.actor && typeof payload.actor === 'object') {
    return {
      member_id: String(payload.actor.member_id ?? ''),
      name: String(payload.actor.name ?? 'Unknown'),
      role: payload.actor.role ? String(payload.actor.role) : undefined,
    }
  }

  return {
    member_id: String(payload.player_id ?? payload.actor_id ?? ''),
    name: String(payload.player_name ?? payload.player ?? 'Unknown'),
    role: payload.player_role ? String(payload.player_role) : undefined,
  }
}

const extractBaseRoll = (payload: any): Omit<RollContent, 'roll_type'> & { roll_type: string } => {
  const dice_pool = typeof payload.dice_pool === 'number'
    ? payload.dice_pool
    : typeof payload.dice_count === 'number'
      ? payload.dice_count
      : 0

  return {
    roll_type: String(payload.roll_type ?? payload.type ?? 'campaign'),
    dice_pool,
    results: isNumberArray(payload.results) ? payload.results : [],
    actor: actorFromLegacy(payload),
    note: typeof payload.note === 'string' ? payload.note : undefined,
  }
}

export const normalizeRollContent = (payload: any): RollContent => {
  const normalizedBase = extractBaseRoll(payload)
  const rollType = normalizedBase.roll_type as RollContent['roll_type']

  switch (rollType) {
    case 'action':
      return {
        ...normalizedBase,
        roll_type: 'action',
        action: payload.action ?? null,
        position: payload.position ?? 'controlled',
        effect: payload.effect ?? 'standard',
      } as ActionRollContent
    case 'resistance':
      return {
        ...normalizedBase,
        roll_type: 'resistance',
        attribute: payload.attribute ?? payload.resistance_attribute ?? 'insight',
      } as ResistanceRollContent
    case 'fortune':
      return {
        ...normalizedBase,
        roll_type: 'fortune',
        context: typeof payload.context === 'string' ? payload.context : undefined,
      } as FortuneRollContent
    case 'engagement':
      return {
        ...normalizedBase,
        roll_type: 'engagement',
        mission_id: typeof payload.mission_id === 'string' ? payload.mission_id : undefined,
      } as EngagementRollContent
    case 'campaign':
      return {
        ...normalizedBase,
        roll_type: 'campaign',
        campaign_roll_type: typeof payload.campaign_roll_type === 'string'
          ? payload.campaign_roll_type
          : String(payload.campaign_roll_type ?? payload.roll_type ?? 'generic'),
      } as CampaignRollContent
    default:
      return {
        ...normalizedBase,
        roll_type: 'campaign',
        campaign_roll_type: typeof payload.campaign_roll_type === 'string'
          ? payload.campaign_roll_type
          : String(payload.roll_type ?? payload.type ?? 'generic'),
      } as CampaignRollContent
  }
}

export const prepareRollMessageContent = (payload: any): RollContent => normalizeRollContent(payload)
