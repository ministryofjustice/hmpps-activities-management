import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addHours, subMinutes } from 'date-fns'
import AppointmentDetailsRoutes from './appointmentDetails'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Appointment Details', () => {
  const handler = new AppointmentDetailsRoutes(activitiesService)
  let req: Request
  let res: Response

  let appointmentDetails = {
    occurrences: [
      {
        id: 10,
        sequenceNumber: 1,
      },
      {
        id: 11,
        sequenceNumber: 2,
      },
    ],
  } as AppointmentDetails

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        id: '10',
      },
    } as unknown as Request

    appointmentDetails = {
      occurrences: [
        {
          id: 10,
          sequenceNumber: 1,
        },
        {
          id: 11,
          sequenceNumber: 2,
        },
      ],
    } as unknown as AppointmentDetails
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesService.getAppointmentDetails)
        .calledWith(10, res.locals.user)
        .mockResolvedValue(appointmentDetails)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/details/appointment', {
        appointment: appointmentDetails,
      })
    })

    it('should remove occurrences in the past', async () => {
      const now = new Date()
      const todayOneMinuteInThePast = subMinutes(now, 1)
      const todayOneHourInTheFuture = addHours(now, 1)

      appointmentDetails.occurrences[0].startDate = formatDate(todayOneMinuteInThePast, 'yyyy-MM-dd')
      appointmentDetails.occurrences[0].startTime = formatDate(todayOneMinuteInThePast, 'HH:mm')
      appointmentDetails.occurrences[1].startDate = formatDate(todayOneHourInTheFuture, 'yyyy-MM-dd')
      appointmentDetails.occurrences[1].startTime = formatDate(todayOneHourInTheFuture, 'HH:mm')

      when(activitiesService.getAppointmentDetails)
        .calledWith(10, res.locals.user)
        .mockResolvedValue(appointmentDetails)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/details/appointment', {
        appointment: {
          occurrences: [
            {
              id: 11,
              sequenceNumber: 2,
              startDate: formatDate(todayOneHourInTheFuture, 'yyyy-MM-dd'),
              startTime: formatDate(todayOneHourInTheFuture, 'HH:mm'),
            },
          ],
        },
      })
    })
  })
})
