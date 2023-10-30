enum ActivityTier {
  TIER_1 = 1,
  TIER_2 = 2,
  FOUNDATION = 3,
}

export const activityTierDescriptions = {
  [ActivityTier.TIER_1]: 'Tier 1',
  [ActivityTier.TIER_2]: 'Tier 2',
  [ActivityTier.FOUNDATION]: 'Routine activities also called "Foundation"',
}

export default ActivityTier
