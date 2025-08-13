import { RequestHandler } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { mapActivityModelSlotsToJourney } from '../../../../utils/utils'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { activityId } = req.params
    const { mode } = req.routeContext

    if (mode !== 'edit' || activityId === req.journeyData.createJourney?.activityId?.toString()) return next()

    const activity = await activitiesService.getActivity(+activityId, res.locals.user)
    const schedule = activity.schedules[0]
    const allocations = activity.schedules
      .flatMap(s => s.allocations.filter(a => a.status !== 'ENDED'))
      .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))

    req.journeyData.createJourney = {
      activityId: activity.id,
      scheduleId: schedule.id,
      category: activity.category,
      tierCode: activity.tier?.code,
      organiserCode: activity.organiser?.code,
      name: activity.summary,
      inCell: activity.inCell,
      onWing: activity.onWing,
      offWing: activity.offWing,
      riskLevel: activity.riskLevel,
      startDate: activity.startDate,
      endDate: activity.endDate,
      scheduleWeeks: schedule.scheduleWeeks,
      slots: mapActivityModelSlotsToJourney(schedule.slots),
      runsOnBankHoliday: schedule.runsOnBankHoliday,
      currentCapacity: schedule.capacity,
      capacity: schedule.capacity,
      allocations,
      attendanceRequired: activity.attendanceRequired,
      paid: activity.paid,
      pay: activity.pay,
      educationLevels: activity.minimumEducationLevel,
    }

    if (schedule.internalLocation) {
      req.journeyData.createJourney.location = {
        id: schedule.internalLocation.dpsLocationId,
        name: schedule.internalLocation.description,
      }
    }

    if (allocations.length > 0) {
      req.journeyData.createJourney.latestAllocationStartDate = allocations[allocations.length - 1].startDate
      req.journeyData.createJourney.earliestAllocationStartDate = allocations[0].startDate
    }

    return next()
  }
}
