enum EventTier {
  TIER_1 = 'TIER_1',
  TIER_2 = 'TIER_2',
  FOUNDATION = 'FOUNDATION',
}

export const eventTierDescriptions = {
  [EventTier.TIER_1]: 'Tier 1',
  [EventTier.TIER_2]: 'Tier 2',
  [EventTier.FOUNDATION]: 'Routine activities also called "Foundation"',
}

export default EventTier
