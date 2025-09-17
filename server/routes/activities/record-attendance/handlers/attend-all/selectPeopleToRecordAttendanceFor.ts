import { addDays, startOfDay, startOfToday, toDate } from 'date-fns'
import { Request, Response } from 'express'
import _ from 'lodash'
import { asString, eventClashes, formatName, getAttendanceSummary } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import { EventType } from '../../../../../@types/activities'
import applyCancellationDisplayRule from '../../../../../utils/applyCancellationDisplayRule'
import config from '../../../../../config'
import { AttendanceUpdateRequest } from '../../../../../@types/activitiesAPI/types'
import AttendanceStatus from '../../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../../enum/attendanceReason'
import { NameFormatStyle } from '../../../../../utils/helpers/nameFormatStyle'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

export default class SelectPeopleToRecordAttendanceForRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    if (req.journeyData.recordAttendanceJourney === undefined) {
      req.journeyData.recordAttendanceJourney = {}
    }
    req.journeyData.recordAttendanceJourney.returnUrl = req.originalUrl

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

    if (instances.length === 0) {
      const activity = await this.activitiesService.getActivity(activityId, user)
      return res.render('pages/activities/record-attendance/attend-all/no-activities-for-selection', {
        activity,
        isInFuture: startOfDay(activityDate) > startOfToday(),
        activityDate,
        timePeriods: timePeriodFilter,
      })
    }

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
          advancedAttendance: instance.isInFuture
            ? instance.advanceAttendances.find(a => a.prisonerNumber === att.prisonerNumber)
            : undefined,
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

    return res.redirectWithSuccess(
      'select-people-to-record-attendance-for?date=2025-09-12&timePeriods=AM,PM,ED&activityId=539',
      'Attendance recorded',
      `You've saved attendance details for ${selectedAttendances.length === 1 ? prisonerName : `${selectedAttendances.length} attendees`}`,
    )
  }

  NOT_ATTENDED = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    let { selectedAttendances }: { selectedAttendances: string[] } = req.body
    if (typeof selectedAttendances === 'string') {
      selectedAttendances = [selectedAttendances]
    }

    const { recordAttendanceJourney } = req.journeyData
    const instanceIds = _.uniq(selectedAttendances.map(selectedAttendance => +selectedAttendance.split('-')[0]))
    const prisonerNumbers = _.uniq(selectedAttendances.map(selectedAttendance => selectedAttendance.split('-')[2]))

    const instances = await this.activitiesService.getScheduledActivities(instanceIds, user)

    const allEvents = await this.activitiesService
      .getScheduledEventsForPrisoners(toDate(instances[0].date), prisonerNumbers, user)
      .then(response => [
        ...response.activities,
        ...response.appointments,
        ...response.courtHearings,
        ...response.visits,
        ...response.adjudications,
      ])
      .then(events => events.filter(e => !e.cancelled))

    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    recordAttendanceJourney.notAttended = {
      selectedPrisoners: [],
    }

    selectedAttendances.forEach(selectedAttendance => {
      const [instanceId, attendanceId, prisonerNumber] = selectedAttendance.split('-')

      const instance = instances.find(inst => inst.id === +instanceId)
      const prisoner = prisoners.find(pris => pris.prisonerNumber === prisonerNumber)

      const otherEvents = allEvents.filter(
        event =>
          event.prisonerNumber === prisoner.prisonerNumber &&
          event.scheduledInstanceId !== +instanceId &&
          eventClashes(event, instance),
      )

      recordAttendanceJourney.notAttended.selectedPrisoners.push({
        instanceId: +instanceId,
        attendanceId: +attendanceId,
        prisonerNumber,
        prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        otherEvents,
      })
    })

    return res.redirect('../activities/not-attended-reason')
  }

  NOT_REQUIRED_OR_EXCUSED = async (req: Request, res: Response): Promise<void> => {
    return res.redirect('not-required-or-excused/paid-or-not')
  }
}
