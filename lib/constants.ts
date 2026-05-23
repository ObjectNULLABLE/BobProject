export const SQUADS = [
  { key: 'ember_wolves', name: 'Ember Wolves' },
  { key: 'grinning_ravens', name: 'Grinning Ravens' },
  { key: 'star_vipers', name: 'Star Vipers' },
] as const

export type SquadKey = typeof SQUADS[number]['key']
