import { Request, Response } from 'express'
import { addWeeks, format, parse } from 'date-fns'
import { when } from 'jest-when'
import LocationEventsRoutes from './locationEvents'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import DateOption from '../../../../enum/dateOption'
import TimeSlot from '../../../../enum/timeSlot'
import { InternalLocationEvents, PrisonerScheduledEvents, ScheduledEvent } from '../../../../@types/activitiesAPI/types'
import { EventType, MovementListLocation } from '../../../../@types/activities'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { PrisonerStatus } from '../../../../@types/prisonApiImportCustom'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Movement list routes - location events', () => {
  const handler = new LocationEventsRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  const prisonCode = 'MDI'

  const internalLocation = {
    id: 1,
    prisonCode,
    code: 'EDUC-ED1-ED1',
    description: 'Education 1',
  } as InternalLocationEvents

  const prisoner = {
    prisonerNumber: 'A1234BC',
    firstName: 'Test',
    lastName: 'Prisoner',
    cellLocation: '1-2-3',
    category: 'P',
    status: PrisonerStatus.ACTIVE_IN,
    prisonId: prisonCode,
    alerts: [
      {
        alertType: 'H',
        alertCode: 'HA',
      },
    ],
  } as Prisoner

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: prisonCode,
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {} as unknown as Request

    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith([prisoner.prisonerNumber], res.locals.user)
      .mockResolvedValue([prisoner])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('redirects to choose details when date is invalid', async () => {
      const dateOption = DateOption.OTHER
      const date = 'invalid'
      const timeSlot = TimeSlot.AM
      req.query = {
        locationIds: '123',
        dateOption,
        date,
        timeSlot,
      }

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('choose-details')
    })

    it('redirects to choose details when no location ids are supplied', async () => {
      const dateOption = DateOption.TODAY
      const timeSlot = TimeSlot.AM
      req.query = {
        dateOption,
        timeSlot,
      }

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('choose-details')
    })

    it('redirects to locations when no requested locations found', async () => {
      const dateOption = DateOption.TODAY
      const dateQueryParam = format(new Date(), 'yyyy-MM-dd')
      const date = parse(dateQueryParam, 'yyyy-MM-dd', new Date())
      const timeSlot = TimeSlot.AM
      req.query = {
        locationIds: '123',
        dateOption,
        timeSlot,
      }

      when(activitiesService.getInternalLocationEvents)
        .calledWith(prisonCode, date, [123], res.locals.user, timeSlot as string)
        .mockResolvedValue([])

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`locations?dateOption=${dateOption}&timeSlot=${timeSlot}`)
    })

    it('redirects to locations with other date when no requested locations found', async () => {
      const dateOption = DateOption.OTHER
      const dateQueryParam = format(addWeeks(new Date(), 1), 'yyyy-MM-dd')
      const date = parse(dateQueryParam, 'yyyy-MM-dd', new Date())
      const timeSlot = TimeSlot.AM
      req.query = {
        locationIds: '123',
        dateOption,
        date: dateQueryParam,
        timeSlot,
      }

      when(activitiesService.getInternalLocationEvents)
        .calledWith(prisonCode, date, [123], res.locals.user, timeSlot as string)
        .mockResolvedValue([])

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `locations?dateOption=${dateOption}&date=${dateQueryParam}&timeSlot=${timeSlot}`,
      )
    })

    it('renders the expected view with one prisoner one event no clashing events', async () => {
      const dateOption = DateOption.TODAY
      const dateQueryParam = format(new Date(), 'yyyy-MM-dd')
      const date = parse(dateQueryParam, 'yyyy-MM-dd', new Date())
      const timeSlot = TimeSlot.AM
      req.query = {
        locationIds: `${internalLocation.id}`,
        dateOption,
        timeSlot,
      }

      const internalLocationEvents = [
        {
          ...internalLocation,
          events: [
            {
              prisonerNumber: 'A1234BC',
            },
          ],
        },
      ] as InternalLocationEvents[]
      when(activitiesService.getInternalLocationEvents)
        .calledWith(prisonCode, date, [internalLocation.id], res.locals.user, timeSlot as string)
        .mockResolvedValue(internalLocationEvents)

      when(activitiesService.getScheduledEventsForPrisoners)
        .calledWith(date, [prisoner.prisonerNumber], res.locals.user)
        .mockResolvedValue({
          activities: [],
          appointments: [],
          visits: [],
          adjudications: [],
          courtHearings: [],
          externalTransfers: [],
        })

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/location-events', {
        dateOption,
        date: dateQueryParam,
        timeSlot,
        locations: [
          {
            ...internalLocationEvents[0],
            prisonerEvents: [
              {
                ...prisoner,
                events: internalLocationEvents[0].events,
                clashingEvents: [],
              },
            ],
          },
        ] as MovementListLocation[],
      })
    })

    it('correctly identifies clashing events', async () => {
      const dateOption = DateOption.TODAY
      const dateQueryParam = format(new Date(), 'yyyy-MM-dd')
      const date = parse(dateQueryParam, 'yyyy-MM-dd', new Date())
      const timeSlot = TimeSlot.AM
      req.query = {
        locationIds: `${internalLocation.id}`,
        dateOption,
        timeSlot,
      }

      const internalLocationEvents = [
        {
          ...internalLocation,
          events: [
            {
              scheduledInstanceId: 1,
              prisonerNumber: 'A1234BC',
              startTime: '09:00',
              endTime: '12:30',
            },
          ],
        },
      ] as InternalLocationEvents[]
      when(activitiesService.getInternalLocationEvents)
        .calledWith(prisonCode, date, [internalLocation.id], res.locals.user, timeSlot as string)
        .mockResolvedValue(internalLocationEvents)

      when(activitiesService.getScheduledEventsForPrisoners)
        .calledWith(date, [prisoner.prisonerNumber], res.locals.user)
        .mockResolvedValue({
          activities: [
            {
              scheduledInstanceId: 4,
              summary: 'Activity - Clash start time',
              prisonerNumber: 'A1234BC',
              startTime: '12:29',
              endTime: '17:00',
            },
            {
              scheduledInstanceId: 3,
              summary: 'Activity - Clash end time',
              prisonerNumber: 'A1234BC',
              startTime: '08:00',
              endTime: '09:01',
            },
            {
              scheduledInstanceId: 2,
              summary: 'Activity - No clash boundary test end time',
              prisonerNumber: 'A1234BC',
              startTime: '08:00',
              endTime: '09:00',
            },
            {
              scheduledInstanceId: 5,
              summary: 'Activity - No clash boundary test start time',
              prisonerNumber: 'A1234BC',
              startTime: '12:30',
              endTime: '17:00',
            },
          ],
          appointments: [
            {
              appointmentId: 3,
              summary: 'Appointment - Clash start time',
              prisonerNumber: 'A1234BC',
              startTime: '12:29',
              endTime: '17:00',
            },
            {
              appointmentId: 2,
              summary: 'Appointment - Clash end time',
              prisonerNumber: 'A1234BC',
              startTime: '08:00',
              endTime: '09:01',
            },
            {
              appointmentId: 1,
              summary: 'Appointment - No clash boundary test end time',
              prisonerNumber: 'A1234BC',
              startTime: '08:00',
              endTime: '09:00',
            },
            {
              appointmentId: 4,
              summary: 'Appointment - No clash boundary test start time',
              prisonerNumber: 'A1234BC',
              startTime: '12:30',
              endTime: '17:00',
            },
            {
              appointmentId: 5,
              summary: 'Appointment - Clash no end time',
              prisonerNumber: 'A1234BC',
              startTime: '08:00',
            },
          ],
          visits: [],
          adjudications: [],
          courtHearings: [],
          externalTransfers: [],
        } as PrisonerScheduledEvents)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/location-events', {
        dateOption,
        date: dateQueryParam,
        timeSlot,
        locations: [
          {
            ...internalLocationEvents[0],
            prisonerEvents: [
              {
                ...prisoner,
                events: internalLocationEvents[0].events,
                clashingEvents: [
                  {
                    scheduledInstanceId: 3,
                    summary: 'Activity - Clash end time',
                    prisonerNumber: 'A1234BC',
                    startTime: '08:00',
                    endTime: '09:01',
                  },
                  {
                    appointmentId: 2,
                    summary: 'Appointment - Clash end time',
                    prisonerNumber: 'A1234BC',
                    startTime: '08:00',
                    endTime: '09:01',
                  },
                  {
                    appointmentId: 5,
                    summary: 'Appointment - Clash no end time',
                    prisonerNumber: 'A1234BC',
                    startTime: '08:00',
                  },
                  {
                    scheduledInstanceId: 4,
                    summary: 'Activity - Clash start time',
                    prisonerNumber: 'A1234BC',
                    startTime: '12:29',
                    endTime: '17:00',
                  },
                  {
                    appointmentId: 3,
                    summary: 'Appointment - Clash start time',
                    prisonerNumber: 'A1234BC',
                    startTime: '12:29',
                    endTime: '17:00',
                  },
                ] as ScheduledEvent[],
              },
            ],
          },
        ] as MovementListLocation[],
      })
    })

    it('clashing events includes visits, adjudications, courtHearings and externalTransfers', async () => {
      const dateOption = DateOption.TODAY
      const dateQueryParam = format(new Date(), 'yyyy-MM-dd')
      const date = parse(dateQueryParam, 'yyyy-MM-dd', new Date())
      const timeSlot = TimeSlot.AM
      req.query = {
        locationIds: `${internalLocation.id}`,
        dateOption,
        timeSlot,
      }

      const internalLocationEvents = [
        {
          ...internalLocation,
          events: [
            {
              scheduledInstanceId: 1,
              prisonerNumber: 'A1234BC',
              startTime: '09:00',
              endTime: '12:30',
            },
          ],
        },
      ] as InternalLocationEvents[]
      when(activitiesService.getInternalLocationEvents)
        .calledWith(prisonCode, date, [internalLocation.id], res.locals.user, timeSlot as string)
        .mockResolvedValue(internalLocationEvents)

      when(activitiesService.getScheduledEventsForPrisoners)
        .calledWith(date, [prisoner.prisonerNumber], res.locals.user)
        .mockResolvedValue({
          activities: [],
          appointments: [],
          visits: [
            {
              summary: 'Visit',
              prisonerNumber: 'A1234BC',
              startTime: '09:30',
              endTime: '10:00',
            },
          ],
          adjudications: [
            {
              summary: 'Adjudication',
              prisonerNumber: 'A1234BC',
              startTime: '10:00',
              endTime: '10:30',
            },
          ],
          courtHearings: [
            {
              summary: 'Court hearing',
              prisonerNumber: 'A1234BC',
              startTime: '10:30',
              endTime: '11:00',
            },
          ],
          externalTransfers: [
            {
              summary: 'External transfer',
              prisonerNumber: 'A1234BC',
              startTime: '09:30',
            },
          ],
        } as PrisonerScheduledEvents)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/location-events', {
        dateOption,
        date: dateQueryParam,
        timeSlot,
        locations: [
          {
            ...internalLocationEvents[0],
            prisonerEvents: [
              {
                ...prisoner,
                events: internalLocationEvents[0].events,
                clashingEvents: [
                  {
                    summary: 'External transfer',
                    prisonerNumber: 'A1234BC',
                    startTime: '09:30',
                  },
                  {
                    summary: 'Visit',
                    prisonerNumber: 'A1234BC',
                    startTime: '09:30',
                    endTime: '10:00',
                  },
                  {
                    summary: 'Adjudication',
                    prisonerNumber: 'A1234BC',
                    startTime: '10:00',
                    endTime: '10:30',
                  },
                  {
                    summary: 'Court hearing',
                    prisonerNumber: 'A1234BC',
                    startTime: '10:30',
                    endTime: '11:00',
                  },
                ] as ScheduledEvent[],
              },
            ],
          },
        ] as MovementListLocation[],
      })
    })
  })

  it('clashing events excludes events at location', async () => {
    const dateOption = DateOption.TODAY
    const dateQueryParam = format(new Date(), 'yyyy-MM-dd')
    const date = parse(dateQueryParam, 'yyyy-MM-dd', new Date())
    const timeSlot = TimeSlot.AM
    req.query = {
      locationIds: `${internalLocation.id}`,
      dateOption,
      timeSlot,
    }

    const internalLocationEvents = [
      {
        ...internalLocation,
        events: [
          {
            scheduledInstanceId: 1,
            eventType: EventType.ACTIVITY,
            internalLocationId: internalLocation.id,
            summary: 'Activity at location',
            prisonerNumber: 'A1234BC',
            startTime: '09:00',
            endTime: '12:30',
          },
          {
            appointmentId: 2,
            eventType: EventType.APPOINTMENT,
            internalLocationId: internalLocation.id,
            summary: 'Appointment at location',
            prisonerNumber: 'A1234BC',
            startTime: '10:00',
            endTime: '11:30',
          },
          {
            eventId: 3,
            eventType: EventType.VISIT,
            internalLocationId: internalLocation.id,
            summary: 'Visit at location',
            prisonerNumber: 'A1234BC',
            startTime: '11:00',
            endTime: '11:30',
          },
        ],
      },
    ] as InternalLocationEvents[]
    when(activitiesService.getInternalLocationEvents)
      .calledWith(prisonCode, date, [internalLocation.id], res.locals.user, timeSlot as string)
      .mockResolvedValue(internalLocationEvents)

    when(activitiesService.getScheduledEventsForPrisoners)
      .calledWith(date, [prisoner.prisonerNumber], res.locals.user)
      .mockResolvedValue({
        activities: [
          {
            scheduledInstanceId: 1,
            internalLocationId: internalLocation.id,
            summary: 'Activity at location',
            prisonerNumber: 'A1234BC',
            startTime: '09:00',
            endTime: '12:30',
          },
        ],
        appointments: [
          {
            appointmentId: 2,
            internalLocationId: internalLocation.id,
            summary: 'Appointment at location',
            prisonerNumber: 'A1234BC',
            startTime: '10:00',
            endTime: '11:30',
          },
        ],
        visits: [
          {
            eventId: 3,
            eventType: EventType.VISIT,
            internalLocationId: internalLocation.id,
            summary: 'Visit at location',
            prisonerNumber: 'A1234BC',
            startTime: '11:00',
            endTime: '11:30',
          },
        ],
        adjudications: [],
        courtHearings: [],
        externalTransfers: [],
      } as PrisonerScheduledEvents)

    await handler.GET(req, res)

    expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/location-events', {
      dateOption,
      date: dateQueryParam,
      timeSlot,
      locations: [
        {
          ...internalLocationEvents[0],
          prisonerEvents: [
            {
              ...prisoner,
              events: internalLocationEvents[0].events,
              clashingEvents: [] as ScheduledEvent[],
            },
          ],
        },
      ] as MovementListLocation[],
    })
  })

  it('orders events', async () => {
    const dateOption = DateOption.TODAY
    const dateQueryParam = format(new Date(), 'yyyy-MM-dd')
    const date = parse(dateQueryParam, 'yyyy-MM-dd', new Date())
    const timeSlot = TimeSlot.AM
    req.query = {
      locationIds: `${internalLocation.id}`,
      dateOption,
      timeSlot,
    }

    const internalLocationEvents = [
      {
        ...internalLocation,
        events: [
          {
            appointmentId: 5,
            eventType: EventType.APPOINTMENT,
            internalLocationId: internalLocation.id,
            summary: 'Appointment 2 at location',
            prisonerNumber: 'A1234BC',
            startTime: '10:00',
            endTime: '11:30',
          },
          {
            appointmentId: 4,
            eventType: EventType.APPOINTMENT,
            internalLocationId: internalLocation.id,
            summary: 'Appointment 1 at location',
            prisonerNumber: 'A1234BC',
            startTime: '10:00',
            endTime: '11:30',
          },
          {
            appointmentId: 6,
            eventType: EventType.APPOINTMENT,
            internalLocationId: internalLocation.id,
            summary: 'Appointment 3 at location',
            prisonerNumber: 'A1234BC',
            startTime: '09:00',
            endTime: '11:30',
          },
          {
            scheduledInstanceId: 2,
            eventType: EventType.ACTIVITY,
            internalLocationId: internalLocation.id,
            summary: 'Activity 2 at location',
            prisonerNumber: 'A1234BC',
            startTime: '09:00',
            endTime: '12:30',
          },
          {
            scheduledInstanceId: 1,
            eventType: EventType.ACTIVITY,
            internalLocationId: internalLocation.id,
            summary: 'Activity 1 at location',
            prisonerNumber: 'A1234BC',
            startTime: '09:00',
            endTime: '12:30',
          },
          {
            scheduledInstanceId: 3,
            eventType: EventType.ACTIVITY,
            internalLocationId: internalLocation.id,
            summary: 'Activity 3 at location',
            prisonerNumber: 'A1234BC',
            startTime: '08:00',
            endTime: '11:30',
          },
        ],
      },
    ] as InternalLocationEvents[]
    when(activitiesService.getInternalLocationEvents)
      .calledWith(prisonCode, date, [internalLocation.id], res.locals.user, timeSlot as string)
      .mockResolvedValue(internalLocationEvents)

    when(activitiesService.getScheduledEventsForPrisoners)
      .calledWith(date, [prisoner.prisonerNumber], res.locals.user)
      .mockResolvedValue({
        activities: [],
        appointments: [],
        visits: [],
        adjudications: [],
        courtHearings: [],
        externalTransfers: [],
      } as PrisonerScheduledEvents)

    await handler.GET(req, res)

    expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/location-events', {
      dateOption,
      date: dateQueryParam,
      timeSlot,
      locations: [
        {
          ...internalLocationEvents[0],
          prisonerEvents: [
            {
              ...prisoner,
              events: [
                {
                  scheduledInstanceId: 3,
                  eventType: EventType.ACTIVITY,
                  internalLocationId: internalLocation.id,
                  summary: 'Activity 3 at location',
                  prisonerNumber: 'A1234BC',
                  startTime: '08:00',
                  endTime: '11:30',
                },
                {
                  scheduledInstanceId: 1,
                  eventType: EventType.ACTIVITY,
                  internalLocationId: internalLocation.id,
                  summary: 'Activity 1 at location',
                  prisonerNumber: 'A1234BC',
                  startTime: '09:00',
                  endTime: '12:30',
                },
                {
                  scheduledInstanceId: 2,
                  eventType: EventType.ACTIVITY,
                  internalLocationId: internalLocation.id,
                  summary: 'Activity 2 at location',
                  prisonerNumber: 'A1234BC',
                  startTime: '09:00',
                  endTime: '12:30',
                },
                {
                  appointmentId: 6,
                  eventType: EventType.APPOINTMENT,
                  internalLocationId: internalLocation.id,
                  summary: 'Appointment 3 at location',
                  prisonerNumber: 'A1234BC',
                  startTime: '09:00',
                  endTime: '11:30',
                },
                {
                  appointmentId: 4,
                  eventType: EventType.APPOINTMENT,
                  internalLocationId: internalLocation.id,
                  summary: 'Appointment 1 at location',
                  prisonerNumber: 'A1234BC',
                  startTime: '10:00',
                  endTime: '11:30',
                },
                {
                  appointmentId: 5,
                  eventType: EventType.APPOINTMENT,
                  internalLocationId: internalLocation.id,
                  summary: 'Appointment 2 at location',
                  prisonerNumber: 'A1234BC',
                  startTime: '10:00',
                  endTime: '11:30',
                },
              ] as ScheduledEvent[],
              clashingEvents: [] as ScheduledEvent[],
            },
          ],
        },
      ] as MovementListLocation[],
    })
  })

  it('excludes prisoners resident in other prisons', async () => {
    const dateOption = DateOption.TODAY
    const dateQueryParam = format(new Date(), 'yyyy-MM-dd')
    const date = parse(dateQueryParam, 'yyyy-MM-dd', new Date())
    const timeSlot = TimeSlot.AM
    req.query = {
      locationIds: `${internalLocation.id}`,
      dateOption,
      timeSlot,
    }

    const prisonerInOtherPrison = {
      prisonerNumber: 'B2345CD',
      firstName: 'Other',
      lastName: 'Prisoner',
      cellLocation: '2-3-4',
      category: 'P',
      status: PrisonerStatus.ACTIVE_IN,
      prisonId: 'OTH',
    } as Prisoner

    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith([prisoner.prisonerNumber, prisonerInOtherPrison.prisonerNumber], res.locals.user)
      .mockResolvedValue([prisoner, prisonerInOtherPrison])

    const internalLocationEvents = [
      {
        ...internalLocation,
        events: [
          {
            appointmentId: 1,
            eventType: EventType.APPOINTMENT,
            internalLocationId: internalLocation.id,
            summary: `Appointment for prisoner resident at ${prisonCode}`,
            prisonerNumber: prisoner.prisonerNumber,
            startTime: '10:00',
            endTime: '11:30',
          },
          {
            appointmentId: 2,
            eventType: EventType.APPOINTMENT,
            internalLocationId: internalLocation.id,
            summary: `Appointment for prisoner resident at ${prisonerInOtherPrison.prisonId}`,
            prisonerNumber: prisonerInOtherPrison.prisonerNumber,
            startTime: '10:00',
            endTime: '11:30',
          },
        ],
      },
    ] as InternalLocationEvents[]
    when(activitiesService.getInternalLocationEvents)
      .calledWith(prisonCode, date, [internalLocation.id], res.locals.user, timeSlot as string)
      .mockResolvedValue(internalLocationEvents)

    when(activitiesService.getScheduledEventsForPrisoners)
      .calledWith(date, [prisoner.prisonerNumber], res.locals.user)
      .mockResolvedValue({
        activities: [],
        appointments: [],
        visits: [],
        adjudications: [],
        courtHearings: [],
        externalTransfers: [],
      } as PrisonerScheduledEvents)

    await handler.GET(req, res)

    expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/location-events', {
      dateOption,
      date: dateQueryParam,
      timeSlot,
      locations: [
        {
          ...internalLocationEvents[0],
          prisonerEvents: [
            {
              ...prisoner,
              events: [
                {
                  appointmentId: 1,
                  eventType: EventType.APPOINTMENT,
                  internalLocationId: internalLocation.id,
                  summary: `Appointment for prisoner resident at ${prisonCode}`,
                  prisonerNumber: prisoner.prisonerNumber,
                  startTime: '10:00',
                  endTime: '11:30',
                },
              ] as ScheduledEvent[],
              clashingEvents: [] as ScheduledEvent[],
            },
          ],
        },
      ] as MovementListLocation[],
    })
  })

  it('excludes inactive out prisoners', async () => {
    const dateOption = DateOption.TODAY
    const dateQueryParam = format(new Date(), 'yyyy-MM-dd')
    const date = parse(dateQueryParam, 'yyyy-MM-dd', new Date())
    const timeSlot = TimeSlot.AM
    req.query = {
      locationIds: `${internalLocation.id}`,
      dateOption,
      timeSlot,
    }

    const inactiveOutPrisoner = {
      prisonerNumber: 'B2345CD',
      firstName: 'Other',
      lastName: 'Prisoner',
      cellLocation: '2-3-4',
      category: 'P',
      status: PrisonerStatus.INACTIVE_OUT,
      prisonId: prisonCode,
    } as Prisoner

    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith([prisoner.prisonerNumber, inactiveOutPrisoner.prisonerNumber], res.locals.user)
      .mockResolvedValue([prisoner, inactiveOutPrisoner])

    const internalLocationEvents = [
      {
        ...internalLocation,
        events: [
          {
            appointmentId: 1,
            eventType: EventType.APPOINTMENT,
            internalLocationId: internalLocation.id,
            summary: `Appointment for prisoner resident at ${prisonCode}`,
            prisonerNumber: prisoner.prisonerNumber,
            startTime: '10:00',
            endTime: '11:30',
          },
          {
            appointmentId: 2,
            eventType: EventType.APPOINTMENT,
            internalLocationId: internalLocation.id,
            summary: `Appointment for prisoner resident at ${inactiveOutPrisoner.prisonId}`,
            prisonerNumber: inactiveOutPrisoner.prisonerNumber,
            startTime: '10:00',
            endTime: '11:30',
          },
        ],
      },
    ] as InternalLocationEvents[]
    when(activitiesService.getInternalLocationEvents)
      .calledWith(prisonCode, date, [internalLocation.id], res.locals.user, timeSlot as string)
      .mockResolvedValue(internalLocationEvents)

    when(activitiesService.getScheduledEventsForPrisoners)
      .calledWith(date, [prisoner.prisonerNumber], res.locals.user)
      .mockResolvedValue({
        activities: [],
        appointments: [],
        visits: [],
        adjudications: [],
        courtHearings: [],
        externalTransfers: [],
      } as PrisonerScheduledEvents)

    await handler.GET(req, res)

    expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/location-events', {
      dateOption,
      date: dateQueryParam,
      timeSlot,
      locations: [
        {
          ...internalLocationEvents[0],
          prisonerEvents: [
            {
              ...prisoner,
              events: [
                {
                  appointmentId: 1,
                  eventType: EventType.APPOINTMENT,
                  internalLocationId: internalLocation.id,
                  summary: `Appointment for prisoner resident at ${prisonCode}`,
                  prisonerNumber: prisoner.prisonerNumber,
                  startTime: '10:00',
                  endTime: '11:30',
                },
              ] as ScheduledEvent[],
              clashingEvents: [] as ScheduledEvent[],
            },
          ],
        },
      ] as MovementListLocation[],
    })
  })
})
