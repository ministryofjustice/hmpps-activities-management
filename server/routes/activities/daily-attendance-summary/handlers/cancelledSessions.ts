import { Request, Response } from 'express'
import { formatDate, getTimeSlotFromTime, toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'

export default class CancelledSessionsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activityDate = req.query.date ? toDate(req.query.date as string) : undefined
    if (activityDate === undefined) {
      return res.redirect('select-period')
    }

    const { attendanceSummaryFilters } = req.session

    const scheduledActivities = await this.activitiesService.getScheduledActivitiesAtPrison(activityDate, user)

    const unfilteredCancelledSessions = scheduledActivities.filter(a => a.cancelled)

    const cancelledSessions = unfilteredCancelledSessions
      .map(session => ({
        id: session.id,
        summary: session.activitySchedule.activity.summary,
        location: session.activitySchedule.internalLocation?.description,
        timeSlot: getTimeSlotFromTime(session.startTime).toUpperCase(),
        reason: session.cancelledReason,
        allocated: session.activitySchedule.activity.allocated,
        comment: session.comment,
      }))
      .filter(c => this.includesSearchTerm(c.summary, attendanceSummaryFilters.searchTerm))

    return res.render('pages/activities/daily-attendance-summary/cancelled-sessions', {
      activityDate,
      cancelledSessions,
      attendanceSummaryFilters,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { attendanceSummaryFilters } = req.session
    const activityDate = req.query.date ? toDate(req.query.date as string) : undefined
    const isoDateString = formatDate(new Date(activityDate), 'yyyy-MM-dd')
    attendanceSummaryFilters.searchTerm = req.body?.searchTerm ? (req.body?.searchTerm as string) : ''

    res.redirect(`cancelled-sessions?date=${isoDateString}`)
  }

  private includesSearchTerm = (propertyValue: string, searchTerm: string) =>
    !searchTerm || propertyValue.toLowerCase().includes(searchTerm.toLowerCase())
}
