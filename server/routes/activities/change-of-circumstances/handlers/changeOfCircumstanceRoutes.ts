import { Request, Response } from 'express'
import { getPagination, PaginationRequest } from '../../../../utils/paginationUtils'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { GetChangeEventsParams } from '../../../../@types/activitiesAPI/types'
import { changeFilters, readFilters } from './changeFilters'
import { convertToNumberArray, isPrisonerNumber } from '../../../../utils/utils'

const ITEMS_PER_PAGE = 25

export default class ChangeOfCircumstanceRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { page, date } = req.query
    const prison = user.activeCaseLoadId
    const queryDate = date as string
    const reviewed = req.query.reviewed === 'true'
    const searchTerm = typeof req.query.searchTerm === 'string' ? req.query.searchTerm.trim() : ''
    const selectedFilters = readFilters(req.query.changeTypes)
    const navigationQuery = new URLSearchParams({ date: queryDate })
    if (searchTerm) navigationQuery.set('searchTerm', searchTerm)
    selectedFilters.forEach(value => navigationQuery.append('changeTypes', value))
    const changesToReviewHref = `view-changes?${navigationQuery}`
    navigationQuery.set('reviewed', 'true')
    const reviewedChangesHref = `view-changes?${navigationQuery}`
    const clearQuery = new URLSearchParams({ date: queryDate })
    if (reviewed) clearQuery.set('reviewed', 'true')
    const clearFiltersHref = `view-changes?${clearQuery}`
    const hasFilters = Boolean(searchTerm || selectedFilters.length)

    const requestedPage = Number(page)
    const pageNo = Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0
    const query: GetChangeEventsParams = {
      date: queryDate,
      page: pageNo,
      size: ITEMS_PER_PAGE,
      filterAcknowledged: reviewed,
    }
    if (selectedFilters.length) {
      query.eventCodes = changeFilters
        .filter(filter => selectedFilters.includes(filter.value))
        .flatMap(filter => filter.eventCodes)
    }
    if (searchTerm) {
      if (isPrisonerNumber(searchTerm)) {
        query.prisonerNumbers = [searchTerm.toUpperCase()]
      } else {
        const candidates = await this.activitiesService.getChangeEventPrisonerNumbers(
          prison,
          { date: queryDate, ...(query.eventCodes && { eventCodes: query.eventCodes }) },
          user,
        )
        query.prisonerNumbers = await this.prisonService.searchPrisonerNumbers(searchTerm, candidates, user)
      }
    }

    const searchResults =
      query.prisonerNumbers?.length === 0
        ? { content: [], totalElements: 0, totalPages: 0, pageNumber: 0 }
        : await this.activitiesService.getChangeEvents(prison, query, user)

    if (pageNo > 0 && pageNo >= searchResults.totalPages) {
      const redirectQuery = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`).searchParams
      redirectQuery.set('page', String(Math.max(0, searchResults.totalPages - 1)))
      res.redirect(`view-changes?${redirectQuery}`)
      return
    }

    const prisonerNumbers = searchResults.content.map(e => e.prisonerNumber)
    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    // Merge the page of results with the offender search response to obtain extra detail
    const prisonersByNumber = new Map(prisoners.map(prisoner => [prisoner.prisonerNumber, prisoner]))
    const changeEvents = searchResults.content.map(item => {
      const prisoner = prisonersByNumber.get(item.prisonerNumber)
      return {
        ...item,
        firstName: prisoner?.firstName || '',
        lastName: prisoner?.lastName || '',
        middleNames: prisoner?.middleNames || '',
        prisonerStatus: prisoner?.status,
        prisonerPrisonCode: prisoner?.prisonId,
        cellLocation: prisoner?.cellLocation || '',
      }
    })

    // Pagination settings for this list
    const totalResults = searchResults.totalElements || 0
    const currentPage = searchResults.pageNumber || 0
    const paginationReq = { totalResults, currentPage, limit: ITEMS_PER_PAGE } as PaginationRequest
    const pagination = getPagination(paginationReq, new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`))

    pagination.results.text = 'changes'

    // Build view context and render the results
    const viewContext = {
      searchTerm,
      selectedFilters,
      filterItems: changeFilters.map(({ value, text }) => ({ value, text, checked: selectedFilters.includes(value) })),
      date: queryDate,
      page: pageNo,
      changeEvents,
      pagination,
      reviewed,
      hasFilters,
      changesToReviewHref,
      reviewedChangesHref,
      clearFiltersHref,
    }
    res.render('pages/activities/change-of-circumstances/view-events', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { date, page, selectedEvents } = req.body
    const { user } = res.locals
    const prisonCode = user.activeCaseLoadId
    const redirectPage = page || 0

    await this.activitiesService.acknowledgeChangeEvents(prisonCode, convertToNumberArray(selectedEvents), user)

    const query = new URLSearchParams({ date, page: String(redirectPage) })
    if (typeof req.body.searchTerm === 'string' && req.body.searchTerm.trim()) {
      query.set('searchTerm', req.body.searchTerm.trim())
    }
    readFilters(req.body.changeTypes).forEach(value => query.append('changeTypes', value))
    res.redirect(`view-changes?${query}`)
  }
}
