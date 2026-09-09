import { Request, Response } from 'express'
import { startOfDay, startOfToday } from 'date-fns'
import { Expose, Transform } from 'class-transformer'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import {
  asString,
  convertToNumberArray,
  eventClashes,
  getAttendanceSummary,
  toDate,
  formatName,
  getAdvancedAttendanceSummary,
} from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import {
  AdvanceAttendance,
  Attendance,
  AttendanceUpdateRequest,
  ScheduledEvent,
} from '../../../../@types/activitiesAPI/types'
import HasAtLeastOne from '../../../../validators/hasAtLeastOne'
import AttendanceReason from '../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import { EventType, Prisoner } from '../../../../@types/activities'
import { NameFormatStyle } from '../../../../utils/helpers/nameFormatStyle'
import applyCancellationDisplayRule from '../../../../utils/applyCancellationDisplayRule'
import UserService from '../../../../services/userService'
import TimeSlot from '../../../../enum/timeSlot'
import {
  flattenPrisonerScheduledEvents,
  getPrisonerNumbersFromScheduledActivities,
} from '../utils/recordAttendanceUtils'

export class AttendanceList {
  @Expose()
  @Transform(({ value }) => [value].flat())
  @HasAtLeastOne({ message: 'Select at least one prisoner' })
  selectedAttendances: number[]
}

export interface ScheduledInstanceAttendance {
  prisoner: Prisoner
  attendance?: Attendance
  advancedAttendance?: AdvanceAttendance
  otherEvents: ScheduledEvent[]
}

export default class AttendanceListRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
  ) {}

  private readonly RELEVANT_ALERT_CODES = ['HA', 'XA', 'RCON', 'XEL', 'RNO121', 'PEEP', 'XRF', 'XSA', 'XTACT']

  GET = async (req: Request, res: Response): Promise<void> => {
    const instanceId = +req.params.id
    const { user } = res.locals

    const [scheduledActivity, instanceAttendees] = await Promise.all([
      this.activitiesService.getScheduledActivity(instanceId, user),
      this.activitiesService.getAttendees(instanceId, user),
    ])

    const instance = {
      ...scheduledActivity,
      isAmendable: startOfDay(toDate(scheduledActivity.date)) >= startOfToday(),
      isInFuture: startOfDay(toDate(scheduledActivity.date)) > startOfToday(),
    }

    const prisonerNumbers = instanceAttendees.map(attendee => attendee.prisonerNumber)

    let attendance: ScheduledInstanceAttendance[] = []
    let userMap

    if (prisonerNumbers.length > 0) {
      const [attendees, otherEvents, users] = await Promise.all([
        this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
        this.activitiesService.getScheduledEventsForPrisoners(toDate(instance.date), prisonerNumbers, user),
        this.userService.getUserMap([instance.cancelledBy], user),
      ])

      userMap = users

      const eventsByPrisoner = _.groupBy(flattenPrisonerScheduledEvents(otherEvents), 'prisonerNumber')

      attendance = attendees.map(attendee => {
        const prisonerEvents = (eventsByPrisoner[attendee.prisonerNumber] ?? [])
          .filter(event => event.scheduledInstanceId !== instanceId)
          .filter(event => eventClashes(event, instance))
          .filter(event => event.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(event))

        return {
          prisoner: {
            ...attendee,
            alerts: attendee.alerts.filter(alert => this.RELEVANT_ALERT_CODES.includes(alert.alertCode)),
          },
          attendance: instance.attendances.find(a => a.prisonerNumber === attendee.prisonerNumber),
          advancedAttendance: instance.isInFuture
            ? instance.advanceAttendances.find(a => a.prisonerNumber === attendee.prisonerNumber)
            : undefined,
          otherEvents: prisonerEvents,
        }
      })
    } else {
      userMap = await this.userService.getUserMap([instance.cancelledBy], user)
    }

    req.journeyData.recordAttendanceJourney ??= {}

    const selectedSessions = req.journeyData.recordAttendanceJourney.sessionFilters
      ? Object.values(TimeSlot).filter(timeSlot =>
          req.journeyData.recordAttendanceJourney.sessionFilters.includes(timeSlot),
        )
      : []

    req.journeyData.recordAttendanceJourney.singleInstanceSelected = true

    const summary = instance.isInFuture
      ? getAdvancedAttendanceSummary(instance.attendances, instance.advanceAttendances, attendance.length)
      : getAttendanceSummary(instance.attendances)

    res.render('pages/activities/record-attendance/attendance-list-single', {
      instance,
      isPayable: instance.activitySchedule.activity.paid,
      attendance,
      attendanceSummary: summary,
      userMap,
      selectedSessions,
    })
  }

  GET_ATTENDANCES = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { searchTerm } = req.query
    const { selectedInstanceIds, locationTypeFilter, returnUrl, sessionFilters } =
      req.journeyData.recordAttendanceJourney

    const instances = await this.activitiesService.getScheduledActivities(
      convertToNumberArray(selectedInstanceIds),
      user,
    )

    const prisonerNumbers = getPrisonerNumbersFromScheduledActivities(instances)

    const cancelledByUserIds = _.uniq(
      instances.map(instance => instance.cancelledBy).filter((userId): userId is string => Boolean(userId)),
    )

    const [allAttendees, otherEvents, userMap] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
      this.activitiesService.getScheduledEventsForPrisoners(toDate(instances[0].date), prisonerNumbers, user),
      this.userService.getUserMap(cancelledByUserIds, user),
    ])

    const eventsByPrisoner = _.groupBy(flattenPrisonerScheduledEvents(otherEvents), 'prisonerNumber')

    const searchedAttendees = searchTerm
      ? allAttendees.filter(attendee => this.filterForTerm(attendee, asString(searchTerm).toLowerCase()))
      : allAttendees

    const attendanceRows = instances.flatMap(instance => {
      const attendancesByPrisoner = new Map(
        instance.attendances.map(attendance => [attendance.prisonerNumber, attendance]),
      )

      return searchedAttendees
        .filter(attendee => attendancesByPrisoner.has(attendee.prisonerNumber))
        .map(attendee => ({
          instance,
          session: instance.timeSlot,
          prisoner: attendee,
          attendance: attendancesByPrisoner.get(attendee.prisonerNumber),
          otherEvents: (eventsByPrisoner[attendee.prisonerNumber] ?? [])
            .filter(event => event.scheduledInstanceId !== instance.id)
            .filter(event => eventClashes(event, instance))
            .filter(event => event.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(event)),
          isAmendable: startOfDay(toDate(instance.date)) >= startOfToday(),
          userMap,
        }))
    })

    let locationName

    if (locationTypeFilter === 'OUT_OF_CELL') {
      const locations = _.uniq(instances.map(instance => instance.activitySchedule.internalLocation?.description))
      locationName = locations.length === 1 ? locations[0] : undefined
    }

    const numActivities = new Set(instances.map(instance => instance.activitySchedule.activity.summary)).size

    res.render('pages/activities/record-attendance/attendance-list-multiple', {
      attendanceRows,
      numActivities,
      attendanceSummary: getAttendanceSummary(attendanceRows.flatMap(row => row.attendance)),
      selectedDate: instances[0].date,
      selectedSessions: Object.values(TimeSlot).filter(timeSlot => sessionFilters.includes(timeSlot)),
      locationName,
      returnUrl,
    })
  }

  ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const instanceId = +req.params.id
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { user } = res.locals

    const instance = await this.activitiesService.getScheduledActivity(instanceId, user)

    const attendances = selectedAttendances.map(selectedAttendance => ({
      id: Number(selectedAttendance.split('-')[1]),
      prisonCode: user.activeCaseLoadId,
      status: AttendanceStatus.COMPLETED,
      attendanceReason: AttendanceReason.ATTENDED,
      issuePayment: instance.activitySchedule.activity.paid,
    }))

    const selectedPrisonerPromise =
      selectedAttendances.length === 1
        ? this.prisonService.getInmateByPrisonerNumber(selectedAttendances[0].split('-')[2], user)
        : Promise.resolve(undefined)

    const [, selectedPrisoner] = await Promise.all([
      this.activitiesService.updateAttendances(attendances, user),
      selectedPrisonerPromise,
    ])

    const prisonerName = selectedPrisoner ? this.formatPrisonerName(selectedPrisoner) : undefined

    const successMessage = `You've saved attendance details for ${
      selectedAttendances.length === 1 ? prisonerName : `${selectedAttendances.length} attendees`
    }`

    return res.redirectWithSuccess('attendance-list', 'Attendance recorded', successMessage)
  }

  ATTENDED_MULTIPLE = async (req: Request, res: Response): Promise<void> => {
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { user } = res.locals

    const instanceIds = _.uniq(selectedAttendances.map(selectedAttendance => +selectedAttendance.split('-')[0]))

    const instances = await this.activitiesService.getScheduledActivities(instanceIds, user)

    const instancesById = new Map(instances.map(instance => [instance.id, instance]))

    const attendances: AttendanceUpdateRequest[] = selectedAttendances.map(selectedAttendance => {
      const [instanceId, attendanceId] = selectedAttendance.split('-')
      const instance = instancesById.get(+instanceId)

      return {
        id: +attendanceId,
        prisonCode: user.activeCaseLoadId,
        status: AttendanceStatus.COMPLETED,
        attendanceReason: AttendanceReason.ATTENDED,
        issuePayment: instance.activitySchedule.activity.paid,
      }
    })

    const selectedPrisonerPromise =
      selectedAttendances.length === 1
        ? this.prisonService.getInmateByPrisonerNumber(selectedAttendances[0].split('-')[2], user)
        : Promise.resolve(undefined)

    const [, selectedPrisoner] = await Promise.all([
      this.activitiesService.updateAttendances(attendances, user),
      selectedPrisonerPromise,
    ])

    const prisonerName = selectedPrisoner ? this.formatPrisonerName(selectedPrisoner) : undefined

    const successMessage = `You've saved attendance details for ${
      selectedAttendances.length === 1 ? prisonerName : `${selectedAttendances.length} attendees`
    }`

    const returnUrl = req.journeyData.recordAttendanceJourney?.returnUrl ?? 'attendance-list'

    return res.redirectWithSuccess(returnUrl, 'Attendance recorded', successMessage)
  }

  NOT_ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { recordAttendanceJourney } = req.journeyData

    const ids = selectedAttendances.map(id => {
      const [instanceId, , prisonerNumber] = id.split('-')

      return {
        instanceId: +instanceId,
        prisonerNumber,
      }
    })

    const instanceIds = _.uniq(ids.map(id => id.instanceId))
    const prisonerNumbers = _.uniq(ids.map(id => id.prisonerNumber))

    const allInstances = await this.activitiesService.getScheduledActivities(instanceIds, user)

    const [scheduledEvents, allPrisoners] = await Promise.all([
      this.activitiesService.getScheduledEventsForPrisoners(toDate(allInstances[0].date), prisonerNumbers, user),
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
    ])

    const instancesById = new Map(allInstances.map(instance => [instance.id, instance]))
    const prisonersByNumber = new Map(allPrisoners.map(prisoner => [prisoner.prisonerNumber, prisoner]))

    const eventsByPrisoner = _.groupBy(
      flattenPrisonerScheduledEvents(scheduledEvents).filter(event => !event.cancelled),
      'prisonerNumber',
    )

    const selectedPrisoners = ids.map(({ instanceId, prisonerNumber }) => {
      const instance = instancesById.get(instanceId)
      const prisoner = prisonersByNumber.get(prisonerNumber)
      const attendance = instance?.attendances.find(a => a.prisonerNumber === prisonerNumber)

      if (!instance || !prisoner || !attendance) {
        return null
      }

      const otherEvents = (eventsByPrisoner[prisonerNumber] ?? [])
        .filter(event => event.scheduledInstanceId !== instanceId)
        .filter(event => eventClashes(event, instance))

      return {
        instanceId,
        attendanceId: attendance.id,
        prisonerNumber,
        prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        otherEvents,
      }
    })

    if (selectedPrisoners.some(prisoner => !prisoner)) {
      delete recordAttendanceJourney.notAttended
      return res.redirect('/activities/attendance')
    }

    recordAttendanceJourney.notAttended = { selectedPrisoners }

    if (recordAttendanceJourney.singleInstanceSelected) {
      return res.redirect('../not-attended-reason')
    }

    return res.redirect('not-attended-reason')
  }

  NOT_REQUIRED_OR_EXCUSED = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { recordAttendanceJourney } = req.journeyData
    const instanceId = +req.params.id

    const prisonerNumbers = req.body.selectedAttendances.map(id => id.split('-')[2])

    const [instance, allPrisoners] = await Promise.all([
      this.activitiesService.getScheduledActivity(instanceId, user),
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
    ])

    recordAttendanceJourney.notRequiredOrExcused = {
      selectedPrisoners: allPrisoners.map(prisoner => ({
        instanceId: instance.id,
        prisonerNumber: prisoner.prisonerNumber,
        prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
      })),
    }

    if (!instance.activitySchedule.activity.paid) {
      recordAttendanceJourney.notRequiredOrExcused.isPaid = false
      return res.redirect('not-required-or-excused/check-and-confirm')
    }

    return res.redirect('not-required-or-excused/paid-or-not')
  }

  private filterForTerm = (attendee: Prisoner, term: string) =>
    attendee.firstName.toLowerCase().includes(term) ||
    attendee.lastName.toLowerCase().includes(term) ||
    attendee.prisonerNumber.toLowerCase().includes(term)

  private formatPrisonerName = (prisoner: Prisoner) =>
    formatName(prisoner.firstName, undefined, prisoner.lastName, NameFormatStyle.firstLast, false)
}
