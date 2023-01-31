import { Request, Response } from 'express'
import _ from 'lodash'
import ActivitiesService from '../../../services/activitiesService'
import { getAttendanceSummary, getTimeSlotFromTime, toDate } from '../../../utils/utils'

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const searchTerm = req.query.searchTerm as string
    const date = req.query.date ? toDate(req.query.date as string) : undefined

    if (date === undefined) {
      return res.redirect('select-period')
    }

    const activitiesModel = await this.activitiesService
      .getScheduledActivitiesAtPrison(date, user)
      .then(scheduledActivities =>
        scheduledActivities.map(activity => ({
          id: activity.id,
          name: activity.activitySchedule.activity.summary,
          scheduleName: activity.activitySchedule.description,
          location: activity.activitySchedule.internalLocation.description,
          timeSlot: getTimeSlotFromTime(activity.startTime),
          time: `${activity.startTime} - ${activity.endTime}`,
          ...getAttendanceSummary(activity.attendances),
        })),
      )
      .then(scheduledActivities => scheduledActivities.filter(a => this.nameIncludesSearchTerm(a.name, searchTerm)))
      .then(scheduledActivities => ({
        ..._.groupBy(scheduledActivities, 'timeSlot'),
        ...{ length: scheduledActivities.length },
      }))

    return res.render('pages/record-attendance/activities', { activities: activitiesModel, date, searchTerm })
  }

  private nameIncludesSearchTerm = (name: string, searchTerm: string) =>
    !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase())
}
