import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { convertToArray, convertToNumberArray, formatDate } from '../../../../../utils/utils'
import TimeSlot from '../../../../../enum/timeSlot'

export default class CancelMultipleSessionsCheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityDate, sessionFilters, selectedInstanceIds, sessionCancellationMultiple } =
      req.journeyData.recordAttendanceJourney

    const instances = await this.activitiesService.getScheduledActivities(
      convertToNumberArray(selectedInstanceIds),
      user,
    )
    const isPayable = !!instances.find(instance => instance.activitySchedule.activity.paid)
    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    const activitiesRedirectUrl = `../../activities?date=${activityDate}&sessionFilters=${sessionFiltersString}&preserveHistory=true`
    const orderedTimeSlots = Object.values(TimeSlot).filter(
      slot => !!instances.find(instance => instance.timeSlot === slot),
    )

    let selectedDateAndSlotsText = `${formatDate(activityDate, 'EEEE, d MMMM yyyy')}`
    orderedTimeSlots.forEach((slot, index) => {
      if (index === 0) {
        selectedDateAndSlotsText += ` - ${slot}`
      } else if (index < orderedTimeSlots.length - 1) {
        selectedDateAndSlotsText += `, ${slot}`
      } else {
        selectedDateAndSlotsText += ` and ${slot}`
      }
    })

    if (!req.journeyData.recordAttendanceJourney.sessionCancellationMultiple) {
      return res.redirect('/activities/attendance')
    }

    return res.render('pages/activities/record-attendance/cancel-multiple-sessions/check-answers', {
      instances,
      isPayable,
      comment: sessionCancellationMultiple.comment,
      reason: sessionCancellationMultiple.reason,
      issuePayment: sessionCancellationMultiple.issuePayment ? 'Yes' : 'No',
      activitiesRedirectUrl,
      selectedDateAndSlotsText,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityDate, sessionFilters, selectedInstanceIds, sessionCancellationMultiple } =
      req.journeyData.recordAttendanceJourney

    await this.activitiesService.cancelMultipleActivities(
      convertToNumberArray(selectedInstanceIds),
      sessionCancellationMultiple,
      user,
    )

    const sessionFiltersString = sessionFilters ? convertToArray(sessionFilters).join(',') : ''
    res.redirect(`../../activities?date=${activityDate}&sessionFilters=${sessionFiltersString}`)
  }
}
