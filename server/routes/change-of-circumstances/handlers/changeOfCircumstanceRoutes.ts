import { Request, Response } from 'express'
import { getPagination, PaginationRequest } from '../../../utils/paginationUtils'
import ActivitiesService from '../../../services/activitiesService'
import { toDateString } from '../../../utils/utils'
import logger from '../../../../logger'

export default class ChangeOfCircumstanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { page, requestDate } = req.query
    const prisonCode = user.activeCaseLoadId
    const queryDate = requestDate ? requestDate as string : toDateString(new Date())

    const searchResults = await this.activitiesService.getChangeEvents(
      prisonCode,
      // queryDate,
      '2023-05-16',
      +page || 0,
      user
    )

    logger.info(`Results = ${JSON.stringify(searchResults)}`)

    const paginationArgs: PaginationRequest = {
      // totalElements: searchResults.totalElements,
      totalResults: 5,
      currentPage: searchResults.pageNumber,
      limit: 2
    }

    logger.info(`PaginationArgs = ${JSON.stringify(paginationArgs)}`)

    // TODO: Extend the response to include the totalElements found - in the API
    const pagination = getPagination(paginationArgs, new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`))

    logger.info(`Pagination = ${JSON.stringify(pagination)}`)

    const viewContext = {
      changeEvents: searchResults.content,
      pagination,
    }

    logger.info(`ViewContext = ${JSON.stringify(viewContext)}`)

    res.render('pages/change-of-circumstances/view-events', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // const { changeEventId } = req.body
    // const { user } = res.locals
    // await this.activitiesService.acknowledgeChangeEvent(changeEventId, user)
    res.redirect(req.originalUrl)
  }
}
