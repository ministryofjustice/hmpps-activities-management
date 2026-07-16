import { Request, Response } from 'express'
import { when } from 'jest-when'
import CheckAnswersRoutes from './checkAnswers'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import {
  Appointment,
  AppointmentSeries,
  AppointmentSeriesCreateRequest,
  AppointmentSet,
  AppointmentSetAppointment,
  AppointmentSetCreateRequest,
} from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import { AppointmentFrequency } from '../../../../@types/appointments'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { AppointmentSetJourney } from '../appointmentSetJourney'
import { organiserDescriptions } from '../../../../enum/eventOrganisers'
import { eventTierDescriptions } from '../../../../enum/eventTiers'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Appointment - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {
          type: AppointmentType.GROUP,
          mode: AppointmentJourneyMode.CREATE,
          prisoners: [
            {
              number: 'A1234BC',
              name: 'Test Prisoner',
              cellLocation: '1-1-1',
            },
          ],
          category: {
            code: 'MEDO',
            description: 'Medical - Doctor',
          },
          location: {
            id: '32',
            description: 'Interview Room',
          },
          inCell: false,
          startDate: '2023-04-23',
          startTime: {
            hour: 9,
            minute: 30,
            date: '2023-04-23T09:30:00.000+0100',
          },
          endTime: {
            hour: 13,
            minute: 0,
            date: '2023-04-23T13:00:00.000+0100',
          },
          tierCode: 'TIER_2',
          organiserCode: 'PRISON_STAFF',
          repeat: YesNo.NO,
        },
        appointmentSetJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the check answers page with data from session when mode is CREATE', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/check-answers', {
        tier: eventTierDescriptions.TIER_2,
        organiser: organiserDescriptions.PRISON_STAFF,
      })

      expect(req.session.appointmentJourney.mode).toEqual(AppointmentJourneyMode.CREATE)
    })

    it('should render the check answers page with data from session when mode is COPY', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.COPY

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/check-answers', {
        tier: eventTierDescriptions.TIER_2,
        organiser: organiserDescriptions.PRISON_STAFF,
      })

      expect(req.session.appointmentJourney.mode).toEqual(AppointmentJourneyMode.CREATE)
    })
  })

  describe('POST', () => {
    let expectedRequest: AppointmentSeriesCreateRequest
    let expectedResponse: AppointmentSeries

    beforeEach(() => {
      expectedRequest = {
        appointmentType: 'GROUP',
        categoryCode: 'MEDO',
        prisonCode: 'TPR',
        internalLocationId: 32,
        inCell: false,
        startDate: '2023-04-23',
        startTime: '09:30',
        endTime: '13:00',
        prisonerNumbers: ['A1234BC'],
        tierCode: 'TIER_2',
        organiserCode: 'PRISON_STAFF',
      } as AppointmentSeriesCreateRequest

      expectedResponse = {
        id: 15,
        appointmentType: 'GROUP',
        prisonCode: 'TPR',
        categoryCode: 'MEDO',
        dpsLocationId: '32',
        startDate: '2023-04-23',
        startTime: '09:30',
        endTime: '13:00',
        extraInformation: '',
        createdTime: '2023-02-07T15:37:59.266Z',
        createdBy: 'test.user',
        appointments: [
          {
            id: 16,
            dpsLocationId: '32',
            startDate: '2023-04-23',
            startTime: '09:30',
            endTime: '13:00',
            extraInformation: null,
            attendees: [
              {
                id: 17,
                prisonerNumber: 'A1234BC',
                bookingId: 456,
              },
            ],
          },
        ],
      } as AppointmentSeries
    })

    it('should create the appointment series using the internal location ID from a legacy numeric string journey', async () => {
      when(activitiesService.createAppointmentSeries)
        .calledWith(atLeast(expectedRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)

      expect(activitiesService.createAppointmentSeries).toHaveBeenCalledWith(expectedRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/16')
    })

    it('should create the appointment series using the internal location ID from a legacy numeric journey', async () => {
      req.session.appointmentJourney.location.id = 32 as unknown as string

      when(activitiesService.createAppointmentSeries)
        .calledWith(atLeast(expectedRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)

      expect(activitiesService.createAppointmentSeries).toHaveBeenCalledWith(expectedRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/16')
    })

    it('should create the appointment series using the DPS location ID from a new journey', async () => {
      const dpsLocationId = 'b7602cc8-e769-4cbb-8194-62d8e655992a'

      req.session.appointmentJourney.location.id = dpsLocationId

      const { internalLocationId: _, ...requestWithoutLegacyLocation } = expectedRequest
      const expectedDpsRequest = {
        ...requestWithoutLegacyLocation,
        dpsLocationId,
      } as AppointmentSeriesCreateRequest

      when(activitiesService.createAppointmentSeries)
        .calledWith(atLeast(expectedDpsRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)

      expect(activitiesService.createAppointmentSeries).toHaveBeenCalledWith(expectedDpsRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/16')
    })

    it('should create the appointment series and redirect to confirmation page when duplicated from an original appointment', async () => {
      req.session.appointmentJourney.originalAppointmentId = 789

      expectedRequest.originalAppointmentId = 789

      when(activitiesService.createAppointmentSeries)
        .calledWith(atLeast(expectedRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)

      expect(activitiesService.createAppointmentSeries).toHaveBeenCalledWith(expectedRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/16')
    })

    it('should create the repeat appointment and redirect to confirmation page', async () => {
      req.session.appointmentJourney.repeat = YesNo.YES
      req.session.appointmentJourney.frequency = AppointmentFrequency.WEEKLY
      req.session.appointmentJourney.numberOfAppointments = 6

      expectedRequest.schedule = {
        frequency: AppointmentFrequency.WEEKLY,
        numberOfAppointments: 6,
      }

      when(activitiesService.createAppointmentSeries)
        .calledWith(atLeast(expectedRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)

      expect(activitiesService.createAppointmentSeries).toHaveBeenCalledWith(expectedRequest, res.locals.user)
    })
  })

  describe('POST set', () => {
    let expectedRequest: AppointmentSetCreateRequest
    let expectedResponse: AppointmentSet

    beforeEach(() => {
      req.session.appointmentJourney.type = AppointmentType.SET

      req.session.appointmentSetJourney = {
        appointments: [
          {
            startTime: {
              hour: 13,
              minute: 30,
            },
            endTime: {
              hour: 14,
              minute: 0,
            },
            prisoner: {
              number: 'A1234BC',
              name: 'A Prisoner',
              cellLocation: '1-2-3',
            },
          },
          {
            startTime: {
              hour: 14,
              minute: 0,
            },
            endTime: {
              hour: 14,
              minute: 30,
            },
            prisoner: {
              number: 'B2345CD',
              name: 'B Prisoner',
              cellLocation: '1-2-4',
            },
            extraInformation: 'Extra information for B2345CD',
            prisonerExtraInformation: 'Prisoner extra information for B2345CD',
          },
        ],
      } as AppointmentSetJourney

      expectedRequest = {
        prisonCode: 'TPR',
        categoryCode: 'MEDO',
        internalLocationId: 32,
        inCell: false,
        startDate: '2023-04-23',
        appointments: [
          {
            prisonerNumber: 'A1234BC',
            startTime: '13:30',
            endTime: '14:00',
          } as AppointmentSetAppointment,
          {
            prisonerNumber: 'B2345CD',
            startTime: '14:00',
            endTime: '14:30',
            extraInformation: 'Extra information for B2345CD',
            prisonerExtraInformation: 'Prisoner extra information for B2345CD',
          } as AppointmentSetAppointment,
        ],
        tierCode: 'TIER_2',
        organiserCode: 'PRISON_STAFF',
      } as AppointmentSetCreateRequest

      expectedResponse = {
        id: 14,
        prisonCode: 'TPR',
        categoryCode: 'MEDO',
        dpsLocationId: '32',
        startDate: '2023-04-23',
        createdTime: '2023-02-07T15:37:59.266Z',
        createdBy: 'test.user',
        appointments: [
          {
            id: 16,
            sequenceNumber: 1,
            prisonCode: 'TPR',
            categoryCode: 'MEDO',
            dpsLocationId: '32',
            startDate: '2023-04-23',
            startTime: '13:30',
            endTime: '14:00',
            extraInformation: 'Extra information for B2345CD',
            prisonerExtraInformation: 'Prisoner extra information for B2345CD',
            createdTime: '2023-02-07T15:37:59.266Z',
            createdBy: 'test.user',
            attendees: [
              {
                id: 17,
                prisonerNumber: 'A1234BC',
                bookingId: 456,
              },
            ],
          } as Appointment,
          {
            id: 17,
            sequenceNumber: 1,
            prisonCode: 'TPR',
            categoryCode: 'MEDO',
            dpsLocationId: '32',
            startDate: '2023-04-23',
            startTime: '14:00',
            endTime: '14:30',
            extraInformation: '',
            createdTime: '2023-02-07T15:37:59.266Z',
            createdBy: 'test.user',
            attendees: [
              {
                id: 18,
                prisonerNumber: 'B2345CD',
                bookingId: 457,
              },
            ],
          } as Appointment,
        ],
      } as AppointmentSet
    })

    it('should create the appointment set using the internal location ID from a legacy numeric string journey', async () => {
      when(activitiesService.createAppointmentSet)
        .calledWith(atLeast(expectedRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)

      expect(activitiesService.createAppointmentSet).toHaveBeenCalledWith(expectedRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('set-confirmation/14')
    })

    it('should create the appointment set using the internal location ID from a legacy numeric journey', async () => {
      req.session.appointmentJourney.location.id = 32 as unknown as string

      when(activitiesService.createAppointmentSet)
        .calledWith(atLeast(expectedRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)

      expect(activitiesService.createAppointmentSet).toHaveBeenCalledWith(expectedRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('set-confirmation/14')
    })

    it('should create the appointment set using the DPS location ID from a new journey', async () => {
      const dpsLocationId = 'b7602cc8-e769-4cbb-8194-62d8e655992a'

      req.session.appointmentJourney.location.id = dpsLocationId

      const { internalLocationId: _, ...requestWithoutLegacyLocation } = expectedRequest
      const expectedDpsRequest = {
        ...requestWithoutLegacyLocation,
        dpsLocationId,
      } as AppointmentSetCreateRequest

      when(activitiesService.createAppointmentSet)
        .calledWith(atLeast(expectedDpsRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)

      expect(activitiesService.createAppointmentSet).toHaveBeenCalledWith(expectedDpsRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('set-confirmation/14')
    })
  })
})
