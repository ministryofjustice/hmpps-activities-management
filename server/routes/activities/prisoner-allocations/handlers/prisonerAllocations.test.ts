import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonerAllocationsHandler from './prisonerAllocations'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Prisoner Allocations', () => {
  const handler = new PrisonerAllocationsHandler(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { prisonerNumber: '12345' },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render a prisoners allocation details', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/prisoner-allocations/dashboard')
    })
  })

  describe('POST', () => {
    it('should redirect to another page', async () => {
      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities/prisoner-allocations')
    })
  })
})
