import { Request, Response } from 'express'
import { isToday, isYesterday } from 'date-fns'
import { getPagination, PaginationRequest } from '../../../../utils/paginationUtils'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { GetChangeEventsParams } from '../../../../@types/activitiesAPI/types'
import { changeFilters, readFilters } from './changeFilters'
import { convertToNumberArray } from '../../../../utils/utils'

const ITEMS_PER_PAGE = 10

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

    const searchTerm = typeof req.query.searchTerm === 'string' ? req.query.searchTerm.trim() : ''
    const selectedFilters = readFilters(req.query.changeTypes)
    const requestedPage = Number(page)
    const pageNo = Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0
    const query: GetChangeEventsParams = { date: queryDate, page: pageNo, size: ITEMS_PER_PAGE }
    if (selectedFilters.length) {
      query.eventCodes = changeFilters
        .filter(filter => selectedFilters.includes(filter.value))
        .flatMap(filter => filter.eventCodes)
    }
    if (searchTerm) query.prisonerNumbers = await this.prisonService.searchPrisonerNumbers(searchTerm, user)

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
        prisonerStatus: prisoner?.status,
        prisonerPrisonCode: prisoner?.prisonId,
        cellLocation: prisoner?.cellLocation || '',
      }
    })

    // Paagination settings for this list
    const totalResults = searchResults.totalElements || 0
    const currentPage = searchResults.pageNumber || 0
    const paginationReq = { totalResults, currentPage, limit: ITEMS_PER_PAGE } as PaginationRequest
    const pagination = getPagination(paginationReq, new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`))

    // Build view context and render the results
    const viewContext = {
      searchTerm,
      selectedFilters,
      filterItems: changeFilters.map(({ value, text }) => ({ value, text, checked: selectedFilters.includes(value) })),
      date: queryDate,
      page: pageNo,
      changeEvents,
      pagination,
      isToday: isToday(queryDate),
      isYesterday: isYesterday(queryDate),
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
