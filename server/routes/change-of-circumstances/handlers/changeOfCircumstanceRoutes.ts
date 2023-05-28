import { Request, Response } from 'express'
import { getPagination, PaginationRequest } from '../../../utils/paginationUtils'
import ActivitiesService from '../../../services/activitiesService'
import logger from '../../../../logger'

export default class ChangeOfCircumstanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { page, date } = req.query
    const prisonCode = user.activeCaseLoadId
    const queryDate = date as string

    const searchResults = await this.activitiesService.getChangeEvents(prisonCode, queryDate, +page || 0, user)

    logger.info(`Results ${JSON.stringify(searchResults)}`)

    // TODO: Get prisoner offender search details for each row of the page

    const paginationArgs: PaginationRequest = {
      totalResults: searchResults.totalElements || 5, // TODO: Temporary until API returns this!!
      currentPage: searchResults.pageNumber,
      limit: 10,
    }
    const pagination = getPagination(paginationArgs, new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`))

    logger.info(`Pagination ${JSON.stringify(pagination)}`)

    const viewContext = { date: queryDate, page, changeEvents: searchResults.content, pagination }

    res.render('pages/change-of-circumstances/view-events', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // const { user } = res.locals
    const { date, page, selectedEvents } = req.body
    const redirectPage = page || 0

    logger.info(`POST - selected ${JSON.stringify(selectedEvents)} - date ${date} page ${redirectPage}`)

    // await this.activitiesService.acknowledgeChangeEvents(bodyList, user)

    res.redirect(`view-changes?date=${date}&page=${redirectPage}`)
  }
}
