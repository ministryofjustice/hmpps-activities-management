import { RequestHandler } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { asString, convertToTitleCase, getScheduleIdFromActivity } from '../../../../utils/utils'
import findNextSchedulesInstance from '../../../../utils/helpers/nextScheduledInstanceCalculator'
import { AllocateToActivityJourney } from '../journey'

export default (prisonService: PrisonService, activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { mode, allocationId } = req.params
    const allocationIds = req.query.allocationIds !== undefined ? asString(req.query.allocationIds).split(',') : []
    const { scheduleId, selectActivity, otherAllocationIds } = req.query
    const { user } = res.locals

    if ((mode !== 'remove' && mode !== 'edit' && mode !== 'exclude') || req.session.allocateJourney) return next()

    if (!scheduleId && !allocationId && !selectActivity) return res.redirect('back')

    if (selectActivity) {
      const otherAllocationIdsList = otherAllocationIds.toString().split(',')
      const otherAllocations = await Promise.all(
        otherAllocationIdsList.map(id => activitiesService.getAllocation(+id, user)),
      )
      const inmate = await prisonService.getInmateByPrisonerNumber(otherAllocations[0].prisonerNumber, user)
      const inmateDetails = {
        prisonerNumber: inmate.prisonerNumber,
        prisonerName: convertToTitleCase(`${inmate.firstName} ${inmate.lastName}`),
        prisonCode: inmate.prisonId,
        status: inmate.status,
        cellLocation: inmate.cellLocation,
      }
      req.session.allocateJourney = {
        inmate: inmateDetails,
        inmates: [inmateDetails],
        otherAllocations,
      } as AllocateToActivityJourney
      return next()
    }

    const allocations = allocationId
      ? [await activitiesService.getAllocation(+allocationId, user)]
      : await activitiesService
          .getAllocations(+scheduleId, user)
          .then(r => r.filter(a => allocationIds.includes(a.id.toString())))
          .then(r => r.sort((a, b) => (a.startDate < b.startDate ? -1 : 1)))

    if (allocations.length === 0) return res.redirect('back')

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
        prisonCode: p.prisonId,
        status: p.status,
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
      scheduledInstance: findNextSchedulesInstance(activity.schedules[0]),
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
