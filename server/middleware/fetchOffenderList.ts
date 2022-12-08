import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonService from '../services/prisonService'
import { comparePrisoners } from '../utils/utils'

export default (prisonService: PrisonService): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { data = {} } = req.session
    const { activityCandidateListCriteria = { sort: { field: 'name', direction: 'asc' } } } = data
    try {
      const result = await prisonService.getInmates(user.activeCaseLoad.caseLoadId, user)
      res.locals.offenderListPage = {
        ...result,
        content: result.content.sort(
          comparePrisoners(
            activityCandidateListCriteria.sort.field,
            activityCandidateListCriteria.sort.direction === 'desc',
          ),
        ),
      }
    } catch (error) {
      logger.error(error, `Failed to fetch offender list, prisonId: ${user.activeCaseLoad.caseLoadId}`)
      return next(error)
    }
    return next()
  }
}
