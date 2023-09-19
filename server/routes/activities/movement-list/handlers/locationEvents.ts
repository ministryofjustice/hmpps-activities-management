import { Request, Response } from 'express'
import { simpleDateFromDateOption } from '../../../../commonValidationTypes/simpleDate'
import DateOption from '../../../../enum/dateOption'
import { EventType, MovementListItem } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import { uniq } from 'lodash'
import PrisonService from '../../../../services/prisonService'
import { ScheduledEvent } from '../../../../@types/activitiesAPI/types'
import { eventClashes, toDate } from '../../../../utils/utils'

export default class LocationEventsRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { locationIds, dateOption, date, timeSlot } = req.query

    const simpleDate = simpleDateFromDateOption(dateOption as DateOption, date as string)
    if (!simpleDate || !(locationIds as string)) {
      return res.redirect(`choose-details`)
    }

    const locations = await this.activitiesService.getInternalLocationEvents(
      user.activeCaseLoadId,
      simpleDate.toRichDate(),
      (locationIds as string).split(',').map(id => parseInt(id, 10)),
      user,
      timeSlot as string,
    )

    /*const prisonerEvents = locations
      .flatMap(l => l.events)
      .reduce((prisonerEventsMap, event) => {
        (prisonerEventsMap[event.prisonerNumber] ||= []).push(event)
        return prisonerEventsMap
      }, {} as Map<string, ScheduledEvent[]>)*/

    const events = locations.flatMap(l => l.events)
    const prisonerNumbers = uniq(events.map(e => e.prisonerNumber))

    const [prisoners, otherEvents] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user),
      this.activitiesService.getScheduledEventsForPrisoners(simpleDate.toRichDate(), prisonerNumbers, user),
    ])

    const allEvents = [
      ...otherEvents.activities,
      ...otherEvents.appointments,
      ...otherEvents.visits,
      ...otherEvents.adjudications,
    ]

    const locationEvents = prisoners.map(p => {
      const prisonerEvents = events
        .filter(e => e.prisonerNumber === p.prisonerNumber)

      const prisonerClashingEvents = allEvents
        .filter(e => e.prisonerNumber === p.prisonerNumber)
        // Exclude any activities for the prisoner scheduled at the current location
        .filter(
          e =>
            !prisonerEvents
              .filter(pe => pe.eventType === EventType.ACTIVITY)
              .map(pe => pe.scheduledInstanceId)
              .includes(e.scheduledInstanceId),
        )
        // Exclude any appointments for the prisoner scheduled at the current location
        .filter(
          e =>
            !prisonerEvents
              .filter(pe => pe.eventType === EventType.APPOINTMENT)
              .map(pe => pe.appointmentId)
              .includes(e.appointmentId),
        )
        // Exclude any event not considered a clash
        .filter(e => !prisonerEvents.map(pe => eventClashes(e, pe)).filter(c => c))

      return {
        prisonerNumber: p.prisonerNumber,
        firstName: p.firstName,
        lastName: p.lastName,
        cellLocation: p.cellLocation,
        status: p.status,
        alerts: p.alerts,
        events: prisonerEvents,
        clashingEvents: prisonerClashingEvents,
      } as MovementListItem
    })

    // TODO: replace with await this.activitiesService.getLocationEvents(user) when implemented
    /*const locationEvents = [
      {
        prisonerNumber: 'A1234BC',
        firstName: 'TEST',
        lastName: 'PRISONER',
        cellLocation: '1-2-3',
        status: 'IN',
        events: [
          {
            eventSource: 'SAA',
            eventType: 'ACTIVITY',
            summary: 'Activity name',
            startTime: '09:00',
            endTime: '12:00',
          },
        ],
        clashingEvents: [
          {
            eventSource: 'SAA',
            eventType: 'ACTIVITY',
            summary: 'Activity name',
            startTime: '09:00',
            endTime: '12:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'ACTIVITY',
            summary: 'Activity name',
            suspended: true,
            startTime: '09:00',
            endTime: '12:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'APPOINTMENT',
            summary: 'Chaplaincy',
            startTime: '10:00',
            endTime: '11:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'APPOINTMENT',
            summary: 'Chaplaincy',
            cancelled: true,
            startTime: '10:00',
            endTime: '11:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'APPOINTMENT',
            summary: 'Chaplaincy',
            comments: 'Extra information',
            startTime: '10:00',
            endTime: '11:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'APPOINTMENT',
            summary: 'Chaplaincy',
            startTime: '10:00',
          },
        ],
      },
    ] as MovementListItem[]*/

    return res.render('pages/activities/movement-list/location-events', {
      dateOption,
      date: simpleDate.toIsoString(),
      timeSlot,
      locations,
      locationEvents,
    })
  }
}
