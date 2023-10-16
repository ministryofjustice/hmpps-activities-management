import { RequestHandler } from 'express'
import { mapActivityModelSlotsToJourney } from '../../utils/utils'
import ActivitiesService from '../../services/activitiesService'

export default (activitiesService: ActivitiesService): RequestHandler => {
  return async (req, res, next) => {
    const { mode, activityId } = req.params

    if (mode !== 'edit' || activityId === req.session.createJourney?.activityId?.toString()) return next()

    const activity = await activitiesService.getActivity(+activityId, res.locals.user)
    const schedule = activity.schedules[0]
    const allocations = activity.schedules.flatMap(s => s.allocations.filter(a => a.status !== 'ENDED'))

    req.session.createJourney = {
      activityId: activity.id,
      scheduleId: schedule.id,
      category: activity.category,
      name: activity.summary,
      inCell: activity.inCell,
      onWing: activity.onWing,
      offWing: activity.offWing,
      riskLevel: activity.riskLevel,
      startDate: activity.startDate,
      endDate: activity.endDate,
      minimumIncentiveLevel: activity.minimumIncentiveLevel,
      scheduleWeeks: schedule.scheduleWeeks,
      slots: mapActivityModelSlotsToJourney(schedule.slots),
      runsOnBankHoliday: schedule.runsOnBankHoliday,
      currentCapacity: schedule.capacity,
      capacity: schedule.capacity,
      allocations,
      pay: activity.pay,
      educationLevels: activity.minimumEducationLevel,
    }

    if (schedule.internalLocation) {
      req.session.createJourney.location = {
        id: schedule.internalLocation.id,
        name: schedule.internalLocation.description,
      }
    }

    return next()
  }
}
