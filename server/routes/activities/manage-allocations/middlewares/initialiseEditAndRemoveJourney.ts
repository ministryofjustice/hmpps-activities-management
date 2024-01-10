import { RequestHandler } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { convertToTitleCase, getScheduleIdFromActivity } from '../../../../utils/utils'

export default (prisonService: PrisonService, activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { mode, allocationId } = req.params
    const allocationIds = req.query.allocationIds as string[]
    const { scheduleId } = req.query
    const { user } = res.locals

    if ((mode !== 'remove' && mode !== 'edit' && mode !== 'exclude') || req.session.allocateJourney) return next()

    if (!scheduleId && !allocationId) return res.redirect('back')

    const allocations = allocationId
      ? [await activitiesService.getAllocation(+allocationId, user)]
      : await activitiesService
          .getAllocations(+scheduleId, user)
          .then(r => r.filter(a => allocationIds.includes(a.id.toString())))
          .then(r => r.sort((a, b) => (a.startDate < b.startDate ? -1 : 1)))

    const [prisoners, activity]: [Prisoner[], Activity] = await Promise.all([
      prisonService.searchInmatesByPrisonerNumbers(
        allocations.map(a => a.prisonerNumber),
        user,
      ),
      activitiesService.getActivity(allocations[0].activityId, user),
    ])

    const inmates = prisoners.map(p => {
      const activityPay = activity.pay.filter(pay => pay.incentiveLevel === p.currentIncentive?.level?.description)
      const payBand = allocations.find(a => a.prisonerNumber === p.prisonerNumber).prisonPayBand

      return {
        prisonerName: convertToTitleCase(`${p.firstName} ${p.lastName}`),
        prisonerNumber: p.prisonerNumber,
        cellLocation: p.cellLocation,
        incentiveLevel: p.currentIncentive?.level?.description,
        payBand: payBand
          ? {
              id: payBand.id,
              alias: payBand.alias,
              rate: activityPay?.find(pay => pay.prisonPayBand.id === payBand.id)?.rate,
            }
          : null,
      }
    })

    req.session.allocateJourney = {
      inmate: inmates[0],
      inmates,
      activity: {
        activityId: activity.id,
        scheduleId: getScheduleIdFromActivity(activity),
        name: activity.summary,
        startDate: activity.startDate,
        endDate: activity.endDate,
        scheduleWeeks: activity.schedules[0].scheduleWeeks,
        location: activity.schedules[0].internalLocation?.description,
        inCell: activity.inCell,
        onWing: activity.onWing,
        offWing: activity.offWing,
      },
      latestAllocationStartDate: allocations[allocations.length - 1].startDate,
      exclusions: [],
      updatedExclusions: [],
    }

    if (req.params.mode === 'edit' || req.params.mode === 'exclude') {
      req.session.allocateJourney.startDate = allocations[0].startDate
      req.session.allocateJourney.endDate = allocations[0].endDate
      req.session.allocateJourney.deallocationReason = allocations[0].plannedDeallocation?.plannedReason?.code
      req.session.allocateJourney.exclusions = allocations[0].exclusions
    }

    return next()
  }
}
