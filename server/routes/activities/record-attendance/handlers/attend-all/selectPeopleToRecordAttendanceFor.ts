import { addDays, startOfDay, startOfToday, toDate } from 'date-fns'
import { Request, Response } from 'express'
import { asString, eventClashes, getAttendanceSummary } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import { EventType } from '../../../../../@types/activities'
import applyCancellationDisplayRule from '../../../../../utils/applyCancellationDisplayRule'
import config from '../../../../../config'

export default class SelectPeopleToRecordAttendanceForRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, timePeriods } = req.query
    const { notRequiredInAdvanceEnabled } = config
    const activityId: number = parseInt(req.query.activityId as string, 10)
    const timePeriodFilter = timePeriods !== undefined ? asString(timePeriods).split(',') : null
    let attendanceRows = []

    const activityDate = date ? toDate(asString(date)) : new Date()
    if (startOfDay(activityDate) > startOfDay(addDays(new Date(), 60)))
      return res.redirect('choose-details-to-record-attendance')

    const instances = (await this.activitiesService.getScheduledActivitiesAtPrison(activityDate, user))
      .filter(
        activity =>
          timePeriodFilter?.includes(activity.timeSlot) && activity.activitySchedule.activity.id === activityId,
      )
      .map(i => ({
        ...i,
        isAmendable: startOfDay(toDate(i.date)) >= startOfToday(),
        isInFuture: notRequiredInAdvanceEnabled && startOfDay(toDate(i.date)) > startOfToday(),
      }))

    const attendees = (await Promise.all(instances.map(a => this.activitiesService.getAttendees(a.id, user)))).flat()

    const prisonerNumbers = Array.from(new Set(attendees.map(a => a.prisonerNumber)))

    if (prisonerNumbers.length > 0) {
      const [prisoners, otherEvents] = await Promise.all([
        this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
        this.activitiesService.getScheduledEventsForPrisoners(activityDate, prisonerNumbers, user),
      ])

      const allEvents = [
        ...otherEvents.activities,
        ...otherEvents.appointments,
        ...otherEvents.courtHearings,
        ...otherEvents.visits,
        ...otherEvents.adjudications,
      ]

      attendanceRows = attendees.map(att => {
        const instance = instances.find(a => a.id === att.scheduledInstanceId)
        const prisonerEvents = allEvents
          .filter(e => e.prisonerNumber === att.prisonerNumber)
          .filter(e => e.scheduledInstanceId !== instance.id)
          .filter(e => eventClashes(e, instance))
          .filter(e => e.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(e))

        return {
          prisoner: prisoners.find(p => p.prisonerNumber === att.prisonerNumber),
          instance,
          attendance: instance.attendances.find(a => a.prisonerNumber === att.prisonerNumber),
          otherEvents: prisonerEvents,
        }
      })
    }

    return res.render('pages/activities/record-attendance/attend-all/select-people-to-record-attendance-for', {
      attendanceRows,
      singleInstance: instances.length === 1,
      instance: instances.length > 0 ? instances[0] : null,
      selectedSessions: instances.map(a => a.timeSlot),
      attendanceSummary: getAttendanceSummary(
        attendanceRows.flatMap(row => row.attendance).filter(a => a !== undefined),
      ),
    })
  }

  ATTENDED = async (req: Request, res: Response): Promise<void> => {
    return res.redirectWithSuccess('attendance-list', 'Attendance recorded')
  }

  NOT_ATTENDED = async (req: Request, res: Response): Promise<void> => {
    return res.redirect('not-attended-reason')
  }

  NOT_REQUIRED_OR_EXCUSED = async (req: Request, res: Response): Promise<void> => {
    return res.redirect('not-required-or-excused/paid-or-not')
  }
}
