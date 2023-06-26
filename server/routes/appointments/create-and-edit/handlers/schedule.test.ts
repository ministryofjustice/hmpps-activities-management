import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays } from 'date-fns'
import ScheduleRoutes from './schedule'
import { YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import { PrisonerScheduledEvents } from '../../../../@types/activitiesAPI/types'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Appointment - Comment', () => {
  const handler = new ScheduleRoutes(activitiesService)
  let req: Request
  let res: Response

  const tomorrow = addDays(new Date(), 1)

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
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {
          startDate: simpleDateFromDate(tomorrow),
          prisoners: [],
        },
      },
      flash: jest.fn(),
    } as unknown as Request

    when(activitiesService.getScheduledEventsForPrisoners)
      // .calledWith(expect.any(Date), ['ABC123', 'ABC321', 'ZXY123'], res.locals.user)
      .mockResolvedValue({
        activities: [],
        appointments: [],
        courtHearings: [],
        visits: [],
        externalTransfers: [],
        adjudications: [],
      } as PrisonerScheduledEvents)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the schedule view with back to repeat page', async () => {
      req.session.appointmentJourney.repeat = YesNo.NO

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/schedule', {
        backLinkHref: 'repeat',
        prisonerSchedules: [],
      })
    })

    it('should render the schedule view with back to repeat period and count page', async () => {
      req.session.appointmentJourney.repeat = YesNo.YES

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/schedule', {
        backLinkHref: 'repeat-period-and-count',
        prisonerSchedules: [],
      })
    })
  })

  describe('POST', () => {
    it('should redirect to comment page', async () => {
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('comment')
    })
  })
})
