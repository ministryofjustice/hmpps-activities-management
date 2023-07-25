import { Request, Response } from 'express'
import { startOfToday, endOfDay } from 'date-fns'
import { Expose, Transform } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import { eventClashes, getAttendanceSummary, toDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { Attendance } from '../../../../@types/activitiesAPI/types'
import HasAtLeastOne from '../../../../validators/hasAtLeastOne'
import AttendanceReason from '../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../enum/attendanceStatus'

export class AttendanceList {
  @Expose()
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
  @HasAtLeastOne({ message: 'Select at least one prisoner' })
  selectedAttendances: number[]
}

export default class AttendanceListRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  private RELEVANT_ALERT_CODES = ['HA', 'XA', 'RCON', 'XEL', 'RNO121', 'PEEP', 'XRF', 'XSA', 'XTACT']

  GET = async (req: Request, res: Response): Promise<void> => {
    const instanceId = req.params.id
    const { user } = res.locals

    const instance = await this.activitiesService.getScheduledActivity(+instanceId, user).then(i => ({
      ...i,
      isAmendable: endOfDay(toDate(i.date)) > startOfToday(),
    }))

    const prisonerNumbers = instance.attendances.map(a => a.prisonerNumber)

    const otherScheduledEvents =
      prisonerNumbers?.length > 0
        ? await this.activitiesService
            .getScheduledEventsForPrisoners(toDate(instance.date), prisonerNumbers, user)
            .then(response => [
              ...response.activities,
              ...response.appointments,
              ...response.courtHearings,
              ...response.visits,
            ])
            .then(events => events.filter(e => e.scheduledInstanceId !== +instanceId))
            .then(events => events.filter(e => eventClashes(e, instance)))
        : []

    const attendees =
      prisonerNumbers?.length > 0
        ? await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user).then(inmates =>
            inmates.map(i => ({
              name: `${i.firstName} ${i.lastName}`,
              prisonerNumber: i.prisonerNumber,
              location: i.cellLocation,
              alerts: i.alerts?.filter(a => this.RELEVANT_ALERT_CODES.includes(a.alertCode)),
              category: i.category,
              otherEvents: otherScheduledEvents.filter(e => e.prisonerNumber === i.prisonerNumber),
              attendance: instance.attendances.find(a => a.prisonerNumber === i.prisonerNumber),
            })),
          )
        : []

    return res.render('pages/activities/record-attendance/attendance-list', {
      activity: {
        name: instance.activitySchedule.activity.summary,
        location: instance.activitySchedule.internalLocation?.description,
        inCell: instance.activitySchedule.activity.inCell,
        onWing: instance.activitySchedule.activity.onWing,
        ...getAttendanceSummary(instance.attendances),
      },
      instance,
      attendees,
    })
  }

  ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { user } = res.locals

    const selectedAttendanceIds: number[] = []
    selectedAttendances.forEach(selectAttendee => selectedAttendanceIds.push(Number(selectAttendee.split('-')[0])))

    const attendances = selectedAttendanceIds.map(attendance => ({
      id: +attendance,
      prisonCode: user.activeCaseLoadId,
      status: AttendanceStatus.COMPLETED,
      attendanceReason: AttendanceReason.ATTENDED,
      issuePayment: true,
    }))

    await this.activitiesService.updateAttendances(attendances, user)

    const successMessage =
      selectedAttendances.length > 1
        ? `We've saved attendance details for ${selectedAttendances.length} prisoners`
        : `We've saved attendance details for ${selectedAttendances.length} prisoner`

    return res.redirectWithSuccess('attendance-list', 'Attendance recorded', successMessage)
  }

  NOT_ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const instanceId = req.params.id
    const { user } = res.locals
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body

    const selectedPrisoners: string[] = []
    selectedAttendances.forEach(selectAttendee => selectedPrisoners.push(selectAttendee.split('-')[1]))

    req.session.notAttendedJourney = {}
    if (!req.session.notAttendedJourney.selectedPrisoners) {
      req.session.notAttendedJourney.selectedPrisoners = []
    }

    const instance = await this.activitiesService.getScheduledActivity(+instanceId, user)

    const otherScheduledEvents = await this.activitiesService
      .getScheduledEventsForPrisoners(toDate(instance.date), selectedPrisoners, user)
      .then(response => [
        ...response.activities,
        ...response.appointments,
        ...response.courtHearings,
        ...response.visits,
      ])
      .then(events => events.filter(e => e.scheduledInstanceId !== +instanceId))
      .then(events => events.filter(e => eventClashes(e, instance)))

    const nonAttendees = await this.prisonService
      .searchInmatesByPrisonerNumbers(selectedPrisoners, user)
      .then(inmates =>
        inmates.map(i => ({
          name: `${i.firstName} ${i.lastName}`,
          prisonerNumber: i.prisonerNumber,
          location: i.cellLocation,
          otherEvents: otherScheduledEvents.filter(e => e.prisonerNumber === i.prisonerNumber),
          attendanceId: this.getAttendanceId(i.prisonerNumber, instance.attendances),
        })),
      )

    nonAttendees.forEach(nonAttendee => {
      req.session.notAttendedJourney.selectedPrisoners.push({
        attendanceId: nonAttendee.attendanceId,
        prisonerNumber: nonAttendee.prisonerNumber,
        prisonerName: nonAttendee.name,
        otherEvents: nonAttendee.otherEvents,
      })
    })

    res.redirect(`/activities/attendance/activities/${instanceId}/not-attended-reason`)
  }

  private getAttendanceId = (prisonerNumber: string, attendances: Attendance[]) => {
    const attendance = attendances.find(a => a.prisonerNumber === prisonerNumber)
    return attendance.id
  }
}
