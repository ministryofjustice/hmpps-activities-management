import { startOfDay, startOfToday, toDate } from 'date-fns'
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
import UserService from '../../../../../services/userService'
import TimeSlot from '../../../../../enum/timeSlot'

export default class SelectPeopleByResidentialLocationRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    if (req.journeyData.recordAttendanceJourney === undefined) {
      req.journeyData.recordAttendanceJourney = {}
    }
    req.journeyData.recordAttendanceJourney.returnUrl = req.originalUrl

    const { user } = res.locals
    const { date, sessionFilters, locationKey } = req.query
    const { notRequiredInAdvanceEnabled } = config

    const timePeriodFilter = sessionFilters !== undefined ? asString(sessionFilters) : null

    const activityDate = date ? toDate(asString(date)) : new Date()

    // if (startOfDay(activityDate) > startOfDay(addDays(new Date(), 60)))
    //   return res.redirect('choose-details-to-record-attendance')
    const location = await this.activitiesService
      .getLocationGroups(user)
      .then(locations => locations.find(loc => loc.key === locationKey))

    const instancesForDateAndSlot = (
      await this.activitiesService.getScheduledActivitiesAtPrisonByDateAndSlot(
        activityDate,
        user,
        timePeriodFilter as TimeSlot,
      )
    ).map(i => ({
      ...i,
      isAmendable: startOfDay(toDate(i.date)) >= startOfToday(),
      isInFuture: notRequiredInAdvanceEnabled && startOfDay(toDate(i.date)) > startOfToday(),
    }))

    const { locationPrefix } = await this.activitiesService.getPrisonLocationPrefixByGroup(
      user.activeCaseLoadId,
      locationKey as string,
      user,
    )

    // Get all prisoners located in the main location by cell prefix e.g. MDI-1-.+
    const results = await this.prisonService.searchPrisonersByLocationPrefix(
      user.activeCaseLoadId,
      locationPrefix.replaceAll('.', '').replaceAll('+', ''),
      0,
      1024,
      user,
    )

    const attendees = (
      await Promise.all(instancesForDateAndSlot.map(a => this.activitiesService.getAttendees(a.id, user)))
    ).flat()

    const attendingPrisonerNumbers = Array.from(new Set(attendees.map(a => a.prisonerNumber)))

    const otherEvents = await this.activitiesService.getScheduledEventsForPrisoners(
      activityDate,
      attendingPrisonerNumbers,
      user,
    )

    const allEvents = [
      ...otherEvents.appointments,
      ...otherEvents.courtHearings,
      ...otherEvents.visits,
      ...otherEvents.adjudications,
    ]

    const prisonersWithActivities = results?.content?.reduce((result, prisoner) => {
      if (attendingPrisonerNumbers.includes(prisoner.prisonerNumber)) {
        const activitiesForPrisoner = attendees
          .filter(a => a.prisonerNumber === prisoner.prisonerNumber)
          .map(a => instancesForDateAndSlot.find(i => i.id === a.scheduledInstanceId))

        const clashes = activitiesForPrisoner.map(instance => {
          return allEvents
            .filter(e => e.prisonerNumber === prisoner.prisonerNumber)
            .filter(e => e.scheduledInstanceId !== instance.id)
            .filter(e => eventClashes(e, instance))
            .filter(e => e.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(e))
        })

        const attendancesForPrisoner = activitiesForPrisoner.flatMap(a =>
          a.attendances.filter(att => att.prisonerNumber === prisoner.prisonerNumber),
        )

        const advanceAttendancesForPrisoner = activitiesForPrisoner.flatMap(a =>
          a.advanceAttendances.filter(att => att.prisonerNumber === prisoner.prisonerNumber),
        )

        let isSelectable = false
        if (notRequiredInAdvanceEnabled && activitiesForPrisoner.some(i => i.isInFuture)) {
          if (advanceAttendancesForPrisoner.length > 0) {
            isSelectable = false
          } else {
            isSelectable = true
          }
        } else if (
          attendancesForPrisoner.some(a => a.status === AttendanceStatus.WAITING && a.editable) &&
          activitiesForPrisoner.some(i => i.activitySchedule.activity.attendanceRequired === true)
        ) {
          isSelectable = true
        } else {
          isSelectable = false
        }

        return result.concat({
          prisoner: {
            prisonerNumber: prisoner.prisonerNumber,
            firstName: prisoner.firstName,
            lastName: prisoner.lastName,
            cellLocation: prisoner?.cellLocation,
            status: prisoner?.status,
            prisonId: prisoner?.prisonId,
          },
          instances: activitiesForPrisoner,
          attendances: attendancesForPrisoner,
          advanceAttendances: advanceAttendancesForPrisoner,
          someSelectable: isSelectable,
          otherEventsPerInstance: clashes,
        })
      }
      return result
    }, [])

    return res.render('pages/activities/record-attendance/attend-all/select-people-by-residential-location', {
      attendanceRows: prisonersWithActivities,
      location,
      activityDate,
      timePeriodFilter,
      singleInstance: instancesForDateAndSlot.length === 1,
      instance: instancesForDateAndSlot.length > 0 ? instancesForDateAndSlot[0] : null,
      instancesForDateAndSlot,
      selectedSessions: instancesForDateAndSlot.map(a => a.timeSlot),
      attendanceSummary: getAttendanceSummary(
        prisonersWithActivities.flatMap(row => row.attendances).filter(a => a !== undefined),
      ),
    })
  }

  ATTENDED = async (req: Request, res: Response): Promise<void> => {
    let { selectedAttendances }: { selectedAttendances: string[] } = req.body
    if (typeof selectedAttendances === 'string') {
      selectedAttendances = [selectedAttendances]
    }
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
      req.journeyData.recordAttendanceJourney.returnUrl || '../choose-details-to-record-attendance',
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
    let { selectedAttendances }: { selectedAttendances: string[] } = req.body
    if (typeof selectedAttendances === 'string') {
      selectedAttendances = [selectedAttendances]
    }
    const { user } = res.locals
    const { recordAttendanceJourney } = req.journeyData
    const instanceIds = _.uniq(selectedAttendances.map(selectedAttendance => +selectedAttendance.split('-')[0]))
    const prisonerNumbers = _.uniq(selectedAttendances.map(selectedAttendance => selectedAttendance.split('-')[2]))

    const instances = await this.activitiesService.getScheduledActivities(instanceIds, user)

    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    recordAttendanceJourney.notRequiredOrExcused = {
      selectedPrisoners: [],
    }

    selectedAttendances.forEach(selectedAttendance => {
      const instanceId = selectedAttendance.split('-')[0]
      const prisonerNumber = selectedAttendance.split('-')[2]

      const instance = instances.find(inst => inst.id === +instanceId)
      const prisoner = prisoners.find(pris => pris.prisonerNumber === prisonerNumber)

      recordAttendanceJourney.notRequiredOrExcused.selectedPrisoners.push({
        instanceId: instance.id,
        prisonerNumber: prisoner.prisonerNumber,
        prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
      })
    })

    if (!instances[0].activitySchedule.activity.paid) {
      req.journeyData.recordAttendanceJourney.notRequiredOrExcused.isPaid = false
      return res.redirect(`../activities/${instances[0].id}/not-required-or-excused/check-and-confirm`)
    }

    return res.redirect(`../activities/${instances[0].id}/not-required-or-excused/paid-or-not`)
  }
}
