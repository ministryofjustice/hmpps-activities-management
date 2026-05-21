import { RequestHandler } from 'express'
import _ from 'lodash'
import createHttpError from 'http-errors'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { formatFirstLastName } from '../../../../utils/utils'
import logger from '../../../../../logger'

export default (prisonService: PrisonService, activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    if (req.session.suspendJourney) return next()

    const allocationIds = (req.query.allocationIds as string)?.split(',')
    const { prisonerNumber } = req.params as { prisonerNumber: string }
    const { mode } = req.routeContext
    const { user } = res.locals

    if (!allocationIds) return res.redirect(req.get('Referrer') || '/')

    const allocations = await activitiesService
      .getActivePrisonPrisonerAllocations([prisonerNumber], user)
      .then(r => r.flatMap(a => a.allocations))
      .then(r => r.filter(a => allocationIds.includes(a.id.toString())))

    if (allocations.length !== allocationIds.length) {
      const missingIds = allocationIds.filter(id => !allocations.map(a => a.id).includes(Number(id)))
      logger.error(`Allocation was not found for prisoner number ${prisonerNumber} and IDs: ${missingIds.join()}`)
      return next(createHttpError.NotFound())
    }

    const prisoner = await prisonService.getInmateByPrisonerNumber(prisonerNumber, user)

    const allocationsWithOutsideData = await Promise.all(
      allocations
        .filter(a => mode === 'unsuspend' || a.status !== 'SUSPENDED')
        .map(async allocation => {
          const activity = await activitiesService.getActivity(allocation.activityId, user)
          return { ...allocation, outsideWork: activity.outsideWork }
        }),
    )

    req.session.suspendJourney = {
      allocations: allocationsWithOutsideData.map(a => ({
        allocationId: a.id,
        activityId: a.activityId,
        activityName: a.activitySummary,
        payBand: a.prisonPayBand,
        outsideWork: a.outsideWork,
      })),
      inmate: {
        prisonerName: formatFirstLastName(prisoner.firstName, prisoner.lastName),
        prisonerNumber,
      },
      earliestAllocationEndDate: _.minBy(allocations, 'endDate')?.endDate,
    }

    return next()
  }
}
