import { Request, Response } from 'express'
import { getPagination, PaginationRequest } from '../../../../utils/paginationUtils'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { convertToNumberArray } from '../../../../utils/utils'

const ITEMS_PER_PAGE = 10

export default class ChangeOfCircumstanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { page, date } = req.query
    const prison = user.activeCaseLoadId
    const queryDate = date as string

    // Get a page of results and call search for additional details
    const pageNo = +page || 0 // Default to the first page if not set
    const searchResults = await this.activitiesService.getChangeEvents(prison, queryDate, pageNo, ITEMS_PER_PAGE, user)
    const prisonerNumbers = searchResults.content.map(e => e.prisonerNumber)
    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    // Get the pagination settings for this list
    const totalResults = searchResults.totalElements || 0
    const currentPage = searchResults.pageNumber || 0
    const paginationReq = { totalResults, currentPage, limit: ITEMS_PER_PAGE } as PaginationRequest
    const pagination = getPagination(paginationReq, new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`))

    // Merge the page of results with the offender search response to obtain extra detail
    const changeEvents = searchResults.content.map(item => {
      const prisoner = prisoners.find(p => p.prisonerNumber === item.prisonerNumber)
      return {
        ...item,
        name: `${prisoner?.lastName}, ${prisoner?.firstName}` || '',
        cellLocation: prisoner?.cellLocation || '',
      }
    })

    // Build view context and render the results
    const viewContext = { date: queryDate, page, changeEvents, pagination }
    res.render('pages/activities/change-of-circumstances/view-events', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { date, page, selectedEvents } = req.body
    const { user } = res.locals
    const prisonCode = user.activeCaseLoadId
    const redirectPage = page || 0

    await this.activitiesService.acknowledgeChangeEvents(prisonCode, convertToNumberArray(selectedEvents), user)

    res.redirect(`view-changes?date=${date}&page=${redirectPage}`)
  }
}
