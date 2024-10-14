import { Request, Response } from 'express'
import { startOfDay, startOfToday } from 'date-fns'
import { Expose, Transform } from 'class-transformer'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { asString, convertToNumberArray, eventClashes, getAttendanceSummary, toDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { Attendance, AttendanceUpdateRequest, ScheduledEvent } from '../../../../@types/activitiesAPI/types'
import HasAtLeastOne from '../../../../validators/hasAtLeastOne'
import AttendanceReason from '../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import { EventType, Prisoner } from '../../../../@types/activities'

import applyCancellationDisplayRule from '../../../../utils/applyCancellationDisplayRule'
import UserService from '../../../../services/userService'
import TimeSlot from '../../../../enum/timeSlot'

export class AttendanceList {
  @Expose()
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
  @HasAtLeastOne({ message: 'Select at least one prisoner' })
  selectedAttendances: number[]
}

export interface ScheduledInstanceAttendance {
  prisoner: Prisoner
  attendance?: Attendance
  otherEvents: ScheduledEvent[]
}

export default class AttendanceListRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
  ) {}

  private RELEVANT_ALERT_CODES = ['HA', 'XA', 'RCON', 'XEL', 'RNO121', 'PEEP', 'XRF', 'XSA', 'XTACT']

  GET = async (req: Request, res: Response): Promise<void> => {
    const instanceId = +req.params.id
    const { user } = res.locals

    let attendance: ScheduledInstanceAttendance[] = []

    const instance = await this.activitiesService.getScheduledActivity(instanceId, user).then(i => ({
      ...i,
      isAmendable: startOfDay(toDate(i.date)) >= startOfToday(),
    }))

    const prisonerNumbers = (await this.activitiesService.getAttendees(instanceId, user)).map(a => a.prisonerNumber)

    if (prisonerNumbers.length > 0) {
      const [attendees, otherEvents] = await Promise.all([
        this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
        this.activitiesService.getScheduledEventsForPrisoners(toDate(instance.date), prisonerNumbers, user),
      ])

      const allEvents = [
        ...otherEvents.activities,
        ...otherEvents.appointments,
        ...otherEvents.courtHearings,
        ...otherEvents.visits,
        ...otherEvents.adjudications,
      ]

      attendance = attendees.map(att => {
        const prisonerEvents = allEvents
          .filter(e => e.prisonerNumber === att.prisonerNumber)
          .filter(e => e.scheduledInstanceId !== instanceId)
          .filter(e => eventClashes(e, instance))
          .filter(e => e.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(e))

        const attendee = {
          ...att,
          alerts: att.alerts.filter(a => this.RELEVANT_ALERT_CODES.includes(a.alertCode)),
        }

        return {
          prisoner: attendee,
          attendance: instance.attendances.find(a => a.prisonerNumber === att.prisonerNumber),
          otherEvents: prisonerEvents,
        }
      })
    }

    const userMap = await this.userService.getUserMap([instance.cancelledBy], user)

    if (!req.session.recordAttendanceJourney) {
      req.session.recordAttendanceJourney = {}
    }

    const selectedSessions = req.session.recordAttendanceJourney?.sessionFilters
      ? Object.values(TimeSlot).filter(t => req.session.recordAttendanceJourney.sessionFilters.includes(t))
      : []

    req.session.recordAttendanceJourney.singleInstanceSelected = true

    res.render('pages/activities/record-attendance/attendance-list-single', {
      instance,
      isPayable: instance.activitySchedule.activity.paid,
      attendance,
      attendanceSummary: getAttendanceSummary(instance.attendances),
      userMap,
      selectedSessions,
    })
  }

  GET_ATTENDANCES = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { searchTerm } = req.query
    const { selectedInstanceIds } = req.session.recordAttendanceJourney

    const instances = await this.activitiesService.getScheduledActivities(
      convertToNumberArray(selectedInstanceIds),
      user,
    )

    const prisonerNumbers = _.uniq(instances.flatMap(instance => instance.attendances.map(att => att.prisonerNumber)))

    const [allAttendees, otherEvents] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
      this.activitiesService.getScheduledEventsForPrisoners(toDate(instances[0].date), prisonerNumbers, user),
    ])

    const attendanceRows = (
      await Promise.all(
        instances.map(async instance => {
          const session = instance.timeSlot

          const allEvents = [
            ...otherEvents.activities,
            ...otherEvents.appointments,
            ...otherEvents.courtHearings,
            ...otherEvents.visits,
            ...otherEvents.adjudications,
          ]

          const userMap = await this.userService.getUserMap([instance.cancelledBy], user)

          return allAttendees
            .filter(att => {
              if (!searchTerm) {
                return true
              }
              const term = asString(searchTerm).toLowerCase()

              return (
                att.firstName.toLowerCase().includes(term) ||
                att.lastName.toLowerCase().includes(term) ||
                att.prisonerNumber.toLowerCase().includes(term)
              )
            })
            .filter(att => instance.attendances.map(a => a.prisonerNumber).includes(att.prisonerNumber))
            .map(att => {
              const prisonerEvents = allEvents
                .filter(e => e.prisonerNumber === att.prisonerNumber)
                .filter(e => e.scheduledInstanceId !== instance.id)
                .filter(e => eventClashes(e, instance))
                .filter(e => e.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(e))

              return {
                instance,
                session,
                prisoner: att,
                attendance: instance.attendances.find(a => a.prisonerNumber === att.prisonerNumber),
                otherEvents: prisonerEvents,
                isAmendable: startOfDay(toDate(instance.date)) >= startOfToday(),
                userMap,
              }
            })
        }),
      )
    ).flat()

    const numActivities = _.uniq(instances.map(instance => instance.activitySchedule.activity.summary)).length

    res.render('pages/activities/record-attendance/attendance-list-multiple', {
      attendanceRows,
      numActivities,
      attendanceSummary: getAttendanceSummary(attendanceRows.flatMap(row => row.attendance)),
      selectedDate: instances[0].date,
      selectedSessions: Object.values(TimeSlot).filter(t =>
        req.session.recordAttendanceJourney.sessionFilters.includes(t),
      ),
    })
  }

  ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const instanceId = +req.params.id
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { user } = res.locals

    const instance = await this.activitiesService.getScheduledActivity(instanceId, user)
    const isPaid = instance.activitySchedule.activity.paid

    const selectedAttendanceIds: number[] = []
    selectedAttendances.forEach(selectAttendee => selectedAttendanceIds.push(Number(selectAttendee.split('-')[1])))

    const attendances = selectedAttendanceIds.map(attendance => ({
      id: +attendance,
      prisonCode: user.activeCaseLoadId,
      status: AttendanceStatus.COMPLETED,
      attendanceReason: AttendanceReason.ATTENDED,
      issuePayment: isPaid,
    }))

    await this.activitiesService.updateAttendances(attendances, user)

    const successMessage = `You've saved attendance details for ${selectedAttendances.length} ${
      selectedAttendances.length === 1 ? 'person' : 'people'
    }`

    return res.redirectWithSuccess('attendance-list', 'Attendance recorded', successMessage)
  }

  ATTENDED_MULTIPLE = async (req: Request, res: Response): Promise<void> => {
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { user } = res.locals

    const instanceIds = _.uniq(selectedAttendances.map(selectedAttendance => +selectedAttendance.split('-')[0]))

    const instances = await this.activitiesService.getScheduledActivities(instanceIds, user)

    const attendances: AttendanceUpdateRequest[] = selectedAttendances.flatMap(selectedAttendance => {
      const [instanceId, attendanceId] = selectedAttendance.split('-')

      const instance = instances.find(i => i.id === +instanceId)

      return {
        id: +attendanceId,
        prisonCode: user.activeCaseLoadId,
        status: AttendanceStatus.COMPLETED,
        attendanceReason: AttendanceReason.ATTENDED,
        issuePayment: instance.activitySchedule.activity.paid,
      }
    })

    await this.activitiesService.updateAttendances(attendances, user)

    const successMessage = `You've saved attendance details for ${selectedAttendances.length} ${
      selectedAttendances.length === 1 ? 'person' : 'people'
    }`

    return res.redirectWithSuccess('attendance-list', 'Attendance recorded', successMessage)
  }

  NOT_ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { recordAttendanceJourney } = req.session

    const ids = selectedAttendances
      .map(id => id.split('-'))
      .map(tokens => {
        return { instanceId: +tokens[0], prisonerNumber: tokens[2] }
      })

    const allInstances = await Promise.all(
      _.uniq(ids.map(id => id.instanceId)).map(instanceId =>
        this.activitiesService.getScheduledActivity(instanceId, user),
      ),
    )

    const allPrisonerNumbers = _.uniq(ids.map(id => id.prisonerNumber))

    const allEvents = await this.activitiesService
      .getScheduledEventsForPrisoners(toDate(allInstances[0].date), allPrisonerNumbers, user)
      .then(response => [
        ...response.activities,
        ...response.appointments,
        ...response.courtHearings,
        ...response.visits,
        ...response.adjudications,
      ])
      .then(events => events.filter(e => !e.cancelled))

    const allPrisoners = await this.prisonService.searchInmatesByPrisonerNumbers(allPrisonerNumbers, user)

    recordAttendanceJourney.notAttended = {
      selectedPrisoners: [],
    }

    ids.forEach(id => {
      const instance = allInstances.find(inst => inst.id === id.instanceId)

      const prisoner = allPrisoners.find(pris => pris.prisonerNumber === id.prisonerNumber)

      const otherEvents = allEvents
        .filter(event => event.prisonerNumber === prisoner.prisonerNumber)
        .filter(event => event.scheduledInstanceId !== id.instanceId)
        .filter(event => eventClashes(event, instance))

      recordAttendanceJourney.notAttended.selectedPrisoners.push({
        instanceId: instance.id,
        attendanceId: this.getAttendanceId(id.prisonerNumber, instance.attendances),
        prisonerNumber: id.prisonerNumber,
        prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
        otherEvents,
      })
    })

    if (req.session.recordAttendanceJourney.singleInstanceSelected) {
      return res.redirect('../not-attended-reason')
    }
    return res.redirect('not-attended-reason')
  }

  private getAttendanceId = (prisonerNumber: string, attendances: Attendance[]) => {
    const attendance = attendances.find(a => a.prisonerNumber === prisonerNumber)
    return attendance.id
  }
}
