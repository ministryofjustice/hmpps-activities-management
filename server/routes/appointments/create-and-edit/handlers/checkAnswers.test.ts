import { Request, Response } from 'express'
import { when } from 'jest-when'
import CheckAnswersRoutes from './checkAnswers'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import {
  AppointmentSeries,
  AppointmentSeriesCreateRequest,
  AppointmentSet,
  AppointmentSetCreateRequest,
  AppointmentSetAppointment,
} from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import { AppointmentRepeatPeriod } from '../../../../@types/appointments'
import { AppointmentType } from '../appointmentJourney'
import { BulkAppointmentJourney } from '../bulkAppointmentJourney'

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
          type: AppointmentType.INDIVIDUAL,
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
            id: 32,
            description: 'Interview Room',
          },
          startDate: {
            day: 23,
            month: 4,
            year: 2023,
            date: '2023-04-23T00:00:00.000+0100',
          },
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
          repeat: YesNo.NO,
        },
        bulkAppointmentJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the check answers page with data from session', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/check-answers')
    })
  })

  describe('POST', () => {
    let expectedRequest: AppointmentSeriesCreateRequest
    let expectedResponse: AppointmentSeries

    beforeEach(() => {
      expectedRequest = {
        appointmentType: 'INDIVIDUAL',
        categoryCode: 'MEDO',
        prisonCode: 'TPR',
        internalLocationId: 32,
        inCell: false,
        startDate: '2023-04-23',
        startTime: '09:30',
        endTime: '13:00',
        prisonerNumbers: ['A1234BC'],
      } as AppointmentSeriesCreateRequest

      expectedResponse = {
        id: 15,
        appointmentType: 'INDIVIDUAL',
        prisonCode: 'TPR',
        categoryCode: 'MEDO',
        internalLocationId: 32,
        startDate: '2023-04-23',
        startTime: '09:30',
        endTime: '13:00',
        comment: '',
        created: '2023-02-07T15:37:59.266Z',
        createdBy: 'test.user',
        occurrences: [
          {
            id: 16,
            internalLocationId: 32,
            startDate: '2023-04-23',
            startTime: '09:30',
            endTime: '13:00',
            comment: null,
            allocations: [
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

    it('should create the appointment and redirect to confirmation page', async () => {
      when(activitiesService.createAppointmentSeries)
        .calledWith(atLeast(expectedRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)
      expect(activitiesService.createAppointmentSeries).toHaveBeenCalledWith(expectedRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/15')
    })

    it('should create the repeat appointment and redirect to confirmation page', async () => {
      req.session.appointmentJourney.repeat = YesNo.YES
      req.session.appointmentJourney.repeatPeriod = AppointmentRepeatPeriod.WEEKLY
      req.session.appointmentJourney.repeatCount = 6

      expectedRequest.repeat = {
        period: AppointmentRepeatPeriod.WEEKLY,
        count: 6,
      }

      when(activitiesService.createAppointmentSeries)
        .calledWith(atLeast(expectedRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)
      expect(activitiesService.createAppointmentSeries).toHaveBeenCalledWith(expectedRequest, res.locals.user)
    })
  })

  describe('POST bulk', () => {
    let expectedRequest: AppointmentSetCreateRequest
    let expectedResponse: AppointmentSet

    beforeEach(() => {
      req.session.appointmentJourney.type = AppointmentType.BULK

      req.session.bulkAppointmentJourney = {
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
            comment: 'Extra information for B2345CD',
          },
        ],
      } as BulkAppointmentJourney

      expectedRequest = {
        prisonCode: 'TPR',
        categoryCode: 'MEDO',
        internalLocationId: 32,
        inCell: false,
        startDate: '2023-04-23',
        appointments: [
          { prisonerNumber: 'A1234BC', startTime: '13:30', endTime: '14:00' } as AppointmentSetAppointment,
          {
            prisonerNumber: 'B2345CD',
            startTime: '14:00',
            endTime: '14:30',
            comment: 'Extra information for B2345CD',
          } as AppointmentSetAppointment,
        ],
      } as AppointmentSetCreateRequest

      expectedResponse = {
        id: 14,
        prisonCode: 'TPR',
        categoryCode: 'MEDO',
        internalLocationId: 32,
        startDate: '2023-04-23',
        created: '2023-02-07T15:37:59.266Z',
        createdBy: 'test.user',
        appointments: [
          {
            id: 15,
            appointmentType: 'INDIVIDUAL',
            prisonCode: 'TPR',
            categoryCode: 'MEDO',
            internalLocationId: 32,
            startDate: '2023-04-23',
            startTime: '13:30',
            endTime: '14:00',
            comment: '',
            created: '2023-02-07T15:37:59.266Z',
            createdBy: 'test.user',
            occurrences: [
              {
                id: 16,
                internalLocationId: 32,
                startDate: '2023-04-23',
                startTime: '13:30',
                endTime: '14:00',
                comment: null,
                allocations: [
                  {
                    id: 17,
                    prisonerNumber: 'A1234BC',
                    bookingId: 456,
                  },
                ],
              },
            ],
          } as AppointmentSeries,
          {
            id: 16,
            appointmentType: 'INDIVIDUAL',
            prisonCode: 'TPR',
            categoryCode: 'MEDO',
            internalLocationId: 32,
            startDate: '2023-04-23',
            startTime: '14:00',
            endTime: '14:30',
            comment: '',
            created: '2023-02-07T15:37:59.266Z',
            createdBy: 'test.user',
            occurrences: [
              {
                id: 17,
                internalLocationId: 32,
                startDate: '2023-04-23',
                startTime: '14:00',
                endTime: '14:30',
                comment: null,
                allocations: [
                  {
                    id: 18,
                    prisonerNumber: 'B2345CD',
                    bookingId: 457,
                  },
                ],
              },
            ],
          } as AppointmentSeries,
        ],
      } as AppointmentSet
    })

    it('should create the bulk appointment and redirect to confirmation page', async () => {
      when(activitiesService.createAppointmentSet)
        .calledWith(atLeast(expectedRequest))
        .mockResolvedValueOnce(expectedResponse)

      await handler.POST(req, res)
      expect(activitiesService.createAppointmentSet).toHaveBeenCalledWith(expectedRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('bulk-appointments-confirmation/14')
    })
  })
})
