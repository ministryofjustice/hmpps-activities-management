import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import TimeSlot from '../../../enum/timeSlot'
import { getAttendanceSummary, toDate } from '../../../utils/utils'

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    if (req.query.date === undefined || req.query.slot === undefined) {
      return res.redirect('select-period')
    }

    const date = toDate(req.query.date as string)
    const slot = req.query.slot as TimeSlot
    const { user } = res.locals

    const activitiesModel = await this.activitiesService
      .getScheduledActivitiesAtPrison(date, date, slot, user)
      .then(scheduledActivities =>
        scheduledActivities.map(activity => ({
          id: activity.id,
          name: activity.activitySchedule.activity.summary,
          location: activity.activitySchedule.internalLocation.description,
          time: `${activity.startTime} - ${activity.endTime}`,
          ...getAttendanceSummary(activity.attendances),
        }))
      )

    return res.render('pages/record-attendance/activities', { activities: activitiesModel, date, slot })
  }
}
