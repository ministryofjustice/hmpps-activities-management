import { Request, Response } from 'express'

import ActivitiesService from '../../../../services/activitiesService'
import CheckAnswersRoutes from './checkAnswers'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocate - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService)
  let req: Request
  let res: Response

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
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            cellLocation: '1-2-001',
            payBand: { id: 1, alias: 'A' },
          },
          activity: {
            scheduleId: 1,
            name: 'Maths',
            location: 'Education room 1',
          },
          startDate: simpleDateFromDate(new Date('2023-01-01')),
          endDate: null,
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with data from session', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocate-to-activity/check-answers', {
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'ABC123',
        cellLocation: '1-2-001',
        payBand: 'A',
        activityName: 'Maths',
        activityLocation: 'Education room 1',
        startDate: '1st January 2023',
        endDate: 'Not set',
      })
    })
  })

  describe('POST', () => {
    it('should create the allocation and redirect to confirmation page', async () => {
      await handler.POST(req, res)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'ABC123',
        1,
        { username: 'joebloggs' },
        '2023-01-01',
        null,
      )
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })
  })
})
