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
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
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

  private RELEVANT_ALERT_CODES = ['HA', 'XA', 'RCON', 'XEL', 'RNO121', 'PEEP', 'XRF', 'XSA', 'XTACT']

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
    const hasAttendees = prisonerNumbers.length > 0

    const [userMap, attendees, otherEvents] = await Promise.all([
      this.userService.getUserMap([instance.cancelledBy], user),
      hasAttendees ? this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user) : [],
      hasAttendees
        ? this.activitiesService.getScheduledEventsForPrisoners(toDate(instance.date), prisonerNumbers, user)
        : undefined,
    ])

    const allEvents = otherEvents ? flattenPrisonerScheduledEvents(otherEvents) : []

    const attendance: ScheduledInstanceAttendance[] = attendees.map(attendee => ({
      prisoner: {
        ...attendee,
        alerts: attendee.alerts.filter(alert => this.RELEVANT_ALERT_CODES.includes(alert.alertCode)),
      },
      attendance: instance.attendances.find(a => a.prisonerNumber === attendee.prisonerNumber),
      advancedAttendance: instance.isInFuture
        ? instance.advanceAttendances.find(a => a.prisonerNumber === attendee.prisonerNumber)
        : undefined,
      otherEvents: allEvents
        .filter(event => event.prisonerNumber === attendee.prisonerNumber)
        .filter(event => event.scheduledInstanceId !== instanceId)
        .filter(event => eventClashes(event, instance))
        .filter(event => event.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(event)),
    }))

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

    const cancelledByUserIds = _.uniq(instances.map(instance => instance.cancelledBy).filter(Boolean))

    const [allAttendees, otherEvents, userMap] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
      this.activitiesService.getScheduledEventsForPrisoners(toDate(instances[0].date), prisonerNumbers, user),
      this.userService.getUserMap(cancelledByUserIds, user),
    ])

    const allEvents = flattenPrisonerScheduledEvents(otherEvents)

    const searchedAttendees = searchTerm
      ? allAttendees.filter(attendee => this.filterForTerm(attendee, asString(searchTerm).toLowerCase()))
      : allAttendees

    const attendanceRows = instances.flatMap(instance => {
      const attendeeNumbers = new Set(instance.attendances.map(attendance => attendance.prisonerNumber))

      return searchedAttendees
        .filter(attendee => attendeeNumbers.has(attendee.prisonerNumber))
        .map(attendee => ({
          instance,
          session: instance.timeSlot,
          prisoner: attendee,
          attendance: instance.attendances.find(attendance => attendance.prisonerNumber === attendee.prisonerNumber),
          otherEvents: allEvents
            .filter(event => event.prisonerNumber === attendee.prisonerNumber)
            .filter(event => event.scheduledInstanceId !== instance.id)
            .filter(event => eventClashes(event, instance))
            .filter(event => event.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(event)),
          isAmendable: startOfDay(toDate(instance.date)) >= startOfToday(),
          userMap,
        }))
    })

    const locationName = locationTypeFilter === 'OUT_OF_CELL' ? getLocationName(instances) : undefined

    const numActivities = _.uniq(instances.map(instance => instance.activitySchedule.activity.summary)).length

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
    let prisonerName

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

    if (selectedAttendances.length === 1) {
      const selectedPrisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(
        selectedAttendances[0].split('-')[2],
        user,
      )
      prisonerName = formatName(
        selectedPrisoner.firstName,
        undefined,
        selectedPrisoner.lastName,
        NameFormatStyle.firstLast,
        false,
      )
    }

    const successMessage = `You've saved attendance details for ${
      selectedAttendances.length === 1 ? prisonerName : `${selectedAttendances.length} attendees`
    }`

    return res.redirectWithSuccess('attendance-list', 'Attendance recorded', successMessage)
  }

  ATTENDED_MULTIPLE = async (req: Request, res: Response): Promise<void> => {
    const { selectedAttendances }: { selectedAttendances: string[] } = req.body
    const { user } = res.locals
    let prisonerName

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

    if (selectedAttendances.length === 1) {
      const selectedPrisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(
        selectedAttendances[0].split('-')[2],
        user,
      )
      prisonerName = formatName(
        selectedPrisoner.firstName,
        undefined,
        selectedPrisoner.lastName,
        NameFormatStyle.firstLast,
        false,
      )
    }

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

    const selectedPrisoners = ids.map(id => {
      const instance = allInstances.find(inst => inst.id === id.instanceId)
      const prisoner = allPrisoners.find(pris => pris.prisonerNumber === id.prisonerNumber)
      const attendance = instance?.attendances.find(a => a.prisonerNumber === id.prisonerNumber)

      if (!instance || !prisoner || !attendance) return null

      const otherEvents = allEvents
        .filter(event => event.prisonerNumber === prisoner.prisonerNumber)
        .filter(event => event.scheduledInstanceId !== id.instanceId)
        .filter(event => eventClashes(event, instance))

      return {
        instanceId: instance.id,
        attendanceId: attendance.id,
        prisonerNumber: id.prisonerNumber,
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

    if (req.journeyData.recordAttendanceJourney.singleInstanceSelected) {
      return res.redirect('../not-attended-reason')
    }
    return res.redirect('not-attended-reason')
  }

  NOT_REQUIRED_OR_EXCUSED = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { recordAttendanceJourney } = req.journeyData
    const instanceId = +req.params.id

    const prisonerNumbers = req.body.selectedAttendances.map(id => id.split('-')).map(tokens => tokens[2])

    const instance = await this.activitiesService.getScheduledActivity(instanceId, user)
    const allPrisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    recordAttendanceJourney.notRequiredOrExcused = {
      selectedPrisoners: allPrisoners.map(prisoner => ({
        instanceId: instance.id,
        prisonerNumber: prisoner.prisonerNumber,
        prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
      })),
    }

    if (!instance.activitySchedule.activity.paid) {
      req.journeyData.recordAttendanceJourney.notRequiredOrExcused.isPaid = false
      return res.redirect('not-required-or-excused/check-and-confirm')
    }

    return res.redirect('not-required-or-excused/paid-or-not')
  }

  private filterForTerm = (att, term) =>
    att.firstName.toLowerCase().includes(term) ||
    att.lastName.toLowerCase().includes(term) ||
    att.prisonerNumber.toLowerCase().includes(term)
}

function getLocationName(instances) {
  const locations = _.uniq(instances.map(instance => instance.activitySchedule.internalLocation?.description))

  return locations.length === 1 ? locations[0] : undefined
}
