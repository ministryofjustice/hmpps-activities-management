import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const flash = jest.fn()

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Uncancel Session Confirmation', () => {
  const handler = new ConfirmationRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          firstName: 'Joe',
          lastName: 'Bloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      flash,
      query: {},
      params: {
        id: '1',
      },
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render uncancel session confirmation page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/uncancel-session/confirm')
    })
  })

  describe('POST', () => {
    let confirmRequest: Request

    beforeEach(() => {
      confirmRequest = {
        ...req,
        body: {
          confirm: 'yes',
        },
      } as unknown as Request
    })

    it('should uncancel scheduled activity', async () => {
      await handler.POST(confirmRequest, res)

      expect(activitiesService.uncancelScheduledActivity).toBeCalledWith(1, {
        username: 'joebloggs',
        firstName: 'Joe',
        lastName: 'Bloggs',
      })

      expect(flash).toHaveBeenCalledWith('successMessage', JSON.stringify({ message: 'Session no longer cancelled' }))

      expect(res.redirect).toHaveBeenCalledWith('/attendance/activities/1/attendance-list')
    })

    it('should redirect back to attendance list if not confirmed', async () => {
      confirmRequest.body.confirm = 'no'
      await handler.POST(confirmRequest, res)

      expect(activitiesService.uncancelScheduledActivity).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/attendance/activities/1/attendance-list')
    })
  })
})
