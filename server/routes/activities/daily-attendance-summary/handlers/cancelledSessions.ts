import { Request, Response } from 'express'
import { getTimeSlotFromTime, toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'

export default class CancelledSessionsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date } = req.query
    const { attendanceSummaryJourney } = req.session

    if (!date) {
      return res.redirect('select-period')
    }
    const activityDate = toDate(req.query.date as string)

    const scheduledActivities = await this.activitiesService.getScheduledActivitiesAtPrison(activityDate, user)

    const unfilteredCancelledSessions = scheduledActivities.filter(a => a.cancelled)

    const cancelledSessions = unfilteredCancelledSessions
      .map(session => ({
        id: session.id,
        summary: session.activitySchedule.activity.summary,
        inCell: session.activitySchedule.activity.inCell,
        onWing: session.activitySchedule.activity.onWing,
        location: session.activitySchedule.internalLocation?.description,
        timeSlot: getTimeSlotFromTime(session.startTime).toUpperCase(),
        reason: session.cancelledReason,
        allocated: session.activitySchedule.activity.allocated,
        comment: session.comment,
      }))
      .filter(c => this.includesSearchTerm(c.summary, attendanceSummaryJourney.searchTerm))

    return res.render('pages/activities/daily-attendance-summary/cancelled-sessions', {
      activityDate,
      cancelledSessions,
    })
  }

  private includesSearchTerm = (propertyValue: string, searchTerm: string) =>
    !searchTerm || propertyValue.toLowerCase().includes(searchTerm.toLowerCase())
}
