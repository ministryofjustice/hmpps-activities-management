import { Request, Response } from 'express'
import _ from 'lodash'
import { convertToTitleCase, toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import AttendanceReason from '../../../../enum/attendanceReason'
import PrisonService from '../../../../services/prisonService'
import activityLocationDescription from '../../../../utils/activityLocationDescription'

export default class SuspendedPrisonersRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date } = req.query

    if (!date) {
      return res.redirect('select-period')
    }

    const activityDate = toDate(req.query.date as string)

    const scheduledActivities = await this.activitiesService.getScheduledActivitiesAtPrison(activityDate, user)
    const suspendedAttendances = await this.activitiesService
      .getAllAttendance(activityDate, user)
      .then(r => r.filter(a => a.attendanceReasonCode === AttendanceReason.SUSPENDED))

    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(
      _.uniq(suspendedAttendances.map(a => a.prisonerNumber)),
      user,
    )

    const uniqueCategories = _.uniq(suspendedAttendances.map(c => c.categoryName))

    // Set the default filter values if they are not set
    req.session.attendanceSummaryJourney ??= {}
    req.session.attendanceSummaryJourney.categoryFilters ??= uniqueCategories

    const { categoryFilters, searchTerm } = req.session.attendanceSummaryJourney

    const attendancesMatchingFilter = suspendedAttendances.filter(a => categoryFilters?.includes(a.categoryName))

    const suspendedAttendancesByPrisoner = Object.values(_.groupBy(attendancesMatchingFilter, 'prisonerNumber'))
      .map(attendances => {
        const prisoner = prisoners.find(p => p.prisonerNumber === attendances[0].prisonerNumber)

        return {
          prisonerNumber: prisoner.prisonerNumber,
          prisonerName: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
          status: prisoner.status,
          prisonCode: prisoner.prisonId,
          cellLocation: prisoner.cellLocation,
          sessions: _.sortBy(
            attendances.map(a => {
              const activity = scheduledActivities.find(act => act.id === a.scheduledInstanceId)

              return {
                sessionId: a.scheduledInstanceId,
                sessionSummary: a.activitySummary,
                sessionStartTime: activity.startTime,
                sessionEndTime: activity.endTime,
                sessionSlot: a.timeSlot,
                sessionLocation: activityLocationDescription(activity.activitySchedule),
              }
            }),
            'sessionStartTime',
          ),
          timeSlots: attendances.map(a => a.timeSlot),
        }
      })
      .filter(
        c =>
          this.includesSearchTerm(c.prisonerName, searchTerm) || this.includesSearchTerm(c.prisonerNumber, searchTerm),
      )

    return res.render('pages/activities/daily-attendance-summary/suspended-prisoners', {
      uniqueCategories,
      activityDate,
      suspendedAttendancesByPrisoner,
    })
  }

  private includesSearchTerm = (propertyValue: string, searchTerm: string) =>
    !searchTerm || propertyValue.toLowerCase().includes(searchTerm.toLowerCase())
}
