export const changeFilters = [
  { value: 'alerts', text: 'Alerts', eventCodes: ['prisoner-offender-search.prisoner.alerts-updated'] },
  {
    value: 'non-associations',
    text: 'Non-associations',
    eventCodes: ['prison-offender-events.prisoner.non-association-detail.changed'],
  },
  {
    value: 'cell-moves',
    text: 'Cell moves',
    eventCodes: ['prisoner-offender-search.prisoner.updated', 'prison-offender-events.prisoner.cell.move'],
  },
  {
    value: 'releases-and-transfers',
    text: 'Releases and transfers',
    eventCodes: ['prisoner-offender-search.prisoner.released'],
  },
  {
    value: 'incentive-levels',
    text: 'Incentive levels',
    eventCodes: ['incentives.iep-review.inserted', 'incentives.iep-review.updated', 'incentives.iep-review.deleted'],
  },
  {
    value: 'arrivals-and-returns',
    text: 'Arrivals and returns',
    eventCodes: ['prisoner-offender-search.prisoner.received'],
  },
]

export const readFilters = (values: unknown): string[] =>
  changeFilters
    .filter(filter => (Array.isArray(values) ? values : [values]).includes(filter.value))
    .map(filter => filter.value)
