import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import CheckAnswersRoutes from './checkAnswers'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import atLeast from '../../../../../jest.setup'
import { Activity } from '../../../../@types/activitiesAPI/types'

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
            incentiveLevel: 'standard',
            payBand: { id: 1, alias: 'A', rate: 150 },
          },
          activity: {
            activityId: 1,
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
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({ inCell: false, onWing: false, offWing: false } as Activity)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocate-to-activity/check-answers', {
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'ABC123',
        cellLocation: '1-2-001',
        payBand: 'A',
        payRate: 150,
        incentiveLevel: 'standard',
        activityName: 'Maths',
        activityLocation: 'Education room 1',
        startDate: 'Sunday, 1 January 2023',
        endDate: null,
        inCell: false,
        onWing: false,
        offWing: false,
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
