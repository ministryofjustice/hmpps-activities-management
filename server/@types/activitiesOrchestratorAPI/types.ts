import { components } from '.'

export interface GetEventsForReviewParams {
  prisonCode: string
  requestDate: string
  page: number
  pageSize: number
  prisonerNumbers?: string[]
  filterAcknowledged?: boolean
  filterEventTypes?: string[]
}

export type EventReviewSearchResultsDto = components['schemas']['EventReviewSearchResultsDto']
export type EventReviewDto = components['schemas']['EventReviewDto']
